# CÔNG NGHỆ XỬ LÝ NGÔN NGỮ TỰ NHIÊN (NLP) TRONG HỆ THỐNG

## Chương 2: Cơ sở lý thuyết về Xử lý Ngôn ngữ Tự nhiên

### 2.1 Tổng quan về Xử lý Ngôn ngữ Tự nhiên (Natural Language Processing)

Xử lý Ngôn ngữ Tự nhiên (Natural Language Processing - NLP) là một lĩnh vực nghiên cứu thuộc giao điểm giữa Khoa học Máy tính, Trí tuệ Nhân tạo và Ngôn ngữ học, tập trung vào việc cho phép máy tính có khả năng hiểu, phân tích và tạo sinh ngôn ngữ của con người một cách tự nhiên và có ý nghĩa [1]. Trong bối cảnh của hệ thống tuyển dụng thông minh, NLP đóng vai trò then chốt trong việc tự động hóa các quy trình phân tích hồ sơ ứng viên và đánh giá độ phù hợp với yêu cầu công việc [21][22].

Không giống như các ngôn ngữ lập trình có cú pháp cố định và rõ ràng, ngôn ngữ tự nhiên của con người chứa đựng nhiều tính mơ hồ, đa nghĩa và phụ thuộc vào ngữ cảnh [2]. Chính vì vậy, các kỹ thuật NLP hiện đại cần kết hợp nhiều phương pháp từ học máy (Machine Learning), học sâu (Deep Learning) và các mô hình ngôn ngữ lớn (Large Language Models - LLMs) để đạt được độ chính xác cao [37][38].

### 2.2 Các khái niệm cơ bản trong NLP

#### 2.2.1 Tokenization (Phân tách Token)

Tokenization là bước tiền xử lý cơ bản và quan trọng nhất trong pipeline xử lý NLP, có nhiệm vụ chia nhỏ văn bản thành các đơn vị có ý nghĩa gọi là token [1][2]. Trong tiếng Anh, quá trình này tương đối đơn giản vì các từ thường được phân tách bởi dấu cách, tuy nhiên với tiếng Việt, vấn đề trở nên phức tạp hơn do đặc thù của ngôn ngữ đơn lập và tính đa nghĩa của từng âm tiết [35][36]. Hệ thống áp dụng kỹ thuật Word Tokenization và Sentence Tokenization để xử lý các cụm từ chuyên ngành trong CV.

#### 2.2.2 Named Entity Recognition (NER - Nhận diện Thực thể Có tên)

Named Entity Recognition là kỹ thuật NLP cho phép hệ thống tự động xác định và phân loại các thực thể có tên trong văn bản thành các nhóm định nghĩa trước như tên người, tên tổ chức, địa điểm, ngày tháng, hoặc các thuật ngữ chuyên môn [1][3]. Trong bối cảnh phân tích CV, NER đóng vai trò then chốt trong việc trích xuất thông tin từ văn bản phi cấu trúc [21][22]. Module NER nhận diện các thực thể như tên công ty, trường đại học, kỹ năng công nghệ và thời gian làm việc, sau đó cấu trúc hóa thông tin này để lưu trữ vào cơ sở dữ liệu.

#### 2.2.3 Text Classification (Phân loại Văn bản)

Text Classification là nhiệm vụ gán nhãn hoặc phân loại văn bản vào một hoặc nhiều danh mục định trước dựa trên nội dung của nó [1][4]. Trong hệ thống, kỹ thuật này được áp dụng để phân loại kỹ năng của ứng viên vào các nhóm như Technical Skills, Soft Skills, Language Skills, và xác định cấp độ kinh nghiệm (Junior, Middle, Senior) [21][23].

#### 2.2.4 Semantic Similarity (Độ tương đồng Ngữ nghĩa)

Semantic Similarity là phương pháp đo lường mức độ tương đồng về ý nghĩa giữa hai đoạn văn bản, không chỉ dựa trên sự trùng khớp từ vựng mà còn dựa trên ngữ cảnh và ý nghĩa sâu xa [8][9]. Kỹ thuật này sử dụng các mô hình embedding như Word2Vec, GloVe hoặc transformer-based embeddings để chuyển văn bản thành các vector số trong không gian nhiều chiều, sau đó tính toán độ tương đồng cosine giữa các vector [10][11]. Trong hệ thống, Semantic Similarity được áp dụng để thực hiện job matching giữa CV ứng viên và yêu cầu công việc [24][25].

### 2.3 Kiến trúc Transformer và Mô hình Ngôn ngữ Lớn (Large Language Models)

#### 2.3.1 Cơ chế Self-Attention trong Transformer

Kiến trúc Transformer, được giới thiệu lần đầu trong bài báo "Attention is All You Need" của Vaswani và cộng sự năm 2017 [5], đã tạo ra một bước ngoặt trong lĩnh vực NLP bằng cách thay thế hoàn toàn các cấu trúc tuần tự (recurrent structures) bằng cơ chế self-attention. Cơ chế này cho phép mô hình xử lý toàn bộ chuỗi đầu vào một cách song song và nắm bắt được mối quan hệ phụ thuộc giữa các từ ở xa nhau trong câu [6].

Cụ thể, cơ chế Self-Attention hoạt động bằng cách tính toán ba ma trận Query (Q), Key (K) và Value (V) từ vector embedding của mỗi từ trong câu [5][6]. Đối với mỗi từ, hệ thống tính điểm attention bằng cách so sánh Query của từ đó với Key của tất cả các từ khác trong câu, sau đó kết hợp các Value vector tương ứng để tạo ra representation mới đã mã hóa thông tin ngữ cảnh từ toàn bộ câu. Khả năng nắm bắt mối quan hệ phức tạp này là nền tảng để hệ thống có thể trích xuất chính xác các trường thông tin và hiểu đúng ngữ nghĩa của CV.

#### 2.3.2 Mô hình Google Gemini và Ứng dụng trong Hệ thống

