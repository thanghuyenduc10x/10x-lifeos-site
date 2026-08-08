# `_audit/` — bộ kiểm tra sức khoẻ website

Node thuần, **zero dependency**. Không có `package.json` — vì repo này là docroot, `node_modules/` sẽ bị deploy thẳng lên Hostinger.

Thư mục này bị `.htaccess` trả 403 và `robots.txt` cấm. Chính bộ audit tự kiểm điều đó (`SEC-AUDIT-EXPOSED`) — công cụ audit mà bản thân nó bị Google index thì tự mâu thuẫn.

## Chạy

```bash
node _audit/chay.mjs                    # markdown ra stdout (chế độ tĩnh, ~2 giây)
node _audit/chay.mjs --live             # thêm 5 kiểm tra gọi ra site thật
node _audit/chay.mjs --json             # dữ liệu đầy đủ
node _audit/chay.mjs --ghi <thư-mục>    # ghi latest.json + latest.md
node _audit/chay.mjs --truoc <file.json> # đọc mốc hôm qua để tính "đổi gì so với hôm qua"
```

Mã thoát: `2` nếu có 🔴 · `1` nếu có 🟡 · `0` nếu sạch · `3` nếu bộ audit lỗi. Dùng được trong CI.

## Bố cục

```
chay.mjs              điểm vào
lib/kho.mjs           QUÉT REPO MỘT LẦN → "kho" dùng chung cho mọi check
lib/html.mjs          đọc HTML/JS không cần DOM parser
lib/csp.mjs           parse CSP + fallback chain đúng chuẩn Level 3
lib/xep-hang.mjs      áp policy.json lên mức gốc
lib/render-md.mjs     dựng markdown, CƯỠNG CHẾ hạn ngạch độ dài
lib/ket-qua.mjs       khuôn một phát hiện + van chặn báo động giả
checks/*.mjs          6 nhóm tĩnh + 1 nhóm live
cau-hinh/policy.json  bộ nhớ quyết định của Coach Thắng
cau-hinh/bo-loc.json  ngưỡng số + loại trừ kỹ thuật
```

Đọc `TIEU-CHUAN.md` để biết chuẩn tham chiếu và cách xếp 🔴🟡🟢. Đọc `VAI-TRO.md` để biết ai được sửa cái gì.

## Thêm một check mới

1. Viết vào module `checks/` phù hợp, trả về `pt({ id, nhom, muc, tieu_de, vi_sao, ca, cach_sua, phut, lop })`.
2. Thêm ID vào mảng `IDS` ở đầu module — con số "N kiểm tra đạt" tự đúng theo, không phải sửa chỗ nào khác.
3. **`vi_sao` phải là tiêu chí máy móc**, không phải cảm nhận. Đọc nó lên phải trả lời được "vì sao mức này" mà không cần đoán.
4. Nếu cách phát hiện dựa vào regex mong manh, khai `do_tin_cay: 'thap'` — nó sẽ bị chặn trần ở 🟡.
5. Chọn `lop` theo 7 tiêu chí trong `VAI-TRO.md`. Khi phân vân: chọn `C`.

## Quy ước ID

`NHÓM-CHỦĐỀ-CHITIẾT`, ASCII, **bất biến vĩnh viễn** — `policy.json` trỏ vào ID. Nếu ý nghĩa một check thay đổi, tạo ID mới thay vì sửa nghĩa ID cũ, nếu không mọi quy tắc Coach Thắng đã duyệt sẽ âm thầm áp sai chỗ.

## Kiểm chính bộ audit

Khi sửa một check, phải thử **cả hai chiều**: dựng lại mã lỗi cũ để chắc check còn kêu, rồi chạy trên mã đã sửa để chắc check im. Một check không phân biệt được hai ca đó thì vô dụng — và một 🔴 giả còn phá niềm tin nhanh hơn một lỗi bị bỏ sót.
