# 🚀 GitHub Actions - PIRA Frontend

## Tự động deploy khi push code vào `main` hoặc `develop`

---

## ⚙️ SETUP (Chỉ làm 1 lần)

### **BƯỚC 1: Tạo SSH Key trên VPS**

> Nếu đã làm cho Backend → SKIP bước này!

```bash
ssh root@103.200.23.208

# Tạo key (ENTER 3 lần)
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions_key

# Thêm public key
cat ~/.ssh/github_actions_key.pub >> ~/.ssh/authorized_keys

# Copy private key
cat ~/.ssh/github_actions_key
```

📋 **Copy TOÀN BỘ** từ `-----BEGIN OPENSSH PRIVATE KEY-----` đến `-----END OPENSSH PRIVATE KEY-----`

---

### **BƯỚC 2: Thêm GitHub Secrets**

Vào: **https://github.com/chautdn/PIRA-client/settings/secrets/actions**

Thêm 3 secrets:

| Name          | Value                                     |
| ------------- | ----------------------------------------- |
| `VPS_SSH_KEY` | Paste toàn bộ private key (giống Backend) |
| `VPS_HOST`    | `103.200.23.208`                          |
| `VPS_USER`    | `root`                                    |

---

### **BƯỚC 3: Push code để test**

```bash
cd PIRA-client
git add .github/
git commit -m "Add GitHub Actions"
git push origin main
```

Xem logs: **https://github.com/chautdn/PIRA-client/actions**

---

## ✅ Xong!

Từ giờ mỗi lần push → Frontend tự động deploy! 🚀