Google Gemini là mô hình ngôn ngữ lớn thế hệ mới được phát triển bởi Google DeepMind, thuộc dòng mô hình multimodal có khả năng xử lý và hiểu nhiều loại dữ liệu khác nhau bao gồm văn bản, hình ảnh và âm thanh [7][26]. Gemini được xây dựng dựa trên kiến trúc Transformer với hàng tỷ tham số, được huấn luyện trên một lượng dữ liệu khổng lồ, giúp mô hình có khả năng suy luận, lập luận logic và tạo sinh nội dung ở mức độ cao [37][38].

Trong hệ thống, Google Gemini API được tích hợp để thực hiện các tác vụ NLP phức tạp thông qua kỹ thuật Prompt Engineering mà không cần fine-tuning [18][19][20].

Hệ thống sử dụng Gemini cho các tác vụ: **CV Parsing** (trích xuất thông tin từ CV như tên, email, học vấn, kinh nghiệm, kỹ năng) [21][22], **Skill Gap Analysis** (phân tích khoảng cách kỹ năng giữa ứng viên và yêu cầu công việc), **Learning Roadmap Generation** (tạo lộ trình học tập có cấu trúc theo từng giai đoạn và bước), và **Job Matching & Scoring** (đánh giá độ phù hợp với điểm số từ 0-100) [24][25].

#### 2.3.3 Prompt Engineering và Optimization

Prompt Engineering là nghệ thuật thiết kế các câu hỏi hoặc hướng dẫn (prompts) đưa vào mô hình ngôn ngữ lớn để thu được kết quả chính xác và có cấu trúc như mong muốn [18][19][20]. Đây là một quy trình có hệ thống kết hợp nhiều kỹ thuật như few-shot learning, chain-of-thought prompting và output formatting.

Trong hệ thống, các prompt được thiết kế theo template có cấu trúc: System Message, Context và Task Instruction [19][20]. Ví dụ prompt cho CV parsing:

```
System: You are an expert HR analyst specializing in IT recruitment with 10 years of experience in parsing and analyzing technical CVs.

Context: Below is the extracted text from a candidate's CV:
[CV_TEXT_HERE]

Task: Please analyze this CV and extract the following information in JSON format:
1. Personal Information (name, email, phone)
2. Education (degree, major, university, graduation year)
3. Work Experience (company, position, duration, responsibilities)
4. Technical Skills (categorized by proficiency level)
5. Certifications (name, issuer, date)

Output Format: Return only valid JSON without any additional text or explanation.
```

Kỹ thuật few-shot learning được áp dụng bằng cách cung cấp ví dụ mẫu trong prompt [19]. Chain-of-thought prompting được sử dụng cho các tác vụ phức tạp, yêu cầu mô hình "suy nghĩ từng bước" để tăng độ chính xác [18].

### 2.4 Retrieval-Augmented Generation (RAG) trong Hệ thống Gợi ý Tài liệu

#### 2.4.1 Khái niệm và Lợi ích của RAG

Retrieval-Augmented Generation (RAG) là một kiến trúc kết hợp giữa hệ thống truy xuất thông tin (Information Retrieval) và mô hình sinh văn bản (Text Generation), nhằm khắc phục hạn chế về kiến thức cũ và hiện tượng "hallucination" của các mô hình ngôn ngữ lớn [12][13][14]. Thay vì chỉ dựa vào kiến thức đã được mã hóa trong tham số của mô hình, RAG cho phép mô hình truy cập động vào một cơ sở tri thức bên ngoài trước khi sinh câu trả lời [15][16]. Trong hệ thống, RAG đảm bảo các tài liệu học tập được gợi ý luôn chính xác và đến từ nguồn đáng tin cậy trong cơ sở dữ liệu.

#### 2.4.2 Quy trình hoạt động của RAG trong Hệ thống

Quy trình RAG được triển khai theo 4 bước [12][14][15]:

**Bước 1: Indexing và Embedding Documents** - Các tài liệu học tập được chuyển đổi thành vector embedding (768 hoặc 1536 chiều) và lưu trữ trong vector database [10][11].

**Bước 2: Query Embedding và Retrieval** - Câu truy vấn được chuyển thành vector embedding, sau đó thực hiện similarity search (cosine similarity hoặc dot product) để tìm top-k tài liệu có vector gần nhất [31][32][33].

**Bước 3: Context Augmentation** - Các tài liệu được truy xuất (3-5 tài liệu) được ghép vào prompt gửi đến Gemini [15][16].

**Bước 4: Generation với Context** - Gemini sinh ra lộ trình học tập chi tiết, liên kết với các tài liệu cụ thể từ cơ sở dữ liệu [12][14].

#### 2.4.3 Vector Embeddings và Semantic Search

Vector embedding là kỹ thuật chuyển đổi dữ liệu văn bản thành các vector số trong không gian nhiều chiều [10][11]. Các mô hình embedding hiện đại như BERT, Sentence-BERT hay OpenAI Embeddings có khả năng nắm bắt được ngữ nghĩa sâu xa và mối quan hệ ngữ cảnh giữa các từ [8][9][10]. Trong hệ thống, semantic search tìm kiếm tài liệu dựa trên ngữ nghĩa, không chỉ từ khóa chính xác. Để tối ưu hiệu năng, hệ thống sử dụng các kỹ thuật indexing như HNSW hoặc IVF cho phép tìm kiếm nearest neighbors với thời gian phản hồi thấp [31][32][33][34].

### 2.5 Các kỹ thuật NLP bổ trợ

#### 2.5.1 Text Normalization và Preprocessing

Text normalization là quá trình chuẩn hóa văn bản đầu vào để đảm bảo tính nhất quán và giảm thiểu nhiễu trong dữ liệu. Trong hệ thống xử lý CV, văn bản trích xuất từ PDF thường chứa nhiều yếu tố không mong muốn như ký tự đặc biệt, khoảng trắng thừa, hoặc encoding không đúng. Quy trình preprocessing được thiết kế gồm nhiều bước:

**Lowercase Conversion:** Chuyển đổi toàn bộ văn bản về chữ thường để đảm bảo "Java", "JAVA" và "java" được coi là một. Tuy nhiên, cần lưu ý rằng một số thuật ngữ như "iOS" hay "iPhone" cần được xử lý đặc biệt để giữ nguyên cách viết hoa đặc trưng.

