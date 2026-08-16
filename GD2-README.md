# GĐ2 "Phễu sống" — BẢN OFFLINE trên nhánh `gd2` (CHƯA deploy)

> Nhánh này KHÔNG tự lên site thật. Chỉ khi merge vào `main` mới deploy.

## Đã dựng gì

| Thứ | File | Là gì |
|---|---|---|
| Hộp bắt email dùng chung | `capture.js` | Kiểu Ali Abdaal: tên thư + lời hứa + số thật (47+) + cam kết thân thiện + link chính sách. Đổi chữ/số 1 chỗ ở đầu file. |
| Nhà của bản tin | `newsletter/index.html` | Trang "Thư Khai Phóng" — lời hứa, nhận gì mỗi thứ Bảy, chỗ chứa kho lưu trữ sau này |
| Chính sách bảo mật | `chinh-sach-bao-mat/index.html` | Bắt buộc trước khi thu email thật. Nói thẳng, không legalese. |
| Trang chủ | `index.html` (đã sửa trên nhánh) | Khối "Hệ thống AI 7 ngày" → hộp bắt email thật (thay nút Skool tạm của GĐ0) |
| Chuỗi 8 lá thư | `~/10X-Brain/content/email-nurture-7-ngay/` | Welcome + 7 ngày, đúng voice, sẵn nạp vào Brevo |

## Việc của Coach trước khi deploy (~10 phút)
1. **Duyệt nội dung:** đọc 8 lá thư + trang /newsletter — có chỗ nào "không phải giọng mình"? Tên "Thư Khai Phóng" giữ hay đổi?
2. **Tạo tài khoản Brevo** (brevo.com — miễn phí 9.000 email/tháng): việc tạo tài khoản chỉ anh làm được. Xong thì nói "xong Brevo" — Claude lo phần còn lại (tạo form + double opt-in + nạp 8 email + dán form action vào `capture.js`).
3. **Link Notion template thật** cho `[LINK-NOTION-TEMPLATE]`.

## Cổng deploy (Claude sẽ tự kiểm trước khi merge)
- [ ] `CFG.action` trong capture.js đã có URL Brevo thật (còn trống = KHÔNG merge)
- [ ] Double opt-in đã bật trong Brevo
- [ ] 8 email đã nạp vào automation, `[LINK-NOTION-TEMPLATE]` đã thay
- [ ] Gửi thử 1 email vào địa chỉ của Coach — nhận được, link hủy chạy
- [ ] Thêm /newsletter/ + /chinh-sach-bao-mat/ vào sitemap.xml + footer
- [ ] Screenshot so trước/sau trang chủ

## Sau deploy (Claude làm nốt GĐ2)
- Sự kiện GA đo submit form (utm + event) · KPI digest thứ Hai đọc thêm số subscriber
