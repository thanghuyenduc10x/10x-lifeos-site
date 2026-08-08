# Nối form đăng ký về Google Sheet (~5 phút, làm 1 lần)

Sau bước này, mọi người đăng ký sẽ rơi thẳng vào một Sheet. Trang web đã sẵn sàng —
chỉ còn thiếu đúng một đường link.

---

## Bước 1 · Tạo Sheet

Tạo một Google Sheet mới, đặt tên `10X — Đăng ký chương trình`.
Hàng 1 gõ đúng 7 ô này:

```
Thời gian | Họ tên | SĐT | Email | Số người | Nguồn | Trang
```

## Bước 2 · Mở Apps Script

Trong Sheet: menu **Tiện ích mở rộng → Apps Script**. Xoá hết code có sẵn, dán khối này:

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var d = JSON.parse(e.postData.contents);
  sheet.appendRow([
    new Date(),
    d.hoten || '',
    "'" + (d.sdt || ''),   // dấu ' phía trước để Sheet không cắt mất số 0 đầu
    d.email || '',
    d.songuoi || '',
    d.nguon || '',
    d.trang || ''
  ]);
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Cho phép trình duyệt hỏi trước (preflight) — thiếu hàm này thì fetch sẽ lỗi CORS.
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

Bấm biểu tượng đĩa mềm để lưu.

## Bước 3 · Triển khai

**Triển khai → Bản triển khai mới → chọn loại: Ứng dụng web**, rồi đặt:

| Trường | Chọn |
|---|---|
| Thực thi với tư cách | **Tôi** |
| Ai có quyền truy cập | **Bất kỳ ai** |

⚠️ Phải là **"Bất kỳ ai"** — nếu để "Bất kỳ ai có Tài khoản Google" thì khách vãng lai không gửi được.

Google sẽ hỏi cấp quyền → **Nâng cao → Chuyển đến … (không an toàn) → Cho phép**.
(Cảnh báo này là bình thường với script tự viết.)

Copy **URL ứng dụng web** — dạng `https://script.google.com/macros/s/AKfy…/exec`.

## Bước 4 · Gửi URL cho Claude

Nhắn: *"URL Apps Script là https://script.google.com/macros/s/…/exec"*

Claude sẽ dán vào `bootcamp/index.html` và chạy lại bộ audit để xác nhận
`DATA-FORM-SINK` chuyển từ 🔴 sang 🟢.

**CSP đã mở sẵn** cho `script.google.com` và `script.googleusercontent.com` trong `.htaccess`
(dòng `connect-src`) — nên form sẽ chạy ngay, không bị trình duyệt chặn.
Đây là cái bẫy hay gặp nhất: code đúng, URL đúng, nhưng CSP chặn nên dữ liệu vẫn không tới nơi.

---

## Kiểm tra sau khi lắp

1. Mở https://10x-lifeos.com/bootcamp/ trên điện thoại
2. Điền tên + số điện thoại của chính mình rồi bấm gửi
3. Mở Sheet — phải thấy một dòng mới trong vòng vài giây
4. Nếu **không** thấy: trang giờ sẽ báo *"Chưa gửi được đăng ký của bạn"* kèm lối liên hệ Zalo,
   chứ không còn giả vờ thành công như trước

## Mỗi lần sửa code Apps Script sau này

Phải **Triển khai → Quản lý bản triển khai → sửa → Phiên bản: Mới** rồi bấm Triển khai.
Chỉ bấm Lưu thôi thì URL cũ vẫn chạy code cũ — đây là chỗ hay nhầm nhất.
URL không đổi, nên không cần báo lại cho Claude.
