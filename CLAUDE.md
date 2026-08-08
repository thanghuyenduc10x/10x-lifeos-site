# Website 10X Life OS — hướng dẫn cho mọi phiên Claude

Repo này là **website đang chạy thật** tại https://10x-lifeos.com.

## ⚠️ Điều quan trọng nhất
**`git push origin main` = lên site thật NGAY LẬP TỨC** (Hostinger tự deploy trong ~15–60 giây, LiteSpeed cache có thể trễ thêm ~15s). Không có môi trường thử. Sau mỗi lần push, kiểm tra live bằng `curl` (kèm `?cb=<timestamp>` để né cache).

**Trước khi làm gì: chạy `node _audit/chay.mjs`.** Mất 2 giây, cho biết ngay site đang có vấn đề gì. **Sau khi sửa: chạy lại, và không được có mục 🟢 nào tụt hạng.** Đây là lưới an toàn thay cho việc nhớ bằng đầu.

## 7 luật bất biến
1. **KHÔNG commit file cài đặt** (`*.dmg` `*.exe` `*.zip` — đã chặn trong .gitignore + CI). File cài app phát hành qua **GitHub Releases** (repo `voiceflow`, `Cheploi-v2`, `fc-fastcapture`) kèm bảng SHA256, link dạng `releases/latest/download/<file>`. → gác bởi `SEC-BINARY-BLOCKED`, `LINK-RELEASE-PINNED`, `ARCH-TEMPLATE-DRIFT`.
2. **KHÔNG tạo khối `:root{}` hay token màu/font mới** trong trang. Nguồn token duy nhất: **`/theme.css`** (kèm `/theme.js`; brand.css là tiền thân — không dùng cho trang mới). theme.css có sẵn ALIAS tên cũ (--navy-*/--n950/--fh/--container…) nên trang cũ link vào là chạy; khi migrate 1 trang: link theme.css?v=N TRƯỚC CSS riêng → xoá :root của trang → xoá các rule trùng theme → đổi font URL về URL CHUẨN ghi ở đầu theme.css → screenshot so trước/sau. → gác bởi `ARCH-TOKEN-ROOT`, `ARCH-TOKEN-HEX`, `ARCH-FONT-URL`, `ARCH-THEME-MISSING`, `ARCH-LEGACY-CSS`.
3. **Component dùng chung**: nav = `header.js`, chân trang = `footer.js`, icon = `icons.js`. Sửa 1 file → mọi trang đổi theo; sau khi sửa phải kiểm tra ít nhất trang chủ + 1 trang blog + 1 trang app. → gác bởi `ARCH-COMPONENT-MISSING`, `ARCH-COMPONENT-ORPHAN`.
4. **`.htaccess` là cửa an toàn** (security headers, redirect, chặn `_mau/` và `_audit/`). Sửa xong bắt buộc `curl -sI https://10x-lifeos.com/` xác nhận site còn sống + header còn đủ. **Claude KHÔNG BAO GIỜ được tự sửa file này** — luôn qua PR. → gác bởi `SEC-HEADER-MISSING`, `SEC-CSP-*`, `SEC-MAU-EXPOSED`, `SEC-AUDIT-EXPOSED`, `TRANG-LIVE-HEADER`.
5. **`_mau/` = template nội bộ (chặn public)** — không coi là trang thật, không link tới từ trang thật. Template là khuôn đẻ trang mới nên sai ở đó nhân bản ra mọi trang tương lai. → gác bởi `ARCH-TEMPLATE-DRIFT`, `SEC-MAU-EXPOSED`.
6. **Repo có thể có 2 phiên Claude song song**: luôn `git fetch origin` + merge trước khi push; việc lớn làm trên nhánh riêng rồi merge.
7. **Mọi thứ chạm TIỀN hoặc DỮ LIỆU NGƯỜI DÙNG phải được kiểm tự động.** Form phải có "cửa ra" sống; không bao giờ báo thành công khi chưa gửi được thật; mọi host xuất hiện trong trang phải nằm trong CSP; trang sự kiện phải tự tắt lối chuyển tiền khi quá ngày. → gác bởi `DATA-FORM-SINK`, `DATA-FORM-FAKE-OK`, `DATA-SINK-HOST-CSP`, `DATA-PII-POLICY`, `SEC-CSP-HOST`, `ARCH-CONTENT-EXPIRED`.

## Bộ audit hằng ngày
`_audit/` — 66 kiểm tra, Node thuần không dependency. Chi tiết: `_audit/TIEU-CHUAN.md` (chuẩn tham chiếu + cách xếp 🔴🟡🟢) và `_audit/VAI-TRO.md` (ai quyết gì, Claude làm gì).

```
node _audit/chay.mjs           # báo cáo markdown, chế độ tĩnh
node _audit/chay.mjs --live    # thêm nhóm kiểm site thật (cần mở egress cho 10x-lifeos.com)
node _audit/chay.mjs --json    # dữ liệu đầy đủ
```

Quyết định của Coach Thắng được ghi vào `_audit/cau-hinh/policy.json` và có hiệu lực từ lần chạy sau. Routine "Sức khoẻ website 8h30" chạy tự động mỗi sáng.

## Nguồn kiến thức
- Giọng văn Coach Thắng: `~/10X-Brain/about-me/` (voice profile) — **luôn load trước khi viết nội dung**.
- Playbook nội dung + kiến trúc nền tảng: `~/10X-Brain/standards/`.
- Nguồn sự thật thiết kế: `~/10X-Brain/brand/brand-identity-10xlifeos-v2.html`.

> ⚠️ **Ba đường dẫn trên chỉ có trên máy Coach Thắng, KHÔNG có trong phiên cloud** (claude.ai/code, Routine). Phiên cloud không kiểm chứng được giọng văn và nhận diện thương hiệu — nên **phiên cloud không tự viết nội dung mới**, chỉ sửa thứ máy móc. Muốn Claude cloud viết được nội dung thì phải chép phần cần thiết vào repo trước.

## Cấu trúc
`index.html` (trang chủ, song ngữ VI/EN qua class `.lang` + thuộc tính `data-lang`) · `blog/` · `chep-loi/` `voiceflow/` `fc-fastcapture/` `app-10xtyping/` `app-Markpicture/` (landing app) · `vibe-code-os/` (cẩm nang) · `coach-thang/` (about) · `bootcamp/` `AI-1Day/` `Toi-uu-Dong-Chay/` `Khampha-Diemthanghoa/` `AI-Agent-Toi-uu-bo-nho-may-tinh-bang-claude-code/` (chương trình) · `chinh-sach-bao-mat/` · `assets/` (ảnh + emblems) · `_mau/` (template nội bộ) · `_audit/` (bộ kiểm tra) · `sitemap.xml` (cập nhật khi thêm/bớt trang).
