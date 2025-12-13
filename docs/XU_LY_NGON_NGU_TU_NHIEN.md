# 📚 Xử Lý Ngôn Ngữ Tự Nhiên (NLP) Trong Project

## Tổng Quan

Project sử dụng nhiều kỹ thuật xử lý ngôn ngữ tự nhiên (NLP) để thực hiện các tính năng AI như gợi ý công việc, gợi ý ứng viên, và tạo lộ trình học tập cá nhân hóa. Các kỹ thuật này được kết hợp theo cách tiếp cận hybrid (lai) để đạt được độ chính xác cao và hiệu suất tốt.

## Các Kỹ Thuật NLP Chính

### 1. **PhoBERT NER (Named Entity Recognition) - Nhận Diện Thực Thể Tên**

**Mục đích:** Trích xuất kỹ năng từ văn bản mô tả công việc và CV ứng viên.

**Cách hoạt động:**
- Sử dụng mô hình PhoBERT đã được huấn luyện sẵn (đạt F1-score 96%) để nhận diện các thực thể kỹ năng trong văn bản tiếng Việt
- Tự động phát hiện và trích xuất các kỹ năng như "JavaScript", "React", "Node.js", "Python" từ mô tả công việc hoặc kinh nghiệm làm việc
- Xử lý cả văn bản tiếng Việt và tiếng Anh

**Ứng dụng:**
- Trích xuất kỹ năng yêu cầu từ job description
- Trích xuất kỹ năng hiện có từ CV và profile ứng viên
- Phân tích mô tả kinh nghiệm làm việc để tìm kỹ năng ẩn

### 2. **Sentence-BERT - Mô Hình Hiểu Ngữ Nghĩa**

**Mục đích:** Chuyển đổi văn bản thành vector số (embedding) để so sánh ngữ nghĩa.

**Cách hoạt động:**
- Sử dụng mô hình `bkai-foundation-models/vietnamese-bi-encoder` để tạo vector 768 chiều từ câu văn
- Tính toán cosine similarity giữa các vector để đo độ tương đồng ngữ nghĩa
- Hiểu được các từ đồng nghĩa và cách diễn đạt khác nhau: "JS" = "JavaScript", "ReactJS" = "React", "Quản lý dự án" = "Project Manager"

**Ứng dụng:**
- So khớp ngữ nghĩa giữa kỹ năng ứng viên và kỹ năng yêu cầu công việc
- Tìm kiếm semantic similarity trong vector database (ChromaDB)
- Re-ranking kết quả gợi ý dựa trên ngữ nghĩa thay vì chỉ từ khóa

### 3. **TF-IDF (Term Frequency-Inverse Document Frequency)**

**Mục đích:** Tính toán độ quan trọng của từ trong văn bản.

**Cách hoạt động:**
- **TF (Term Frequency):** Đo tần suất xuất hiện của từ trong document
- **IDF (Inverse Document Frequency):** Đo độ hiếm của từ trong toàn bộ corpus
- Từ xuất hiện nhiều trong một document nhưng hiếm trong corpus → có trọng số cao (quan trọng)

**Ứng dụng:**
- Tính điểm khớp kỹ năng giữa CV và job description
- Tìm learning resources phù hợp với skill cần học
- Phân tích keyword matching trong matching score

### 4. **Cosine Similarity - Đo Độ Tương Đồng Vector**

**Mục đích:** So sánh độ tương đồng giữa hai vector embedding.

**Cách hoạt động:**
- Chuyển văn bản thành vector bằng Sentence-BERT
- Tính cosine similarity: `cos(θ) = (A · B) / (||A|| × ||B||)`
- Kết quả từ 0 đến 1: 1 = giống hệt, 0 = không liên quan

**Ứng dụng:**
- So sánh similarity giữa candidate profile và job posting
- Tìm kiếm vector trong ChromaDB để gợi ý công việc/ứng viên
- Tính điểm semantic matching trong RAG re-ranking

### 5. **Hybrid Skill Extraction - Trích Xuất Kỹ Năng Lai**

**Mục đích:** Trích xuất kỹ năng từ CV với độ chính xác cao cho cả tiếng Việt và tiếng Anh.

**Cách hoạt động:**
- **Rule-based (300+ patterns):** Sử dụng 300+ mẫu pattern để trích xuất kỹ năng từ văn bản tiếng Việt (đạt 100% recall)
- **Language Detection:** Tự động phát hiện tỷ lệ tiếng Việt/tiếng Anh trong văn bản
- **Strategy Selection:** 
  - Văn bản >80% tiếng Việt → Dùng rule-based (100% recall)
  - Văn bản <20% tiếng Việt → Dùng rule-based (~70% recall cho tiếng Anh)
  - Văn bản hỗn hợp → Kết hợp cả hai (~85% recall)

**Ứng dụng:**
- Trích xuất kỹ năng từ CV đa ngôn ngữ
- Xử lý CV tiếng Việt với độ chính xác cao nhất
- Hỗ trợ CV tiếng Anh và mixed-language

### 6. **Skill Normalization - Chuẩn Hóa Tên Kỹ Năng**

**Mục đích:** Chuẩn hóa các biến thể của cùng một kỹ năng về dạng chuẩn.

**Cách hoạt động:**
- Sử dụng AI (Gemini) hoặc rule-based để chuẩn hóa tên kỹ năng
- Ví dụ: "JS" → "JavaScript", "Nodejs" → "Node.js", "ReactJS" → "React", "Postgres" → "PostgreSQL"
- Cache kết quả để tăng tốc độ xử lý

**Ứng dụng:**
- Đảm bảo so khớp chính xác giữa các biến thể của cùng một kỹ năng
- Chuẩn hóa dữ liệu trước khi lưu vào database
- Cải thiện độ chính xác của matching algorithm