**Special Character Handling:** Loại bỏ hoặc thay thế các ký tự đặc biệt như bullet points, ký tự Unicode không chuẩn, hoặc các ký tự điều khiển. Tuy nhiên, các ký tự có ý nghĩa như "@" trong email, "+" trong "C++" cần được giữ lại.

**Whitespace Normalization:** Chuẩn hóa khoảng trắng, loại bỏ khoảng trắng thừa, tab và xuống dòng không cần thiết. Điều này đặc biệt quan trọng khi xử lý PDF vì quá trình trích xuất văn bản từ PDF thường tạo ra nhiều khoảng trắng bất thường.

**Acronym Expansion:** Mở rộng các từ viết tắt phổ biến trong ngành IT, ví dụ "JS" → "JavaScript", "ML" → "Machine Learning". Hệ thống duy trì một dictionary các từ viết tắt được cập nhật thường xuyên.

#### 2.5.2 Skill Normalization và Matching

Một thách thức lớn trong việc so khớp kỹ năng giữa CV và Job Description là sự đa dạng trong cách đặt tên và viết tắt các kỹ năng công nghệ. Cùng một công nghệ có thể được viết dưới nhiều dạng khác nhau: "React.js", "ReactJS", "React", "react-js" đều ám chỉ cùng một framework. Hệ thống giải quyết vấn đề này thông qua một module Skill Normalization chuyên biệt.

Module này hoạt động dựa trên một knowledge base chứa các skill entries trong collection `Skill` của MongoDB, mỗi entry bao gồm tên canonical (tên chuẩn) và một mảng các aliases (tên gọi khác). Khi phát hiện một kỹ năng trong CV hoặc Job Description, hệ thống trước tiên thực hiện fuzzy matching với danh sách skill đã biết, sau đó chuẩn hóa về tên canonical. Điều này đảm bảo rằng khi so sánh kỹ năng, hệ thống không bỏ sót do sai lệch về cách viết.

Ngoài ra, hệ thống còn xây dựng một skill graph mô tả mối quan hệ giữa các kỹ năng, ví dụ "React Native" là một specialization của "React", "Express.js" thường đi kèm với "Node.js". Thông tin này được sử dụng trong quá trình tính toán matching score để đánh giá chính xác hơn khoảng cách kỹ năng giữa ứng viên và yêu cầu công việc.

#### 2.5.3 Experience Level Classification

Phân loại cấp độ kinh nghiệm của ứng viên (Junior, Middle, Senior) là một nhiệm vụ phức tạp không chỉ dựa vào số năm kinh nghiệm mà còn dựa vào chất lượng và độ sâu của kinh nghiệm được mô tả trong CV. Hệ thống sử dụng một combination của rule-based và ML-based approaches.

Các rule-based features bao gồm: số năm kinh nghiệm tổng thể, số lượng project đã tham gia, các từ khóa chỉ trách nhiệm (ví dụ: "lead", "architect", "mentor"), và độ phức tạp của stack công nghệ. ML component sử dụng Gemini để phân tích ngữ nghĩa của phần mô tả công việc, đánh giá xem ứng viên có thể hiện được khả năng giải quyết vấn đề phức tạp, làm việc độc lập hay leadership skills hay không.

Kết quả classification không chỉ là một label đơn giản mà là một confidence score, ví dụ "70% Middle, 30% Senior", giúp hệ thống có thể matching linh hoạt hơn với các job requirements không rõ ràng.

### 2.6 Đánh giá Hiệu năng và Độ chính xác của Hệ thống NLP

#### 2.6.1 Metrics và Phương pháp Đánh giá

Để đánh giá chất lượng của các module NLP trong hệ thống, nhiều metrics khác nhau được sử dụng tùy theo từng tác vụ cụ thể:

**CV Parsing Accuracy:** Được đo bằng cách so sánh kết quả tự động parse với ground truth (dữ liệu được gán nhãn thủ công). Metrics bao gồm Precision (độ chính xác của thông tin được trích xuất), Recall (tỷ lệ thông tin quan trọng được tìm thấy), và F1-score (trung bình điều hòa của precision và recall). Mục tiêu là đạt F1-score > 90% cho các trường thông tin quan trọng như kỹ năng và kinh nghiệm.

**Job Matching Quality:** Được đánh giá thông qua A/B testing và feedback từ recruiters. Hệ thống track số lượng ứng viên được shortlist sau khi được gợi ý bởi AI so với shortlist rate trung bình của toàn hệ thống. Một chỉ số quan trọng khác là Normalized Discounted Cumulative Gain (NDCG), đo lường chất lượng của ranking trong danh sách gợi ý ứng viên.

**Learning Roadmap Relevance:** Được đánh giá dựa trên user feedback và completion rate. Hệ thống thu thập feedback từ ứng viên về độ hữu ích của roadmap và theo dõi tỷ lệ ứng viên hoàn thành các bước trong roadmap, từ đó điều chỉnh prompt và logic generation.

#### 2.6.2 Xử lý Lỗi và Edge Cases

Bất kỳ hệ thống NLP thực tế nào cũng phải đối mặt với các edge cases và lỗi không mong muốn. Hệ thống được thiết kế với nhiều lớp error handling và fallback mechanisms:

**Malformed Input Handling:** Khi CV có format kỳ lạ hoặc bị corrupt, hệ thống sử dụng OCR (Optical Character Recognition) như backup method để trích xuất văn bản từ image of document. Nếu vẫn thất bại, hệ thống sẽ yêu cầu người dùng nhập thủ công hoặc upload file khác.

**API Rate Limiting và Retry Logic:** Gemini API có giới hạn về số request per minute. Hệ thống implement exponential backoff retry logic và request queuing để xử lý gracefully khi hit rate limit. Trong trường hợp API hoàn toàn unavailable, hệ thống fall back về các phương pháp NLP truyền thống (rule-based parsing và keyword matching) với độ chính xác thấp hơn nhưng vẫn functional.

