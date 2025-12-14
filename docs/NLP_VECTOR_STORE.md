# 🧠 Chức Năng Vector Store (ChromaDB) - Tài Liệu Chi Tiết

## 📋 Mục Lục

1. [Tổng Quan](#1-tổng-quan)
2. [Kiến Trúc Hệ Thống](#2-kiến-trúc-hệ-thống)
3. [Công Nghệ Sử Dụng](#3-công-nghệ-sử-dụng)
4. [Quy Trình Hoạt Động](#4-quy-trình-hoạt-động)
5. [API Methods](#5-api-methods)
6. [Ví Dụ Sử Dụng](#6-ví-dụ-sử-dụng)
7. [Tối Ưu Hiệu Suất](#7-tối-ưu-hiệu-suất)

---

## 1. Tổng Quan

### 1.1. Mục Đích

Chức năng **Vector Store** sử dụng ChromaDB để lưu trữ và tìm kiếm tài liệu học tập bằng vector embeddings. Đây là hệ thống tìm kiếm thông minh dựa trên ý nghĩa (semantic search) thay vì từ khóa chính xác.

### 1.2. Tính Năng Chính

- ✅ **Vector Storage**: Lưu trữ embeddings 768 chiều
- ✅ **Semantic Search**: Tìm kiếm dựa trên ý nghĩa, không phải từ khóa
- ✅ **Metadata Filtering**: Lọc kết quả theo metadata
- ✅ **Batch Operations**: Thêm/xóa nhiều documents cùng lúc
- ✅ **Persistent Storage**: Dữ liệu được lưu trữ lâu dài
- ✅ **Auto Fallback**: Graceful fallback khi ChromaDB không khả dụng

### 1.3. Điểm Nổi Bật

- **Lightweight**: ChromaDB là vector database nhẹ, phù hợp cho MVP
- **Self-Contained**: Có thể chạy embedded hoặc client-server
- **Production Ready**: Scale được cho production environment
- **Flexible Deployment**: Hỗ trợ multiple deployment scenarios

---

## 2. Kiến Trúc Hệ Thống

### 2.1. Sơ Đồ Tổng Quan

```
┌─────────────────────────────────────────────────────────────┐
│                    VECTOR STORE SERVICE                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                 NODE.JS SERVICE LAYER                 │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │  │
│  │  │ Add          │  │ Search       │  │ Delete      │ │  │
│  │  │ Resources    │  │ Resources    │  │ Resources   │ │  │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                 CHROMADB CLIENT                       │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │  │
│  │  │ Collection   │  │ Vector       │  │ Metadata    │ │  │
│  │  │ Management   │  │ Search       │  │ Filtering   │ │  │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                    CHROMADB SERVER                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │  │
│  │  │ Persistent   │  │ Vector       │  │ Index       │ │  │
│  │  │ Storage      │  │ Database     │  │ Management  │ │  │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

### 2.2. Luồng Xử Lý

```
1. Client gọi API (add/search/delete resources)
   ↓
2. Vector Store Service kiểm tra ChromaDB availability
   ↓
3. Khởi tạo collection nếu chưa có
   ↓
4. Thực hiện operation:
   a. Add: Generate embedding → Store in ChromaDB
   b. Search: Generate query embedding → Vector search
   c. Delete: Remove by ID
   ↓
5. Trả kết quả về client
   ↓
6. Fallback nếu ChromaDB không available
```

---

## 3. Công Nghệ Sử Dụng

### 3.1. ChromaDB

#### **3.1.1. Overview**
- **Type**: Lightweight vector database
- **Language**: Python-based, Node.js client available
- **Features**: Vector storage, similarity search, metadata filtering
- **Use Case**: Perfect for MVP and small-to-medium applications

#### **3.1.2. Architecture**
- **Collections**: Logical grouping of documents
- **Documents**: Text content with metadata
- **Embeddings**: Vector representations (768 dimensions)
- **Metadata**: Additional filtering attributes

### 3.2. Deployment Options

#### **3.2.1. Embedded Mode**
- **Use Case**: Development, single instance
- **Pros**: Simple setup, no external dependencies
- **Cons**: Not scalable, data lost on restart

#### **3.2.2. Client-Server Mode**
- **Use Case**: Production, multiple instances
- **Pros**: Scalable, persistent storage
- **Cons**: Requires separate ChromaDB server

#### **3.2.3. Docker Deployment**
- **Use Case**: Containerized environments
- **Pros**: Easy deployment, consistent environment
- **Cons**: Resource overhead

### 3.3. Connection Logic

```javascript
// Priority order for ChromaDB URL:
if (process.env.CHROMA_URL) {
  // 1. Explicit CHROMA_URL
  chromaUrl = process.env.CHROMA_URL;
} else if (process.env.NODE_ENV === 'production' || 
           process.env.AWS_EXECUTION_ENV || 
           process.env.AWS_LAMBDA_FUNCTION_NAME ||
           process.env._?.includes('apprunner')) {
  // 2. Production/App Runner: embedded server
  chromaUrl = 'http://localhost:8001';
} else {
  // 3. Local development: docker-compose
  chromaUrl = 'http://localhost:8000';
}
```

---

## 4. Quy Trình Hoạt Động

### 4.1. Khởi Tạo Service

```javascript
class VectorStoreService {
  constructor() {
    // Initialize ChromaDB client
    let chromaUrl;
    if (process.env.CHROMA_URL) {
      chromaUrl = process.env.CHROMA_URL;
    } else if (production environment) {
      chromaUrl = 'http://localhost:8001'; // Embedded server
    } else {
      chromaUrl = 'http://localhost:8000'; // Docker
    }
    
    this.client = new ChromaClient({ path: chromaUrl });
    this.collectionName = process.env.CHROMA_COLLECTION_NAME || 'learning-resources';
    this.collection = null;
  }
}
```

### 4.2. Khởi Tạo Collection

```javascript
async initializeCollection() {
  try {
    // Check if collection exists
    const collections = await this.client.listCollections();
    let existingCollection = collections.find(
      col => col.name === this.collectionName
    );

    if (existingCollection) {
      // Get existing collection
      this.collection = await this.client.getCollection({
        name: this.collectionName,
      });
    } else {
      // Create new collection
      this.collection = await this.client.createCollection({
        name: this.collectionName,
        metadata: {
          description: 'Learning resources for personalized roadmaps',
          createdAt: new Date().toISOString(),
        },
      });
    }

    return this.collection;
  } catch (error) {
    // ChromaDB not available - graceful fallback
    this.client = null;
    return null;
  }
}
```

### 4.3. Thêm Resource

```javascript
async addResource(resource) {
  try {
    if (!this.collection) {
      await this.initializeCollection();
    }

    const {
      id, title, description, skills = [], level, provider,
      type, url, rating, isFree, estimatedCost
    } = resource;

    // Generate embedding using embedding service
    const embeddingService = getEmbeddingService();
    const embedding = await embeddingService.embedResource(resource);

    // Prepare metadata
    const metadata = {
      title: String(title),
      description: String(description || ''),
      skills: Array.isArray(skills) ? skills.join(',') : String(skills),
      level: String(level || ''),
      provider: String(provider || ''),
      type: String(type || ''),
      url: String(url || ''),
      rating: rating ? Number(rating) : 0,
      isFree: isFree ? 'true' : 'false',
      estimatedCost: estimatedCost ? Number(estimatedCost) : 0,
    };

    // Add to ChromaDB
    await this.collection.add({
      ids: [id],
      embeddings: [embedding],
      metadatas: [metadata],
      documents: [description || title], // Fallback document
    });

  } catch (error) {
    logger.error('Failed to add resource to vector store:', error);
    throw error;
  }
}
```

### 4.4. Tìm Kiếm Resources

```javascript
async searchResources(query, limit = 10, filters = {}) {
  try {
    if (!this.collection) {
      await this.initializeCollection();
    }

    // Generate query embedding
    const embeddingService = getEmbeddingService();
    const queryEmbedding = await embeddingService.embedText(query);

    // Build where clause for metadata filtering
    const where = {};
    if (filters.level) where.level = filters.level;
    if (filters.type) where.type = filters.type;
    if (filters.isFree !== undefined) where.isFree = filters.isFree.toString();

    // Search in ChromaDB
    const results = await this.collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: limit,
      where: Object.keys(where).length > 0 ? where : undefined,
    });

    // Format results
    const formattedResults = results.ids[0].map((id, index) => ({
      id,
      score: results.distances[0][index],
      metadata: results.metadatas[0][index],
      document: results.documents[0][index],
    }));

    return formattedResults;
  } catch (error) {
    logger.error('Failed to search resources:', error);
    throw error;
  }
}
```

---

## 5. API Methods

### 5.1. Resource Management

#### **5.1.1. Add Single Resource**
```javascript
async addResource(resource) {
  // Generate embedding and add to ChromaDB
  const embedding = await embeddingService.embedResource(resource);
  
  await this.collection.add({
    ids: [resource.id],
    embeddings: [embedding],
    metadatas: [metadata],
    documents: [resource.description || resource.title],
  });
}
```

#### **5.1.2. Add Multiple Resources**
```javascript
async addResources(resources) {
  const ids = [];
  const embeddings = [];
  const metadatas = [];
  const documents = [];

  for (const resource of resources) {
    const embedding = await embeddingService.embedResource(resource);
    
    ids.push(resource.id);
    embeddings.push(embedding);
    metadatas.push(metadata);
    documents.push(resource.description || resource.title);
  }

  await this.collection.add({
    ids,
    embeddings,
    metadatas,
    documents,
  });
}
```

#### **5.1.3. Delete Resource**
```javascript
async deleteResource(resourceId) {
  await this.collection.delete({
    ids: [resourceId],
  });
}
```

### 5.2. Search Operations

#### **5.2.1. Semantic Search**
```javascript
async searchResources(query, limit = 10, filters = {}) {
  const queryEmbedding = await embeddingService.embedText(query);
  
  const results = await this.collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: limit,
    where: filters,
  });
  
  return results;
}
```

#### **5.2.2. Search with Metadata Filters**
```javascript
// Filter by level, type, isFree, etc.
const filters = {
  level: 'intermediate',
  type: 'course',
  isFree: true,
};

const results = await vectorStore.searchResources(
  'React tutorial', 
  5, 
  filters
);
```

---

## 6. Ví Dụ Sử Dụng

### 6.1. Thêm Learning Resource

```javascript
const vectorStore = require('./vectorStoreService');

const resource = {
  id: 'react-complete-guide',
  title: 'React - The Complete Guide',
  description: 'Learn React from scratch with hands-on projects',
  skills: ['React', 'JavaScript', 'HTML', 'CSS'],
  level: 'intermediate',
  provider: 'Udemy',
  type: 'course',
  url: 'https://udemy.com/react-complete-guide',
  rating: 4.7,
  isFree: false,
  estimatedCost: 99,
};

await vectorStore.addResource(resource);
```

### 6.2. Tìm Kiếm Resources

```javascript
// Simple search
const results = await vectorStore.searchResources('React tutorial', 5);

// Search with filters
const filteredResults = await vectorStore.searchResources(
  'JavaScript course',
  10,
  {
    level: 'beginner',
    isFree: true,
    type: 'course'
  }
);

// Results format
[
  {
    id: 'js-basics-course',
    score: 0.15, // Cosine distance (lower = more similar)
    metadata: {
      title: 'JavaScript Basics',
      level: 'beginner',
      isFree: 'true',
      // ... other metadata
    },
    document: 'Learn JavaScript fundamentals...'
  }
]
```

### 6.3. Integration với Learning Roadmap

```javascript
// Trong learningRoadmapService.js
async _findLearningResources(prioritizedSkills) {
  const resources = [];
  
  for (const skill of prioritizedSkills) {
    // Tạo search query
    const query = `${skill.skillName} ${skill.requiredLevel} tutorial course`;
    
    // Tìm kiếm trong ChromaDB
    const searchResults = await vectorStoreService.searchResources(query, 3);
    
    // Convert to standard format
    const skillResources = searchResults.map(result => ({
      title: result.metadata.title,
      url: result.metadata.url,
      type: result.metadata.type,
      difficulty: result.metadata.level,
      provider: result.metadata.provider,
      score: 1 - result.score, // Convert distance to similarity
      source: 'chromadb'
    }));
    
    resources.push({
      skillName: skill.skillName,
      resources: skillResources
    });
  }
  
  return resources;
}
```

---

## 7. Tối Ưu Hiệu Suất

### 7.1. Batch Operations

- **Benefit**: Giảm network latency
- **Implementation**: Add multiple resources cùng lúc
- **Limit**: Không quá 100 resources per batch

### 7.2. Metadata Filtering

- **Benefit**: Giảm search space, tăng accuracy
- **Types**: String equality, numeric ranges
- **Performance**: Filters applied before vector search

### 7.3. Embedding Caching

- **Benefit**: Tránh generate embedding nhiều lần
- **Implementation**: Cache embeddings trong memory/database
- **Invalidation**: Update khi resource thay đổi

### 7.4. Index Optimization

- **HNSW Index**: Approximate nearest neighbor search
- **Parameters**: Tune M, ef_construction, ef_search
- **Trade-off**: Accuracy vs Speed

---

## 8. Deployment Scenarios

### 8.1. Local Development

```yaml
# docker-compose.yml
version: '3.8'
services:
  chromadb:
    image: chromadb/chroma:latest
    ports:
      - "8000:8000"
    volumes:
      - ./chroma-data:/chroma/chroma
```

### 8.2. Production (AWS App Runner)

```javascript
// Environment variables
CHROMA_URL=http://localhost:8001  // Embedded server
NODE_ENV=production
```

### 8.3. External ChromaDB Server

```javascript
// Environment variables
CHROMA_URL=https://your-chromadb-server.com
```

---

## 9. Lưu Ý Quan Trọng

### 9.1. Error Handling
- **Graceful Fallback**: Luôn có plan B khi ChromaDB không available
- **Connection Issues**: Retry logic với exponential backoff
- **Data Consistency**: Handle partial failures in batch operations

### 9.2. Performance Considerations
- **Embedding Generation**: Bottleneck chính, optimize bằng caching
- **Search Latency**: ~100ms cho 10k documents
- **Memory Usage**: ~1GB cho 100k vectors

### 9.3. Scaling Considerations
- **Horizontal Scaling**: Multiple ChromaDB instances
- **Data Partitioning**: Split collections theo domain
- **Backup Strategy**: Regular backups của vector data

### 9.4. Security
- **Access Control**: Implement authentication nếu cần
- **Data Encryption**: Encrypt sensitive metadata
- **Network Security**: Secure ChromaDB endpoints

---

*Tài liệu này được tạo tự động từ code analysis. Cập nhật lần cuối: December 13, 2025*</content>
<parameter name="filePath">d:\KhoaLuan_Internship\internship-recruitment-platform\docs\NLP_VECTOR_STORE.md