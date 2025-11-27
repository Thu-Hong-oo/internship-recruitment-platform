# 🔧 Hướng Dẫn Setup GitHub Actions cho Firebase Hosting

## 📋 Tổng Quan

File workflow đã có sẵn tại `.github/workflows/deploy-firebase.yml`. Bạn chỉ cần tạo **Firebase Service Account** và thêm vào GitHub Secrets.

---

## 🚀 Các Bước Setup

### **Bước 1: Tạo Firebase Service Account**

1. **Truy cập Firebase Console:**
   - Link: https://console.firebase.google.com/project/intern-recruitment-2025/settings/serviceaccounts/adminsdk

2. **Tạo Service Account:**
   - Click **"Generate new private key"**
   - File JSON sẽ được download về máy
   - **Lưu ý:** Giữ file này an toàn, không commit vào Git!

3. **Copy nội dung file JSON:**
   - Mở file JSON vừa download
   - Copy **TOÀN BỘ** nội dung (từ `{` đến `}`)

---

### **Bước 2: Thêm Secret vào GitHub**

1. **Truy cập GitHub Repository:**
   - Vào repo: `https://github.com/YOUR_USERNAME/internship-recruitment-platform`
   - Click **Settings** → **Secrets and variables** → **Actions**

2. **Tạo Secret mới:**
   - Click **"New repository secret"**
   - **Name:** `FIREBASE_SERVICE_ACCOUNT`
   - **Secret:** Paste toàn bộ nội dung file JSON (từ Bước 1)
   - Click **"Add secret"**

---

### **Bước 3: Kiểm Tra Workflow File**

File `.github/workflows/deploy-firebase.yml` đã có sẵn và đúng cấu hình:

```yaml
- name: Deploy to Firebase
  uses: FirebaseExtended/action-hosting-deploy@v0
  with:
    repoToken: "${{ secrets.GITHUB_TOKEN }}"  # Tự động có sẵn
    firebaseServiceAccount: "${{ secrets.FIREBASE_SERVICE_ACCOUNT }}"  # Cần tạo
    projectId: intern-recruitment-2025
    channelId: live
```

---

### **Bước 4: Test Deploy**

Sau khi thêm secret, có 2 cách test:

#### **Cách 1: Push code lên branch `develop`**
```bash
git add .
git commit -m "Test deploy"
git push origin develop
```

Workflow sẽ tự động chạy khi push lên branch `develop`.

#### **Cách 2: Chạy thủ công từ GitHub**
1. Vào **Actions** tab trên GitHub
2. Chọn workflow **"Deploy to Firebase Hosting"**
3. Click **"Run workflow"**
4. Chọn branch và click **"Run workflow"**

---

## ✅ Checklist

- [ ] Đã tạo Firebase Service Account
- [ ] Đã download file JSON
- [ ] Đã thêm secret `FIREBASE_SERVICE_ACCOUNT` vào GitHub
- [ ] Đã test deploy (push code hoặc chạy thủ công)

---

## 🔍 Troubleshooting

### **Lỗi: "Firebase service account not found"**
- Kiểm tra secret `FIREBASE_SERVICE_ACCOUNT` đã được thêm chưa
- Đảm bảo copy đầy đủ nội dung JSON (không thiếu dấu `}`)

### **Lỗi: "Permission denied"**
- Kiểm tra Service Account có quyền **Firebase Hosting Admin**
- Vào Firebase Console → IAM & Admin → Kiểm tra roles

### **Workflow không chạy**
- Kiểm tra branch trigger (hiện tại là `develop`)
- Nếu muốn trigger từ `main`, sửa dòng 5 trong workflow:
  ```yaml
  branches: [main]  # Thay vì [develop]
  ```

---

## 📝 Lưu Ý

1. **File JSON Service Account:**
   - ❌ KHÔNG commit vào Git
   - ✅ Đã có trong `.gitignore`
   - ✅ Chỉ dùng để tạo GitHub Secret

2. **Branch Trigger:**
   - Hiện tại: `develop`
   - Có thể sửa thành `main` nếu muốn

3. **Build Scripts:**
   - `fe`: `npm run build:export` (build + export static)
   - `fe-employer`: `npm run build:export` (build + export static)
   - `admin`: `npm run build` (Vite build)

---

## 🎉 Hoàn Thành!

Sau khi setup xong, mỗi lần push code lên branch `develop`, GitHub Actions sẽ tự động:
1. ✅ Install dependencies
2. ✅ Build cả 3 projects
3. ✅ Export static files (cho Next.js)
4. ✅ Deploy lên Firebase Hosting

**URLs sau khi deploy:**
- FE: https://internbridge.web.app
- Admin: https://internbridge-admin.web.app
- Employer: https://internbridge-employer.web.app

