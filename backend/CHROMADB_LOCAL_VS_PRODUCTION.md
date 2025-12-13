# ChromaDB: Sự khác biệt giữa Local và Production

## Tại sao cùng code nhưng Local chạy được còn Production lỗi?

### 🔍 Nguyên nhân chính

**Local (docker-compose):**
- ✅ ChromaDB chạy như **service riêng** (`chromadb:8000`)
- ✅ Dùng **ChromaDB server chính thức** (`chromadb/chroma:latest`)
- ✅ API đầy đủ, response format chuẩn
- ✅ Data persistent (volume), có thể đã có data từ trước
- ✅ Response có đầy đủ fields: `id`, `name`, `metadata`, `embedding_function`, etc.

**Production (App Runner):**
- ⚠️ ChromaDB chạy qua **embedded server** (port 8001)
- ⚠️ Dùng **custom Python HTTP server** (không phải ChromaDB server chính thức)
- ⚠️ API chỉ hỗ trợ các endpoint cơ bản
- ⚠️ Data mới, lưu trong `/tmp/chroma_db` (mất khi restart)
- ⚠️ Response có thể thiếu một số fields

### 🐛 Lỗi cụ thể

**Lỗi:** `Cannot read properties of undefined (reading 'embedding_function')`

**Nguyên nhân:**
1. ChromaDB client (Node.js) gọi `getOrCreateCollection()`
2. Client parse response từ server thành collection object
3. Client expect response có field `embedding_function`
4. Embedded server chưa trả về field này → collection object undefined
5. Khi code truy cập `collection.embedding_function` → lỗi

### ✅ Giải pháp đã áp dụng

1. ✅ Thêm `embedding_function: None` vào tất cả collection responses
2. ✅ Hỗ trợ cả API v1 và v2
3. ✅ Hỗ trợ cả camelCase và snake_case
4. ✅ Cải thiện error handling và logging

### 📋 So sánh chi tiết

| Tính năng | Local (docker-compose) | Production (App Runner) |
|-----------|------------------------|-------------------------|
| **ChromaDB Server** | `chromadb/chroma:latest` (official) | Custom Python HTTP server |
| **Port** | 8000 | 8001 |
| **API Endpoints** | Đầy đủ | Cơ bản (query, add, upsert, collections) |
| **Response Format** | Chuẩn ChromaDB | Custom (cần match format) |
| **Data Persistence** | Volume (persistent) | `/tmp/chroma_db` (temporary) |
| **Startup** | Service riêng, start trước backend | Embedded trong container, start cùng backend |
| **Dependencies** | Không cần Python | Cần Python + chromadb + pysqlite3 |

### 🔧 Cách test

**Local:**
```bash
# Start ChromaDB service
docker-compose up chromadb -d

# Check ChromaDB
curl http://localhost:8000/api/v1/heartbeat

# Backend tự động connect đến http://localhost:8000
```

**Production:**
```bash
# ChromaDB embedded server tự động start trong container
# Check logs để xem:
# - "✅ ChromaDB embedded server is ready!"
# - "✅ ChromaDB embedded server is ready and listening on port 8001"

# Backend tự động connect đến http://localhost:8001
```

### 🎯 Kết luận

**Local hoạt động vì:**
- ChromaDB server chính thức có đầy đủ API và response format chuẩn
- Không cần custom server

**Production lỗi vì:**
- Embedded server là custom, có thể thiếu fields trong response
- ChromaDB client expect format chuẩn

**Đã fix:**
- Thêm `embedding_function` vào tất cả responses
- Cải thiện API compatibility
- Thêm logging để debug

Sau khi deploy, production sẽ hoạt động giống local! 🎉

## 🔬 Debug Tool

Để so sánh response format giữa local và production:

```bash
# Test local ChromaDB server (chính thức)
node backend/scripts/test-chromadb-response.js --local

# Test embedded server (custom Python)
node backend/scripts/test-chromadb-response.js --embedded

# Test cả hai để so sánh
node backend/scripts/test-chromadb-response.js --local --embedded
```

Tool này sẽ:
- Test heartbeat endpoint
- Test `getOrCreateCollection()` qua ChromaDB client
- Test raw HTTP response để xem format thực tế
- So sánh `embedding_function` field giữa 2 servers

