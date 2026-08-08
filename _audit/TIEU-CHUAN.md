# Bộ tiêu chuẩn — 10x-lifeos.com

Đây là thứ Coach Thắng và Claude cùng làm việc trên đó. Nguyên tắc: **không tự bịa tiêu chuẩn.**
Mỗi kiểm tra trong `_audit/` ánh xạ tới một chuẩn có thật bên ngoài, hoặc một luật nội bộ đã thành văn trong `CLAUDE.md`.

---

## 1. Chuẩn tham chiếu

| Lĩnh vực | Chuẩn | Kiểm tra tương ứng |
|---|---|---|
| SEO / index | **Google Search Essentials** — title, description, canonical, sitemap, noindex | `TRANG-CANON-*`, `TRANG-DESC-MISSING`, `TRANG-TITLE-LEN`, `TRANG-H1`, `ARCH-SITEMAP-*`, `TRANG-NOINDEX-MISSING` |
| Hiệu năng | **Core Web Vitals** — LCP chịu ảnh hưởng trực tiếp bởi trọng lượng trang. Ngân sách nội bộ: HTML ≤ 150KB | `PERF-HTML-WEIGHT*`, `PERF-INLINE-B64`, `PERF-IMG-FORMAT`, `PERF-CACHE-*`, `PERF-LIVE-TTFB` |
| Header bảo mật | **OWASP Secure Headers Project** — HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, CSP | `SEC-HEADER-MISSING`, `SEC-HTACCESS-GAP`, `TRANG-LIVE-HEADER` |
| CSP | **CSP Level 3** (W3C/MDN) — kể cả chuỗi fallback: `img-src`… rơi về `default-src`, còn `frame-ancestors`/`base-uri`/`form-action` thì **không** | `SEC-CSP-HOST`, `SEC-CSP-STALE`, `SEC-CSP-WEAK`, `DATA-SINK-HOST-CSP` |
| Tiếp cận | **WCAG 2.2 mức AA** — `alt`, `lang`, viewport, tương phản | `TRANG-ALT-MISSING`, `TRANG-LANG`, `TRANG-VIEWPORT` |
| Dữ liệu cá nhân | **Nghị định 13/2023/NĐ-CP** (+ GDPR nếu có khách EU) — thông báo và có căn cứ trước khi xử lý | `DATA-PII-POLICY`, `DATA-GA-CONSENT` |
| Toàn vẹn dữ liệu | Không có chuẩn ngoài — luật nội bộ: **dữ liệu người dùng gửi đi phải tới nơi, và không bao giờ báo thành công khi chưa gửi được** | `DATA-FORM-SINK`, `DATA-FORM-FAKE-OK` |
| Cách xếp hạng | **RAG status** (đỏ/vàng/xanh, quản trị dự án) + **error budget** của SRE — dùng để quyết khi nào ngừng làm mới, quay về sửa | toàn bộ |
| Nội bộ | **7 luật bất biến** trong `CLAUDE.md` | mỗi luật đều có ≥1 check ID ghi ngay cạnh nó |

---

## 2. Rubric màu — tính bằng công thức, không cảm tính

Mỗi check **tự khai mức trong code** kèm tiêu chí máy móc. Cùng dữ liệu luôn ra cùng màu, không phụ thuộc hôm đó Claude nghĩ gì.

### 🔴 ĐỎ — sửa trong ngày
Một phát hiện là đỏ khi thoả **ít nhất một** điều:
- **Chặn tiền**: người dùng không hoàn tất được việc trả tiền / tải app (vd host bị CSP chặn trên trang có trong sitemap).
- **Mất dữ liệu**: form thu thông tin mà không có cửa ra sống.
- **Nói dối người dùng**: trang báo thành công trong khi việc không thành công.
- **Site chết**: URL trong sitemap không trả 200.
- **Phơi bày bảo mật**: khoá bí mật trong repo, thư mục nội bộ không được chặn, chứng chỉ TLS sắp hết hạn.
- **Rủi ro pháp lý**: thu dữ liệu cá nhân mà không có chính sách bảo mật.
- **Mất cổng an toàn**: `CLAUDE.md` nói "đã có cổng chặn" mà cổng không còn — vì phiên Claude sau sẽ tin nhầm.