**Multilingual Support và Language Detection:** Mặc dù hệ thống chủ yếu xử lý CV tiếng Việt và tiếng Anh, việc phát hiện ngôn ngữ và xử lý mixed-language documents (CV có cả tiếng Việt và tiếng Anh) là cần thiết. Hệ thống sử dụng language detection library để identify ngôn ngữ chính và điều chỉnh preprocessing pipeline tương ứng.

### 2.7 Thách thức và Hướng Phát triển Tương lai

#### 2.7.1 Các Thách thức Hiện tại

**Ambiguity và Context-Dependency:** Ngôn ngữ tự nhiên vốn dĩ mơ hồ và phụ thuộc ngữ cảnh. Một từ như "Python" có thể là ngôn ngữ lập trình hoặc tên một tổ chức. Mặc dù mô hình ngôn ngữ lớn đã cải thiện đáng kể trong việc xử lý ambiguity, vẫn còn cases mà hệ thống hiểu sai ngữ cảnh.

**Domain-Specific Terminology:** Lĩnh vực IT liên tục xuất hiện các thuật ngữ và công nghệ mới. Việc cập nhật knowledge base và training mô hình để nhận diện các kỹ năng mới là một thách thức liên tục. Hệ thống cần một mechanism để tự động phát hiện và thêm các skill mới vào database.

**Bias và Fairness:** Các mô hình NLP có thể inherit các bias từ dữ liệu training, dẫn đến discrimination không mong muốn trong quá trình matching và recommendation. Ví dụ, mô hình có thể bias về gender khi đánh giá ứng viên cho một số vị trí nhất định. Việc detect và mitigate bias này là một vấn đề quan trọng cần được giải quyết.

#### 2.7.2 Hướng Phát triển

**Fine-tuning Domain-Specific Models:** Thay vì chỉ sử dụng general-purpose LLM, hệ thống có thể được cải thiện bằng cách fine-tune các mô hình nhỏ hơn trên dữ liệu CV và Job Description trong lĩnh vực IT cụ thể. Điều này sẽ cải thiện accuracy đồng thời giảm latency và chi phí API.

**Active Learning và Continuous Improvement:** Implement một feedback loop cho phép hệ thống học từ corrections của users. Khi một recruiter chỉnh sửa kết quả parsing hoặc matching, feedback này được lưu lại và sử dụng để cải thiện mô hình theo thời gian.

**Multimodal Understanding:** Mở rộng khả năng của hệ thống để không chỉ xử lý text mà còn có thể phân tích các elements khác trong CV như charts, graphs, hoặc portfolio images. Gemini với khả năng multimodal có tiềm năng lớn cho hướng phát triển này.

**Explainable AI (XAI):** Tăng cường khả năng giải thích của hệ thống, cho phép users hiểu rõ tại sao một recommendation được đưa ra hoặc vì sao một matching score có giá trị nhất định. Điều này tăng trust và adoption của hệ thống.

---

## Kết luận

Công nghệ Xử lý Ngôn ngữ Tự nhiên đóng vai trò nền tảng trong việc xây dựng một hệ thống tuyển dụng thông minh hiện đại. Thông qua việc kết hợp các kỹ thuật NLP truyền thống với các mô hình ngôn ngữ lớn tiên tiến như Google Gemini và kiến trúc RAG, hệ thống đã có khả năng tự động hóa nhiều quy trình phức tạp từ phân tích CV, matching ứng viên đến tạo sinh lộ trình học tập cá nhân hóa.

Việc hiểu sâu về các khái niệm NLP cơ bản như tokenization, NER, text classification và semantic similarity, kết hợp với kiến thức về kiến trúc Transformer và cơ chế self-attention, là chìa khóa để xây dựng và tối ưu hóa các ứng dụng NLP trong thực tế. Đồng thời, các kỹ thuật tiên tiến như Prompt Engineering và RAG cho phép tận dụng sức mạnh của LLMs một cách hiệu quả mà không cần chi phí training lớn.

Mặc dù còn nhiều thách thức cần giải quyết, đặc biệt về vấn đề bias, ambiguity và domain adaptation, hướng phát triển của công nghệ NLP hứa hẹn sẽ mang lại những cải tiến đáng kể trong tương lai, góp phần tạo ra các hệ thống tuyển dụng ngày càng thông minh, công bằng và hiệu quả hơn.

---

## Danh mục Hình ảnh và Sơ đồ

### Hình 2.1: Kiến trúc tổng quan của Pipeline NLP trong Hệ thống
*Mô tả luồng xử lý từ khi nhận CV đầu vào đến khi tạo ra Learning Roadmap*
- **Nguồn:** Thiết kế của tác giả
- **Vị trí đề xuất:** Sau phần 2.1

**Mô tả nội dung hình:**
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  CV Upload  │────▶│ PDF/DOCX     │────▶│ Text        │
│  (PDF/DOCX) │     │ Text Extract │     │ Cleaning    │
└─────────────┘     └──────────────┘     └─────────────┘
                                                │
                                                ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Learning   │◀────│  Gemini AI   │◀────│ Tokenization│
│  Roadmap    │     │  Processing  │     │ & NER       │
└─────────────┘     └──────────────┘     └─────────────┘
                            ▲
                            │
                    ┌──────────────┐
                    │  RAG System  │
                    │  (Resources) │
                    └──────────────┘
```

### Hình 2.2: Quy trình Tokenization cho Tiếng Việt và Tiếng Anh
*So sánh cách tokenize giữa hai ngôn ngữ*
- **Nguồn:** Minh họa của tác giả
- **Vị trí đề xuất:** Phần 2.2.1

**Ví dụ minh họa:**
```
Input Text (Tiếng Việt): "Có 5 năm kinh nghiệm lập trình Java"

Word Tokenization:
["Có", "5", "năm", "kinh nghiệm", "lập trình", "Java"]

Input Text (English): "5 years of Java programming experience"

Word Tokenization:
["5", "years", "of", "Java", "programming", "experience"]
```

### Hình 2.3: Named Entity Recognition (NER) trên CV
*Ví dụ nhận diện các thực thể trong đoạn văn bản CV*
- **Nguồn:** Kết quả thực nghiệm từ hệ thống
- **Vị trí đề xuất:** Phần 2.2.2

**Ví dụ trực quan:**
```
Text: "Tốt nghiệp Đại học Bách Khoa Hà Nội năm 2020, 
       làm việc tại FPT Software với vai trò Backend Developer"

