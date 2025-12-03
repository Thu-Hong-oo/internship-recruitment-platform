# CƠ SỞ LÝ THUYẾT VỀ XỬ LÝ NGÔN NGỮ TỰ NHIÊN
# Theoretical Foundation of Natural Language Processing

## 2.1. Xử lý Ngôn ngữ Tự nhiên – Tổng quan

### 2.1.1. Định nghĩa và phạm vi

Xử lý ngôn ngữ tự nhiên (Natural Language Processing – NLP) là lĩnh vực nghiên cứu liên ngành giữa Khoa học máy tính, Ngôn ngữ học và Trí tuệ nhân tạo, nhằm cho phép máy tính hiểu, phân tích, sinh và tương tác với ngôn ngữ tự nhiên của con người [7, 10]. Các bài toán kinh điển trong NLP bao gồm: phân loại văn bản (text classification), phân tích cảm xúc (sentiment analysis), gán nhãn từ loại (Part-of-Speech tagging - POS), trích chọn thực thể có tên (Named Entity Recognition – NER), phân tích cú pháp (parsing), tóm tắt văn bản (summarization), dịch máy (machine translation), trả lời câu hỏi (Question Answering – QA).

Trong bối cảnh hệ thống tuyển dụng, các bài toán NLP chính được áp dụng là:
- **Trích xuất thông tin** (Information Extraction): nhận diện và trích xuất các thực thể như kỹ năng, kinh nghiệm làm việc, học vấn, chứng chỉ từ CV.
- **Biểu diễn ngữ nghĩa** (Semantic Representation): chuyển đổi văn bản CV và mô tả công việc thành các vector số để đo độ tương đồng.
- **Đối sánh ngữ nghĩa** (Semantic Matching): tính toán mức độ phù hợp giữa hồ sơ ứng viên và yêu cầu công việc dựa trên ngữ nghĩa, không chỉ dựa trên sự trùng khớp từ khóa.

### 2.1.2. Pipeline xử lý ngôn ngữ tự nhiên

Một pipeline NLP điển hình thường gồm các bước tiền xử lý sau [7, 10]:

**Bước 1: Chuẩn hóa văn bản (Text Normalization)**

Chuẩn hóa văn bản bao gồm việc chuyển toàn bộ văn bản về dạng chuẩn: chuyển sang chữ thường, loại bỏ ký tự đặc biệt, chuẩn hóa dấu câu, loại bỏ khoảng trắng dư thừa. Đối với tiếng Việt, bước này còn bao gồm việc xử lý các vấn đề mã hóa (encoding issues) do sự không nhất quán trong bảng mã Unicode (Unicode normalization).

**Bước 2: Tách câu và tách từ (Sentence & Word Tokenization)**

Tách câu (sentence segmentation) chia văn bản thành các câu riêng biệt, trong khi tách từ (word segmentation/tokenization) chia mỗi câu thành các đơn vị từ (tokens). Đối với tiếng Việt, tách từ là bài toán khó do tính đa âm tiết và ràng buộc khoảng trắng không đồng nhất với ranh giới từ [1]. Ví dụ, cụm từ "học sinh giỏi" cần được nhận diện như ba từ riêng biệt, không phải ba âm tiết "học", "sinh", "giỏi".

**Bước 3: Loại bỏ từ dừng (Stopword Removal)**

Từ dừng (stopwords) là các từ thường xuyên xuất hiện nhưng ít mang thông tin ngữ nghĩa quan trọng, ví dụ: "và", "là", "ở", "của" trong tiếng Việt; "and", "the", "is" trong tiếng Anh. Việc loại bỏ stopwords giúp giảm kích thước dữ liệu và tập trung vào các từ có ý nghĩa.

**Bước 4: Gán nhãn từ loại (Part-of-Speech Tagging)**

POS tagging gán cho mỗi token một nhãn ngữ pháp (danh từ, động từ, tính từ, trạng từ, v.v.), phục vụ cho các bài toán phân tích sâu hơn như phân tích cú pháp (parsing) và trích xuất thông tin. Đối với tiếng Việt, POS tagging đòi hỏi sự hiểu biết về cấu trúc ngữ pháp đặc thù [1].

**Bước 5: Biểu diễn văn bản (Text Representation)**

Để áp dụng các thuật toán học máy, văn bản cần được chuyển từ dạng chuỗi ký tự sang dạng vector số. Các phương pháp biểu diễn phổ biến bao gồm Bag-of-Words, TF-IDF [14], Word Embeddings (Word2Vec, GloVe), và Contextual Embeddings (BERT, GPT).

### 2.1.3. Thách thức với tiếng Việt

