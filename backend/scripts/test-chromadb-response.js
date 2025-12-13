/**
 * Script để test và so sánh response format giữa ChromaDB server chính thức và embedded server
 * Giúp debug tại sao local chạy được mà production lại lỗi
 */

const { ChromaClient } = require('chromadb');
const http = require('http');

async function testChromaDBResponse(url, name) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${name}`);
  console.log(`URL: ${url}`);
  console.log('='.repeat(60));

  try {
    const client = new ChromaClient({ path: url });
    
    // Test heartbeat first
    console.log('\n1. Testing heartbeat...');
    try {
      // Try v2 first (newer API)
      let heartbeat;
      try {
        heartbeat = await fetch(`${url}/api/v2/heartbeat`);
      } catch (e) {
        heartbeat = await fetch(`${url}/api/v1/heartbeat`);
      }
      
      if (heartbeat.ok) {
        const heartbeatData = await heartbeat.json();
        console.log('✅ Heartbeat OK:', heartbeatData);
      } else {
        const text = await heartbeat.text();
        console.log('⚠️  Heartbeat response:', heartbeat.status, text);
      }
    } catch (err) {
      console.log('❌ Heartbeat failed:', err.message);
      console.log('   Server might not be running. Continuing anyway...');
      // Don't return, continue to test collection
    }

    // Test getOrCreateCollection
    console.log('\n2. Testing getOrCreateCollection...');
    const collectionName = 'test-collection-response';
    
    try {
      const collection = await client.getOrCreateCollection({
        name: collectionName,
        metadata: { test: true },
      });

      console.log('✅ Collection created/retrieved');
      console.log('Collection object type:', typeof collection);
      console.log('Collection object keys:', Object.keys(collection || {}));
      
      // Check properties
      console.log('\nCollection properties:');
      console.log('  - name:', collection?.name);
      console.log('  - id:', collection?.id);
      console.log('  - metadata:', collection?.metadata);
      
      // Safely check embedding_function
      try {
        const ef = collection?.embedding_function;
        console.log('  - embedding_function:', ef === null ? 'null' : ef === undefined ? 'undefined' : typeof ef);
        if (ef && typeof ef === 'object') {
          console.log('  - embedding_function keys:', Object.keys(ef));
        }
      } catch (efError) {
        console.log('  - embedding_function: ERROR accessing -', efError.message);
      }

      // Check if collection has methods
      console.log('\nCollection methods:');
      console.log('  - query:', typeof collection?.query);
      console.log('  - add:', typeof collection?.add);
      console.log('  - upsert:', typeof collection?.upsert);
      console.log('  - delete:', typeof collection?.delete);

      // Try to make a raw HTTP request to see actual response (GET existing collection)
      console.log('\n3. Testing raw HTTP GET response (existing collection)...');
      await testRawHTTPGetResponse(url, collectionName);

    } catch (error) {
      console.log('❌ Error:', error.message);
      console.log('Stack:', error.stack);
    }

  } catch (error) {
    console.log('❌ Failed to connect:', error.message);
  }
}

async function testRawHTTPGetResponse(baseUrl, collectionName) {
  return new Promise((resolve, reject) => {
    // Test GET collection (when it already exists)
    const url = new URL(`${baseUrl}/api/v2/tenants/default_tenant/databases/default_database/collections/${collectionName}`);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Raw HTTP GET Response:');
        console.log('  Status:', res.statusCode);
        console.log('  Headers:', JSON.stringify(res.headers, null, 2));
        try {
          const json = JSON.parse(data);
          console.log('  Body (formatted):');
          console.log(JSON.stringify(json, null, 2));
          
          // Check embedding_function in raw response
          if (json.embedding_function !== undefined) {
            console.log('\n  ✅ embedding_function present in response');
            console.log('     Type:', typeof json.embedding_function);
            console.log('     Value:', json.embedding_function);
            if (json.embedding_function === null) {
              console.log('     ⚠️  Value is null (might cause issues)');
            } else if (typeof json.embedding_function === 'object' && Object.keys(json.embedding_function).length === 0) {
              console.log('     ✅ Value is empty object {} (should work)');
            }
          } else {
            console.log('\n  ❌ embedding_function MISSING in response');
            console.log('     This is likely the cause of the error!');
          }
        } catch (e) {
          console.log('  Body (raw):', data);
          console.log('  Parse error:', e.message);
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log('❌ HTTP GET request error:', error.message);
      console.log('   This might mean the server is not running or endpoint not supported');
      resolve(); // Don't reject, just continue
    });

    req.setTimeout(5000, () => {
      console.log('❌ Request timeout');
      req.destroy();
      resolve();
    });

    req.end();
  });
}

async function main() {
  console.log('🔍 ChromaDB Response Format Comparison Tool');
  console.log('This tool helps debug why local works but production fails\n');

  // Test local ChromaDB (if running)
  if (process.argv.includes('--local')) {
    await testChromaDBResponse('http://localhost:8000', 'Local ChromaDB (Official Server)');
  }

  // Test embedded server (if running)
  if (process.argv.includes('--embedded')) {
    await testChromaDBResponse('http://localhost:8001', 'Embedded Server (Custom Python)');
  }

  // If no args, test both
  if (!process.argv.includes('--local') && !process.argv.includes('--embedded')) {
    console.log('Usage:');
    console.log('  node test-chromadb-response.js --local      # Test local ChromaDB server');
    console.log('  node test-chromadb-response.js --embedded   # Test embedded server');
    console.log('  node test-chromadb-response.js --local --embedded  # Test both\n');
    
    // Try both by default
    try {
      await testChromaDBResponse('http://localhost:8000', 'Local ChromaDB (Official Server)');
    } catch (e) {
      console.log('Local ChromaDB not available');
    }
    
    try {
      await testChromaDBResponse('http://localhost:8001', 'Embedded Server (Custom Python)');
    } catch (e) {
      console.log('Embedded server not available');
    }
  }
}

main().catch(console.error);

