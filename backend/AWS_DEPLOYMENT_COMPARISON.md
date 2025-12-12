# AWS App Runner vs Elastic Beanstalk - So sánh

## Tổng quan

Cả hai đều là AWS managed services để deploy containerized applications, nhưng có sự khác biệt lớn về cách hoạt động và use cases.

---

## 🚀 AWS App Runner

### Đặc điểm:
- ✅ **Fully Managed**: AWS quản lý hoàn toàn infrastructure
- ✅ **Auto-scaling**: Tự động scale up/down dựa trên traffic
- ✅ **Simple**: Chỉ cần Docker image → Deploy
- ✅ **Fast setup**: Setup trong vài phút
- ✅ **Pay-per-use**: Chỉ trả tiền khi có traffic
- ✅ **Zero configuration**: Không cần config VPC, Load Balancer, Auto Scaling

### Phù hợp cho:
- ✅ Microservices
- ✅ APIs, Backend services
- ✅ Containerized apps (Docker)
- ✅ Projects cần deploy nhanh
- ✅ Small to medium traffic

### Hạn chế:
- ❌ Không customize infrastructure nhiều
- ❌ Không có SSH access
- ❌ Giới hạn về networking options
- ❌ Không hỗ trợ multi-container (chỉ 1 container per service)

### Pricing:
- **Compute**: ~$0.007/vCPU-hour, ~$0.0008/GB-hour
- **Ví dụ**: 1 vCPU, 2GB RAM, 24/7 = ~$15-20/tháng

---

## 🌱 Elastic Beanstalk

### Đặc điểm:
- ✅ **More Control**: Có thể customize EC2, VPC, Load Balancer
- ✅ **Multiple Platforms**: Docker, Node.js, Python, Java, .NET, Go, PHP, Ruby
- ✅ **SSH Access**: Có thể SSH vào EC2 instances
- ✅ **Environment Management**: Dev, Staging, Production environments
- ✅ **Configuration Files**: `.ebextensions` để customize
- ✅ **Multi-container**: Hỗ trợ Docker Compose

### Phù hợp cho:
- ✅ Applications cần customize infrastructure
- ✅ Legacy applications (không phải Docker)
- ✅ Cần SSH access để debug
- ✅ Multi-container applications
- ✅ Enterprise applications với nhiều requirements

### Hạn chế:
- ❌ Phức tạp hơn App Runner
- ❌ Cần hiểu về EC2, VPC, Load Balancer
- ❌ Setup lâu hơn
- ❌ Phải quản lý scaling configuration

### Pricing:
- **Free**: Chỉ trả cho EC2, Load Balancer, Storage
- **Ví dụ**: t3.small (2 vCPU, 2GB) = ~$15/tháng + Load Balancer ~$16/tháng = ~$31/tháng

---

## 📊 So sánh chi tiết

| Tiêu chí | App Runner | Elastic Beanstalk |
|----------|-----------|-------------------|
| **Setup Time** | ⚡ 5-10 phút | ⏱️ 15-30 phút |
| **Complexity** | 🟢 Đơn giản | 🟡 Phức tạp hơn |
| **Control** | 🟡 Limited | 🟢 Full control |
| **Auto-scaling** | 🟢 Automatic | 🟡 Cần config |
| **SSH Access** | ❌ Không | ✅ Có |
| **Multi-container** | ❌ Không | ✅ Có (Docker Compose) |
| **Cost (small app)** | ~$15-20/tháng | ~$30-40/tháng |
| **Best for** | Microservices, APIs | Enterprise apps |

---

## 🎯 Khuyến nghị cho dự án của bạn

### Dùng **App Runner** nếu:
- ✅ Bạn muốn deploy nhanh và đơn giản
- ✅ Backend chỉ là 1 Docker container
- ✅ Không cần SSH access
- ✅ Muốn tiết kiệm chi phí
- ✅ **→ Phù hợp nhất cho đồ án/startup**

### Dùng **Elastic Beanstalk** nếu:
- ✅ Cần SSH access để debug
- ✅ Cần customize infrastructure nhiều
- ✅ Có multi-container (Docker Compose)
- ✅ Cần nhiều environments (dev, staging, prod)
- ✅ **→ Phù hợp cho enterprise/production lớn**

---

## 💡 Kết luận

**Cho đồ án của bạn (Internship Recruitment Platform):**

👉 **Khuyến nghị: Dùng App Runner**

Lý do:
1. ✅ Đơn giản hơn - phù hợp cho đồ án
2. ✅ Deploy nhanh - chỉ cần Docker image
3. ✅ Auto-scaling - không cần config
4. ✅ Rẻ hơn - ~$15-20/tháng vs ~$30-40/tháng
5. ✅ Backend của bạn chỉ là 1 container (Node.js + Python services)

**Elastic Beanstalk** chỉ nên dùng nếu:
- Bạn cần SSH để debug
- Cần multi-container
- Cần customize nhiều

---

## 📝 Workflow Files

Hiện tại bạn có 2 workflow files:
1. `.github/workflows/deploy-backend.yml` → **App Runner** (khuyến nghị)
2. `.github/workflows/deploy-backend-elastic-beanstalk.yml` → **Elastic Beanstalk**

**Khuyến nghị**: Chỉ dùng App Runner workflow, có thể xóa Elastic Beanstalk workflow nếu không cần.

