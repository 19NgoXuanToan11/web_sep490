# 🧪 Hướng dẫn Test Thanh Toán VNPay

## ⚠️ VẤN ĐỀ HIỆN TẠI

Backend đang redirect về **URL sai**:
```
❌ https://iotfarm.onrender.com/payment-result  (Backend - không có giao diện)
```

Cần redirect về **URL đúng**:
```
✅ https://web-sep490.vercel.app/payment-result  (Frontend Vercel - có giao diện)
```

## 🔧 GIẢI PHÁP (2 CÁCH)

### **Cách 1: Yêu cầu Backend Team Sửa (KHUYÊN DÙNG)**

Backend team cần apply patch đã có sẵn trong folder `backend/`:

```bash
cd backend
git apply 0001-Fix-payment-callback-redirect-to-Vercel-frontend-URL.patch
git add .
git commit -m "Fix payment callback URL to Vercel frontend"
git push origin main
```

**File cần sửa:** `backend/WebAPI/Controllers/PaymentController.cs` (dòng 183)

Chi tiết xem file: `BACKEND_UPDATE_GUIDE.md` trong root folder.

---

### **Cách 2: Test Bằng URL Thủ Công (TẠM THỜI)**

Vì backend chưa sửa, bạn có thể test bằng cách **thay đổi URL thủ công**:

#### Bước 1: Thanh toán như bình thường

Sau khi thanh toán VNPay, bạn sẽ bị redirect về:
```
https://iotfarm.onrender.com/payment-result?success=true&orderId=61&amount=500000&code=00
```

#### Bước 2: Copy và thay đổi URL

**Thay đổi:** `iotfarm.onrender.com` → **URL Vercel thực tế của bạn**

**Ví dụ:**
```
Từ: https://iotfarm.onrender.com/payment-result?success=true&orderId=61&amount=500000&code=00
Sang: https://YOUR-VERCEL-URL.vercel.app/payment-result?success=true&orderId=61&amount=500000&code=00
```

#### Bước 3: Paste URL mới vào trình duyệt

Bạn sẽ thấy giao diện thanh toán thành công đẹp mắt! 🎉

---

## 📱 TEST TRÊN MOBILE APP

Mobile app **ĐÃ HOẠT ĐỘNG ĐÚNG** vì backend đang redirect về deep link `ifms://` cho mobile.

### Cách test:

1. **Chạy mobile app:**
```bash
cd mobile_sep490/mobile_sep490
npx expo start
```

2. **Scan QR code** bằng Expo Go app

3. **Thanh toán từ app** → Deep link tự động mở app và hiển thị kết quả

---

## 🔍 KIỂM TRA URL VERCEL

Để lấy **URL Vercel chính xác**:

1. Vào: https://vercel.com/dashboard
2. Click vào project **web_sep490**
3. Copy **Production URL** (ví dụ: `web-sep490.vercel.app`)
4. Dùng URL này để test theo Cách 2 ở trên

---

## ✅ KẾT QUẢ SAU KHI BACKEND SỬA

Sau khi backend team apply patch:

- ✅ **Web browser:** Tự động redirect về Vercel → Hiển thị giao diện đẹp
- ✅ **Mobile app:** Tự động mở deep link → Hiển thị trong app
- ✅ **Không cần thay đổi URL thủ công nữa**

---

## 🎨 GIÁ TRỊ THAM SỐ

URL thanh toán kết quả cần các tham số sau:

| Tham số | Ý nghĩa | Ví dụ |
|---------|---------|-------|
| `success` | Thành công hay thất bại | `true` / `false` |
| `orderId` | Mã đơn hàng | `61` |
| `amount` | Số tiền (VND) | `500000` |
| `code` | Mã giao dịch VNPay | `00` (thành công) |
| `message` | Thông điệp (tùy chọn) | `Payment Success` |

### Ví dụ URL đầy đủ:

**Thành công:**
```
https://web-sep490.vercel.app/payment-result?success=true&orderId=61&amount=500000&code=00&message=Payment%20Success
```

**Thất bại:**
```
https://web-sep490.vercel.app/payment-result?success=false&orderId=61&amount=500000&code=24&message=Payment%20Failed
```

---

## 🚀 DEPLOY STATUS

- ✅ Frontend đã deploy lên Vercel
- ✅ Route `/payment-result` đã được cấu hình trong `vercel.json`
- ✅ Giao diện thanh toán đã sẵn sàng
- ⏳ Đang chờ backend team sửa URL callback

---

**Liên hệ backend team và gửi file:** `BACKEND_UPDATE_GUIDE.md`

