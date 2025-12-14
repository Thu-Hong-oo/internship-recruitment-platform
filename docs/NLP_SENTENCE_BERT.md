# 🧠 Chức Năng Sentence-BERT - Tài Liệu Chi Tiết

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

Chức năng **Sentence-BERT** cung cấp khả năng chuyển đổi văn bản thành vector embeddings và tính toán độ tương đồng ngữ nghĩa. Đây là công nghệ nền tảng cho việc tìm kiếm thông minh và matching trong hệ thống.

### 1.2. Tính Năng Chính

- ✅ **Text Embedding**: Chuyển đổi văn bản thành vector 768 chiều
- ✅ **Semantic Similarity**: Tính độ tương đồng ý nghĩa giữa các văn bản
- ✅ **Batch Processing**: Xử lý nhiều văn bản cùng lúc
- ✅ **Multilingual Support**: Hỗ trợ tiếng Việt và tiếng Anh
- ✅ **Persistent Model Server**: Server chạy liên tục để tăng hiệu suất
- ✅ **Self-Sufficient**: Hoạt động độc lập không phụ thuộc API bên ngoài

### 1.3. Điểm Nổi Bật

- **Optimized for Vietnamese**: Sử dụng model `bkai-foundation-models/vietnamese-bi-encoder`
- **Persistent Server**: Tránh khởi động model nhiều lần
- **High Performance**: Xử lý nhanh với batch operations
- **Reliable**: Graceful fallback khi model không khả dụng

---

## 2. Kiến Trúc Hệ Thống

### 2.1. Sơ Đồ Tổng Quan

```
┌─────────────────────────────────────────────────────────────┐
│                    SENTENCE-BERT SERVICE                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                 NODE.JS SERVICE LAYER                 │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │  │
│  │  │ Text         │  │ Batch        │  │ Similarity  │ │  │
│  │  │ Embedding    │  │ Processing   │  │ Calculation │ │  │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              PERSISTENT PYTHON SERVER                │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │  │
│  │  │ Model Server │  │ Request      │  │ Response    │ │  │
│  │  │ (stdin/out)  │  │ Queue        │  │ Handling    │ │  │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                    PYTHON MODEL LAYER                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          bkai-foundation-models/vietnamese-bi-encoder │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │  │
│  │  │ Sentence-    │  │ Cosine       │  │ Batch       │ │  │
│  │  │ BERT Model   │  │ Similarity   │  │ Processing  │ │  │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

### 2.2. Luồng Xử Lý

```
1. Client gọi API (encode/similarity)
   ↓
2. Node.js service kiểm tra model availability
   ↓
3. Gửi request đến Python model server (stdin/stdout)
   ↓
4. Python server xử lý:
   a. Load Sentence-BERT model (nếu chưa load)
   b. Encode text thành vector
   c. Tính similarity (nếu cần)
   ↓
5. Trả kết quả về Node.js service
   ↓
