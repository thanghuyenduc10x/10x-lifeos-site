/* Nhóm TRANG — mỗi trang thật có tử tế với người đọc và với Google không.
 * Chuẩn tham chiếu: Google Search Essentials + WCAG 2.2 AA. */

import { pt, NHOM } from '../lib/ket-qua.mjs';
import { layHead, quetThe, soDong, xoaComment } from '../lib/html.mjs';

const DOMAIN = '10x-lifeos.com';

/** URL công khai suy từ vị trí file — nguồn sự thật để đối chiếu canonical. */
export function urlCuaTrang(file) {
  if (file === 'index.html') return `https://${DOMAIN}/`;
  if (file.endsWith('/index.html')) return `https://${DOMAIN}/${file.slice(0, -'index.html'.length)}`;
  return `https://${DOMAIN}/${file}`;
}

const chuanHoa = (u) => String(u).trim().replace(/\/+$/, '/').replace(/^http:/, 'https:');

/** Mọi ID check module này có thể phát ra — nguồn để đếm 'N kiểm tra đạt'. */
export const IDS = [
  'TRANG-GA-MISSING',
  'TRANG-CANON-MISSING',
  'TRANG-CANON-WRONG',
  'TRANG-DESC-MISSING',
  'TRANG-TITLE-LEN',
  'TRANG-H1',
  'TRANG-OG-IMAGE',
  'TRANG-ALT-MISSING',
  'TRANG-LANG',
  'TRANG-VIEWPORT',
  'TRANG-NOINDEX-MISSING',
];