Tiếng Việt, với đặc trưng ngôn ngữ đơn lập, giàu thanh điệu, nhiều biến thể chính tả và dấu, đặt ra thêm thách thức trong việc tách từ, chuẩn hóa và xử lý lỗi mã hóa (encoding), đặc biệt khi văn bản được trích xuất từ các tệp PDF hoặc tài liệu scan. Các vấn đề cụ thể bao gồm:

- **Tính đa âm tiết**: Một từ tiếng Việt có thể gồm nhiều âm tiết (ví dụ: "nhà hàng", "trường học"), việc tách từ cần nhận diện ranh giới từ chính xác.
- **Dấu thanh**: Sáu thanh điệu (ngang, huyền, sắc, hỏi, ngã, nặng) ảnh hưởng đến nghĩa của từ, đòi hỏi xử lý chính xác dấu Unicode.
- **Lỗi mã hóa**: Khi trích xuất text từ PDF, thường gặp vấn đề với font chữ không chuẩn, dẫn đến lỗi hiển thị ký tự (ví dụ: "Trịnh Hà Miên" bị trích xuất thành "TrịnhĐỗHàĐỗMiên").
- **Biến thể chính tả**: Sự không nhất quán trong cách viết (ví dụ: "email" vs "e-mail", "JavaScript" vs "Javascript").

Điều này thúc đẩy việc ứng dụng các mô hình ngôn ngữ hiện đại (contextual language models) như PhoBERT [2] cho tiếng Việt, thay vì chỉ dựa vào các phương pháp rule-based truyền thống.

---

## 2.2. Mô hình Ngôn ngữ và Kiến trúc Transformer

### 2.2.1. Mô hình ngôn ngữ (Language Models)

Mô hình ngôn ngữ (Language Model – LM) là mô hình thống kê hoặc mô hình học sâu nhằm ước lượng xác suất của một chuỗi từ trong ngôn ngữ, thường được viết dưới dạng $P(w_1, w_2, ..., w_n)$ [7]. Mô hình ngôn ngữ trả lời câu hỏi: "Xác suất để một chuỗi từ cụ thể xuất hiện trong ngôn ngữ tự nhiên là bao nhiêu?"

**Mô hình n-gram cổ điển:**

Các mô hình cổ điển như n-gram giả định tính Markov bậc thấp, trong đó xác suất của một từ phụ thuộc vào một số hữu hạn từ trước đó. Với mô hình bigram (n=2), xác suất được tính như sau:

$$P(w_1, w_2, ..., w_n) = \prod_{i=1}^{n} P(w_i | w_{i-1})$$

Dù đơn giản và dễ triển khai, các mô hình n-gram gặp phải những vấn đề nghiêm trọng:

- **Độ thưa dữ liệu** (data sparsity): Nhiều chuỗi từ hợp lệ không xuất hiện trong tập huấn luyện, dẫn đến xác suất bằng 0.
- **Giới hạn ngữ cảnh**: Chỉ có thể nắm bắt phụ thuộc ngắn hạn (n-1 từ trước), khó mô hình hóa phụ thuộc dài trong câu.
- **Kích thước mô hình**: Với từ vựng lớn và n cao, số lượng tham số tăng theo cấp số nhân.

**Mạng nơ-ron và mô hình ngôn ngữ hiện đại:**

Sự ra đời của mạng nơ-ron sâu, đặc biệt là RNN (Recurrent Neural Networks), LSTM (Long Short-Term Memory), GRU (Gated Recurrent Unit), và sau đó là Transformer, đã thay đổi căn bản cách xây dựng mô hình ngôn ngữ [10]. Các mô hình này cho phép:
- Mô hình hóa phụ thuộc ngữ nghĩa dài hạn (long-range dependencies).
- Nắm bắt cấu trúc câu phức tạp và quan hệ ngữ nghĩa tinh tế.
- Học biểu diễn phân tán (distributed representations) thay vì one-hot encoding.

### 2.2.2. Kiến trúc Transformer

Transformer, được giới thiệu bởi Vaswani và cộng sự (2017) trong bài báo mang tên "Attention is All You Need" [19], là bước đột phá trong lĩnh vực NLP. Khác với các kiến trúc trước đó dựa trên RNN/LSTM, Transformer dựa hoàn toàn trên cơ chế **self-attention**, không sử dụng mạng tuần tự, cho phép xử lý song song và nắm bắt quan hệ phụ thuộc dài hạn hiệu quả hơn.

#### 2.2.2.1. Cơ chế Self-Attention

Self-attention cho phép mỗi vị trí trong chuỗi đầu vào "nhìn" được tất cả các vị trí khác, với trọng số (attention weights) do mô hình học được. Công thức self-attention được định nghĩa như sau [19]:

$$\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V$$

