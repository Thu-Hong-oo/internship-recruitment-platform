# 📋 Job Review Submission System

## 📋 Tổng quan

Hệ thống tự động kiểm duyệt job posting khi employer submit job để đăng. Sử dụng **Content Moderation Service** với chiến lược **Rule-based + AI (optional)** để tự động approve/reject hoặc yêu cầu manual review.

## 🏗️ Kiến trúc

```
┌─────────────────────────────────────────────────────────────┐
│         Employer submits job (status: DRAFT → ?)            │
│         POST /api/jobs/:id/submit-review                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│         jobController.submitJobForReview()                  │
│         1. Validate job status (phải là DRAFT)              │
│         2. Call Content Moderation Service                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│      ContentModerationService.moderateContent()             │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Step 1: Rule-based Check (nhanh, ưu tiên)          │   │
│  │ - Check banned words → REJECT ngay                   │   │
│  │ - Check suspicious patterns → Warning                │   │
│  │ - Check warning words → Warning                       │   │
│  └──────────┬───────────────────────────────────────────┘   │
│             │                                                │
│    ┌────────┴────────┐                                       │
│    │ REJECT?        │ APPROVE (no warnings)?                 │
│    │                │                                        │
│    ▼                ▼                                        │
│  Return REJECT    Return APPROVE                             │
│    (skip AI)       (skip AI)                                 │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Step 2: AI Check (nếu có warnings hoặc không chắc)   │   │
│  │ - Gemini API phân tích ngữ cảnh                       │   │
│  │ - Xác nhận warnings có phải false positive không      │   │
│  └──────────┬───────────────────────────────────────────┘   │
│             │                                                │
│    ┌────────┴────────┐                                       │
│    │ REJECT?        │ APPROVE?    │ MANUAL_REVIEW?          │
│    │                │             │                         │
│    ▼                ▼             ▼                         │
│  Return REJECT    Return APPROVE  Return MANUAL_REVIEW       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│         jobController xử lý moderation result               │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Case 1: APPROVE (confidence >= 0.8)                 │   │
│  │ → status = ACTIVE                                   │   │
│  │ → moderation.status = 'auto_approved'               │   │
│  │ → Response: { autoApproved: true }                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Case 2: REJECT                                       │   │
│  │ → status = REJECTED                                 │   │
│  │ → moderation.status = 'auto_rejected'                │   │
│  │ → Format reasons thành message dễ hiểu              │   │
│  │ → Response: { autoRejected: true, reasons: [...] }  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Case 3: MANUAL_REVIEW                                │   │
│  │ → status = PENDING                                  │   │
│  │ → moderation.status = 'manual_review'                │   │
│  │ → Format reasons thành warnings                      │   │
│  │ → Response: { requiresReview: true, warnings: [...] }│   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ Công nghệ sử dụng

### 1. **Content Moderation Service**

- **Rule-based**: Regex patterns, keyword matching
- **AI (Optional)**: Google Gemini API (`gemini-2.0-flash-lite`)
- **Strategy**: Hybrid (Rule-based chính + AI khi cần)

### 2. **Job Status Management**

- `DRAFT` → Submit for review
- `PENDING` → Chờ admin duyệt
- `ACTIVE` → Đã được duyệt và đăng
- `REJECTED` → Bị từ chối

### 3. **Moderation Result Storage**

- Lưu trong `job.moderation` object:
  - `autoModerationScore`: Confidence score (0-100)
  - `moderationResult`: Action, method, flags, reasons
  - `moderatedAt`: Timestamp
  - `status`: `auto_approved` | `auto_rejected` | `manual_review`

## ⚙️ Cấu hình

### Environment Variables

```env
# Enable AI moderation (optional)
USE_AI_MODERATION=true

# Gemini API (nếu dùng AI)
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-2.0-flash-lite
```

## 🔄 Logic hoạt động chi tiết

### 1. Request Flow

#### Endpoint

```
POST /api/jobs/:id/submit-review
```

#### Validation

```javascript
// 1. Check job exists
const job = await Job.findById(id);