Entities Detected:
┌─────────────────────────────┬──────────────────┐
│ Entity Text                 │ Entity Type      │
├─────────────────────────────┼──────────────────┤
│ Đại học Bách Khoa Hà Nội   │ EDUCATION        │
│ 2020                        │ DATE             │
│ FPT Software                │ ORGANIZATION     │
│ Backend Developer           │ JOB_TITLE        │
└─────────────────────────────┴──────────────────┘
```

### Hình 2.4: Kiến trúc Transformer với cơ chế Self-Attention
*Sơ đồ minh họa cách hoạt động của Self-Attention mechanism*
- **Nguồn:** Dựa trên Vaswani et al. (2017) "Attention is All You Need"
- **Vị trí đề xuất:** Phần 2.3.1

**Sơ đồ khối:**
```
Input Sequence: ["Ứng", "viên", "có", "kinh", "nghiệm", "Java"]
        │
        ▼
    Embedding Layer
        │
        ▼
┌───────────────────────────────────────────┐
│      Multi-Head Self-Attention            │
│  ┌──────┐  ┌──────┐  ┌──────┐           │
│  │  Q   │  │  K   │  │  V   │           │
│  └──────┘  └──────┘  └──────┘           │
│      │         │         │               │
│      └─────────┴─────────┘               │
│              │                            │
│     Attention Scores                      │
│  ┌─────────────────────┐                 │
│  │ [0.3, 0.1, 0.05...] │                 │
│  └─────────────────────┘                 │
└───────────────────────────────────────────┘
        │
        ▼
  Feed Forward Network
        │
        ▼
  Output Representations
```

### Hình 2.5: Prompt Engineering Workflow cho CV Analysis
*Cấu trúc một prompt hoàn chỉnh gửi đến Gemini API*
- **Nguồn:** Implementation thực tế trong hệ thống
- **Vị trí đề xuất:** Phần 2.3.3

**Template minh họa:**
```javascript
const prompt = {
  systemMessage: "You are an expert HR analyst...",
  context: {
    cvText: "Extracted CV content here...",
    jobRequirements: ["React", "Node.js", "MongoDB"]
  },
  task: "Analyze and extract structured information",
  outputFormat: {
    type: "JSON",
    schema: {
      skills: ["string"],
      experience: ["object"],
      education: ["object"]
    }
  },
  examples: [/* Few-shot examples */]
}
```

### Hình 2.6: Kiến trúc RAG (Retrieval-Augmented Generation)
*Luồng hoạt động của RAG trong việc gợi ý tài liệu học tập*
- **Nguồn:** Thiết kế hệ thống của tác giả
- **Vị trí đề xuất:** Phần 2.4.2

**Sơ đồ luồng:**
```
┌────────────────────────────────────────────────────────┐
│                   RAG PIPELINE                         │
├────────────────────────────────────────────────────────┤
│                                                         │
│  1. INDEXING PHASE (Offline)                          │
│     ┌─────────────────┐                               │
│     │ Learning        │                               │
│     │ Resources DB    │                               │
│     └────────┬────────┘                               │
│              │                                         │
│              ▼                                         │
│     ┌─────────────────┐                               │
│     │ Embedding Model │                               │
│     │ (BERT/OpenAI)   │                               │
│     └────────┬────────┘                               │
│              │                                         │
│              ▼                                         │
│     ┌─────────────────┐                               │
│     │ Vector Database │                               │
│     │ (FAISS/Pinecone)│                               │
│     └─────────────────┘                               │
│                                                         │
│  2. RETRIEVAL PHASE (Online)                          │
│     ┌─────────────────┐                               │
│     │ User Query:     │                               │
│     │ "React Hooks"   │                               │
│     └────────┬────────┘                               │
│              │                                         │
│              ▼                                         │
│     ┌─────────────────┐                               │
│     │ Query Embedding │                               │
│     └────────┬────────┘                               │
│              │                                         │
│              ▼                                         │
│     ┌─────────────────┐                               │
│     │ Similarity      │                               │
│     │ Search (Top-K)  │                               │
│     └────────┬────────┘                               │
│              │                                         │
│              ▼                                         │
│     ┌─────────────────┐                               │
│     │ Retrieved Docs  │                               │
│     │ [Doc1, Doc2...] │                               │
│     └─────────────────┘                               │
│                                                         │
│  3. GENERATION PHASE                                   │
│     ┌─────────────────┐                               │
│     │ Context         │                               │
│     │ Augmentation    │                               │
│     └────────┬────────┘                               │
│              │                                         │
│              ▼                                         │
│     ┌─────────────────┐                               │
│     │ Gemini LLM      │                               │
│     │ Generation      │                               │
│     └────────┬────────┘                               │
│              │                                         │
│              ▼                                         │
│     ┌─────────────────┐                               │
│     │ Learning        │                               │
│     │ Roadmap Output  │                               │
│     └─────────────────┘                               │
└────────────────────────────────────────────────────────┘
```

### Hình 2.7: Vector Embeddings và Semantic Search
*Minh họa không gian vector và tìm kiếm tương đồng ngữ nghĩa*
- **Nguồn:** Concept visualization
- **Vị trí đề xuất:** Phần 2.4.3

**Biểu đồ không gian 2D (chiếu từ không gian nhiều chiều):**
```
                    Semantic Space Visualization
                    
        React Hooks ●
                     ╲
                      ╲  (cosine similarity = 0.92)
                       ╲
    React Component     ● Query: "React Lifecycle"
    Lifecycle            
                        
                        
    Angular ●                          ● Vue.js
    Components                         Lifecycle
    
    
    
            ● Django                ● Flask
            Views                   Routes
            
            
                    Python ●
                    Basics
                    