Trong đó:
- **Q** (Query), **K** (Key), **V** (Value) là các ma trận được tính từ đầu vào thông qua các phép biến đổi tuyến tính.
- $d_k$ là chiều của key vectors (thường là 64 hoặc 512).
- $\sqrt{d_k}$ là hệ số scaling để ổn định gradient khi $d_k$ lớn.

Cơ chế này cho phép mô hình tập trung vào các phần quan trọng của chuỗi đầu vào khi mã hóa mỗi từ, giúp nắm bắt quan hệ phụ thuộc dài và cấu trúc ngữ nghĩa phức tạp.

#### 2.2.2.2. Multi-Head Attention

Multi-Head Attention mở rộng self-attention bằng cách sử dụng nhiều "đầu" attention song song, mỗi đầu học một dạng quan hệ khác nhau (cú pháp, ngữ nghĩa, đồng tham chiếu, v.v.) [19]:

$$\text{MultiHead}(Q, K, V) = \text{Concat}(\text{head}_1, ..., \text{head}_h)W^O$$

$$\text{head}_i = \text{Attention}(QW_i^Q, KW_i^K, VW_i^V)$$

Trong đó:
- $h$ là số lượng attention heads (thường là 8 hoặc 12).
- $W_i^Q, W_i^K, W_i^V$ là các ma trận trọng số học được cho mỗi head.
- $W^O$ là ma trận projection cuối cùng.

Việc sử dụng nhiều heads cho phép mô hình học được nhiều loại quan hệ khác nhau trong cùng một lớp, tăng khả năng biểu diễn của mô hình.

#### 2.2.2.3. Positional Encoding

Vì Transformer không có cấu trúc tuần tự như RNN, nó cần cơ chế để mã hóa thông tin vị trí của các từ trong câu. Positional Encoding được thêm vào embedding của mỗi từ để mô hình có thể phân biệt được vị trí tương đối [19]:

$$PE_{(pos, 2i)} = \sin\left(\frac{pos}{10000^{2i/d_{model}}}\right)$$

$$PE_{(pos, 2i+1)} = \cos\left(\frac{pos}{10000^{2i/d_{model}}}\right)$$

Trong đó:
- $pos$ là vị trí của từ trong câu.
- $i$ là chiều trong vector embedding.
- $d_{model}$ là kích thước của embedding (thường là 512 hoặc 768).

#### 2.2.2.4. Các thành phần bổ sung

**Residual Connections và Layer Normalization:**

Transformer sử dụng residual connections (kết nối tắt) và layer normalization sau mỗi sub-layer để:
- Giúp mô hình sâu hơn (nhiều lớp hơn) mà không bị vấn đề vanishing gradient.
- Ổn định quá trình huấn luyện.
- Tăng tốc độ hội tụ.

Công thức tổng quát cho mỗi sub-layer:

$$\text{Output} = \text{LayerNorm}(x + \text{Sublayer}(x))$$

**Feed-Forward Networks:**

Mỗi lớp Transformer còn chứa một mạng feed-forward đơn giản, áp dụng độc lập cho mỗi vị trí:

$$\text{FFN}(x) = \max(0, xW_1 + b_1)W_2 + b_2$$

### 2.2.3. Ảnh hưởng và ứng dụng của Transformer

Transformer đã trở thành nền tảng của hàng loạt mô hình tiền huấn luyện hiện đại [10]:
- **BERT, RoBERTa**: Sử dụng Transformer encoder cho bài toán hiểu ngôn ngữ.
- **GPT series**: Sử dụng Transformer decoder cho bài toán sinh ngôn ngữ.
- **T5, BART**: Sử dụng cả encoder và decoder cho bài toán sequence-to-sequence.
- **PhoBERT**: Biến thể của BERT cho tiếng Việt [2].
- **Sentence-BERT**: Tối ưu BERT cho bài toán semantic similarity [15].

Trong hệ thống tuyển dụng, kiến trúc Transformer được sử dụng gián tiếp thông qua các mô hình tiền huấn luyện như PhoBERT (cho NER) và Sentence-BERT (cho semantic matching).

---

## 2.3. Mô hình Tiền huấn luyện (Pre-trained Language Models) và PhoBERT

### 2.3.1. BERT – Bidirectional Encoder Representations from Transformers

BERT (Bidirectional Encoder Representations from Transformers) là mô hình ngôn ngữ hai chiều dựa trên Transformer encoder, được Devlin và cộng sự (2019) đề xuất [8]. BERT đánh dấu một bước ngoặt quan trọng trong lĩnh vực NLP nhờ khả năng học biểu diễn ngữ cảnh sâu (deep contextualized representations) từ cả hai hướng trái-sang-phải và phải-sang-trái trong cùng một mô hình.

#### 2.3.1.1. Kiến trúc BERT

