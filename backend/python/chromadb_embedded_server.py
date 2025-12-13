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

# Try to use pysqlite3 if available (better for ChromaDB)
# This MUST be done before importing chromadb
try:
    import pysqlite3
    sys.modules['sqlite3'] = pysqlite3
    # Verify SQLite version
    conn = pysqlite3.connect(':memory:')
    version = conn.execute('SELECT sqlite_version()').fetchone()[0]
    conn.close()
    version_tuple = tuple(map(int, version.split('.')))
    print(f"✅ Using pysqlite3 with SQLite {version}", file=sys.stderr, flush=True)
    if version_tuple < (3, 35, 0):
        print(f"❌ ERROR: SQLite {version} < 3.35.0 required by ChromaDB", file=sys.stderr, flush=True)
        sys.exit(1)
except ImportError:
    # Fallback to system sqlite3, but check version
    import sqlite3
    conn = sqlite3.connect(':memory:')
    version = conn.execute('SELECT sqlite_version()').fetchone()[0]
    conn.close()
    version_tuple = tuple(map(int, version.split('.')))
    print(f"⚠️ pysqlite3 not available, using system sqlite3 {version}", file=sys.stderr, flush=True)
    if version_tuple < (3, 35, 0):
        print(f"❌ ERROR: System SQLite {version} < 3.35.0 required by ChromaDB", file=sys.stderr, flush=True)
        print("💡 Solution: pysqlite3 should be built with SQLite >= 3.35.0", file=sys.stderr, flush=True)
        sys.exit(1)

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
        
        # Get collection endpoint - API v1
        if path.startswith('/api/v1/collections/'):
            collection_name = path.split('/')[-1]
            try:
                collection = client.get_collection(name=collection_name)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                # Get embedding_function if available
                embedding_func = None
                try:
                    if hasattr(collection, 'embedding_function') and collection.embedding_function is not None:
                        embedding_func = collection.embedding_function
                except:
                    pass
                response = {
                    'name': collection.name,
                    'metadata': collection.metadata or {},
                    'id': str(collection.id),
                    'embedding_function': embedding_func  # ChromaDB client expects this field
                }
                logger.info(f"GET v1 Collection response: name={response['name']}, id={response['id']}, has_embedding_func={embedding_func is not None}")
                self.wfile.write(json.dumps(response).encode())
            except Exception as e:
                self.send_error(404, str(e))
            return
        
        # Get collection endpoint - API v2
        # Format: /api/v2/tenants/{tenant}/databases/{database}/collections/{name}
        if '/api/v2/' in path and '/collections/' in path:
            try:
                # Extract collection name from path
                parts = path.split('/')
                if 'collections' in parts:
                    idx = parts.index('collections')
                    if idx + 1 < len(parts):
                        collection_name = parts[idx + 1]
                    else:
                        self.send_error(404, 'Collection name not found in path')
                        return
                else:
                    self.send_error(404, 'Invalid v2 collection path')
                    return
                
                collection = client.get_collection(name=collection_name)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                # Get embedding_function if available
                embedding_func = None
                try:
                    if hasattr(collection, 'embedding_function') and collection.embedding_function is not None:
                        embedding_func = collection.embedding_function
                except:
                    pass
                # Return v2 format
                response = {
                    'id': str(collection.id),
                    'name': collection.name,
                    'metadata': collection.metadata or {},
                    'tenant': 'default_tenant',
                    'database': 'default_database',
                    'embedding_function': embedding_func  # ChromaDB client expects this field
                }
                logger.info(f"GET v2 Collection response: name={response['name']}, id={response['id']}, has_embedding_func={embedding_func is not None}")
                self.wfile.write(json.dumps(response).encode())
            except Exception as e:
                logger.error(f"Error getting v2 collection: {e}")
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
        
        # Log all POST requests for debugging
        logger.info(f"POST {path} - Collection: {data.get('collection_name') or data.get('name') or 'N/A'}")
        
        # Helper function to handle collection creation/getting
        def handle_collection_request(collection_name, metadata):
            """Handle collection get or create"""
            try:
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
                
                # ChromaDB client expects embedding_function field
                # Return empty dict or None to match ChromaDB server format
                # ChromaDB client may access embedding_function property, so we need to provide it
                embedding_func = None
                try:
                    # Try to get embedding function from collection if available
                    if hasattr(collection, 'embedding_function') and collection.embedding_function is not None:
                        embedding_func = collection.embedding_function
                except:
                    pass
                
                # Return format matching ChromaDB server response
                result = {
                    'name': collection.name,
                    'metadata': collection.metadata or {},
                    'id': str(collection.id),
                    'embedding_function': embedding_func  # Can be None, ChromaDB client handles it
                }
                
                # Log response for debugging
                logger.info(f"Collection response: name={result['name']}, id={result['id']}, has_embedding_func={embedding_func is not None}")
                
                return result
            except Exception as e:
                logger.error(f"Error creating/getting collection: {e}")
                raise
        
        # Create or get collection (getOrCreateCollection) - API v1
        if path == '/api/v1/collections' or path.startswith('/api/v1/collections'):
            try:
                collection_name = data.get('name') or path.split('/')[-1]
                metadata = data.get('metadata', {})
                result = handle_collection_request(collection_name, metadata)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(result).encode())
            except Exception as e:
                logger.error(f"Error in v1 collection request: {e}")
                self.send_error(500, str(e))
            return
        
        # Create or get collection - API v2 (with tenants/databases)
        # Format: /api/v2/tenants/{tenant}/databases/{database}/collections
        if '/api/v2/' in path and '/collections' in path:
            try:
                # Extract collection name from request body or path
                collection_name = data.get('name')
                if not collection_name:
                    # Try to extract from path: /api/v2/tenants/.../databases/.../collections/{name}
                    parts = path.split('/')
                    if 'collections' in parts:
                        idx = parts.index('collections')
                        if idx + 1 < len(parts):
                            collection_name = parts[idx + 1]
                
                if not collection_name:
                    # Default collection name if not provided
                    collection_name = data.get('collection_name', 'default_collection')
                
                metadata = data.get('metadata', {})
                result = handle_collection_request(collection_name, metadata)
                
                # Return v2 format response
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                # ChromaDB v2 returns collection in a specific format
                # Use same embedding_function from result (can be None)
                response = {
                    'id': result['id'],
                    'name': result['name'],
                    'metadata': result['metadata'],
                    'tenant': 'default_tenant',
                    'database': 'default_database',
                    'embedding_function': result.get('embedding_function')  # Use from result
                }
                # Log full response for debugging
                logger.info(f"V2 Collection response: {json.dumps(response)}")
                self.wfile.write(json.dumps(response).encode())
            except Exception as e:
                logger.error(f"Error in v2 collection request: {e}")
                self.send_error(500, str(e))
            return
        
        # Query collection - support both v1 and v2
        if '/query' in path:
            try:
                collection_name = data.get('collection_name') or data.get('name')
                # Support both camelCase (from ChromaDB client) and snake_case
                query_embeddings = data.get('queryEmbeddings') or data.get('query_embeddings', [])
                n_results = data.get('nResults') or data.get('n_results', 10)
                where = data.get('where')
                include = data.get('include', ['metadatas', 'distances'])
                
                if not collection_name:
                    self.send_error(400, 'Collection name is required')
                    return
                
                if not query_embeddings:
                    self.send_error(400, 'queryEmbeddings or query_embeddings is required')
                    return
                
                logger.info(f"Querying collection '{collection_name}': n_results={n_results}, embeddings_count={len(query_embeddings)}")
                collection = client.get_collection(name=collection_name)
                results = collection.query(
                    query_embeddings=query_embeddings,
                    n_results=n_results,
                    where=where,
                    include=include
                )
                
                result_count = len(results.get('ids', [])[0] if results.get('ids') else [])
                logger.info(f"✅ Query returned {result_count} results from collection '{collection_name}'")
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(results).encode())
            except Exception as e:
                logger.error(f"Error querying collection: {e}", exc_info=True)
                self.send_error(500, str(e))
            return
        
        # Add/upsert to collection
        if '/add' in path or '/upsert' in path:
            try:
                collection_name = data.get('collection_name') or data.get('name')
                ids = data.get('ids', [])
                embeddings = data.get('embeddings', [])
                metadatas = data.get('metadatas', [])
                
                if not collection_name:
                    self.send_error(400, 'Collection name is required')
                    return
                
                if not ids or not embeddings:
                    self.send_error(400, 'ids and embeddings are required')
                    return
                
                logger.info(f"Upsert/Add to collection '{collection_name}': {len(ids)} items")
                collection = client.get_collection(name=collection_name)
                
                if '/upsert' in path:
                    collection.upsert(
                        ids=ids,
                        embeddings=embeddings,
                        metadatas=metadatas
                    )
                    logger.info(f"✅ Upserted {len(ids)} items to collection '{collection_name}'")
                else:
                    collection.add(
                        ids=ids,
                        embeddings=embeddings,
                        metadatas=metadatas
                    )
                    logger.info(f"✅ Added {len(ids)} items to collection '{collection_name}'")
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True}).encode())
            except Exception as e:
                logger.error(f"Error adding to collection: {e}", exc_info=True)
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

