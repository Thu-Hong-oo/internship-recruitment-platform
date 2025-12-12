#!/usr/bin/env python3
"""
ChromaDB Embedded Server
Exposes ChromaDB embedded mode via HTTP for Node.js backend
This allows using ChromaDB embedded mode in production (App Runner) without a separate server
"""

import os
import sys
import json
import logging
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import chromadb
from chromadb.config import Settings

# Setup logging - output to stderr so it appears in container logs
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stderr  # Output to stderr so it appears in logs
)
logger = logging.getLogger(__name__)

# ChromaDB path - use /tmp/chroma_db for App Runner, or env variable
CHROMA_DB_PATH = os.getenv('CHROMA_DB_PATH', '/tmp/chroma_db')
PORT = int(os.getenv('CHROMADB_EMBEDDED_PORT', '8001'))

# Initialize ChromaDB client in embedded mode
try:
    # Print immediately (unbuffered)
    print(f"📁 ChromaDB data directory: {CHROMA_DB_PATH}", file=sys.stderr, flush=True)
    
    # Create directory if it doesn't exist
    os.makedirs(CHROMA_DB_PATH, exist_ok=True)
    logger.info(f"📁 ChromaDB data directory: {CHROMA_DB_PATH}")
    
    print("🔧 Initializing ChromaDB PersistentClient...", file=sys.stderr, flush=True)
    logger.info("🔧 Initializing ChromaDB PersistentClient...")
    
    client = chromadb.PersistentClient(
        path=CHROMA_DB_PATH,
        settings=Settings(
            anonymized_telemetry=False,
            allow_reset=True
        )
    )
    success_msg = f"✅ ChromaDB embedded client initialized at {CHROMA_DB_PATH}"
    print(success_msg, file=sys.stderr, flush=True)
    logger.info(success_msg)
except ImportError as e:
    error_msg = f"❌ Failed to import chromadb: {e}"
    print(error_msg, file=sys.stderr, flush=True)
    logger.error(error_msg)
    logger.error("Make sure chromadb is installed: pip install chromadb")
    sys.exit(1)
except Exception as e:
    error_msg = f"❌ Failed to initialize ChromaDB: {e}"
    print(error_msg, file=sys.stderr, flush=True)
    logger.error(error_msg, exc_info=True)
    sys.exit(1)


class ChromaDBHandler(BaseHTTPRequestHandler):
    """HTTP handler for ChromaDB embedded server"""
    
    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        # Health check endpoint
        if path == '/api/v1/heartbeat' or path == '/heartbeat':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                'nanosecond heartbeat': 0,
                'status': 'ok'
            }).encode())
            return
        
        # Get collection endpoint
        if path.startswith('/api/v1/collections/'):
            collection_name = path.split('/')[-1]
            try:
                collection = client.get_collection(name=collection_name)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'name': collection.name,
                    'metadata': collection.metadata or {},
                    'id': str(collection.id)
                }).encode())
            except Exception as e:
                self.send_error(404, str(e))
            return
        
        self.send_error(404, 'Not Found')
    
    def do_POST(self):
        """Handle POST requests"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        # Get request body
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        
        try:
            data = json.loads(body.decode()) if body else {}
        except:
            data = {}
        
        # Create or get collection (getOrCreateCollection)
        if path == '/api/v1/collections' or path.startswith('/api/v1/collections'):
            try:
                collection_name = data.get('name') or path.split('/')[-1]
                metadata = data.get('metadata', {})
                
                # Try to get existing collection first, create if not exists
                try:
                    collection = client.get_collection(name=collection_name)
                    logger.info(f"Using existing collection: {collection_name}")
                except:
                    # Create new collection
                    collection = client.create_collection(
                        name=collection_name,
                        metadata=metadata
                    )
                    logger.info(f"Created new collection: {collection_name}")
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'name': collection.name,
                    'metadata': collection.metadata or {},
                    'id': str(collection.id)
                }).encode())
            except Exception as e:
                logger.error(f"Error creating/getting collection: {e}")
                self.send_error(500, str(e))
            return
        
        # Query collection
        if '/query' in path:
            try:
                collection_name = data.get('collection_name') or data.get('name')
                query_embeddings = data.get('query_embeddings', [])
                n_results = data.get('n_results', 10)
                where = data.get('where')
                include = data.get('include', ['metadatas', 'distances'])
                
                collection = client.get_collection(name=collection_name)
                results = collection.query(
                    query_embeddings=query_embeddings,
                    n_results=n_results,
                    where=where,
                    include=include
                )
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(results).encode())
            except Exception as e:
                logger.error(f"Error querying collection: {e}")
                self.send_error(500, str(e))
            return
        
        # Add/upsert to collection
        if '/add' in path or '/upsert' in path:
            try:
                collection_name = data.get('collection_name') or data.get('name')
                ids = data.get('ids', [])
                embeddings = data.get('embeddings', [])
                metadatas = data.get('metadatas', [])
                
                collection = client.get_collection(name=collection_name)
                
                if '/upsert' in path:
                    collection.upsert(
                        ids=ids,
                        embeddings=embeddings,
                        metadatas=metadatas
                    )
                else:
                    collection.add(
                        ids=ids,
                        embeddings=embeddings,
                        metadatas=metadatas
                    )
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True}).encode())
            except Exception as e:
                logger.error(f"Error adding to collection: {e}")
                self.send_error(500, str(e))
            return
        
        self.send_error(404, 'Not Found')
    
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def log_message(self, format, *args):
        """Override to use our logger"""
        logger.info(f"{self.address_string()} - {format % args}")


def run_server():
    """Start the ChromaDB embedded HTTP server"""
    try:
        # Print startup messages immediately (unbuffered)
        print(f"🚀 ChromaDB Embedded Server starting on port {PORT}", file=sys.stderr, flush=True)
        print(f"📁 Database path: {CHROMA_DB_PATH}", file=sys.stderr, flush=True)
        print(f"🌐 Server will listen on 0.0.0.0:{PORT}", file=sys.stderr, flush=True)
        
        server = HTTPServer(('0.0.0.0', PORT), ChromaDBHandler)
        logger.info(f"🚀 ChromaDB Embedded Server starting on port {PORT}")
        logger.info(f"📁 Database path: {CHROMA_DB_PATH}")
        logger.info(f"🌐 Server will listen on 0.0.0.0:{PORT}")
        print(f"✅ ChromaDB Embedded Server is ready and listening on port {PORT}", file=sys.stderr, flush=True)
        server.serve_forever()
    except OSError as e:
        error_msg = f"❌ Failed to start server on port {PORT}: {e}"
        print(error_msg, file=sys.stderr, flush=True)
        logger.error(error_msg)
        logger.error("Port may be in use or permission denied")
        sys.exit(1)
    except KeyboardInterrupt:
        logger.info("Shutting down ChromaDB Embedded Server...")
        server.shutdown()
    except Exception as e:
        error_msg = f"❌ Unexpected error: {e}"
        print(error_msg, file=sys.stderr, flush=True)
        logger.error(error_msg, exc_info=True)
        sys.exit(1)


if __name__ == '__main__':
    run_server()