// 2. Check status (phải là DRAFT)
if (job.status !== JOB_STATUS.DRAFT) {
  return error('Chỉ có thể gửi duyệt job ở trạng thái nháp');
}
```

### 2. Content Moderation Process

#### Step 1: Extract Text

```javascript
// Extract từ các field: title, description, requirements, benefits
const textToCheck = [
  job.title,
  job.description,
  job.requirements,
  job.benefits,
].join(' ');
```

#### Step 2: Rule-based Check

**Banned Words** (Auto REJECT):

```javascript
banned: [
  'đa cấp',
  'mlm',
  'tuyển dụng ảo',
  'thu nhập khủng',
  'kiếm tiền online dễ dàng',
  'massage',
  'karaoke',
  'bar',
  'club',
  'đầu tư',
  'cho vay',
  'vay tiền nhanh',
  'sex',
  'xxx',
  'adult',
  '18+',
];
```

**Warning Words** (Cần review):

```javascript
warning: [
  'part-time tại nhà',
  'làm thêm',
  'thu nhập thụ động',
  'bán hàng',
  'tư vấn',
  'marketing',
];
```

**Suspicious Patterns** (Regex):

```javascript
suspiciousPatterns: [
  /(?:lương|thu nhập|kiếm).*(?:khủng|cao|nhanh|dễ)/i,
  /(?:không cần|không yêu cầu).*(?:kinh nghiệm|bằng cấp)/i,
  /(?:làm tại nhà|work from home).*(?:kiếm|thu nhập)/i,
  /(?:đầu tư|vay|cho vay).*(?:lãi|lợi nhuận)/i,
  /(?:tuyển|tìm).*(?:nữ|nam).*(?:trẻ|đẹp)/i,
];
```

**Logic**:

- Nếu tìm thấy **banned word** → `REJECT` ngay (confidence: 1.0)
- Nếu tìm thấy **warning word** hoặc **suspicious pattern** → `MANUAL_REVIEW`
- Nếu không có gì → `APPROVE` (confidence: 1.0)

#### Step 3: AI Check (Optional)

**Khi nào dùng AI**:

- Rule-based có warnings nhưng không reject
- Rule-based không chắc chắn (confidence < 0.9)

**AI Prompt**:

```
Bạn là chuyên gia phân tích nội dung tuyển dụng. Phân tích KỸ LƯỠNG nội dung:

NỘI DUNG:
[Job content]

CẢNH BÁO TỪ HỆ THỐNG:
[Rule-based warnings]

NHIỆM VỤ:
Phân tích NGỮ CẢNH và đánh giá xem nội dung có an toàn, hợp pháp, và phù hợp không.

PHÂN TÍCH CẦN THIẾT:
1. NGỮ CẢNH: Từ khóa được dùng trong ngữ cảnh gì?
2. TÍNH THỰC TẾ: Lương, yêu cầu có thực tế không?
3. DẤU HIỆU LỪA ĐẢO: Có dấu hiệu scam, MLM không?
4. CHẤT LƯỢNG: Nội dung có chuyên nghiệp không?

