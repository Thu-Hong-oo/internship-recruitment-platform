# ChromaDB Embedded Server

## Tổng quan

ChromaDB Embedded Server là một Python service chạy ChromaDB ở embedded mode và expose qua HTTP API. Điều này cho phép:

- ✅ **App Runner/Production**: Chạy ChromaDB trong cùng container với backend (không cần server riêng)
- ✅ **Localhost**: Vẫn có thể dùng docker-compose ChromaDB server
- ✅ **Tự động fallback**: Code tự động detect environment và chọn đúng server

## Cách hoạt động

### 1. Localhost Development
- Không có `CHROMA_URL` → dùng `http://localhost:8000` (docker-compose)
- Cần chạy: `docker-compose up chromadb -d`

### 2. Production/App Runner
- Không có `CHROMA_URL` → dùng `http://localhost:8001` (embedded server)
- Embedded server tự động start cùng với backend trong Dockerfile
- Data lưu tại `/tmp/chroma_db` (trong container)

### 3. External ChromaDB Server
- Có `CHROMA_URL` → dùng URL đó (EC2, ECS, Cloud, etc.)

## API Endpoints

Embedded server hỗ trợ các endpoint cơ bản:

- `GET /api/v1/heartbeat` - Health check
- `GET /api/v1/collections/{name}` - Get collection
- `POST /api/v1/collections` - Create/get collection
- `POST /api/v1/collections/{name}/query` - Query collection
- `POST /api/v1/collections/{name}/add` - Add documents
- `POST /api/v1/collections/{name}/upsert` - Upsert documents

## Environment Variables

- `CHROMA_DB_PATH`: Path để lưu ChromaDB data (default: `/tmp/chroma_db`)
- `CHROMADB_EMBEDDED_PORT`: Port cho embedded server (default: `8001`)

## Lưu ý

- Embedded server chỉ hỗ trợ các API cơ bản, không đầy đủ như ChromaDB server chính thức
- Data trong `/tmp/chroma_db` sẽ mất khi container restart (đủ dùng cho đồ án)
- Nếu cần persistence lâu dài, nên dùng external ChromaDB server trên EC2