Legend:
● = Document embedding point
Distance = Semantic similarity (closer = more similar)
```

### Hình 2.8: Job Matching Score Calculation
*Công thức và quy trình tính điểm phù hợp giữa CV và Job*
- **Nguồn:** Algorithm implementation
- **Vị trí đề xuất:** Phần 2.3.2

**Sơ đồ tính toán:**
```
┌──────────────────────────────────────────────────────┐
│           MATCHING SCORE CALCULATION                 │
├──────────────────────────────────────────────────────┤
│                                                       │
│  Component Weights:                                  │
│  ├─ Technical Skills Match    : 40%                 │
│  ├─ Experience Level Match    : 25%                 │
│  ├─ Education Match            : 15%                 │
│  ├─ Soft Skills Match          : 10%                 │
│  └─ Cultural Fit (AI Analysis) : 10%                 │
│                                                       │
│  Formula:                                            │
│  ┌────────────────────────────────────────────────┐ │
│  │ Total Score = Σ(Component_i × Weight_i)        │ │
│  │                                                 │ │
│  │ Where:                                          │ │
│  │ Component_i = Skill_Match_Score_i              │ │
│  │ Weight_i = Importance_Weight_i                 │ │
│  └────────────────────────────────────────────────┘ │
│                                                       │
│  Example Calculation:                                │
│  ┌────────────────────┬──────────┬─────────────┐   │
│  │ Component          │ Score    │ Weighted    │   │
│  ├────────────────────┼──────────┼─────────────┤   │
│  │ Technical Skills   │ 85/100   │ 34.0        │   │
│  │ Experience Level   │ 90/100   │ 22.5        │   │
│  │ Education          │ 80/100   │ 12.0        │   │
│  │ Soft Skills        │ 75/100   │  7.5        │   │
│  │ Cultural Fit       │ 88/100   │  8.8        │   │
│  ├────────────────────┴──────────┼─────────────┤   │
│  │ TOTAL MATCHING SCORE          │ 84.8/100    │   │
│  └───────────────────────────────┴─────────────┘   │
└──────────────────────────────────────────────────────┘
```

### Hình 2.9: Skill Normalization và Matching Process
*Quy trình chuẩn hóa và so khớp kỹ năng*
- **Nguồn:** System implementation
- **Vị trí đề xuất:** Phần 2.5.2

**Flow chart:**
```
Input Skill Text: "reactjs", "React.js", "ReactJS"
            │
            ▼
    ┌──────────────────┐
    │ Lowercase        │
    │ Conversion       │
    └────────┬─────────┘
            │
            ▼
    ┌──────────────────┐
    │ Special Char     │
    │ Normalization    │ 
    └────────┬─────────┘
            │
            ▼
    ┌──────────────────┐
    │ Fuzzy Matching   │
    │ with Skill DB    │
    └────────┬─────────┘
            │
            ▼
    ┌──────────────────┐
    │ Canonical Name:  │
    │ "React"          │
    └────────┬─────────┘
            │
            ▼
    ┌──────────────────┐
    │ Skill Metadata:  │
    │ - Category: FE   │
    │ - Related: JSX   │
    │ - Level: Check   │
    └──────────────────┘
```

### Hình 2.10: Error Handling và Fallback Mechanisms
*Chiến lược xử lý lỗi trong hệ thống NLP*
- **Nguồn:** System architecture
- **Vị trí đề xuất:** Phần 2.6.2

**Decision tree:**
```
CV Upload Received
        │
        ▼
    Can extract text?
    ├─ YES ──────────────────┐
    │                         │
    └─ NO                     ▼
        │               Text Preprocessing
        ▼                     │
    Try OCR?                  ▼
    ├─ YES ────┐        Send to Gemini API
    │          │              │
    └─ NO      ▼              ▼
        │   OCR Success?   API Available?
        │   ├─ YES ───────┐  ├─ YES ────┐
        │   └─ NO ────┐   │  └─ NO      │
        │             │   │      │       │
        ▼             ▼   ▼      ▼       ▼
   Manual        Request  Parse  Rule-   Process
   Input         Re-upload Success Based  Success
   Required                      Fallback
