# Upload CV Component

## Tổng quan

Component `UploadCVModal` cung cấp giao diện hiện đại để upload CV với 2 chế độ:

- **Phân tích AI**: Tự động trích xuất thông tin từ CV
- **Upload thường**: Chỉ tải lên file, không phân tích

## Tính năng

### 🎯 Upload Modes

- **AI Parsing**: Sử dụng Gemini AI để phân tích CV và trích xuất thông tin
- **Regular Upload**: Tải lên file nhanh chóng không xử lý nội dung

### 📊 Parsed Data Display

- **Thông tin cá nhân**: Họ tên, email, SĐT, địa chỉ, ngày sinh
- **Học vấn**: Trường, bằng cấp, chuyên ngành, năm tốt nghiệp, GPA
- **Kinh nghiệm**: Công ty, vị trí, thời gian, mô tả công việc
- **Kỹ năng**: Kỹ thuật, mềm, ngoại ngữ với badge hiển thị
- **Chứng chỉ**: Tên, tổ chức cấp, ngày cấp
- **Thống kê**: Hiển thị số lượng thông tin đã trích xuất

### 📁 File Support

- **Formats**: PDF, DOC, DOCX, JPG, PNG
- **Size Limit**: 10MB
- **Validation**: Kiểm tra định dạng và kích thước

### 🎨 UI Features

- **Modern Design**: Glass morphism với gradient backgrounds
- **Progress Indicator**: Hiển thị tiến trình upload
- **Error Handling**: Xử lý lỗi với thông báo rõ ràng
- **Success Feedback**: Hiển thị kết quả parsed data
- **Responsive**: Tương thích mobile và desktop

## Cách sử dụng

### 1. Import Component

```tsx
import UploadCVModal from "@/components/cv/UploadCVModal";
```

### 2. Sử dụng trong Component

```tsx
function MyComponent() {
  const [showModal, setShowModal] = useState(false);

  const handleUploadSuccess = (response) => {
    console.log("Upload successful:", response);
    // Xử lý response
  };

  return (
    <>
      <Button onClick={() => setShowModal(true)}>Upload CV</Button>

      <UploadCVModal
        open={showModal}
        onOpenChange={setShowModal}
        onSuccess={handleUploadSuccess}
      />
    </>
  );
}
```

### 3. Props Interface

```tsx
interface UploadCVModalProps {
  open: boolean; // Trạng thái hiển thị modal
  onOpenChange: (open: boolean) => void; // Callback khi đóng/mở modal
  onSuccess?: (response: CVResponse) => void; // Callback khi upload thành công
}
```

## API Integration

### Upload Endpoint

```http
POST /api/candidates/me/resume
Content-Type: multipart/form-data
Authorization: Bearer <token>

FormData:
- file: File
- action: "upload" | "parse"
- displayName?: string
```

### Response Format

#### Upload Success

```json
{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/.../resume.pdf",
    "publicId": "resume_user123_1234567890",
    "filename": "my_resume.pdf",
    "displayName": "my_resume.pdf",
    "format": "pdf",
    "size": 1024000,
    "mimeType": "application/pdf",
    "uploadedAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Resume uploaded successfully"
}
```

#### Parse Success

```json
{
  "success": true,
  "data": {
    "upload": {
      /* file info */
    },
    "parsing": {
      "extractedData": {
        "personalInfo": {
          "fullName": "Nguyễn Văn A",
          "email": "nguyenvana@email.com",
          "phone": "0123456789",
          "address": "Hà Nội, Việt Nam"
        },
        "education": {
          "institution": "Đại học Bách Khoa Hà Nội",
          "degree": "Cử nhân",
          "field": "Công nghệ thông tin",
          "graduationYear": 2025
        },
        "experience": [
          {
            "company": "Công ty ABC",
            "position": "Thực tập sinh",
            "startDate": "06/2024",
            "endDate": "08/2024",
            "description": "Phát triển ứng dụng web"
          }
        ],
        "skills": {
          "technical": ["JavaScript", "React", "Node.js"],
          "soft": ["Giao tiếp", "Làm việc nhóm"],
          "languages": ["Tiếng Anh", "TOEIC 800"]
        }
      },
      "skills": ["JavaScript", "React", "Node.js"],
      "suggestions": ["Thêm dự án cá nhân", "Cải thiện mô tả kinh nghiệm"],
      "analyzedAt": "2024-01-15T10:30:05.000Z"
    }
  },
  "message": "Resume uploaded and parsed successfully"
}
```

## API Client Methods

### Upload CV (without parsing)

```tsx
const response = await api.candidateCV.uploadCV(formData);
```

### Upload and Parse CV (with AI)

```tsx
const response = await api.candidateCV.uploadAndParseCV(formData);
```

## Demo

Truy cập `/demo/upload-cv` để xem demo component.

## Styling

Component sử dụng:

- **Primary Color**: `oklch(0.65 0.18 195)`
- **Gradient**: Linear gradient với primary color
- **Glass Morphism**: Backdrop blur với transparency
- **Shadows**: Layered shadows cho depth
- **Animations**: Smooth transitions và hover effects

## Error Handling

- **File Type Validation**: Kiểm tra định dạng file
- **Size Validation**: Kiểm tra kích thước file (10MB max)
- **Network Errors**: Xử lý lỗi API
- **User Feedback**: Thông báo lỗi rõ ràng

## Accessibility

- **Keyboard Navigation**: Hỗ trợ điều hướng bằng bàn phím
- **Screen Reader**: ARIA labels và descriptions
- **Focus Management**: Quản lý focus khi mở/đóng modal
- **Color Contrast**: Đảm bảo độ tương phản màu sắc
