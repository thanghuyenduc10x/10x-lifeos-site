# Ai làm gì — Coach Thắng và Claude

## Nguyên tắc chia việc

> **Coach Thắng giữ mọi thứ không đảo ngược được, và mọi thứ mang giọng nói của mình.
> Claude giữ mọi thứ máy móc và đảo ngược được bằng `git revert`.**

Mọi dòng dưới đây chỉ là hệ quả của một câu đó.

---

## Bảng phân vai

| Mảng | Coach Thắng quyết | Claude làm |
|---|---|---|
| **Design** | Bản sắc thương hiệu · giọng văn · cái gì được đăng · khi nào đổi hệ màu/font · trang nào được phép lệch chuẩn | Canh token khỏi trôi (`:root{}` lạ, hex ngoài theme, URL font lệch, `?v=` không đồng bộ) · báo chỗ lệch kèm diff sẵn · **không bao giờ tự sửa chữ trong `<body>`** |
| **Vận hành** | Bấm merge (= deploy) · go/no-go mọi thứ chạm tiền, `.htaccess`, nội dung · ngày tháng sự kiện · nơi nhận lead | Phát hiện sớm · dựng PR sẵn · kiểm live sau deploy · canh nội dung hết hạn · canh link chết |
| **Tối ưu** | Ngân sách (trang bao nhiêu KB là đủ) · đánh đổi giữa SEO và nội dung · cái gì đáng làm, cái gì kệ | Đo · xếp hạng theo `mức × 1/phút` · gom vào 5 phút thứ Hai · đề xuất, không tự quyết |
| **Tự động hoá** | Duyệt nâng bậc tự chủ · duyệt quy tắc mới trong `policy.json` | Viết & bảo trì `_audit/` · siết cổng CI khi nợ về 0 · tự sửa lớp A khi đã được phép |

---

## Ba lớp tự chủ

Mọi kiểm tra đều được gán một lớp cố định trong code:

### Lớp A — Claude tự sửa được
Chỉ khi thoả **tất cả 7 điều**:
1. `git revert` một lệnh khôi phục nguyên trạng byte-for-byte
2. Không đổi DOM hiển thị — diff phải rỗng ngoài "vùng chạm" mà check khai sẵn
3. Không chạm 5 file cửa an toàn: `.htaccess`, `robots.txt`, `.gitignore`, `.github/workflows/**`, `CLAUDE.md`
4. Không chạm chữ nghĩa — cấm mọi text node trong `<body>`
5. Không chạm tiền / liên hệ / ngày sự kiện
6. Chạy trọn bộ check trước-sau: mục tiêu 🔴→🟢 và **không check nào 🟢→🔴**. Có hồi quy thì tự `git reset --hard` và báo "đã thử, đã lùi lại"
7. Chứng minh được đúng mà không cần mạng

*Đang thuộc lớp A:* `ARCH-SITEMAP-LASTMOD` · `TRANG-CANON-MISSING` · `TRANG-LANG` · `TRANG-VIEWPORT` · `LINK-EXT-NOOPENER` · `PERF-VERSION-SKEW` · `ARCH-COMPONENT-ORPHAN`

### Lớp B — Claude mở PR, Coach Thắng bấm merge
Đảo ngược được nhưng **đổi hành vi** hoặc **xoá dữ liệu**: bật đo lường, xoá asset, đổi định dạng ảnh, sửa URL font, thêm vào sitemap, nối link giữ chỗ, sửa CI.

### Lớp C — Claude chỉ báo cáo, không đụng
Cần quyết định của người: an toàn (`.htaccess`, CSP), nội dung, thương hiệu, tiền, pháp lý.

*Luôn ở lớp C:* mọi `SEC-CSP-*` · `DATA-FORM-SINK` · `DATA-PII-POLICY` · `ARCH-TOKEN-ROOT` · `ARCH-CONTENT-EXPIRED` · `ARCH-DOC-CLAIM` · mọi thứ chạm `.htaccess`

> **C không bao giờ nâng lên A được.** Đây là ràng buộc cứng trong `_audit/lib/xep-hang.mjs`, không phải cấu hình. Coach Thắng có thể nâng B → A bằng quy tắc `cho_tu_sua`, nhưng C thì không có đường.
>
> Sửa CSP là hạng mục **giá trị nhất** mà bộ audit tìm ra — và vẫn vĩnh viễn ở lớp C. Vì `.htaccess` sai một ký tự là sập cả site, mà phiên cloud không phải lúc nào cũng curl được để kiểm.

---

## Thang nâng bậc

| Bậc | Claude được làm | Cổng của Coach Thắng |
|---|---|---|
| 0 | Chỉ đọc, chỉ báo cáo | — |
| 1 | Báo cáo + hỏi ≤3 câu/ngày + ghi `policy.json` | Trả lời trong chat |
| 2 | Mở PR `audit/YYYY-MM-DD` với diff đề xuất. **Không merge** | Bấm merge |
| 3 | Tự sửa lớp A thẳng lên main — chỉ với ID đã từng qua 1 PR được merge nguyên vẹn | Xem thông báo |
| 4 | Ổn định: A tự động · B qua PR · C chỉ báo cáo | Merge lớp B |

**Điều kiện nâng bậc: ≥5 quy tắc đã xác nhận VÀ ≥1 PR được merge nguyên vẹn.** Không nâng theo lịch — nếu chưa đủ thì kéo dài giai đoạn.

---

## Cách Claude học

Mỗi quyết định của Coach Thắng thành một bản ghi trong `_audit/cau-hinh/policy.json` với **hai trường tách bạch**:

- **`chu_noi`** — nguyên văn lời Coach Thắng, tiếng Việt. Mở file ra là nhận ra chính mình.
- **`claude_hieu`** — Claude diễn giải tổng quát. **Chỉ trường này được áp cho ca mới**, và Claude phải hỏi *"tôi hiểu vậy đúng chưa?"* trước khi nó có hiệu lực.

Tách hai trường vì đây là chỗ dễ hỏng nhất: Coach Thắng bỏ qua **một** ca, Claude tổng quát thành **luật**, rồi các lỗi thật sau đó bị nuốt hết. Bốn van chặn điều đó:

1. `tong_quat_hoa` mặc định **false** — quy tắc chỉ áp cho đúng file đã liệt kê.
2. `da_xac_nhan` phải là `true` mới có hiệu lực.
3. Mọi lệnh hạ mức **tự hết hạn sau 90 ngày**. Mọi lệnh hoãn bắt buộc có hạn, tối đa 30 ngày.
4. `muc_goc` luôn được giữ trong `latest.json`, và báo cáo **luôn in** dòng *"Đã hạ mức N mục · Đang hoãn M mục"*.

**Policy đổi cách trình bày. Policy không xoá được sự thật.** Không có gì tắt vĩnh viễn trong im lặng.

---

## Nhịp

- **Mỗi sáng 8h30** — Routine chạy, đẩy thông báo về điện thoại. Đọc 5 phút. Nếu có 🔴 thì làm đúng 1 việc; nếu không thì đóng máy.
- **Thứ Hai** — báo cáo có thêm khối `📋 5 việc tuần này`. Đây là 5 phút/tuần.
- **Khi Coach Thắng quyết điều gì** — Claude ghi vào `policy.json`, hỏi lại một câu để xác nhận đã hiểu đúng, rồi từ hôm sau cư xử theo.