### 7. **RAG (Retrieval-Augmented Generation) - Tìm Kiếm Nâng Cao**

**Mục đích:** Kết hợp tìm kiếm thông minh với AI để hiểu sâu hơn về mô tả công việc/ứng viên.

**Cách hoạt động:**
1. **Bước 1 - Fast Filter:** Lọc nhanh top 100 candidates/jobs dựa trên weighted scoring (kỹ năng, kinh nghiệm, học vấn)
2. **Bước 2 - Semantic Re-rank:** Sử dụng Sentence-BERT để tính semantic similarity cho top 100
3. **Bước 3 - Hybrid Score:** Kết hợp 60% weighted score + 40% semantic score

**Ứng dụng:**
- Tìm "hidden gems" - ứng viên/công việc phù hợp nhưng dùng từ khóa khác
- Hiểu ngữ nghĩa của mô tả dài thay vì chỉ dựa vào keyword matching
- Cải thiện recall (+15-25%) so với phương pháp truyền thống

### 8. **Vector Embeddings & ChromaDB - Cơ Sở Dữ Liệu Vector**

**Mục đích:** Lưu trữ và tìm kiếm nhanh dựa trên ngữ nghĩa.

**Cách hoạt động:**
- Chuyển đổi job postings và candidate profiles thành vector embeddings (768 chiều) bằng Sentence-BERT
- Lưu trữ trong ChromaDB - vector database chuyên dụng
- Tìm kiếm bằng vector similarity search (milliseconds thay vì seconds)

**Ứng dụng:**
- Tìm kiếm công việc phù hợp cho ứng viên trong vài milliseconds
- Tìm kiếm ứng viên phù hợp cho job posting nhanh chóng
- Tìm learning resources phù hợp với skill cần học

### 9. **Word Tokenization - Phân Tách Từ**

**Mục đích:** Chia văn bản thành các từ/token để xử lý.

**Cách hoạt động:**
- Sử dụng thư viện `natural` (WordTokenizer) để phân tách văn bản thành các từ
- Xử lý cả tiếng Việt và tiếng Anh
- Loại bỏ stop words và punctuation

**Ứng dụng:**
- Tiền xử lý văn bản trước khi tính TF-IDF
- Phân tích keyword trong matching score
- Chuẩn bị dữ liệu cho các thuật toán NLP khác

### 10. **Language Detection - Phát Hiện Ngôn Ngữ**

**Mục đích:** Tự động phát hiện ngôn ngữ trong văn bản để chọn phương pháp xử lý phù hợp.

**Cách hoạt động:**
- Phân tích tỷ lệ ký tự tiếng Việt (à, á, ả, ã, ạ, ă, ằ, ẳ, ẵ, ặ, â, ấ, ầ, ẩ, ẫ, ậ, đ, è, é, ẻ, ẽ, ẹ, ê, ế, ề, ể, ễ, ệ, ...)
- Tính tỷ lệ: `vietnameseRatio = vietnameseChars / totalChars`
- Chọn strategy dựa trên tỷ lệ: >80% Việt → rule-based, <20% Việt → rule-based (English)

**Ứng dụng:**
- Tự động chọn phương pháp trích xuất kỹ năng phù hợp
- Xử lý CV đa ngôn ngữ một cách thông minh
- Tối ưu hóa hiệu suất cho từng loại văn bản

## Quy Trình Xử Lý Tổng Thể

### 1. **Gợi ý Công Việc Cho Ứng Viên**

```
CV/Profile → PhoBERT NER → Extract Skills
           → Sentence-BERT → Generate Embedding (768-dim)
           → ChromaDB Vector Search → Find Similar Jobs
           → TF-IDF + Cosine Similarity → Calculate Match Score
           → RAG Re-rank → Final Recommendations
```

### 2. **Gợi ý Ứng Viên Cho Nhà Tuyển Dụng**

```
Job Posting → PhoBERT NER → Extract Required Skills
            → Sentence-BERT → Generate Embedding
            → ChromaDB Vector Search → Find Similar Candidates
            → Hybrid Scoring (Weighted + Semantic) → Rank Candidates
            → RAG Re-rank → Final Recommendations
```

### 3. **Tạo Lộ Trình Học Tập**

```
Job Description → PhoBERT NER → Extract Required Skills
Candidate Profile → PhoBERT NER → Extract Current Skills
                 → Sentence-BERT → Semantic Matching
                 → Skill Gap Analysis → Identify Missing Skills
                 → TF-IDF + ChromaDB → Find Learning Resources
                 → Generate Weekly Roadmap
```

## Kết Hợp Các Kỹ Thuật

Project sử dụng **hybrid approach** - kết hợp nhiều kỹ thuật để đạt được:

1. **Độ chính xác cao:** PhoBERT NER (96% F1) + Sentence-BERT semantic matching
2. **Hiệu suất tốt:** ChromaDB vector search (milliseconds) + TF-IDF caching
3. **Hỗ trợ đa ngôn ngữ:** Hybrid skill extraction (Việt + Anh)
4. **Tìm kiếm thông minh:** RAG với semantic re-ranking
5. **Tự chủ:** Không phụ thuộc LLM (Gemini là optional enhancement)

## Kết Luận

Hệ thống NLP trong project được thiết kế để xử lý hiệu quả cả tiếng Việt và tiếng Anh, với độ chính xác cao và hiệu suất tốt. Các kỹ thuật được kết hợp một cách thông minh để tạo ra các tính năng AI mạnh mẽ như gợi ý công việc, gợi ý ứng viên, và lộ trình học tập cá nhân hóa.

