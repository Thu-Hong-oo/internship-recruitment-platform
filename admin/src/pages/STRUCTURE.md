# Cấu trúc thư mục Pages

## Cấu trúc mới (Đề xuất)

```
pages/
  admin/                    # Tất cả trang dành cho admin
    dashboard/
    accounts/               # Quản lý users
    companies/
    posts/                  # Quản lý bài đăng
    employers/
    candidates/
    transactions/
    exams/
    media/
    charts/
    settings/               # Các trang cấu hình
      job-types/
      skills/
      levels/
      work-types/
      salary-ranges/
      experience/
      industries/
    packages/
      post-packages/
      view-packages/
  shared/                   # Trang dùng chung
    login/
```

## Các file cần di chuyển thủ công (do permission)

Các file sau cần được di chuyển từ root `pages/` vào `pages/admin/`:

1. `accounts/` → `admin/accounts/`
2. `companies/` → `admin/companies/`
3. `candidates/` → `admin/candidates/`
4. `dashboard/` → `admin/dashboard/`
5. `exams/` → `admin/exams/`
6. `transactions/` → `admin/transactions/`
7. `media/` → `admin/media/`

## Đã di chuyển

- ✅ `admin/settings/` - Tất cả các trang cấu hình đã được di chuyển
- ✅ `shared/login/` - Trang login đã được di chuyển

## Đã cập nhật imports

- ✅ `admin/src/config/adminMenuConfig.jsx` - Đã cập nhật tất cả imports
- ✅ `admin/src/router/AppRouter.jsx` - Đã cập nhật imports

## Cần cập nhật thêm

Sau khi di chuyển các file, cần kiểm tra và cập nhật:

- Các imports trong các file components
- Các imports trong các file config khác (nếu có)
- Các đường dẫn relative trong các file đã di chuyển