```

---

## Tài liệu Tham khảo

### Sách và Giáo trình

[1] Jurafsky, D., & Martin, J. H. (2024). *Speech and Language Processing* (3rd ed. - Draft). Stanford University. https://web.stanford.edu/~jurafsky/slp3/

[2] Eisenstein, J. (2019). *Introduction to Natural Language Processing*. MIT Press.

[3] Chollet, F. (2021). *Deep Learning with Python* (2nd ed.). Manning Publications.

[4] Tunstall, L., von Werra, L., & Wolf, T. (2022). *Natural Language Processing with Transformers: Building Language Applications with Hugging Face*. O'Reilly Media.

### Bài báo Khoa học về Large Language Models

[5] Brown, T., Mann, B., Ryder, N., Subbiah, M., Kaplan, J. D., Dhariwal, P., ... & Amodei, D. (2020). Language models are few-shot learners. In *Advances in Neural Information Processing Systems*, 33, 1877-1901. https://arxiv.org/abs/2005.14165

[6] Ouyang, L., Wu, J., Jiang, X., Almeida, D., Wainwright, C., Mishkin, P., ... & Lowe, R. (2022). Training language models to follow instructions with human feedback. In *Advances in Neural Information Processing Systems*, 35, 27730-27744. https://arxiv.org/abs/2203.02155

[7] Touvron, H., Martin, L., Stone, K., Albert, P., Almahairi, A., Babaei, Y., ... & Scialom, T. (2023). Llama 2: Open foundation and fine-tuned chat models. *arXiv preprint arXiv:2307.09288*. https://arxiv.org/abs/2307.09288

[8] Achiam, J., Adler, S., Agarwal, S., Ahmad, L., Akkaya, I., Aleman, F. L., ... & McGrew, B. (2023). GPT-4 Technical Report. *arXiv preprint arXiv:2303.08774*. https://arxiv.org/abs/2303.08774

[9] Team, G., Anil, R., Borgeaud, S., Wu, Y., Alayrac, J. B., Yu, J., ... & Vinyals, O. (2023). Gemini: A Family of Highly Capable Multimodal Models. *arXiv preprint arXiv:2312.11805*. https://arxiv.org/abs/2312.11805

[10] Zhao, W. X., Zhou, K., Li, J., Tang, T., Wang, X., Hou, Y., ... & Wen, J. R. (2023). A survey of large language models. *arXiv preprint arXiv:2303.18223*. https://arxiv.org/abs/2303.18223

### Bài báo về Retrieval-Augmented Generation (RAG)

[11] Lewis, P., Perez, E., Piktus, A., Petroni, F., Karpukhin, V., Goyal, N., ... & Kiela, D. (2020). Retrieval-augmented generation for knowledge-intensive NLP tasks. In *Advances in Neural Information Processing Systems*, 33, 9459-9474. https://arxiv.org/abs/2005.11401

[12] Gao, Y., Xiong, Y., Gao, X., Jia, K., Pan, J., Bi, Y., ... & Wang, H. (2023). Retrieval-Augmented Generation for Large Language Models: A Survey. *arXiv preprint arXiv:2312.10997*. https://arxiv.org/abs/2312.10997

[13] Asai, A., Wu, Z., Wang, Y., Sil, A., & Hajishirzi, H. (2023). Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection. *arXiv preprint arXiv:2310.11511*. https://arxiv.org/abs/2310.11511

### Bài báo về Embeddings và Semantic Search

[14] Reimers, N., & Gurevych, I. (2019). Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks. In *Proceedings of EMNLP-IJCNLP* (pp. 3982-3992). https://arxiv.org/abs/1908.10084

[15] Neelakantan, A., Xu, T., Puri, R., Radford, A., Han, J. M., Tworek, J., ... & Sastry, G. (2022). Text and code embeddings by contrastive pre-training. *arXiv preprint arXiv:2201.10005*. https://arxiv.org/abs/2201.10005

[16] Muennighoff, N., Tazi, N., Magne, L., & Reimers, N. (2023). MTEB: Massive Text Embedding Benchmark. In *Proceedings of EACL 2023* (pp. 2014-2037). https://arxiv.org/abs/2210.07316

[17] Johnson, J., Douze, M., & Jégou, H. (2019). Billion-scale similarity search with GPUs. *IEEE Transactions on Big Data*, 7(3), 535-547. https://doi.org/10.1109/TBDATA.2019.2921572

### Bài báo về Prompt Engineering

[18] Wei, J., Wang, X., Schuurmans, D., Bosma, M., Xia, F., Chi, E., ... & Zhou, D. (2022). Chain-of-thought prompting elicits reasoning in large language models. In *Advances in Neural Information Processing Systems*, 35, 24824-24837. https://arxiv.org/abs/2201.11903

[19] Zhou, Y., Muresanu, A. I., Han, Z., Paster, K., Pitis, S., Chan, H., & Ba, J. (2023). Large language models are human-level prompt engineers. In *Proceedings of ICLR 2023*. https://arxiv.org/abs/2211.01910

[20] White, J., Fu, Q., Hays, S., Sandborn, M., Olea, C., Gilbert, H., ... & Schmidt, D. C. (2023). A prompt pattern catalog to enhance prompt engineering with ChatGPT. *arXiv preprint arXiv:2302.11382*. https://arxiv.org/abs/2302.11382

### Nghiên cứu về CV Parsing và Job Matching

[21] Qamar, A., Karim, A., & Shaikh, S. (2020). Automated Resume Classification using Deep Learning. In *2020 IEEE 23rd International Multitopic Conference (INMIC)* (pp. 1-6). IEEE. https://doi.org/10.1109/INMIC50486.2020.9318135

[22] Roy, P. K., Chowdhary, S. S., & Bhatia, R. (2020). A Machine Learning approach towards Resume Parsing and Recommendation. In *2020 International Conference on Computer Science, Engineering and Applications (ICCSEA)* (pp. 1-5). IEEE. https://doi.org/10.1109/ICCSEA49143.2020.9132926

[23] Gupta, K., & Chawla, M. (2019). Natural Language Processing Based Resume Ranking using Machine Learning. In *2019 International Conference on Machine Learning, Big Data, Cloud and Parallel Computing (COMITCon)* (pp. 445-450). IEEE. https://doi.org/10.1109/COMITCon.2019.8862265

[24] Dave, V. S., Zhang, B., Al Hasan, M., AlJadda, K., & Korayem, M. (2018). A combined representation learning approach for better job and skill recommendation. In *Proceedings of the 27th ACM International Conference on Information and Knowledge Management* (pp. 1997-2005). https://doi.org/10.1145/3269206.3272023

[25] Qin, C., Zhu, H., Xu, T., Zhu, C., Jiang, L., Chen, E., & Xiong, H. (2018). Enhancing person-job fit for talent recruitment: An ability-aware neural network approach. In *Proceedings of SIGIR 2018* (pp. 25-34). https://doi.org/10.1145/3209978.3210025

### Tài liệu Kỹ thuật và Framework

[26] Google AI. (2024). *Gemini API Documentation*. Google DeepMind. https://ai.google.dev/docs

[27] OpenAI. (2024). *API Reference - OpenAI Documentation*. https://platform.openai.com/docs/api-reference

[28] Hugging Face. (2024). *Transformers Documentation*. https://huggingface.co/docs/transformers

[29] LangChain. (2024). *LangChain Documentation*. https://python.langchain.com/docs/

[30] MongoDB, Inc. (2024). *MongoDB Manual Version 7.0*. https://docs.mongodb.com/manual/

### Công cụ Vector Database và Search

[31] Pinecone Systems. (2024). *Pinecone Vector Database Documentation*. https://docs.pinecone.io/

[32] Weaviate. (2024). *Weaviate Vector Search Engine*. https://weaviate.io/developers/weaviate

[33] Qdrant. (2024). *Qdrant Vector Database Documentation*. https://qdrant.tech/documentation/

[34] Chroma. (2024). *Chroma - the AI-native open-source embedding database*. https://docs.trychroma.com/

### Nghiên cứu về NLP cho tiếng Việt

[35] Nguyen, D. Q., Nguyen, A. T., Pham, D. D., & Nguyen, P. T. (2020). PhoBERT: Pre-trained language models for Vietnamese. In *Findings of EMNLP 2020* (pp. 1037-1042). https://arxiv.org/abs/2003.00744

[36] The, V. B., Tran, T. O., & Pham, V. T. (2021). Improving Sequence Tagging for Vietnamese Text using Transformer-based Neural Models. In *Proceedings of RIVF International Conference on Computing and Communication Technologies* (pp. 1-6). IEEE. https://doi.org/10.1109/RIVF51545.2021.9642096

### Survey Papers và Best Practices

[37] Bommasani, R., Hudson, D. A., Adeli, E., Altman, R., Arora, S., von Arx, S., ... & Liang, P. (2021). On the opportunities and risks of foundation models. *arXiv preprint arXiv:2108.07258*. https://arxiv.org/abs/2108.07258

[38] Kaddour, J., Harris, J., Mozes, M., Bradley, H., Raileanu, R., & McHardy, R. (2023). Challenges and Applications of Large Language Models. *arXiv preprint arXiv:2307.10169*. https://arxiv.org/abs/2307.10169

[39] Naveed, H., Khan, A. U., Qiu, S., Saqib, M., Anwar, S., Usman, M., ... & Mian, A. (2023). A Comprehensive Overview of Large Language Models. *arXiv preprint arXiv:2307.06435*. https://arxiv.org/abs/2307.06435

### Tiêu chuẩn và Đánh giá

[40] ISO/IEC 25010:2023. *Systems and software engineering - Systems and software Quality Requirements and Evaluation (SQuaRE)*. International Organization for Standardization.

[41] Liang, P., Bommasani, R., Lee, T., Tsipras, D., Soylu, D., Yasunaga, M., ... & Koreeda, Y. (2023). Holistic evaluation of language models. *Transactions on Machine Learning Research*. https://arxiv.org/abs/2211.09110

[42] Chang, Y., Wang, X., Wang, J., Wu, Y., Yang, L., Zhu, K., ... & Xie, X. (2024). A Survey on Evaluation of Large Language Models. *ACM Transactions on Intelligent Systems and Technology*, 15(3), 1-45. https://arxiv.org/abs/2307.03109

### Nghiên cứu về Bias và Fairness trong AI

[43] Ferrara, E. (2023). Fairness and Bias in Artificial Intelligence: A Brief Survey of Sources, Impacts, and Mitigation Strategies. *Sci*, 6(1), 3. https://doi.org/10.3390/sci6010003

[44] Gallegos, I. O., Rossi, R. A., Barrow, J., Tanjim, M. M., Kim, S., Dernoncourt, F., ... & Ahmed, N. K. (2024). Bias and Fairness in Large Language Models: A Survey. *Computational Linguistics*, 1-79. https://arxiv.org/abs/2309.00770

### Ứng dụng AI trong Recruitment

[45] Sánchez-Monedero, J., Dencik, L., & Edwards, L. (2020). What does it mean to 'solve'the problem of discrimination in hiring? Social, technical and legal perspectives from the UK on automated hiring systems. In *Proceedings of the 2020 Conference on Fairness, Accountability, and Transparency* (pp. 458-468). https://doi.org/10.1145/3351095.3372849

[46] Raghavan, M., Barocas, S., Kleinberg, J., & Levy, K. (2020). Mitigating bias in algorithmic hiring: Evaluating claims and practices. In *Proceedings of the 2020 Conference on Fairness, Accountability, and Transparency* (pp. 469-481). https://doi.org/10.1145/3351095.3372828

[47] Köchling, A., & Wehner, M. C. (2020). Discriminated by an algorithm: a systematic review of discrimination and fairness by algorithmic decision-making in the context of HR recruitment and HR development. *Business Research*, 13(3), 795-848. https://doi.org/10.1007/s40685-020-00134-w

---

## Phụ lục: Code Examples và Implementation Details

### Phụ lục A: CV Text Extraction với PDF.js
```javascript
// Example code cho việc trích xuất text từ PDF
const pdfParse = require('pdf-parse');
const fs = require('fs');

