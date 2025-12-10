# 🔐 Dialogflow Environment Variables Setup

Hướng dẫn cấu hình Dialogflow credentials trong file `.env` (local development) và Koyeb (production).

---

## 📝 Cách 1: Dùng 3 biến riêng (RECOMMENDED - Cho Koyeb & Local)

### Setup trong `backend/.env`:

```env
# Dialogflow Configuration
DIALOGFLOW_PROJECT_ID=intern-bridge-dialogflowe-emed
DIALOGFLOW_MODE=ES
DIALOGFLOW_LANGUAGE_CODE=vi

# Dialogflow Credentials (Method 1: Separate env vars - RECOMMENDED)
DIALOGFLOW_CLIENT_EMAIL=dialogflow-access@intern-bridge-dialogflowe-emed.iam.gserviceaccount.com
DIALOGFLOW_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEuwIBADANBgkqhkiG9w0BAQEFAASCBKUwggShAgEAAoIBAQC4if4hCPTboNHa\nKJFgNBkjZC/VWnsNZQ/52DPYAx1CKQOWuCx/oX78dwRbohizrj/QxwiATFnVzZQI\n... (toàn bộ private key với \n thật)\n-----END PRIVATE KEY-----
```

**Lưu ý quan trọng:**
- `DIALOGFLOW_PRIVATE_KEY` phải có `\n` thật (xuống dòng thật), không phải text `\n`
- Hoặc nếu copy từ JSON file, giữ nguyên format với `\n` trong string

### Ví dụ đầy đủ:

```env
# Dialogflow Configuration
DIALOGFLOW_PROJECT_ID=intern-bridge-dialogflowe-emed
DIALOGFLOW_MODE=ES
DIALOGFLOW_LANGUAGE_CODE=vi

# Dialogflow Credentials
DIALOGFLOW_CLIENT_EMAIL=dialogflow-access@intern-bridge-dialogflowe-emed.iam.gserviceaccount.com
DIALOGFLOW_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEuwIBADANBgkqhkiG9w0BAQEFAASCBKUwggShAgEAAoIBAQC4if4hCPTboNHa
KJFgNBkjZC/VWnsNZQ/52DPYAx1CKQOWuCx/oX78dwRbohizrj/QxwiATFnVzZQI
AdMNLwB3MLsbMYDdoVhAC12pVjEtilvls75dEP9B+uEYfhQMQgGvj5Ay7+q36/q8
lx1cmT0/hPJPA30nVFpoTMlijMVNFC8AR/FJxw3KS0QSRbeZx6iSoHiDsl/buneF
nl0a5jx2XgODqimq7JGigWvaKFxXOZYAUFnmT1QygIvMzgTxq77sPKlX7jpW8epd
/elQKfFfJ+EOmqeSR2Vm0CKqmwLmzZFkIN38YPjhIpJ8hp9xm/tjVMkzW1dqobuC
9vFkg45xAgMBAAECggEAESpEyS3cGNHMs04yt5AhBnm7OU1BRO2xnrvNlrozboQC
IXLgML8E4NbxQNTDF3ON3A2nbMetU4XbzyLcTs2gbXXK8ayZIARyAQMNo0KxMFs+
UQ93FZEPLUP4zB5uHvXE0l+4OgS3AISivggQYxyd5dqn71GTwqTGBA2gbdpKP/EH
3EIZaz0KBFawDpOWpwN4bJ8T0ennxM0yukdnem+QtFXQMrvRTanOWPTqZWMECW8P
lmkSLuOghylTulcnBEnp4EOu5VBxR0a53WM6u3/phyO6HHHda5oeSGMJIJ3/GK4g
qVpts/eCwg1UOpM2M7BYXFXIXR10L8mgEmdOsVtKQQKBgQD5ewdrJQwe9NhfghF+
vRsKa3t9h1eiVn/4P2hHsrE1jL8rL5VYPGfya+ogejRnX3iyFTlxcosYGpv0tqkm
ZRJek2gsuE5K/kdgsNh/S2K+pes+1i1jox++VzfpUJXuJg7vmMkM2qO7c7+SavKp
4w8xe9axbGZFn9OGmaNjppFDUwKBgQC9XITSLompkY5BvRG8HMDMguHFMNwDdDjW
TzFOcVFzmWOGqu0BaVkdat0IbCf4efmf0zV0jGIo052U6q86Hwmp1JCol5bsVaRx
UIs0UZn3+IMh4JMmeezH4S1TZyi0Y3cEQHZtwW+v7GAMgM22G2CbrnUpIBPsR9+u
setcVAlSqwKBgQDruhfUYXkGdwtLkza8rioyukRA4/Ul6t2XzzHVLT7L/mVThO50
JP+Cy/y5Gz8QveDpQ6y3SSesatgZbc59/NpSiq3QM4WmzoTbE7486RowUc3p3a2d
i7CexQKLbh18nHFYauDtSFmU8VV+H5eSdn0QoJbHpkksWEwhzmHX8rcnCQKBgCjH
3grt3tPX9w0NTN54SsVAgqLXDOrpgrwUvgeou+PratW7xeMB7yE4vHVt5YXLrwjO
kbqR6SnluRAzIp2fxZL/pk/IpcYsA4gr0m7oDAKtUIBhPw+QPoAlbH+Dve5rZVxT
Da5BdG4st9q5epP3fWzJu42pzOCb8f5LbuapaoCVAn8RvmFE8ujzN5sSw6pMp4wb
sF8iLD6TUc1VTSBzTyoxJgECBZR7wtshHg9sdTOzTGfwJpgpKsLZRFddx5oqKuli
6HKplCLFPKHZh3x50fdBUMSXo2KDfRx/nTZ0O0/sJNRyz2Dl8XXuJhJD+razcUqo
/MF0iB39Rr98BwKMPghT
-----END PRIVATE KEY-----"
```