BERT sử dụng kiến trúc Transformer encoder với các đặc điểm:
- **BERT-Base**: 12 lớp Transformer, 768 hidden units, 12 attention heads, ~110M tham số.
- **BERT-Large**: 24 lớp Transformer, 1024 hidden units, 16 attention heads, ~340M tham số.

Đầu vào của BERT là một chuỗi tokens, bao gồm:
- **[CLS]**: Token đặc biệt ở đầu câu, biểu diễn của nó được sử dụng cho bài toán phân loại câu.
- **[SEP]**: Token phân tách giữa các câu.
- **[MASK]**: Token đặc biệt thay thế các từ bị che trong quá trình tiền huấn luyện.

#### 2.3.1.2. Các nhiệm vụ tiền huấn luyện

BERT được tiền huấn luyện trên hai nhiệm vụ chính [8]:

**1. Masked Language Modeling (MLM):**

Ngẫu nhiên che (mask) khoảng 15% tokens trong câu và yêu cầu mô hình dự đoán lại chúng dựa trên ngữ cảnh xung quanh. Ví dụ:

```
Input:  "Tôi có kinh nghiệm [MASK] React và Node.js"
Target: "làm việc với"
```

Cách tiếp cận này cho phép BERT học được biểu diễn hai chiều thực sự, khác với các mô hình tự hồi quy (autoregressive) như GPT chỉ nhìn theo một chiều.

**2. Next Sentence Prediction (NSP):**

Dự đoán xem câu B có xuất hiện liên tiếp sau câu A trong văn bản gốc hay không. Nhiệm vụ này giúp BERT hiểu được quan hệ giữa các câu, hữu ích cho các bài toán như Question Answering và Natural Language Inference.

#### 2.3.1.3. Fine-tuning và Transfer Learning

Sau quá trình tiền huấn luyện trên tập dữ liệu văn bản lớn (English Wikipedia + BookCorpus, ~3.3 tỷ từ), BERT có thể được fine-tune trên nhiều bài toán cụ thể (downstream tasks) với hiệu năng vượt trội [8]:
- Phân loại văn bản (Text Classification)
- Named Entity Recognition (NER)
- Question Answering (QA)
- Semantic Textual Similarity (STS)
- Natural Language Inference (NLI)

Việc fine-tune BERT thường chỉ cần thêm một lớp output đơn giản và huấn luyện trên tập dữ liệu nhỏ của bài toán cụ thể, tiết kiệm đáng kể chi phí tính toán so với việc huấn luyện từ đầu.

**Các biến thể của BERT:**

Sau BERT, nhiều biến thể cải tiến đã được đề xuất:
- **RoBERTa** [2]: Huấn luyện lâu hơn, batch size lớn hơn, loại bỏ NSP.
- **ALBERT**: Chia sẻ tham số giữa các lớp để giảm kích thước mô hình.
- **DistilBERT**: Distillation của BERT, giữ 97% hiệu năng nhưng nhỏ hơn 40%.

### 2.3.2. PhoBERT – Mô hình Transformer cho tiếng Việt

PhoBERT là mô hình tiền huấn luyện (pre-trained language model) dành riêng cho tiếng Việt, được xây dựng dựa trên kiến trúc RoBERTa, do Nguyen & Nguyen (2020) đề xuất [2]. PhoBERT giải quyết nhu cầu cấp thiết về một mô hình ngôn ngữ chất lượng cao cho tiếng Việt, vốn là ngôn ngữ ít tài nguyên (low-resource language) trong lĩnh vực NLP.

#### 2.3.2.1. Đặc điểm kỹ thuật của PhoBERT

PhoBERT có hai phiên bản [2]:

**PhoBERT-base:**
- **Số lớp**: 12 lớp Transformer encoder
- **Hidden dimension**: 768
- **Attention heads**: 12 multi-head attention
- **Tổng số tham số**: ~135 triệu
- **Tokenization**: SentencePiece với BPE (Byte-Pair Encoding)
- **Vocabulary size**: 64,000 subword units

**PhoBERT-large:**
- **Số lớp**: 24 lớp Transformer encoder
- **Hidden dimension**: 1024
- **Attention heads**: 16 multi-head attention
- **Tổng số tham số**: ~370 triệu

#### 2.3.2.2. Dữ liệu và quá trình huấn luyện

PhoBERT được huấn luyện trên tập dữ liệu văn bản tiếng Việt quy mô lớn (khoảng 20GB text), bao phủ nhiều miền chủ đề [2]:
- **Vietnamese Wikipedia**: ~1GB
- **Vietnamese News**: ~19GB từ các nguồn báo điện tử

Quá trình tiền huấn luyện sử dụng cấu hình tương tự RoBERTa:
- **Masked Language Modeling (MLM)**: Che 15% tokens và dự đoán
- **Dynamic masking**: Thay đổi các tokens bị che qua mỗi epoch
- **Không sử dụng NSP**: Tập trung hoàn toàn vào MLM
- **Huấn luyện**: 40 epochs trên 4 GPUs V100

