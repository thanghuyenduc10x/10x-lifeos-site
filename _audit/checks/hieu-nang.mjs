/* Nhóm HIỆU-NĂNG — ngân sách trang và lãng phí có thể thu hồi.
 * Chuẩn tham chiếu: Core Web Vitals (LCP chịu ảnh hưởng trực tiếp bởi trọng lượng trang). */

import { pt, NHOM } from '../lib/ket-qua.mjs';
import { soDong } from '../lib/html.mjs';

const kb = (b) => Math.round(b / 1024);

/** Mọi ID check module này có thể phát ra — nguồn để đếm 'N kiểm tra đạt'. */
export const IDS = [
  'PERF-HTML-WEIGHT-DO',
  'PERF-HTML-WEIGHT',
  'PERF-INLINE-B64',
  'PERF-ASSET-ORPHAN',
  'PERF-ASSET-DUP',
  'PERF-IMG-FORMAT',
  'PERF-CACHE-STATIC',
  'PERF-VERSION-SKEW',
  'PERF-CACHE-BUST',
];

export function chay(kho) {
  const ra = [];
  const n = kho.nguong;

  /* ── Trang HTML quá nặng ── */
  const nangDo = [];
  const nangVang = [];
  for (const f of kho.trangThat) {
    const cỡ = kho.file.get(f)?.kich_thuoc ?? 0;
    if (cỡ > (n.html_kb_do ?? 500) * 1024) nangDo.push({ file: f, dong: null, bang_chung: `${kb(cỡ)}KB HTML` });
    else if (cỡ > (n.html_kb_vang ?? 150) * 1024) nangVang.push({ file: f, dong: null, bang_chung: `${kb(cỡ)}KB HTML` });
  }
  if (nangDo.length) {
    ra.push(pt({
      id: 'PERF-HTML-WEIGHT-DO', nhom: NHOM.HIEU_NANG, muc: 'do',
      tieu_de: 'Trang HTML quá nặng', vi_sao: `vượt ${n.html_kb_do ?? 500}KB — LCP hỏng trên mạng chậm`,
      ca: nangDo, cach_sua: 'Tách ảnh base64 ra file riêng, cắt CSS/JS không dùng.', phut: 45, lop: 'C',
    }));
  }
  if (nangVang.length) {
    ra.push(pt({
      id: 'PERF-HTML-WEIGHT', nhom: NHOM.HIEU_NANG, muc: 'vang',
      tieu_de: 'Trang HTML vượt ngân sách', vi_sao: `vượt ${n.html_kb_vang ?? 150}KB`,
      ca: nangVang, cach_sua: 'Xem có ảnh base64 hay CSS thừa không.', phut: 30, lop: 'C',
    }));
  }

  /* ── Ảnh base64 nhúng thẳng vào HTML: không cache riêng, không lazy-load được ── */
  const b64 = [];
  for (const f of kho.trangThat) {
    const noi = kho.html.get(f);
    let tong = 0; let dong = null;
    const re = /data:image\/[a-z+]+;base64,([A-Za-z0-9+/=]+)/g;
    let m;
    while ((m = re.exec(noi)) !== null) { tong += m[1].length; if (dong === null) dong = soDong(noi, m.index); }
    if (tong > (n.base64_kb ?? 50) * 1024) {
      b64.push({ file: f, dong, bang_chung: `${kb(tong)}KB ảnh base64 nhúng thẳng trong HTML` });
    }
  }
  if (b64.length) {
    ra.push(pt({
      id: 'PERF-INLINE-B64', nhom: NHOM.HIEU_NANG, muc: 'vang',
      tieu_de: 'Ảnh nhúng base64 làm phình HTML',
      vi_sao: 'ảnh base64 không cache riêng được, không lazy-load được, và mỗi lần sửa 1 ký tự là git phải lưu lại toàn bộ',
      ca: b64, cach_sua: 'Tách ra file .webp và trỏ bằng <img src> kèm loading="lazy".', phut: 30, lop: 'C',
    }));
  }

  /* ── Asset mồ côi: không file nào nhắc tên ── */
  const moCoi = [];
  const noiDungGop = [...kho.html.values(), ...kho.js.values(), ...kho.css.values(), kho.sitemapRaw].join('\n');
  for (const f of kho.dsFile) {
    if (!/\.(png|jpe?g|webp|svg|gif|pdf|mp4|woff2?)$/i.test(f)) continue;
    if (f.startsWith('_audit/')) continue;
    const ten = f.split('/').pop();
    if (!noiDungGop.includes(ten)) {
      moCoi.push({ file: f, dong: null, bang_chung: `${kb(kho.file.get(f)?.kich_thuoc ?? 0)}KB — không file nào nhắc tên` });
    }
  }
  if (moCoi.length) {
    const tong = moCoi.reduce((s, c) => s + (kho.file.get(c.file)?.kich_thuoc ?? 0), 0);
    ra.push(pt({
      id: 'PERF-ASSET-ORPHAN', nhom: NHOM.HIEU_NANG, muc: tong > 1024 * 1024 ? 'do' : 'vang',
      tieu_de: `Asset không ai dùng — ${kb(tong)}KB`,
      vi_sao: 'tên file không xuất hiện trong bất kỳ html/js/css/xml nào',
      ca: moCoi, do_tin_cay: 'vua',
      cach_sua: 'Xoá khỏi repo (lịch sử git vẫn giữ). Kiểm tay trước nếu file được tham chiếu động.',
      phut: 10, lop: 'B',
    }));
  }

  /* ── Asset trùng byte ── */
  const theoMd5 = new Map();
  for (const [f, meta] of kho.file) {
    if (!/\.(png|jpe?g|webp|svg|gif|pdf)$/i.test(f)) continue;
    if (!theoMd5.has(meta.md5)) theoMd5.set(meta.md5, []);
    theoMd5.get(meta.md5).push(f);
  }
  const trung = [];
  let tongTrung = 0;
  for (const [, ds] of theoMd5) {
    if (ds.length < 2) continue;
    const cỡ = kho.file.get(ds[0]).kich_thuoc;
    tongTrung += cỡ * (ds.length - 1);
    trung.push({ file: ds[0], dong: null, bang_chung: `${kb(cỡ)}KB × ${ds.length} bản trùng byte: ${ds.join(', ')}`.slice(0, 200) });
  }
  if (trung.length) {
    ra.push(pt({
      id: 'PERF-ASSET-DUP', nhom: NHOM.HIEU_NANG, muc: 'vang',
      tieu_de: `Ảnh trùng nhau — lãng phí ${kb(tongTrung)}KB`, vi_sao: 'nhiều file có md5 giống hệt nhau',
      ca: trung, cach_sua: 'Giữ 1 bản, các trang còn lại trỏ về đường dẫn chung.', phut: 15, lop: 'B',
    }));
  }

  /* ── Đã có .webp nhưng HTML vẫn trỏ bản nặng ── */
  const chuaWebp = [];
  for (const [f, meta] of kho.file) {
    if (!/\.(png|jpe?g)$/i.test(f)) continue;
    if (meta.kich_thuoc < (n.asset_kb ?? 200) * 1024) continue;
    const webp = f.replace(/\.(png|jpe?g)$/i, '.webp');
    if (!kho.dsFile.includes(webp)) continue;
    const ten = f.split('/').pop();
    if (noiDungGop.includes(ten)) {
      const cỡWebp = kho.file.get(webp)?.kich_thuoc ?? 0;
      chuaWebp.push({ file: f, dong: null, bang_chung: `${kb(meta.kich_thuoc)}KB trong khi đã có ${webp} chỉ ${kb(cỡWebp)}KB` });
    }
  }
  if (chuaWebp.length) {
    ra.push(pt({
      id: 'PERF-IMG-FORMAT', nhom: NHOM.HIEU_NANG, muc: 'vang',
      tieu_de: 'Có sẵn bản .webp nhẹ hơn nhưng trang vẫn dùng bản nặng',
      vi_sao: 'file .webp cùng tên đã tồn tại trong repo', ca: chuaWebp,
      cach_sua: 'Đổi src sang .webp (giữ .png làm fallback nếu cần).', phut: 10, lop: 'B',
    }));
  }

  /* ── .htaccess: nén và cache tài nguyên tĩnh ── */
  const thieu = [];
  if (!/(DEFLATE|mod_brotli|BrotliCompression)/i.test(kho.htaccess)) {
    thieu.push({ file: '.htaccess', dong: null, bang_chung: 'không có cấu hình nén (gzip/brotli) — phó mặc mặc định LiteSpeed' });
  }
  if (!/(ExpiresByType|ExpiresActive)/i.test(kho.htaccess) && !/FilesMatch[^>]*(css|js|png)/i.test(kho.htaccess)) {
    thieu.push({ file: '.htaccess', dong: null, bang_chung: 'CSS/JS/ảnh không có chính sách cache — chỉ .html có no-cache' });
  }
  if (thieu.length) {
    ra.push(pt({
      id: 'PERF-CACHE-STATIC', nhom: NHOM.HIEU_NANG, muc: 'vang',
      tieu_de: 'Thiếu nén và cache cho tài nguyên tĩnh', vi_sao: 'không có directive nén/hết-hạn trong .htaccess',
      ca: thieu, cach_sua: 'Thêm mod_deflate + ExpiresByType cho css/js/ảnh.', phut: 15, lop: 'C',
    }));
  }

  /* ── Cache-bust: theme.css đổi mà ?v= không tăng ──
   * Đây là lỗi im lặng nguy hiểm: sửa theme mà người dùng cũ không bao giờ thấy. */
  for (const chung of ['theme.css', 'theme.js', 'header.js', 'footer.js', 'icons.js', 'ga.js']) {
    if (!kho.dsFile.includes(chung)) continue;
    const ver = new Set();
    let coThamChieu = false;
    for (const f of kho.trangThat) {
      const noi = kho.html.get(f);
      const re = new RegExp(`/${chung.replace('.', '\\.')}(?:\\?v=([\\w.]+))?`, 'g');
      let m;
      while ((m = re.exec(noi)) !== null) { coThamChieu = true; ver.add(m[1] ?? '(không có)'); }
    }
    if (!coThamChieu) continue;
    if (ver.size > 1) {
      ra.push(pt({
        id: 'PERF-VERSION-SKEW', nhom: NHOM.HIEU_NANG, muc: 'vang',
        tieu_de: `${chung} được nạp với nhiều số phiên bản khác nhau`,
        vi_sao: `tìm thấy các giá trị ?v= khác nhau: ${[...ver].join(', ')}`,
        ca: [{ file: chung, dong: null, bang_chung: `phiên bản đang dùng: ${[...ver].join(', ')}` }],
        cach_sua: 'Thống nhất một giá trị ?v= trên mọi trang.', phut: 5, lop: 'A',
      }));
    }
    const coCacheTinh = /(ExpiresByType|FilesMatch[^>]*(?:css|js))/i.test(kho.htaccess);
    if (!coCacheTinh && ver.size === 1 && [...ver][0] === '1' && kho.ngayCommit.get(chung)) {
      // v=1 chưa từng tăng + không có chính sách cache cho css/js → sửa theme có thể không tới người dùng
      ra.push(pt({
        id: 'PERF-CACHE-BUST', nhom: NHOM.HIEU_NANG, muc: 'vang',
        tieu_de: `${chung} vẫn ở ?v=1 và không có chính sách cache cho CSS/JS`,
        vi_sao: 'số phiên bản chưa từng tăng, mà .htaccess chỉ đặt no-cache cho .html',
        ca: [{ file: chung, dong: null, bang_chung: `sửa lần cuối ${kho.ngayCommit.get(chung)} nhưng ?v= vẫn là 1` }],
        cach_sua: 'Tăng ?v= mỗi lần sửa file dùng chung, hoặc đặt Cache-Control cho css/js trong .htaccess.',
        phut: 5, lop: 'B',
      }));
    }
  }

  return ra;
}
