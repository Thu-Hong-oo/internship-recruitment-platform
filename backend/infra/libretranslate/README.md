# LibreTranslate (Self-hosted)

Chạy dịch vụ dịch văn bản miễn phí phục vụ API `/api/translate`.

## Yêu cầu

- Docker & Docker Compose
- Port trống (mặc định `5000`)

## Khởi chạy

```bash
cd backend/infra/libretranslate
docker compose up -d
```

Các biến môi trường tùy chỉnh (optional):

| Biến                  | Mặc định | Ý nghĩa                  |
| --------------------- | -------- | ------------------------ |
| `LIBRETRANSLATE_PORT` | `5000`   | Port phía host để expose |

Sau khi container chạy:

```bash
curl http://localhost:5000/languages
```

## Tích hợp backend

Trong file `.env` của backend, đặt:

```
TRANSLATE_BASE_URL=http://localhost:5000/translate
```

Server Node.js sẽ gọi trực tiếp tới endpoint này thông qua `translationService`.

## Dừng / cập nhật

```bash
docker compose down        # dừng container
docker compose pull        # cập nhật image
docker compose up -d       # chạy lại
```