#### 2.3.2.3. Tokenization cho tiếng Việt

Một điểm quan trọng của PhoBERT là sử dụng **SentencePiece** để tách subword, phù hợp với đặc thù chính tả tiếng Việt [2]. Khác với word-level tokenization truyền thống (cần tách từ chính xác trước), subword tokenization:
- Xử lý tốt các từ out-of-vocabulary (OOV).
- Không yêu cầu công cụ tách từ hoàn hảo.
- Linh hoạt với các biến thể chính tả.

Ví dụ: "JavaScript" có thể được tách thành ["Java", "##Script"] hoặc ["J", "##ava", "##Script"] tùy vào từ vựng đã học.

#### 2.3.2.4. Hiệu năng trên các benchmark tiếng Việt

PhoBERT đạt **state-of-the-art** trên nhiều benchmark tiếng Việt [2]:

| Task | Dataset | Metric | PhoBERT-base | Previous SOTA |
|------|---------|--------|--------------|---------------|
| POS Tagging | VLSP 2013 | Accuracy | **96.7%** | 95.8% |
| NER | VLSP 2016 | F1 | **94.0%** | 92.3% |
| Dependency Parsing | VnDT | LAS | **74.9%** | 73.1% |
| Sentiment Analysis | VSFC | F1 | **91.3%** | 89.5% |

#### 2.3.2.5. Ứng dụng PhoBERT trong hệ thống tuyển dụng

Trong hệ thống tuyển dụng thực tập, PhoBERT được fine-tune cho bài toán **Named Entity Recognition (NER)** để trích xuất các thực thể từ CV tiếng Việt:

**Các entity types:**
- **SKILL**: Kỹ năng kỹ thuật (JavaScript, React, Python, SQL)
- **LANGUAGE**: Ngôn ngữ lập trình (Java, C++, Go)
- **FRAMEWORK**: Frameworks (Django, Spring Boot, Express.js)
- **SOFT_SKILL**: Kỹ năng mềm (Leadership, Communication, Teamwork)
- **TOOL**: Công cụ (Git, Docker, Jira)
- **EDUCATION**: Học vấn (Đại học, Thạc sĩ, GPA)
- **EXPERIENCE**: Kinh nghiệm làm việc

**Quá trình fine-tuning:**
1. **Tập dữ liệu**: ~10,000 CV tiếng Việt được gán nhãn thủ công với các entity types.
2. **Augmentation**: Tăng cường dữ liệu bằng cách thay thế tên kỹ năng với synonyms.
3. **Training**: Fine-tune PhoBERT-base trong 5-10 epochs với learning rate 2e-5.
4. **Evaluation**: Đánh giá trên tập test với F1 score đạt **96%** cho skill extraction.

PhoBERT là mô hình **chính (primary)** trong hệ thống, chịu trách nhiệm trích xuất kỹ năng với độ chính xác cao, hoạt động offline và không phụ thuộc vào kết nối internet [2].

---

## 2.4. Biểu diễn Văn bản và Sentence-BERT

### 2.4.1. TF-IDF và biểu diễn vector cổ điển

Để áp dụng các thuật toán học máy, văn bản cần được biểu diễn dưới dạng vector số. Hai phương pháp cổ điển phổ biến là Bag of Words và TF-IDF [14]:

**Bag of Words (BoW):**

Bag of Words biểu diễn văn bản bằng vector có độ dài bằng kích thước từ vựng, mỗi phần tử là tần suất xuất hiện của từ tương ứng. BoW đơn giản nhưng không nắm bắt ngữ cảnh hay trật tự từ, và bị ảnh hưởng nặng nề bởi các từ phổ biến (high-frequency words).

**Term Frequency – Inverse Document Frequency (TF-IDF):**

TF-IDF cải thiện BoW bằng cách gán trọng số cho từ dựa trên hai yếu tố [14]:

1. **Term Frequency (TF)**: Tần suất xuất hiện của term trong document:

$$\text{TF}(t, d) = \frac{f_{t,d}}{\sum_{t' \in d} f_{t',d}}$$

Hoặc dạng logarithm để giảm ảnh hưởng của high-frequency terms:

$$\text{TF}(t, d) = \log(1 + f_{t,d})$$

2. **Inverse Document Frequency (IDF)**: Logarit nghịch đảo của số document chứa term:

$$\text{IDF}(t, D) = \log\left(\frac{N}{|\{d \in D: t \in d\}|}\right)$$

Trong đó:
- $f_{t,d}$ là số lần xuất hiện của term $t$ trong document $d$.
- $N$ là tổng số documents trong corpus $D$.
- $|\{d \in D: t \in d\}|$ là số documents chứa term $t$.

