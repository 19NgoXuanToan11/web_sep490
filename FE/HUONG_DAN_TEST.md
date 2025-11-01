# 🎯 HƯỚNG DẪN TEST THANH TOÁN - ĐƠN GIẢN

## ❗ VẤN ĐỀ

Khi thanh toán, URL backend trả về là:
```
https://iotfarm.onrender.com/payment-result?success=true&orderId=61
```

**Nhưng URL này KHÔNG có giao diện** (lỗi 404) vì đây là URL backend.

---

## ✅ GIẢI PHÁP TẠM THỜI (KHÔNG CẦN SỬA BACKEND)

### **Cách Test Ngay:**

1. **Thanh toán như bình thường** trên web hoặc app

2. **Sau khi thanh toán**, bạn sẽ thấy lỗi 404. **ĐỪNG LO!**

3. **Xem thanh URL trên trình duyệt**, copy toàn bộ URL:
```
https://iotfarm.onrender.com/payment-result?success=true&orderId=61&amount=500000&code=00
```

4. **Thay đổi** phần đầu URL:
   - **Xóa:** `iotfarm.onrender.com`
   - **Thay bằng:** URL Vercel của bạn (lấy từ Vercel Dashboard)

5. **Paste URL mới** vào trình duyệt:
```
https://YOUR-VERCEL-URL.vercel.app/payment-result?success=true&orderId=61&amount=500000&code=00
```

6. **XONG!** Bạn sẽ thấy màn hình thanh toán thành công đẹp mắt! 🎉

---

## 🔗 LẤY URL VERCEL

1. Vào: https://vercel.com/dashboard
2. Chọn project `web_sep490`
3. Copy **Production URL** (ví dụ: `web-sep490.vercel.app`)

---

## 📢 GIẢI PHÁP VĨNH VIỄN

**Gửi file này cho Backend Team:**
```
BACKEND_UPDATE_GUIDE.md
```

Backend team chỉ cần **thay đổi 1 dòng code** trong file:
```
backend/WebAPI/Controllers/PaymentController.cs (dòng 183)
```

Thay đổi:
```csharp
// CŨ (SAI):
string fallbackUrl = $"https://iotfarm.onrender.com/payment-result...

// MỚI (ĐÚNG):
string fallbackUrl = $"https://web-sep490.vercel.app/payment-result...
```

Sau khi backend sửa → **MỌI THỨ SẼ TỰ ĐỘNG HOẠT ĐỘNG!**

---

## 📱 TEST MOBILE APP

Mobile app **ĐÃ HOẠT ĐỘNG ĐÚNG** vì backend redirect về deep link `ifms://`.

Không cần sửa gì cho mobile app! ✅

---

## 🎨 VÍ DỤ URL TEST

**Thành công:**
```
https://YOUR-VERCEL-URL.vercel.app/payment-result?success=true&orderId=61&amount=500000&code=00&message=Payment%20Success
```

**Thất bại:**
```
https://YOUR-VERCEL-URL.vercel.app/payment-result?success=false&orderId=62&amount=300000&code=24&message=Payment%20Failed
```

Bạn có thể **paste trực tiếp các URL này vào trình duyệt** để test giao diện!

---

**TÓM LẠI:**
- ✅ Frontend đã sẵn sàng trên Vercel
- ✅ Giao diện thanh toán đã đẹp
- ⏳ Backend cần sửa 1 dòng code (file `BACKEND_UPDATE_GUIDE.md`)
- 🎯 Test tạm thời: Thay đổi URL thủ công như hướng dẫn ở trên

