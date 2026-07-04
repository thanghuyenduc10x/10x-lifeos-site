# Website 10X Life OS — hướng dẫn cho mọi phiên Claude

Repo này là **website đang chạy thật** tại https://10x-lifeos.com.

## ⚠️ Điều quan trọng nhất
**`git push origin main` = lên site thật NGAY LẬP TỨC** (Hostinger tự deploy trong ~15–60 giây, LiteSpeed cache có thể trễ thêm ~15s). Không có môi trường thử. Sau mỗi lần push, kiểm tra live bằng `curl` (kèm `?cb=<timestamp>` để né cache).

## 6 luật bất biến
1. **KHÔNG commit file cài đặt** (`*.dmg` `*.exe` `*.zip` — đã chặn trong .gitignore + CI). File cài app phát hành qua **GitHub Releases** (repo `voiceflow`, `Cheploi-v2`, `fc-fastcapture`) kèm `SHA256SUMS.txt`, link dạng `releases/latest/download/<file>`.
2. **KHÔNG tạo khối `:root{}` hay token màu/font mới** trong trang. Nguồn token duy nhất: **`/theme.css`** (kèm `/theme.js`; brand.css là tiền thân — không dùng cho trang mới). theme.css có sẵn ALIAS tên cũ (--navy-*/--n950/--fh/--container…) nên trang cũ link vào là chạy; khi migrate 1 trang: link theme.css?v=N TRƯỚC CSS riêng → xoá :root của trang → xoá các rule trùng theme → đổi font URL về URL CHUẨN ghi ở đầu theme.css → screenshot so trước/sau. Đã migrate: blog/ (4 trang). Nguồn sự thật thiết kế: `~/10X-Brain/brand/brand-identity-10xlifeos-v2.html`.
3. **Component dùng chung**: nav = `header.js`, chân trang = `footer.js`, icon = `icons.js`. Sửa 1 file → mọi trang đổi theo; sau khi sửa phải kiểm tra ít nhất trang chủ + 1 trang blog + 1 trang app.
4. **`.htaccess` là cửa an toàn** (security headers, redirect, chặn `_mau/`). Sửa xong bắt buộc `curl -sI https://10x-lifeos.com/` xác nhận site còn sống + header còn đủ.
5. **`/v2/` = demo reskin (noindex), `_mau/` = template nội bộ (chặn public)** — không coi là trang thật, không link tới từ trang thật.
6. **Repo có thể có 2 phiên Claude song song**: luôn `git fetch origin` + merge trước khi push; việc lớn làm trên nhánh riêng rồi merge.

## Nguồn kiến thức (bắt buộc đọc khi làm nội dung)
- Giọng văn Coach Thắng: `~/10X-Brain/about-me/` (voice profile) — **luôn load trước khi viết nội dung**.
- Playbook nội dung + kiến trúc nền tảng: `~/10X-Brain/standards/`.
- Audit + roadmap hiện hành (07/2026): memory `platform-audit-2026-07` — đang thi hành GĐ0→GĐ4.

## Cấu trúc
`index.html` (trang chủ, song ngữ VI/EN qua `.lang` + `data-lang`) · `blog/` · `chep-loi/` `voiceflow/` `fc-fastcapture/` (landing app) · `vibe-code-os/` (cẩm nang) · `coach-thang/` (about) · `assets/` (ảnh + emblems) · `sitemap.xml` (cập nhật khi thêm/bớt trang).
