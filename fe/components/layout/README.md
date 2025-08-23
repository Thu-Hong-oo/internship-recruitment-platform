# Layout Components

Các component layout được thiết kế theo kiến trúc **Layout-based** để quản lý layout chung cho toàn bộ hệ thống.

## 🏗️ Kiến trúc Layout-based

### ✅ **Ưu điểm:**

- **Single Source of Truth**: Layout được quản lý tập trung
- **DRY Principle**: Không lặp lại Header/Footer ở mọi page
- **Consistency**: Đảm bảo layout nhất quán toàn bộ hệ thống
- **Maintainability**: Dễ bảo trì và cập nhật layout chung
- **Flexibility**: Có thể tùy chỉnh layout cho từng page

### 📁 **Cấu trúc**

```
components/layout/
├── header.tsx          # Component Header chung
├── footer.tsx          # Component Footer chung
├── hero-section.tsx    # Component Hero Section (chỉ dùng cho trang chủ)
├── page-layout.tsx     # Layout wrapper chính
├── index.ts           # File export
└── README.md          # Hướng dẫn sử dụng
```

## 🚀 Cách sử dụng

### 1. Sử dụng PageLayout (Khuyến nghị)

```tsx
import { PageLayout } from "@/components/layout";

export default function MyPage() {
  return (
    <PageLayout>
      {/* Nội dung trang của bạn */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1>Nội dung trang</h1>
      </div>
    </PageLayout>
  );
}
```

### 2. Sử dụng PageLayout với Search Bar

```tsx
import { PageLayout } from "@/components/layout";

export default function SearchPage() {
  const searchBarContent = (
    <div className="flex items-center gap-4">
      <input placeholder="Tìm kiếm..." />
      <button>Tìm kiếm</button>
    </div>
  );

  return (
    <PageLayout showSearchBar={true} searchBarContent={searchBarContent}>
      {/* Nội dung trang tìm kiếm */}
    </PageLayout>
  );
}
```

### 3. Import riêng lẻ (nếu cần)

```tsx
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import HeroSection from "@/components/layout/hero-section";
```

## 📋 Props

### PageLayout

| Prop               | Type        | Default | Description              |
| ------------------ | ----------- | ------- | ------------------------ |
| `children`         | `ReactNode` | -       | Nội dung chính của trang |
| `showSearchBar`    | `boolean`   | `false` | Hiển thị search bar      |
| `searchBarContent` | `ReactNode` | -       | Nội dung search bar      |

### HeroSection

| Prop       | Type                        | Description                      |
| ---------- | --------------------------- | -------------------------------- |
| `onSearch` | `(keyword: string) => void` | Callback khi người dùng tìm kiếm |

## 🎯 Tính năng

### PageLayout

- **Header**: Navigation, logo, user actions
- **Search Bar**: Tùy chọn, có thể bật/tắt
- **Main Content**: Wrapper cho nội dung trang
- **Footer**: Company info, links, copyright

### Header

- Logo TopCV
- Navigation menu với dropdown
- User actions (notifications, profile)
- Responsive design

### Footer

- Company information
- Social media links
- Multiple columns với links hữu ích
- Copyright information

### HeroSection

- Search form với 4 input fields
- Location picker modal
- Job category selection modal
- Popular search tags
- Gradient background

## 🔄 Migration từ Component-based

### Trước (Component-based):

```tsx
export default function MyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Nội dung */}
      <Footer />
    </div>
  );
}
```

### Sau (Layout-based):

```tsx
export default function MyPage() {
  return <PageLayout>{/* Nội dung */}</PageLayout>;
}
```

## 🎨 Customization

### Tùy chỉnh Search Bar

```tsx
<PageLayout
  showSearchBar={true}
  searchBarContent={
    <div className="custom-search-bar">{/* Custom search content */}</div>
  }
>
  {/* Page content */}
</PageLayout>
```

### Tùy chỉnh Layout (nâng cao)

```tsx
// Tạo layout riêng nếu cần
function CustomLayout({ children }) {
  return (
    <div className="custom-layout">
      <Header />
      <div className="custom-sidebar">Sidebar</div>
      <main>{children}</main>
      <Footer />
    </div>
  );
}
```

## 🚀 Best Practices

1. **Luôn sử dụng PageLayout** cho các trang mới
2. **Tách search bar content** thành component riêng nếu phức tạp
3. **Sử dụng semantic HTML** trong main content
4. **Responsive design** cho mọi layout
5. **Accessibility** với ARIA labels và keyboard navigation

## 📱 Responsive Design

- Tất cả components đều responsive
- Mobile-first approach
- Sử dụng Tailwind CSS breakpoints
- Adaptive layouts cho các kích thước màn hình khác nhau

## ♿ Accessibility

- Semantic HTML structure
- ARIA labels và roles
- Keyboard navigation support
- Screen reader friendly
- Focus management

## ⚡ Performance

- Component splitting
- Lazy loading ready
- Efficient re-renders
- Memoization support
- Bundle optimization