### 🟡 VÀNG — gom vào 5 phút thứ Hai
Vẫn chạy được nhưng đang trôi: nợ kiến trúc, SEO hụt, lãng phí dung lượng, thiếu cổng kiểm, tài liệu lệch thực tế.

### 🟢 XANH — đạt
Không liệt kê trong báo cáo, chỉ đếm. Danh sách những thứ đang ổn không giúp ai quyết định gì.

### Ba van chống báo động giả
1. **Trần độ tin cậy.** Mỗi check khai `do_tin_cay`. Check `thap` **không bao giờ được lên đỏ** — một regex đoán sai không được phép làm Coach Thắng hoảng lúc 8h30.
2. **Trong sitemap hay không.** Cùng một lỗi: 🔴 nếu ở trang có trong sitemap (người lạ vào được), 🟡 nếu ngoài sitemap.
3. **Loại trừ có chủ đích.** Namespace `xmlns`, `@context` của JSON-LD, `<a href>`, thẻ meta, comment — đều bị loại khỏi kho tài nguyên trước khi đối chiếu CSP. Không có bước này thì 61 lần `xmlns` thành 61 báo động giả.

---

## 3. Ngân sách 5 phút

Báo cáo bị **code cưỡng chế** giới hạn, không phải khuyến nghị (`_audit/lib/render-md.mjs`):

| Khối | Hạn cứng |
|---|---|
| Toàn bộ | ≤ 110 dòng / 6.000 ký tự |
| 🔴 | tối đa 5 mục × 3 dòng |
| 🟡 | tối đa 6 mục × 1 dòng |
| 🟢 | 0 mục — chỉ 1 dòng đếm |
| Nợ cũ > 7 ngày | 1 dòng tổng |
| Việc hôm nay | **đúng 1** |

Mở đầu **luôn là delta so với hôm qua**, không phải danh sách. Nếu không có đỏ và không có gì đổi, báo cáo tự rút còn 6 dòng.

Lý do có phần này: bộ audit hằng ngày chết vì **mệt-vì-cảnh-báo**, không phải vì thiếu check. Repo này có những ngày 0 commit; nếu sáng nào cũng in 20 mục y hệt thì tới ngày thứ ba là không còn ai đọc.

---

## 4. Thứ tự ưu tiên khi nhiều thứ cùng đỏ

`DỮ-LIỆU` → `BẢO-MẬT` → `TRANG` → `LIÊN-KẾT` → `KIẾN-TRÚC` → `HIỆU-NĂNG`

Mất lead và chặn thanh toán đứng trên mọi thứ khác: một trang bán hàng hỏng tốn tiền thật **hôm nay**, còn nợ kiến trúc thì không. Trong cùng nhóm ưu tiên, việc nhanh nhất lên trước — để "5 phút" là làm xong thật.

Coach Thắng đổi được thứ tự này bằng quy tắc `nang_muc` trong `policy.json`.

---

## 5. Cái bộ audit này KHÔNG làm được

Ghi ra đây để không ai nhầm tưởng nó bao hết:

- **Backlink thật** (ai đang trỏ về mình) — cần Google Search Console hoặc Ahrefs. Bộ audit chỉ đo được **link mình trỏ đi** và **đường vào của từng trang**. Không giả vờ đo cái không đo được.
- **Nội dung hay hay dở, giọng văn đúng hay sai** — cần voice profile ở `~/10X-Brain/`, không có trong phiên cloud.
- **Trang có đẹp không, có thuyết phục không** — cần mắt người.
- **Chuyển đổi thực tế** — cần dữ liệu GA4, không có trong repo.
- **Lỗi chỉ lộ khi chạy thật** (CSP có thật sự chặn không, LiteSpeed có nạp `mod_headers` không) — cần chế độ `--live`, mà chế độ đó cần mở egress cho `10x-lifeos.com`. Không mở thì 5 kiểm tra này báo **"không kiểm được"**, chứ không báo xanh giả.

Nguyên tắc bao trùm: **thà nói "không kiểm được" còn hơn báo xanh khi chưa kiểm.**