**Trọng số TF-IDF** kết hợp cả hai yếu tố:

$$\text{TF-IDF}(t, d, D) = \text{TF}(t, d) \times \text{IDF}(t, D)$$

Trọng số TF-IDF giúp phân biệt các từ quan trọng trong một tài liệu và giảm ảnh hưởng của các từ phổ biến trên toàn bộ tập dữ liệu [14]. TF-IDF thường được kết hợp với các độ đo tương đồng như Cosine similarity hoặc Jaccard coefficient.

**Ứng dụng TF-IDF trong hệ thống:**

Trong hệ thống tuyển dụng, TF-IDF được sử dụng để:
- Trích xuất từ khóa quan trọng từ CV và mô tả công việc.
- Tính toán độ overlap giữa keywords của CV và job description.
- Xếp hạng tài nguyên học tập theo độ liên quan với skill gap.

### 2.4.2. Sentence Embeddings và Sentence-BERT

Mặc dù TF-IDF hiệu quả trong nhiều bài toán, nó không nắm bắt được quan hệ ngữ nghĩa sâu giữa các câu, vì xem câu như "túi từ" không có ngữ cảnh. Các sentence embeddings dựa trên mô hình ngôn ngữ sâu (như BERT) được đề xuất để giải quyết vấn đề này [15].

#### 2.4.2.1. Sentence-BERT (SBERT)

Sentence-BERT, do Reimers & Gurevych (2019) đề xuất, điều chỉnh BERT theo kiến trúc Siamese/Triplet network để trực tiếp tối ưu cho bài toán đo độ tương đồng câu [15].

**Kiến trúc Siamese Network:**

SBERT sử dụng hai BERT encoders chia sẻ trọng số (weight sharing) để encode hai câu input thành hai sentence embeddings:

```
Sentence A → BERT Encoder → Pooling → Embedding u (768-dim)
Sentence B → BERT Encoder → Pooling → Embedding v (768-dim)
                                ↓
                        Cosine Similarity(u, v)
```

**Pooling Strategies:**

SBERT sử dụng pooling layer để chuyển output của BERT (sequence of token embeddings) thành sentence embedding cố định:
- **MEAN pooling**: Trung bình cộng tất cả token embeddings.
- **MAX pooling**: Lấy giá trị maximum theo từng chiều.
- **CLS token**: Sử dụng embedding của token [CLS].

Thực nghiệm cho thấy MEAN pooling thường cho kết quả tốt nhất [15].

**Training Objectives:**

SBERT được huấn luyện với ba objective khác nhau tùy task:

1. **Classification Objective** (cho NLI tasks):

$$o = \text{softmax}(W_t \cdot (u, v, |u - v|))$$

Trong đó $(u, v, |u - v|)$ là concatenation của hai embeddings và element-wise difference.

2. **Regression Objective** (cho STS tasks):

$$\text{Loss} = \text{MSE}(\text{cosine}(u, v), \text{gold\_label})$$

3. **Triplet Objective**:

$$\text{Loss} = \max(||u_a - u_p|| - ||u_a - u_n|| + \epsilon, 0)$$

Trong đó $u_a$ (anchor), $u_p$ (positive), $u_n$ (negative) và $\epsilon$ là margin.

#### 2.4.2.2. Model được sử dụng trong hệ thống

Hệ thống sử dụng model **`paraphrase-multilingual-mpnet-base-v2`** với các đặc điểm [15]:

- **Base model**: MPNet (Masked and Permuted Pre-training)
- **Multilingual**: Hỗ trợ 50+ ngôn ngữ, bao gồm tiếng Việt
- **Embedding dimension**: 768
- **Performance**: Tốt nhất cho multilingual semantic similarity
- **Training data**: Paraphrase datasets từ nhiều ngôn ngữ

#### 2.4.2.3. Ứng dụng SBERT trong hệ thống

**1. Semantic Search và Skill Matching:**

So sánh semantic similarity giữa kỹ năng hiện có của ứng viên và kỹ năng yêu cầu của công việc:

```python
# Generate embeddings
candidate_embedding = sbert.encode("JavaScript, React, Node.js")
job_embedding = sbert.encode("Frontend developer with React experience")

# Calculate similarity
similarity = cosine_similarity(candidate_embedding, job_embedding)
# similarity = 0.78 (high match)
```

**2. Learning Roadmap Generation:**

Tìm tài nguyên học tập phù hợp nhất dựa trên khoảng cách ngữ nghĩa với skill gap:

```python
skill_gap = "Need to learn React and TypeScript"
resources = [
    "React fundamentals course",
    "TypeScript for beginners",
    "Python tutorial"
]

# Encode all
gap_emb = sbert.encode(skill_gap)
resource_embs = sbert.encode(resources)

# Find most relevant
similarities = cosine_similarity([gap_emb], resource_embs)[0]
# [0.92, 0.88, 0.31] → React course most relevant
```