export function chay(kho) {
  const ra = [];
  const g = { ga: [], canon: [], canonSai: [], desc: [], title: [], h1: [], og: [], alt: [], lang: [], viewport: [], noindex: [] };
  const n = kho.nguong;

  for (const file of kho.trangThat) {
    const goc = kho.html.get(file);
    const html = xoaComment(goc);
    const head = layHead(goc);
    const them = (kho, ca) => g[kho].push(ca);

    /* Đo lường */
    if (!/\bga\.js\b/.test(html) && !/googletagmanager/.test(html)) {
      them('ga', { file, dong: null, bang_chung: 'không nạp /ga.js — trang này không đo được' });
    }

    /* canonical */
    const mCanon = /<link\b[^>]*\brel\s*=\s*["']canonical["'][^>]*\bhref\s*=\s*["']([^"']+)["']/i.exec(head)
      || /<link\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*\brel\s*=\s*["']canonical["']/i.exec(head);
    if (!mCanon) {
      them('canon', { file, dong: null, bang_chung: 'thiếu <link rel="canonical">' });
    } else if (chuanHoa(mCanon[1]) !== chuanHoa(urlCuaTrang(file))) {
      them('canonSai', { file, dong: soDong(goc, goc.indexOf(mCanon[0])), bang_chung: `canonical trỏ ${mCanon[1]} nhưng trang ở ${urlCuaTrang(file)}` });
    }

    /* description */
    const mDesc = /<meta\b[^>]*\bname\s*=\s*["']description["'][^>]*\bcontent\s*=\s*["']([^"']*)["']/i.exec(head);
    if (!mDesc) them('desc', { file, dong: null, bang_chung: 'thiếu meta description' });
    else if (mDesc[1].trim().length < (n.description_ngan ?? 50)) {
      them('desc', { file, dong: null, bang_chung: `description chỉ ${mDesc[1].trim().length} ký tự` });
    }

    /* title */
    const mTitle = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(head);
    const tieuDe = mTitle ? mTitle[1].trim() : '';
    if (!tieuDe) them('title', { file, dong: null, bang_chung: 'thiếu <title>' });
    else if (tieuDe.length > (n.title_dai ?? 65)) them('title', { file, dong: null, bang_chung: `title ${tieuDe.length} ký tự — Google sẽ cắt` });
    else if (tieuDe.length < (n.title_ngan ?? 20)) them('title', { file, dong: null, bang_chung: `title chỉ ${tieuDe.length} ký tự` });

    /* h1 */
    const soH1 = (html.match(/<h1\b/gi) || []).length;
    if (soH1 !== 1) them('h1', { file, dong: null, bang_chung: `có ${soH1} thẻ <h1> (nên đúng 1)` });

    /* og:image — và ảnh đó phải tồn tại thật */
    const mOg = /<meta\b[^>]*\bproperty\s*=\s*["']og:image["'][^>]*\bcontent\s*=\s*["']([^"']+)["']/i.exec(head);
    if (!mOg) them('og', { file, dong: null, bang_chung: 'thiếu og:image — chia sẻ lên MXH không có ảnh' });
    else {
      const duong = mOg[1].replace(/^https?:\/\/[^/]+/, '');
      if (duong.startsWith('/')) {
        const co = kho.dsFile.includes(duong.slice(1));
        if (!co) them('og', { file, dong: null, bang_chung: `og:image trỏ ${duong} — file không tồn tại` });
      }
    }

    /* alt */
    const thieuAlt = quetThe(goc, ['img']).filter((t) => !('alt' in t.thuoc_tinh));
    if (thieuAlt.length) {
      them('alt', { file, dong: thieuAlt[0].dong, bang_chung: `${thieuAlt.length} thẻ <img> không có alt (WCAG 2.2 A)` });
    }

    if (!/<html\b[^>]*\blang\s*=/i.test(html)) them('lang', { file, dong: 1, bang_chung: '<html> thiếu lang' });
    if (!/<meta\b[^>]*\bname\s*=\s*["']viewport["']/i.test(head)) them('viewport', { file, dong: null, bang_chung: 'thiếu meta viewport — vỡ trên điện thoại' });

    /* trang ngoài sitemap mà không noindex → lơ lửng, Google index cái không nên index */
    if (!kho.sitemapFile.has(file)) {
      them('noindex', { file, dong: null, bang_chung: 'không có trong sitemap nhưng cũng không noindex' });
    }
  }

  const D = (id, muc, tieu_de, vi_sao, ca, cach_sua, phut, lop, do_tin_cay) => {
    if (ca.length) ra.push(pt({ id, nhom: NHOM.TRANG, muc, tieu_de, vi_sao, ca, cach_sua, phut, lop, do_tin_cay }));
  };

  D('TRANG-GA-MISSING', 'vang', 'Trang thật không có đo lường',
    'trang nằm trong tập trang thật nhưng không nạp /ga.js', g.ga,
    'Thêm <script src="/ga.js"></script> trước </body>.', 3, 'B');
  D('TRANG-CANON-MISSING', 'vang', 'Thiếu thẻ canonical',
    'thiếu canonical → Google có thể coi là nội dung trùng lặp', g.canon,
    'Thêm <link rel="canonical" href="…"> vào <head>, URL suy từ vị trí file.', 2, 'A');
  D('TRANG-CANON-WRONG', 'do', 'Canonical trỏ sai địa chỉ',
    'canonical khác URL thật của trang → Google bỏ qua trang này', g.canonSai,
    'Sửa canonical về đúng URL của trang.', 3, 'B');
  D('TRANG-DESC-MISSING', 'vang', 'Thiếu hoặc quá ngắn meta description',
    'Google tự bịa đoạn mô tả nếu không có', g.desc,
    'Viết description 120–160 ký tự, đúng giọng trang.', 5, 'C');
  D('TRANG-TITLE-LEN', 'vang', 'Độ dài title không tối ưu', 'ngoài khoảng 20–65 ký tự', g.title,
    'Viết lại title cho gọn, giữ từ khoá ở đầu.', 5, 'C');
  D('TRANG-H1', 'vang', 'Số thẻ H1 không phải 1', 'mỗi trang nên có đúng 1 H1', g.h1,
    'Gộp hoặc hạ cấp các H1 thừa xuống H2.', 5, 'C');
  D('TRANG-OG-IMAGE', 'vang', 'Vấn đề với og:image', 'thiếu, hoặc trỏ tới file không tồn tại', g.og,
    'Thêm og:image 1200×630 và kiểm file có thật.', 10, 'B');
  D('TRANG-ALT-MISSING', 'vang', 'Ảnh thiếu thuộc tính alt', 'WCAG 2.2 mức A', g.alt,
    'Thêm alt mô tả; ảnh trang trí dùng alt="".', 10, 'C');
  D('TRANG-LANG', 'vang', '<html> thiếu lang', 'trình đọc màn hình không biết đọc tiếng gì', g.lang,
    'Thêm lang="vi" vào thẻ <html>.', 1, 'A');
  D('TRANG-VIEWPORT', 'do', 'Thiếu meta viewport', 'trang vỡ trên điện thoại', g.viewport,
    'Thêm <meta name="viewport" content="width=device-width, initial-scale=1">.', 1, 'A');
  D('TRANG-NOINDEX-MISSING', 'vang', 'Trang lơ lửng: ngoài sitemap nhưng vẫn cho index',
    'không trong sitemap và không noindex → Google vẫn có thể index', g.noindex,
    'Chọn một: đưa vào sitemap, HOẶC thêm <meta name="robots" content="noindex">.', 3, 'B');

  return ra;
}