Trả về JSON:
{
  "safe": true/false,
  "confidence": 0.0-1.0,
  "flags": ["spam", "scam", "inappropriate"],
  "reasons": ["lý do cụ thể"]
}
```

**AI Decision**:

- `safe: false` → `REJECT`
- `safe: true` + `confidence >= 0.7` → `APPROVE`
- `safe: true` + `confidence < 0.7` → `MANUAL_REVIEW`

### 3. Result Processing

#### Case 1: Auto-approve

```javascript
if (
  moderationResult.action === 'APPROVE' &&
  moderationResult.confidence >= 0.8
) {
  job.status = JOB_STATUS.ACTIVE;
  job.moderation.status = 'auto_approved';
  await job.save();

  return {
    success: true,
    message: 'Job đã được tự động duyệt và đăng thành công',
    autoApproved: true,
  };
}
```

#### Case 2: Auto-reject

```javascript
if (moderationResult.action === 'REJECT') {
  job.status = JOB_STATUS.REJECTED;
  job.moderation.status = 'auto_rejected';
  await job.save();

  // Format reasons thành message dễ hiểu
  const reviewReasons = formatReasons(moderationResult.reasons);

  return {
    success: false,
    message: `Job không được duyệt do: ${reviewReasons
      .map(r => r.message)
      .join('; ')}`,
    reasons: moderationResult.reasons,
    reviewReasons: reviewReasons,
    autoRejected: true,
  };
}
```

#### Case 3: Manual Review

```javascript
// Các trường hợp còn lại
job.status = JOB_STATUS.PENDING;
job.moderation.status = 'manual_review';
await job.save();

const reviewReasons = formatReasons(moderationResult.reasons);