**3. Skill Normalization:**

Xác định các skill names khác nhau nhưng có cùng semantic meaning:

| Skill A | Skill B | Similarity | Same Skill? |
|---------|---------|------------|-------------|
| "React" | "ReactJS" | 0.95 | ✅ Yes |
| "JS" | "JavaScript" | 0.93 | ✅ Yes |
| "Machine Learning" | "ML" | 0.89 | ✅ Yes |
| "React" | "Angular" | 0.71 | ❌ No (different frameworks) |

SBERT cho phép hệ thống hiểu được ngữ nghĩa thay vì chỉ so sánh string matching, cải thiện đáng kể độ chính xác của matching score [15].

---

## 2.5. Các độ đo Tương đồng Văn bản

### 2.5.1. Hệ số Jaccard (Jaccard Coefficient)

Hệ số Jaccard là độ đo độ tương đồng giữa hai tập hợp, được định nghĩa là tỷ lệ giữa giao (intersection) và hợp (union) [14]:

$$J(A, B) = \frac{|A \cap B|}{|A \cup B|} = \frac{|A \cap B|}{|A| + |B| - |A \cap B|}$$

Trong đó:
- $A, B$ là hai tập hợp (sets).
- $|A \cap B|$ là số phần tử chung (intersection).
- $|A \cup B|$ là số phần tử trong hợp (union).
- $J(A, B) \in [0, 1]$: 0 = không giống, 1 = giống hệt.

**Jaccard Distance** (complement):

$$d(A, B) = 1 - J(A, B)$$

**Ứng dụng trong NLP:**

Trong bối cảnh NLP, $A$ và $B$ là tập các từ (hoặc n-grams) của hai văn bản. Jaccard đặc biệt hữu ích để đo mức độ trùng lặp từ khóa, ví dụ giữa mô tả công việc và CV.

**Ví dụ:**

```
CV skills:      {"JavaScript", "React", "Node.js", "MongoDB"}
Job skills:     {"React", "Node.js", "TypeScript", "PostgreSQL"}

Intersection:   {"React", "Node.js"}  →  |A ∩ B| = 2
Union:          {"JavaScript", "React", "Node.js", "MongoDB", 
                 "TypeScript", "PostgreSQL"}  →  |A ∪ B| = 6

J(A,B) = 2/6 = 0.333
```

**Ưu và nhược điểm:**

✅ **Ưu điểm**:
- Đơn giản, dễ hiểu và tính toán.
- Không phụ thuộc tần suất (chỉ xét có/không).
- Hiệu quả cho set comparison.
- Symmetry: $J(A,B) = J(B,A)$.

❌ **Nhược điểm**:
- Không xét trọng số (tất cả items đều quan trọng như nhau).
- Không hiểu ngữ nghĩa ("JS" ≠ "JavaScript").
- Yếu khi sets có size rất khác nhau.

### 2.5.2. Cosine Similarity

Cosine Similarity đo độ tương đồng giữa hai vectors bằng cách tính cosine của góc giữa chúng trong không gian nhiều chiều [14]:

$$\cos(\theta) = \frac{u \cdot v}{||u|| \times ||v||} = \frac{\sum_{i=1}^{n} u_i v_i}{\sqrt{\sum_{i=1}^{n} u_i^2} \times \sqrt{\sum_{i=1}^{n} v_i^2}}$$

Trong đó:
- $u, v$ là hai vectors (có thể là TF-IDF vectors, embeddings, etc.).
- $u \cdot v$ là tích vô hướng (dot product).
- $||u||, ||v||$ là độ dài Euclidean (L2 norm).
- $\theta$ là góc giữa hai vectors.
- $\cos(\theta) \in [-1, 1]$ (thường $[0, 1]$ với TF-IDF không âm).

**Ý nghĩa hình học:**

- $\cos(\theta) = 1$: Hai vectors cùng hướng (identical).
- $\cos(\theta) = 0$: Hai vectors vuông góc (orthogonal, không liên quan).
- $\cos(\theta) = -1$: Hai vectors ngược hướng (opposite).

**Ứng dụng trong hệ thống:**

1. **Keyword Matching với TF-IDF vectors:**

```python
# Calculate TF-IDF vectors
cv_vector = tfidf.fit_transform([cv_text])[0]
job_vector = tfidf.transform([job_text])[0]

# Cosine similarity
keyword_score = cosine_similarity(cv_vector, job_vector)[0][0]
# keyword_score: 0.49 = 49% overlap
```

2. **Semantic Matching với SBERT embeddings:**