6. Node.js service trả về client
```

---

## 3. Công Nghệ Sử Dụng

### 3.1. Sentence-BERT Model

#### **3.1.1. Model Selection**
- **Model**: `bkai-foundation-models/vietnamese-bi-encoder`
- **Optimized for**: Tiếng Việt và tiếng Anh
- **Dimension**: 768 chiều vector
- **Architecture**: Bi-encoder cho symmetric semantic search

#### **3.1.2. Technical Details**
- **Framework**: Transformers (Hugging Face)
- **Base Model**: PhoBERT + sentence embedding fine-tuning
- **Training Data**: Vietnamese text corpus
- **Performance**: Optimized cho semantic similarity tasks

### 3.2. Python Server Architecture

#### **3.2.1. Persistent Server**
- **Purpose**: Tránh cold start khi load model
- **Communication**: stdin/stdout với Node.js
- **Protocol**: JSON-based request/response
- **Timeout**: 120 seconds default

#### **3.2.2. Request Queue**
- **Purpose**: Handle concurrent requests
- **Implementation**: Map-based queue với request IDs
- **Timeout Handling**: Auto-cleanup expired requests

### 3.3. Node.js Service Layer

#### **3.3.1. Service Methods**
- **encode()**: Single text embedding
- **encodeBatch()**: Multiple texts embedding
- **similarity()**: Similarity between two texts
- **similarityBatch()**: One-to-many similarity
- **similarityMatrix()**: All-pairs similarity matrix

---

## 4. Quy Trình Hoạt Động

### 4.1. Khởi Tạo Service

```javascript
class SentenceBertService {
  constructor() {
    this.pythonScript = path.join(__dirname, '../../../python/sentence_bert_inference.py');
    this.modelServerScript = path.join(__dirname, '../../../python/model_server.py');
    this.modelName = 'bkai-foundation-models/vietnamese-bi-encoder';
    this.embeddingDim = 768;
    this.isAvailable = false;
    this.modelProcess = null;
    this.modelReadyPromise = null;
    this.pendingRequests = new Map();
    this.nextRequestId = 1;
    
    // Check availability
    this._checkAvailability();
  }
}
```

### 4.2. Kiểm Tra Tình Trạng Model

```javascript
async _checkAvailability() {
  try {
    await this._ensureModelServer(180000); // 3 minutes timeout
    this.isAvailable = true;
    logger.info('✅ Sentence-BERT model available');
  } catch (error) {
    this.isAvailable = false;
    logger.warn('⚠️ Sentence-BERT not available:', error.message);
  }
}
```

### 4.3. Đảm Bảo Model Server Chạy

```javascript
_ensureModelServer(timeoutMs = 120000) {
  if (this.modelReadyPromise) {
    return this.modelReadyPromise; // Return existing promise
  }

  this.modelReadyPromise = new Promise((resolve, reject) => {
    // Spawn Python process
    this.modelProcess = spawn('python', [this.modelServerScript], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Handle stdout (responses)
    this.modelProcess.stdout.on('data', (data) => {
      this._handleServerResponse(data, resolve, reject);
    });

    // Handle stderr (logs)
    this.modelProcess.stderr.on('data', (data) => {
      logger.debug('Python server stderr:', data.toString());
    });

    // Handle process exit
    this.modelProcess.on('exit', (code) => {
      logger.warn(`Python server exited with code ${code}`);
      this.modelReadyPromise = null;
    });
  });

  return this.modelReadyPromise;
}
```

### 4.4. Gửi Request Đến Model Server

```javascript
async _sendToModelServer(request) {
  return new Promise((resolve, reject) => {
    const requestId = this.nextRequestId++;
    
    // Create timeout
    const timeoutId = setTimeout(() => {
      this.pendingRequests.delete(requestId);
      reject(new Error('Request timeout'));
    }, 30000); // 30 seconds
    
    // Store promise handlers
    this.pendingRequests.set(requestId, {
      resolve,
      reject,
      timeoutId
    });
    
    // Send request
    const requestData = JSON.stringify({
      id: requestId,
      ...request
    }) + '\n';
    
    this.modelProcess.stdin.write(requestData);
  });
}
```

---

## 5. API Methods

### 5.1. Text Embedding

#### **5.1.1. Single Text**
```javascript
async encode(text) {
  const embeddings = await this.encodeBatch([text]);
  return embeddings[0]; // 768-dimensional vector
}
```

#### **5.1.2. Batch Texts**
```javascript
async encodeBatch(texts) {
  const result = await this._sendToModelServer({
    action: 'encode_batch',
    texts
  });
  
  if (!result.success || !result.embeddings) {
    throw new Error('Failed to generate batch embeddings');
  }
  
  return result.embeddings; // Array of 768-dimensional vectors
}
```

### 5.2. Similarity Calculation

#### **5.2.1. Two Texts Similarity**
```javascript
async similarity(text1, text2) {
  const result = await this._sendToModelServer({
    action: 'similarity',
    text1,
    text2
  });
  
  return result.similarity; // Float 0-1
}
```

#### **5.2.2. One-to-Many Similarity**
```javascript
async similarityBatch(query, documents) {
  const result = await this._sendToModelServer({
    action: 'similarity_batch',
    query,
    docs: documents
  });
  
  return result.similarities; // Array of floats 0-1
}
```

#### **5.2.3. All-Pairs Similarity Matrix**
```javascript
async similarityMatrix(texts) {
  const result = await this._sendToModelServer({
    action: 'similarity_matrix',
    texts
  });
  
  return result.matrix; // NxN similarity matrix
}
```

---

## 6. Ví Dụ Sử Dụng

### 6.1. Text Embedding

```javascript
const sentenceBertService = require('./sentenceBertService');

// Single text embedding
const embedding = await sentenceBertService.encode(
  "Tôi là một lập trình viên JavaScript"
);
// Result: [0.123, 0.456, ..., 0.789] (768 dimensions)

// Batch embedding
const embeddings = await sentenceBertService.encodeBatch([
  "Frontend Developer với React",
  "Backend Developer với Node.js",
  "Fullstack Developer"
]);
// Result: [[...], [...], [...]]
```

### 6.2. Similarity Calculation

```javascript
// Similarity between two job descriptions
const similarity = await sentenceBertService.similarity(
  "Frontend Developer cần biết React và JavaScript",
  "Tìm lập trình viên frontend thành thạo ReactJS"
);
// Result: 0.85 (high similarity)

// One-to-many similarity
const similarities = await sentenceBertService.similarityBatch(
  "React Developer",
  [
    "Frontend Developer với React",
    "Java Developer",
    "Python Developer"
  ]
);
// Result: [0.92, 0.15, 0.08]
```

### 6.3. CV-Job Matching

```javascript
// Calculate similarity between CV and job
const cvEmbedding = await sentenceBertService.encode(cvText);
const jobEmbedding = await sentenceBertService.encode(jobDescription);

// Cosine similarity calculation
const similarity = cosineSimilarity(cvEmbedding, jobEmbedding);
```

---

## 7. Tối Ưu Hiệu Suất

### 7.1. Persistent Model Server

- **Benefit**: Tránh load model nhiều lần
- **Memory Usage**: Model được giữ trong memory
- **Startup Time**: Chỉ load một lần khi server khởi động

### 7.2. Batch Processing

- **Efficiency**: Xử lý nhiều texts cùng lúc thay vì từng cái
- **Network Latency**: Giảm số lần gọi API
- **GPU Utilization**: Tối ưu sử dụng GPU (nếu có)

### 7.3. Request Queue Management

- **Concurrency**: Handle multiple concurrent requests
- **Timeout Handling**: Auto-cleanup expired requests
- **Memory Management**: Prevent memory leaks

### 7.4. Caching Strategy

- **Embedding Cache**: Cache embeddings đã tính
- **Similarity Cache**: Cache kết quả similarity
- **LRU Eviction**: Loại bỏ cache cũ khi đầy

---

## 8. Lưu Ý Quan Trọng

### 8.1. Model Availability
- **Check First**: Luôn kiểm tra `isAvailable` trước khi sử dụng
- **Graceful Fallback**: Có phương án backup khi model không khả dụng
- **Error Handling**: Handle errors một cách graceful

### 8.2. Performance Considerations
- **Batch Size**: Không nên batch quá lớn (max 100 texts)
- **Text Length**: Giới hạn độ dài text để tránh timeout
- **Concurrent Requests**: Limit số concurrent requests

### 8.3. Memory Management
- **Model Size**: Sentence-BERT model ~400MB RAM
- **Process Management**: Đảm bảo kill process khi shutdown
- **Resource Cleanup**: Clean up resources properly

### 8.4. Deployment Considerations
- **Docker**: Model server chạy trong container riêng
- **Scaling**: Có thể scale horizontally với multiple instances
- **Health Checks**: Implement health check endpoints

---

*Tài liệu này được tạo tự động từ code analysis. Cập nhật lần cuối: December 13, 2025*</content>
<parameter name="filePath">d:\KhoaLuan_Internship\internship-recruitment-platform\docs\NLP_SENTENCE_BERT.md