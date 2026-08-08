/* Nhóm KIẾN-TRÚC — nơi 6 luật bất biến trong CLAUDE.md có cổng kiểm thật sự.
 * Gồm cả ARCH-DOC-CLAIM: giữ chính CLAUDE.md khỏi biến thành cái bẫy cho phiên sau. */

import { pt, NHOM, homNay, lechNgay } from '../lib/ket-qua.mjs';
import { quetKhoi, quetThe, soDong, xoaComment } from '../lib/html.mjs';
import { urlCuaTrang } from './trang.mjs';

/** URL font chuẩn tự khai trong theme.css — không hardcode ở đây. */
function fontChuan(themeCss) {
  const m = /FONTS URL CHUẨN[^\n]*\n\s*(https:\/\/fonts\.googleapis\.com\/[^\s]+)/i.exec(themeCss);
  return m ? m[1].trim() : null;
}

const hexTrong = (css) => new Set((css.match(/#[0-9a-fA-F]{3,8}\b/g) || []).map((h) => h.toLowerCase()));

/** Mọi ID check module này có thể phát ra — nguồn để đếm 'N kiểm tra đạt'. */
export const IDS = [
  'ARCH-TOKEN-ROOT',
  'ARCH-TOKEN-HEX',
  'ARCH-FONT-URL',
  'ARCH-THEME-MISSING',
  'ARCH-LEGACY-CSS',
  'ARCH-COMPONENT-MISSING',
  'ARCH-COMPONENT-ORPHAN',
  'ARCH-CONTENT-EXPIRED',
  'ARCH-SITEMAP-MISSING',
  'ARCH-SITEMAP-DEAD',
  'ARCH-SITEMAP-LASTMOD',
  'ARCH-TEMPLATE-DRIFT',
  'ARCH-CI-COVERAGE',
  'ARCH-CI-TOOTHLESS',
  'ARCH-DOC-CLAIM',
  'ARCH-DOC-GATE-LOST',
];

export function chay(kho) {
  const ra = [];
  const n = kho.nguong;
  const themeCss = kho.css.get('theme.css') || '';
  const urlFont = fontChuan(themeCss);
  const hexTheme = hexTrong(themeCss + (kho.css.get('brand.css') || ''));

  const g = { root: [], hex: [], font: [], theme: [], legacy: [], navThieu: [], mountThua: [], hetHan: [] };

  for (const file of kho.trangThat) {
    const goc = kho.html.get(file);
    const html = xoaComment(goc);
    const styles = quetKhoi(goc, 'style');

    /* Luật 2 — trang tự khai :root */
    for (const s of styles) {
      const m = /:root\s*\{/.exec(s.noi_dung);
      if (m) {
        g.root.push({ file, dong: soDong(goc, s.offset_noi_dung + m.index), bang_chung: 'trang tự định nghĩa :root — vi phạm luật 2' });
        break;
      }
    }

    /* Luật 2 biến thể lách: dựng bảng màu riêng mà không khai :root */
    const hexTrang = new Set();
    for (const s of styles) for (const h of hexTrong(s.noi_dung)) if (!hexTheme.has(h)) hexTrang.add(h);
    if (hexTrang.size >= (n.hex_la_toi_da ?? 8)) {
      g.hex.push({ file, dong: null, bang_chung: `${hexTrang.size} mã màu không có trong theme.css` });
    }

    /* Luật 2 — URL font */
    if (urlFont) {
      const dsFontUrl = [...html.matchAll(/https:\/\/fonts\.googleapis\.com\/css2\?[^"'\s]+/g)].map((m) => m[0]);
      for (const u of dsFontUrl) {
        if (u.replace(/&amp;/g, '&') !== urlFont) {
          g.font.push({ file, dong: soDong(goc, goc.indexOf(u)), bang_chung: 'URL font khác URL CHUẨN khai trong theme.css' });
          break;
        }
      }
    }

    if (!/theme\.css/.test(html)) g.theme.push({ file, dong: null, bang_chung: 'không nạp /theme.css' });
    if (/\/brand\.css/.test(html)) g.legacy.push({ file, dong: null, bang_chung: 'còn nạp brand.css (tiền thân của theme.css)' });

    /* Luật 3 — component: trang có điều hướng dùng được không */
    if (!(kho.boLoc.trang_khong_can_nav || []).includes(file)) {
      const napHeader = /header\.js/.test(html);
      const coMount = /id\s*=\s*["'](?:site-header|site-langtog)["']/.test(html);
      const coNavRieng = /<nav\b/i.test(html);
      if (!coNavRieng && !(napHeader && coMount)) {
        g.navThieu.push({ file, dong: null, bang_chung: 'không có nav riêng, cũng không có header.js + điểm mount' });
      }
      if (napHeader && !coMount && !coNavRieng) {
        g.mountThua.push({ file, dong: null, bang_chung: 'nạp header.js nhưng không có #site-header/#site-langtog — tải file vô ích' });
      }
    }

    /* Nội dung hết hạn — bắt trang bán vé cho sự kiện đã qua.
     * Nguồn ngày ưu tiên JSON-LD (máy đọc chắc chắn), sau đó mới tới ngày trong tiêu đề. */
    let ngayKetThuc = null;
    for (const k of quetKhoi(goc, 'script')) {
      if (!/ld\+json/i.test(k.thuoc_tinh.type || '')) continue;
      const m = /"(?:endDate|validThrough)"\s*:\s*"([0-9]{4}-[0-9]{2}-[0-9]{2})/.exec(k.noi_dung);
      if (m) { ngayKetThuc = m[1]; break; }
    }
    if (ngayKetThuc && kho.sitemapFile.has(file)) {
      const quaHan = lechNgay(homNay(), ngayKetThuc);
      if (quaHan > 0) {
        g.hetHan.push({ file, dong: null, bang_chung: `sự kiện kết thúc ${ngayKetThuc} — đã qua ${quaHan} ngày mà trang vẫn trong sitemap`, quaHan });
      }
    }
  }

  const D = (id, muc, tieu_de, vi_sao, ca, cach_sua, phut, lop, do_tin_cay) => {
    if (ca.length) ra.push(pt({ id, nhom: NHOM.KIEN_TRUC, muc, tieu_de, vi_sao, ca, cach_sua, phut, lop, do_tin_cay }));
  };

  D('ARCH-TOKEN-ROOT', 'vang', 'Trang tự định nghĩa token màu/font (vi phạm luật 2)',
    'luật 2: nguồn token duy nhất là /theme.css', g.root,
    'Xoá khối :root của trang, dùng token từ theme.css. Nếu trang cần hệ màu riêng thì phải là quyết định có chủ ý, ghi vào policy.', 30, 'C');
  D('ARCH-TOKEN-HEX', 'vang', 'Trang dựng bảng màu riêng ngoài theme.css',
    `≥${n.hex_la_toi_da ?? 8} mã hex không có trong theme.css`, g.hex,
    'Đưa màu về token của theme.css, hoặc bổ sung token mới vào theme.css nếu thật sự cần.', 30, 'C', 'vua');
  D('ARCH-FONT-URL', 'vang', 'URL font khác URL chuẩn',
    'khác chuỗi FONTS URL CHUẨN tự khai ở đầu theme.css', g.font,
    'Dán y hệt URL chuẩn ghi ở đầu theme.css.', 5, 'B');
  D('ARCH-THEME-MISSING', 'vang', 'Trang thật không nạp theme.css', 'luật 2', g.theme,
    'Thêm <link rel="stylesheet" href="/theme.css?v=N"> TRƯỚC CSS riêng của trang.', 15, 'C');
  D('ARCH-LEGACY-CSS', 'vang', 'Còn dùng brand.css', 'CLAUDE.md: brand.css là tiền thân, không dùng cho trang mới', g.legacy,
    'Chuyển sang theme.css.', 20, 'C');
  D('ARCH-COMPONENT-MISSING', 'vang', 'Trang thật không có điều hướng',
    'không nav riêng và cũng không có header.js kèm điểm mount', g.navThieu,
    'Thêm <div id="site-header"></div> + <script src="/header.js"></script>.', 10, 'B');
  D('ARCH-COMPONENT-ORPHAN', 'vang', 'Nạp header.js nhưng không có chỗ mount',
    'file được tải về nhưng không render gì', g.mountThua,
    'Thêm điểm mount, hoặc gỡ thẻ script thừa.', 5, 'A');

  if (g.hetHan.length) {
    const nangDo = g.hetHan.some((c) => c.quaHan > (n.noi_dung_het_han_ngay_len_do ?? 14));
    ra.push(pt({
      id: 'ARCH-CONTENT-EXPIRED', nhom: NHOM.KIEN_TRUC, muc: nangDo ? 'do' : 'vang',
      tieu_de: 'Trang quảng bá sự kiện đã kết thúc vẫn đang mở cho Google',
      vi_sao: `JSON-LD endDate đã qua và trang vẫn nằm trong sitemap${nangDo ? ` (quá ${n.noi_dung_het_han_ngay_len_do ?? 14} ngày → lên đỏ)` : ''}`,
      ca: g.hetHan.map(({ quaHan, ...c }) => c),
      cach_sua: 'Cập nhật ngày đợt mới, HOẶC chuyển trang sang chế độ "đã diễn ra" (tắt form + ẩn QR cọc), HOẶC noindex + gỡ khỏi sitemap.',
      phut: 20, lop: 'C',
    }));
  }

  /* ── Sitemap ↔ thực tế ── */
  const thieuSitemap = [...kho.trangThat].filter((f) => !kho.sitemapFile.has(f))
    .map((f) => ({ file: f, dong: null, bang_chung: `trang thật nhưng không có trong sitemap (${urlCuaTrang(f)})` }));
  if (thieuSitemap.length) {
    ra.push(pt({
      id: 'ARCH-SITEMAP-MISSING', nhom: NHOM.KIEN_TRUC, muc: 'vang',
      tieu_de: 'Trang thật vắng mặt trong sitemap', vi_sao: 'Google không được báo là trang này tồn tại',
      ca: thieuSitemap, cach_sua: 'Thêm <url><loc>…</loc><lastmod>…</lastmod></url> vào sitemap.xml, hoặc noindex nếu cố ý.', phut: 3, lop: 'B',
    }));
  }
  const sitemapChet = kho.sitemap.filter((u) => !u.file)
    .map((u) => ({ file: 'sitemap.xml', dong: null, bang_chung: `${u.loc} không resolve ra file nào` }));
  if (sitemapChet.length) {
    ra.push(pt({
      id: 'ARCH-SITEMAP-DEAD', nhom: NHOM.KIEN_TRUC, muc: 'do',
      tieu_de: 'Sitemap khai URL không tồn tại', vi_sao: 'Google crawl vào 404 → mất uy tín trang',
      ca: sitemapChet, cach_sua: 'Gỡ URL khỏi sitemap.xml hoặc tạo lại trang.', phut: 5, lop: 'B',
    }));
  }
  const lastmodLech = [];
  for (const u of kho.sitemap) {
    if (!u.file || !u.lastmod) continue;
    const ngayThat = kho.ngayCommit.get(u.file);
    if (!ngayThat) continue;
    const lech = lechNgay(ngayThat, u.lastmod);
    if (lech > (n.lastmod_lech_ngay ?? 2)) {
      lastmodLech.push({ file: 'sitemap.xml', dong: null, bang_chung: `${u.loc}: lastmod ${u.lastmod} nhưng sửa thật ${ngayThat} (lệch ${lech} ngày)` });
    }
  }
  if (lastmodLech.length) {
    ra.push(pt({
      id: 'ARCH-SITEMAP-LASTMOD', nhom: NHOM.KIEN_TRUC, muc: 'vang',
      tieu_de: 'lastmod trong sitemap cũ hơn thực tế', vi_sao: 'Google không biết trang đã cập nhật nên chậm crawl lại',
      ca: lastmodLech, cach_sua: 'Cập nhật lastmod theo ngày commit cuối của từng file.', phut: 3, lop: 'A',
    }));
  }

  /* ── Template drift: _mau/ đẻ trang mới nên lỗi ở đây nhân bản ra tương lai ── */
  const drift = [];
  for (const f of kho.html.keys()) {
    if (!f.startsWith('_mau/')) continue;
    const html = xoaComment(kho.html.get(f));
    if (/\/brand\.css/.test(html)) drift.push({ file: f, dong: null, bang_chung: 'template dạy dùng brand.css — trái luật 2' });
    // Chỉ bắt link tải CỤC BỘ. URL GitHub Releases cũng chứa "releases/latest/download/…dmg"
    // nên nếu chỉ khớp ".dmg" thì cách làm ĐÚNG cũng bị báo là sai.
    for (const m of html.matchAll(/href\s*=\s*["']([^"']*\.(?:dmg|exe|zip|msi|pkg))["']/gi)) {
      const u = m[1];
      if (/^https:\/\/github\.com\/[^/]+\/[^/]+\/releases\/latest\/download\//i.test(u)) continue;
      drift.push({ file: f, dong: soDong(kho.html.get(f), m.index), bang_chung: `template dạy trỏ file cài đặt cục bộ (${u.slice(0, 60)}) — trái luật 1` });
    }
    if (urlFont) {
      const u = /https:\/\/fonts\.googleapis\.com\/css2\?[^"'\s]+/.exec(html);
      if (u && u[0].replace(/&amp;/g, '&') !== urlFont) drift.push({ file: f, dong: null, bang_chung: 'template dùng URL font sai' });
    }
  }
  if (drift.length) {
    ra.push(pt({
      id: 'ARCH-TEMPLATE-DRIFT', nhom: NHOM.KIEN_TRUC, muc: 'do',
      tieu_de: 'Template trong _mau/ đang dạy sai luật',
      vi_sao: 'template là khuôn đẻ trang mới — sai ở đây thì mọi trang tương lai đều sai',
      ca: drift, cach_sua: 'Sửa _mau/ khớp luật hiện hành trước khi tạo trang mới tiếp theo.', phut: 20, lop: 'C',
    }));
  }

  /* ── CI ── */
  if (kho.ciYml) {
    const thuMucTrang = new Set([...kho.trangThat].map((f) => (f.includes('/') ? f.slice(0, f.indexOf('/')) : '.')));
    const ngoaiCi = [...thuMucTrang].filter((d) => d !== '.' && !kho.ciYml.includes(`${d}/`))
      .map((d) => ({ file: '.github/workflows/ci.yml', dong: null, bang_chung: `thư mục ${d}/ không nằm trong danh sách validate HTML` }));
    const excludeChet = [...kho.ciYml.matchAll(/--exclude-path\s+(\S+)/g)]
      .filter((m) => !kho.dsFile.some((f) => f.startsWith(`${m[1]}/`)))
      .map((m) => ({ file: '.github/workflows/ci.yml', dong: null, bang_chung: `--exclude-path ${m[1]} trỏ thư mục không còn tồn tại` }));
    if (ngoaiCi.length || excludeChet.length) {
      ra.push(pt({
        id: 'ARCH-CI-COVERAGE', nhom: NHOM.KIEN_TRUC, muc: 'vang',
        tieu_de: 'CI bỏ sót trang mới', vi_sao: 'danh sách glob hardcode không theo kịp khi thêm thư mục trang',
        ca: [...ngoaiCi, ...excludeChet],
        cach_sua: 'Đổi sang glob "**/*.html" (trừ _mau, _audit) để không phải sửa tay mỗi lần thêm trang.', phut: 10, lop: 'B',
      }));
    }
    const voHieu = [];
    if (/continue-on-error:\s*true/.test(kho.ciYml)) voHieu.push({ file: '.github/workflows/ci.yml', dong: null, bang_chung: 'có bước continue-on-error: true' });
    if (/\|\|\s*true/.test(kho.ciYml)) voHieu.push({ file: '.github/workflows/ci.yml', dong: null, bang_chung: 'có lệnh kết thúc bằng || true' });
    if (/fail:\s*false/.test(kho.ciYml)) voHieu.push({ file: '.github/workflows/ci.yml', dong: null, bang_chung: 'có bước fail: false' });
    if (voHieu.length) {
      ra.push(pt({
        id: 'ARCH-CI-TOOTHLESS', nhom: NHOM.KIEN_TRUC, muc: 'vang',
        tieu_de: 'Cổng CI đang ở chế độ chỉ báo cáo',
        vi_sao: 'bước có continue-on-error / || true / fail:false thì không bao giờ chặn được gì',
        ca: voHieu,
        cach_sua: 'Siết dần từng bước một khi số lỗi tồn đọng về 0. Lưu ý: Hostinger deploy độc lập với CI nên CI xanh/đỏ đều không chặn được deploy.',
        phut: 10, lop: 'C',
      }));
    }
  }

  /* ── ARCH-DOC-CLAIM ── */
  ra.push(...docNoiDoi(kho));
  return ra;
}

/* ── Tài liệu nói dối: đối chiếu khẳng định trong CLAUDE.md với filesystem ── */
function docNoiDoi(kho) {
  const doc = kho.claudeMd;
  if (!doc) return [];
  const sai = [];

  /* 1. Con số "N/M trang" — probe: đếm trang thật nạp theme.css */
  const mSo = /Đã migrate:\s*(\d+)\s*\/\s*(\d+)\s*trang/i.exec(doc);
  if (mSo) {
    const thatMau = kho.trangThat.size;
    const thatTu = [...kho.trangThat].filter((f) => /theme\.css/.test(kho.html.get(f))).length;
    if (Number(mSo[1]) !== thatTu || Number(mSo[2]) !== thatMau) {
      sai.push({ file: 'CLAUDE.md', dong: soDong(doc, mSo.index), bang_chung: `khai "${mSo[1]}/${mSo[2]} trang" nhưng thực tế ${thatTu}/${thatMau}` });
    }
  }

  /* 2. Mọi đường dẫn trong backtick phải tồn tại — bắt lời nói dối TƯƠNG LAI.
   * Chỉ xét token có dấu "/" (đường dẫn thật sự). Token không có "/" quá mơ hồ:
   * `.lang` là tên class CSS, `SHA256SUMS.txt` là file trong GitHub Releases —
   * bắt cả hai là báo động giả, mà báo động giả thì huỷ hoại niềm tin nhanh hơn
   * bỏ sót. */
  const ngoaiRepo = [];
  const reBt = /`([^`\n]+)`/g;
  let m;
  while ((m = reBt.exec(doc)) !== null) {
    const t = m[1].trim();
    if (!/^[\w@./~-]+$/.test(t) || !t.includes('/')) continue;
    if (t.startsWith('~') || t.startsWith('/root') || t.startsWith('/home')) {
      ngoaiRepo.push(t);
      continue;
    }
    const sach = t.replace(/^\//, '').replace(/\/$/, '');
    if (!sach) continue;
    const co = kho.dsFile.some((f) => f === sach || f.startsWith(`${sach}/`));
    if (!co) sai.push({ file: 'CLAUDE.md', dong: soDong(doc, m.index), bang_chung: `nhắc \`${t}\` nhưng không tồn tại trong repo` });
  }
  // Gộp mọi đường dẫn ngoài repo thành MỘT dòng — nhắc một lần là đủ, lặp lại 3 lần
  // mỗi sáng chỉ làm người ta ngừng đọc.
  if (ngoaiRepo.length) {
    sai.push({
      file: 'CLAUDE.md', dong: null,
      bang_chung: `${ngoaiRepo.length} đường dẫn nằm ngoài repo (${ngoaiRepo.join(', ').slice(0, 90)}…) — phiên cloud không đọc được`,
    });
  }

  /* 3. Doc nói "đã có cổng" thì cổng phải còn — mất cổng là ĐỎ, vì phiên sau sẽ tin nhầm */
  const congMat = [];
  if (/đã chặn trong \.gitignore \+ CI/i.test(doc)) {
    if (!/\*\.dmg/.test(kho.gitignore)) congMat.push({ file: '.gitignore', dong: null, bang_chung: 'CLAUDE.md nói .gitignore chặn file cài đặt nhưng không thấy *.dmg' });
    if (!/ls-files[^\n]*dmg/.test(kho.ciYml)) congMat.push({ file: '.github/workflows/ci.yml', dong: null, bang_chung: 'CLAUDE.md nói CI chặn file cài đặt nhưng không thấy bước đó' });
  }

  const ra = [];
  if (sai.length) {
    ra.push(pt({
      id: 'ARCH-DOC-CLAIM', nhom: NHOM.KIEN_TRUC, muc: 'vang',
      tieu_de: 'CLAUDE.md khẳng định điều không đúng thực tế',
      vi_sao: 'mọi phiên Claude đọc file này làm sự thật — sai ở đây lan ra mọi việc sau',
      ca: sai, cach_sua: 'Sửa CLAUDE.md cho khớp thực tế, hoặc sửa thực tế cho khớp CLAUDE.md.', phut: 10, lop: 'C',
    }));
  }
  if (congMat.length) {
    ra.push(pt({
      id: 'ARCH-DOC-GATE-LOST', nhom: NHOM.KIEN_TRUC, muc: 'do',
      tieu_de: 'CLAUDE.md nói đã có cổng chặn, nhưng cổng không còn',
      vi_sao: 'phiên Claude sau sẽ tin là có cổng và đẩy thứ nguy hiểm lên site thật',
      ca: congMat, cach_sua: 'Khôi phục cổng, hoặc sửa CLAUDE.md để không ai tin nhầm nữa.', phut: 10, lop: 'C',
    }));
  }
  return ra;
}