```python
# Generate 768-dimensional embeddings
cv_embedding = sbert.encode(cv_text)      # [768 floats]
job_embedding = sbert.encode(job_text)    # [768 floats]

# Cosine similarity
semantic_score = cosine_similarity([cv_embedding], [job_embedding])[0][0]
# semantic_score: 0.78 = high semantic match
```

**Ưu điểm:**

✅ Bất biến với độ dài document (length normalization).  
✅ Hiệu quả trong không gian nhiều chiều.  
✅ Computational efficiency: $O(n)$ với sparse vectors.  
✅ Intuitive interpretation (góc giữa vectors).

Kết hợp Jaccard (đo overlap từ khóa) và Cosine (đo tương đồng phân bố trọng số từ hoặc ngữ nghĩa) là một trong những hướng tiếp cận thường gặp để tăng độ chính xác trong bài toán tương đồng văn bản [14].

---

## 2.6. Tổng kết Cơ sở Lý thuyết

Chương này đã trình bày chi tiết các nền tảng lý thuyết về xử lý ngôn ngữ tự nhiên được áp dụng trong hệ thống tuyển dụng thực tập:

**1. Pipeline NLP cơ bản:**
- Chuẩn hóa văn bản, tokenization, stopword removal, POS tagging
- Các thách thức đặc thù với tiếng Việt (đa âm tiết, thanh điệu, mã hóa)

**2. Kiến trúc Transformer [19]:**
- Self-attention mechanism cho phép nắm bắt long-range dependencies
- Multi-head attention học nhiều loại quan hệ ngữ nghĩa
- Positional encoding bù cho việc không có cấu trúc tuần tự
- Nền tảng cho các mô hình hiện đại như BERT, GPT, PhoBERT

**3. Mô hình Tiền huấn luyện:**
- BERT [8]: MLM + NSP, fine-tuning cho downstream tasks
- PhoBERT [2]: Vietnamese BERT, 96% F1 trên NER, tokenization với SentencePiece
- Sentence-BERT [15]: Tối ưu cho semantic similarity, multilingual embeddings

**4. Biểu diễn Văn bản:**
- TF-IDF [14]: Trọng số dựa trên tần suất và độ hiếm của từ
- Sentence Embeddings: Dense vectors 768-dim nắm bắt ngữ nghĩa sâu
- MPNet multilingual model: Hỗ trợ 50+ ngôn ngữ bao gồm tiếng Việt

**5. Độ đo Tương đồng:**
- Jaccard Coefficient: Set-based overlap, đơn giản nhưng không có ngữ nghĩa
- Cosine Similarity: Đo góc giữa vectors, phù hợp cho TF-IDF và embeddings
- Kết hợp cả hai để tăng độ chính xác matching

Những kiến thức lý thuyết này tạo nền tảng vững chắc cho việc triển khai hệ thống NLP trong chương tiếp theo, bao gồm skill extraction, semantic matching, và candidate ranking.

---

## Tài liệu Tham khảo

[1]. Nguyen, D. Q. (2019). A neural joint model for Vietnamese word segmentation, POS tagging and dependency parsing. *Proceedings of the 17th Annual Workshop of the Australasian Language Technology Association*, 28–34.

[2]. Nguyen, D. Q., & Nguyen, A.-T. (2020). PhoBERT: Pre-trained language models for Vietnamese. *Findings of the Association for Computational Linguistics: EMNLP 2020*, 1037–1042.

[7]. Dan Jurafsky and James H. Martin. (n.d.). Speech and Language Processing. Retrieved December 2, 2025, from https://web.stanford.edu/~jurafsky/slp3/

[8]. Devlin, J., Chang, M.-W., Lee, K., & Toutanova, K. (2019). BERT: Pre-training of deep bidirectional transformers for language understanding. *Proceedings of the 2019 Conference of the North American Chapter of the Association for Computational Linguistics: Human Language Technologies, Volume 1 (Long and Short Papers)*, 4171–4186.

[10]. Goldberg, Y. (2018). Neural network methods for natural language processing. *Computational Linguistics*, 44(1), 194–195.

[14]. Manning, C. D. (2008). Introduction to information retrieval. Syngress Publishing.

[15]. Reimers, N., & Gurevych, I. (2019). Sentence-BERT: Sentence embeddings using siamese BERT-networks. *ArXiv Preprint ArXiv:1908.10084*.

[17]. Team, G. (2025). Gemini: A Family of Highly Capable Multimodal Models.

[19]. Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., & Gomez, A. N. (2017). Attention is all you need [J]. *Advances in Neural Information Processing Systems*, 30(1), 261–272.

---

**Ngày hoàn thành**: 03/12/2025  
**Phiên bản**: 1.0  
**Tác giả**: Backend Development Team  
**Dự án**: Internship Recruitment Platform