return {
  success: true,
  message: `Job của bạn cần được admin xem xét do: ${reviewReasons
    .map(r => r.message)
    .join('; ')}`,
  requiresReview: true,
  reviewReasons: reviewReasons,
  moderationScore: moderationResult.confidence * 100,
};
```

### 4. Reason Formatting

**Format reasons thành message dễ hiểu cho employer**:

```javascript
function formatReasons(reasons) {
  return reasons.map(reason => {
    // Warning word
    if (reason.includes('Chứa từ cảnh báo')) {
      const word = reason.match(/"([^"]+)"/)?.[1];
      return {
        type: 'warning_word',
        message: `Nội dung chứa từ khóa "${word}" - cần kiểm tra lại ngữ cảnh sử dụng`,
        severity: 'medium',
      };
    }

    // Suspicious pattern - Thu nhập
    if (reason.includes('pattern đáng nghi')) {
      if (reason.includes('thu nhập') || reason.includes('lương')) {
        if (reason.includes('khủng') || reason.includes('cao')) {
          return {
            type: 'suspicious_pattern',
            message:
              'Nội dung có dấu hiệu hứa hẹn thu nhập không thực tế - vui lòng điều chỉnh để rõ ràng và thực tế hơn',
            severity: 'high',
          };
        }
      }

      // Yêu cầu quá thấp
      if (reason.includes('không cần') && reason.includes('kinh nghiệm')) {
        return {
          type: 'suspicious_pattern',
          message:
            'Nội dung có dấu hiệu yêu cầu quá thấp - vui lòng mô tả rõ yêu cầu thực tế',
          severity: 'medium',
        };
      }

      // Làm tại nhà
      if (reason.includes('làm tại nhà') && reason.includes('kiếm')) {
        return {
          type: 'suspicious_pattern',
          message:
            'Nội dung có dấu hiệu đáng nghi về công việc làm tại nhà - vui lòng mô tả rõ ràng hơn về công việc',
          severity: 'medium',
        };
      }
    }

    return {
      type: 'other',
      message: reason,
      severity: 'low',
    };
  });
}
```

## 📊 Response Formats

### Success - Auto-approved

```json
{
  "success": true,
  "data": {
    /* job object */
  },
  "message": "Job đã được tự động duyệt và đăng thành công",
  "autoApproved": true
}
```

### Error - Auto-rejected

```json
{
  "success": false,
  "message": "Job không được duyệt do: Nội dung có dấu hiệu hứa hẹn thu nhập không thực tế",
  "reasons": [
    "Phát hiện pattern đáng nghi: (?:lương|thu nhập|kiếm).*(?:khủng|cao|nhanh|dễ)"
  ],
  "flags": ["suspicious_pattern"],
  "reviewReasons": [
    {
      "type": "suspicious_pattern",
      "message": "Nội dung có dấu hiệu hứa hẹn thu nhập không thực tế - vui lòng điều chỉnh để rõ ràng và thực tế hơn",
      "severity": "high"
    }
  ],
  "autoRejected": true
}
```

### Success - Manual Review Required

```json
{
  "success": true,
  "data": {
    /* job object */
  },
  "message": "Job của bạn cần được admin xem xét do: Nội dung chứa từ khóa \"bán hàng\" - cần kiểm tra lại ngữ cảnh sử dụng",
  "requiresReview": true,
  "reviewReasons": [
    {
      "type": "warning_word",
      "message": "Nội dung chứa từ khóa \"bán hàng\" - cần kiểm tra lại ngữ cảnh sử dụng",
      "severity": "medium"
    }
  ],
  "warnings": ["Chứa từ cảnh báo: \"bán hàng\""],
  "moderationScore": 85,
  "moderationMethod": "hybrid"
}
```

## 🔍 Ví dụ

### Ví dụ 1: Auto-approve

**Job content**: "Tuyển dụng Developer React.js, lương 15-20 triệu, yêu cầu 2 năm kinh nghiệm"

**Moderation**:

- Rule-based: No banned words, no warnings → `APPROVE` (confidence: 1.0)
- AI: Skip (không cần)

**Result**: `ACTIVE` (auto-approved)

### Ví dụ 2: Auto-reject

**Job content**: "Tuyển dụng đa cấp, thu nhập khủng, không cần kinh nghiệm"

**Moderation**:

- Rule-based: Found "đa cấp" (banned) → `REJECT` (confidence: 1.0)
- AI: Skip (đã reject)

**Result**: `REJECTED` (auto-rejected)

### Ví dụ 3: Manual Review

**Job content**: "Tuyển nhân viên bán hàng part-time tại nhà, thu nhập thụ động"

**Moderation**:

- Rule-based: Found "bán hàng" (warning), "part-time tại nhà" (warning), "thu nhập thụ động" (warning) → `MANUAL_REVIEW`
- AI: Phân tích ngữ cảnh → Có thể là job hợp pháp hoặc MLM → `MANUAL_REVIEW`

**Result**: `PENDING` (chờ admin review)

## 🚀 Tối ưu hóa

### 1. Performance

- **Rule-based first**: Nhanh, không cần API call
- **AI only when needed**: Chỉ dùng khi có warnings hoặc không chắc chắn
- **Early exit**: REJECT ngay khi tìm thấy banned words

### 2. Accuracy

- **Hybrid approach**: Rule-based + AI để giảm false positive
- **Context-aware**: AI phân tích ngữ cảnh, không chỉ từ khóa
- **Confidence scoring**: Đánh giá độ tin cậy của kết quả

### 3. User Experience

- **Clear messages**: Format reasons thành message dễ hiểu
- **Actionable feedback**: Đưa ra gợi ý cụ thể để sửa
- **Severity levels**: Phân loại mức độ nghiêm trọng

## 🐛 Error Handling

### Moderation Service Fail

```javascript
try {
  const moderationResult = await moderationService.moderateContent(job);
  // Process result...
} catch (moderationError) {
  // Fallback: Manual review
  logger.error('Content moderation failed, falling back to manual review');

  job.status = JOB_STATUS.PENDING;
  job.moderation.status = 'manual_review';
  job.moderation.moderationError = moderationError.message;
  await job.save();

  return {
    success: true,
    message: 'Đã gửi duyệt. Vui lòng chờ admin phê duyệt',
  };
}
```

## 📚 Tài liệu tham khảo

- [Content Moderation Service](../src/services/moderation/contentModerationService.js)
- [Job Controller](../src/controllers/jobController.js)
- [Google Gemini API](https://ai.google.dev/docs)

## 🔄 Cải tiến tương lai

1. **Dynamic Blacklist**: Load từ database thay vì hardcode
2. **Machine Learning**: Train model riêng cho job moderation
3. **Multi-language Support**: Hỗ trợ tiếng Anh
4. **Feedback Loop**: Học từ admin decisions để cải thiện accuracy
5. **Real-time Updates**: Webhook để notify employer khi job được approve/reject