async function extractTextFromPDF(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  
  return {
    text: data.text,
    numPages: data.numpages,
    info: data.info
  };
}
```

### Phụ lục B: Gemini API Integration Example
```javascript
// Example prompt structure cho CV analysis
const analyzeCV = async (cvText) => {
  const prompt = {
    contents: [{
      parts: [{
        text: `You are an expert HR analyst. Analyze this CV and extract:
        
        CV Text:
        ${cvText}
        
        Extract in JSON format:
        {
          "personalInfo": {...},
          "skills": [...],
          "experience": [...],
          "education": [...]
        }`
      }]
    }],
    generationConfig: {
      temperature: 0.2,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    }
  };
  
  const result = await geminiModel.generateContent(prompt);
  return JSON.parse(result.response.text());
};
```

### Phụ lục C: Vector Similarity Search với FAISS
```python
# Example implementation của semantic search
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

class SemanticSearchEngine:
    def __init__(self, model_name='all-MiniLM-L6-v2'):
        self.model = SentenceTransformer(model_name)
        self.index = None
        self.documents = []
    
    def index_documents(self, documents):
        embeddings = self.model.encode(documents)
        dimension = embeddings.shape[1]
        
        self.index = faiss.IndexFlatIP(dimension)
        self.index.add(embeddings)
        self.documents = documents
    
    def search(self, query, top_k=5):
        query_embedding = self.model.encode([query])
        distances, indices = self.index.search(query_embedding, top_k)
        
        results = []
        for i, idx in enumerate(indices[0]):
            results.append({
                'document': self.documents[idx],
                'score': float(distances[0][i])
            })
        return results
```

---

**Ghi chú về Hình ảnh:**
- Tất cả các hình ảnh và sơ đồ được đề xuất ở trên đều là mô tả văn bản (ASCII art/text diagram)
- Để tạo hình ảnh chất lượng cao cho khóa luận, có thể sử dụng các công cụ:
  * **Draw.io / Diagrams.net**: Cho các sơ đồ kiến trúc và flow charts
  * **PlantUML**: Cho các sơ đồ UML và sequence diagrams
  * **Python Matplotlib/Seaborn**: Cho các biểu đồ vector space visualization
  * **Figma/Adobe Illustrator**: Cho các infographic chuyên nghiệp
  * **Microsoft Visio**: Cho các sơ đồ kỹ thuật chi tiết