**Hoặc dùng single line với `\n`:**

```env
DIALOGFLOW_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEuwIBADANBgkqhkiG9w0BAQEFAASCBKUwggShAgEAAoIBAQC4if4hCPTboNHa\nKJFgNBkjZC/VWnsNZQ/52DPYAx1CKQOWuCx/oX78dwRbohizrj/QxwiATFnVzZQI\n... (tiếp tục)\n-----END PRIVATE KEY-----
```

---

## 📝 Cách 2: Dùng file path (Local development)

Nếu bạn có file JSON credentials:

```env
# Dialogflow Configuration
DIALOGFLOW_PROJECT_ID=intern-bridge-dialogflowe-emed
DIALOGFLOW_MODE=ES
DIALOGFLOW_LANGUAGE_CODE=vi

# Dialogflow Credentials (Method 2: File path)
GOOGLE_APPLICATION_CREDENTIALS=./dialogflow-key.json
```

**Lưu ý:**
- File `dialogflow-key.json` phải nằm trong thư mục `backend/`
- Thêm vào `.gitignore` để không commit lên Git

---

## 📝 Cách 3: Dùng JSON content (Không khuyến khích)

Nếu muốn dùng JSON content trực tiếp trong `.env`:

```env
# Dialogflow Configuration
DIALOGFLOW_PROJECT_ID=intern-bridge-dialogflowe-emed
DIALOGFLOW_MODE=ES
DIALOGFLOW_LANGUAGE_CODE=vi

# Dialogflow Credentials (Method 3: JSON content - NOT RECOMMENDED)
GOOGLE_APPLICATION_CREDENTIALS={"type":"service_account","project_id":"intern-bridge-dialogflowe-emed","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"dialogflow-access@...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/..."}
```

**⚠️ Không khuyến khích:** JSON quá dài, dễ lỗi, khó maintain.

---

## 🚀 Setup trên Koyeb (Production)

### 1. Vào Koyeb Dashboard:
- Services → Your service → Environment Variables → Add Secret

### 2. Thêm 3 Secrets:

| Secret Name | Secret Value |
|------------|--------------|
| `DIALOGFLOW_PROJECT_ID` | `intern-bridge-dialogflowe-emed` |
| `DIALOGFLOW_CLIENT_EMAIL` | `dialogflow-access@intern-bridge-dialogflowe-emed.iam.gserviceaccount.com` |
| `DIALOGFLOW_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----` (với `\n` thật) |

### 3. Thêm 2 Environment Variables (không cần secret):

| Variable Name | Value |
|--------------|-------|
| `DIALOGFLOW_MODE` | `ES` |
| `DIALOGFLOW_LANGUAGE_CODE` | `vi` |

---

## ✅ Kiểm tra sau khi setup

Sau khi restart backend, logs sẽ hiển thị:

```
✅ Dialogflow ES credentials loaded from separate env vars (DIALOGFLOW_CLIENT_EMAIL + DIALOGFLOW_PRIVATE_KEY)
✅ Dialogflow ES client initialized
   Project: intern-bridge-dialogflowe-emed, Mode: ES
```

---

## 🔍 Troubleshooting

### Lỗi: "Dialogflow ES not configured: DIALOGFLOW_PROJECT_ID missing"
→ Kiểm tra `DIALOGFLOW_PROJECT_ID` đã được set chưa

### Lỗi: "Failed to build credentials from env vars"
→ Kiểm tra `DIALOGFLOW_CLIENT_EMAIL` và `DIALOGFLOW_PRIVATE_KEY` đã đúng format chưa

### Lỗi: "ENAMETOOLONG"
→ Đã được fix, không còn lỗi này nữa khi dùng Method 1 (credentials object)

---

## 📌 Tóm tắt

**Local (.env):**
```env
DIALOGFLOW_PROJECT_ID=intern-bridge-dialogflowe-emed
DIALOGFLOW_MODE=ES
DIALOGFLOW_LANGUAGE_CODE=vi
DIALOGFLOW_CLIENT_EMAIL=dialogflow-access@intern-bridge-dialogflowe-emed.iam.gserviceaccount.com
DIALOGFLOW_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
```

**Koyeb:**
- 3 Secrets: `DIALOGFLOW_PROJECT_ID`, `DIALOGFLOW_CLIENT_EMAIL`, `DIALOGFLOW_PRIVATE_KEY`
- 2 Variables: `DIALOGFLOW_MODE=ES`, `DIALOGFLOW_LANGUAGE_CODE=vi`

