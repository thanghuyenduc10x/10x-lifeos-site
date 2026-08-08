/* Quét repo ĐÚNG MỘT LẦN thành "kho" dùng chung cho mọi check.
 * Mọi check đọc từ đây, không tự đọc đĩa — để 50 check không thành 50 lần quét. */

import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative, extname } from 'node:path';
import { createHash } from 'node:crypto';
import {
  xoaComment, xoaCommentJs, quetThe, quetKhoi, layHead, soDong,
  quetLiteralChuoi, bangHangSoChuoi, layHost,
} from './html.mjs';

export const DOMAIN = '10x-lifeos.com';

function git(root, ...args) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  } catch {
    return '';
  }
}

/* ── Phân loại "trang thật" ─────────────────────────────────────────────
 * Suy ra từ filesystem, KHÔNG hardcode danh sách. Đây là thứ giữ cho bộ audit
 * không trôi lệch khi thêm trang mới — lỗi mà chính CI hiện tại đang mắc. */
function laTrangThat(duongDan, html, duocNhungQuaIframe) {
  if (duongDan.startsWith('_mau/')) return false;
  if (duongDan.startsWith('_audit/')) return false;
  const head = layHead(html);
  if (/<meta\s[^>]*name\s*=\s*["']robots["'][^>]*content\s*=\s*["'][^"']*noindex/i.test(head)) return false;
  if (/<meta\s[^>]*http-equiv\s*=\s*["']refresh["']/i.test(head)) return false;
  if (duocNhungQuaIframe) return false;
  return true;
}

/* ── Giải đường dẫn nội bộ về file trên đĩa ───────────────────────────── */
export function giaiDuongDan(root, tuFile, href) {
  let h = String(href).trim();
  if (!h || /^(https?:|mailto:|tel:|data:|javascript:|blob:|#)/i.test(h)) return null;
  h = h.split('#')[0].split('?')[0];
  if (!h) return null;
  const goc = h.startsWith('/') ? join(root, h) : resolve(root, dirname(tuFile), h);
  const ungVien = [goc];
  if (h.endsWith('/')) ungVien.push(join(goc, 'index.html'));
  else ungVien.push(join(goc, 'index.html'), `${goc}.html`);
  for (const u of ungVien) {
    if (existsSync(u) && statSync(u).isFile()) return relative(root, u);
  }
  // Thư mục tồn tại nhưng không có index.html → vẫn coi là tồn tại (server tự xử)
  if (existsSync(goc) && statSync(goc).isDirectory()) return relative(root, goc);
  return { thieu: relative(root, goc), goc: h };
}

/* ── Kho tài nguyên: (host, directive, vị trí) để đối chiếu CSP ────────── */

const AS_SANG_DIRECTIVE = {
  script: 'script-src', style: 'style-src', font: 'font-src', image: 'img-src',
  fetch: 'connect-src', track: 'media-src', audio: 'media-src', video: 'media-src',
  document: 'frame-src', worker: 'worker-src',
};

function themHost(ra, host, directive, file, dong, bangChung, doTinCay = 'cao') {
  if (!host || host === DOMAIN || host === `www.${DOMAIN}`) return;
  ra.push({ host, directive, file, dong, bang_chung: bangChung.slice(0, 120), do_tin_cay: doTinCay });
}

function hostTuUrlTrongCss(css, file, offsetGoc, noiDungGoc, ra) {
  // @font-face { src: url(...) } → font-src; url() còn lại → img-src
  const vungFont = [];
  const reFF = /@font-face\s*\{[\s\S]*?\}/gi;
  let m;
  while ((m = reFF.exec(css)) !== null) vungFont.push([m.index, m.index + m[0].length]);
  const reUrl = /url\(\s*['"]?([^'")]+)['"]?\s*\)/gi;
  while ((m = reUrl.exec(css)) !== null) {
    const host = layHost(m[1]);
    if (!host) continue;
    const trongFont = vungFont.some(([a, b]) => m.index >= a && m.index < b);
    const dong = soDong(noiDungGoc, offsetGoc + m.index);
    themHost(ra, host, trongFont ? 'font-src' : 'img-src', file, dong, m[0]);
  }
}

/** Directive suy từ ngữ cảnh JS quanh một literal URL. Không đoán được → 'khong_ro'. */
function directiveTuNguCanh(js, offset, banDoId) {
  const truoc = js.slice(Math.max(0, offset - 90), offset);
  if (/(?:fetch|sendBeacon|\.open|new\s+WebSocket|new\s+EventSource|axios\.\w+)\s*\(\s*$/.test(truoc)) return 'connect-src';
  if (/(?:fetch|sendBeacon|\.open|new\s+WebSocket|new\s+EventSource)\s*\([^)]{0,60}$/.test(truoc)) return 'connect-src';

  // X.src = '...' → tra xem X là gì
  const mGan = /([A-Za-z_$][\w$]*)\s*\.\s*(src|href)\s*=\s*$/.exec(truoc);
  if (mGan) {
    const bien = mGan[1];
    const thuocTinh = mGan[2];
    const truocXa = js.slice(0, offset);
    const reTao = new RegExp(`\\b${bien}\\s*=\\s*document\\.createElement\\(\\s*['"]([a-z]+)['"]`, 'i');
    const mTao = reTao.exec(truocXa);
    if (mTao) {
      const the = mTao[1].toLowerCase();
      if (the === 'script') return 'script-src';
      if (the === 'img') return 'img-src';
      if (the === 'link') return 'style-src';
      if (the === 'iframe') return 'frame-src';
    }
    const reId = new RegExp(`\\b${bien}\\s*=\\s*document\\.(?:getElementById\\(\\s*['"]([\\w-]+)['"]|querySelector\\(\\s*['"]#([\\w-]+)['"])`, 'i');
    const mId = reId.exec(truocXa);
    if (mId) {
      const id = (mId[1] || mId[2] || '').toLowerCase();
      const the = banDoId.get(id);
      if (the === 'img') return 'img-src';
      if (the === 'script') return 'script-src';
      if (the === 'iframe') return 'frame-src';
      if (the === 'link') return 'style-src';
      if (the === 'video' || the === 'audio' || the === 'source') return 'media-src';
    }
    if (thuocTinh === 'href') return 'style-src';
  }
  return 'khong_ro';
}

export function quetKho(root) {
  const dsFile = git(root, 'ls-files').split('\n').filter(Boolean);

  const file = new Map(); // duong_dan → {kich_thuoc, md5}
  for (const f of dsFile) {
    const day = join(root, f);
    if (!existsSync(day)) continue;
    const buf = readFileSync(day);
    file.set(f, { kich_thuoc: buf.length, md5: createHash('md5').update(buf).digest('hex') });
  }

  const doc = (f) => {
    try { return readFileSync(join(root, f), 'utf8'); } catch { return ''; }
  };

  const dsHtml = dsFile.filter((f) => f.endsWith('.html'));
  const dsJs = dsFile.filter((f) => f.endsWith('.js'));
  const dsCss = dsFile.filter((f) => f.endsWith('.css'));

  const html = new Map();
  for (const f of dsHtml) html.set(f, doc(f));
  const js = new Map();
  for (const f of dsJs) js.set(f, doc(f));
  const css = new Map();
  for (const f of dsCss) css.set(f, doc(f));

  let boLoc = {};
  try { boLoc = JSON.parse(readFileSync(join(root, '_audit/cau-hinh/bo-loc.json'), 'utf8')); } catch { /* chạy được không cần cấu hình */ }

  const htaccess = existsSync(join(root, '.htaccess')) ? doc('.htaccess') : '';
  const robots = existsSync(join(root, 'robots.txt')) ? doc('robots.txt') : '';
  const claudeMd = existsSync(join(root, 'CLAUDE.md')) ? doc('CLAUDE.md') : '';
  const ciYml = existsSync(join(root, '.github/workflows/ci.yml')) ? doc('.github/workflows/ci.yml') : '';
  const gitignore = existsSync(join(root, '.gitignore')) ? doc('.gitignore') : '';

  /* sitemap */
  const sitemapRaw = existsSync(join(root, 'sitemap.xml')) ? doc('sitemap.xml') : '';
  const sitemap = [];
  {
    const re = /<url>\s*<loc>([^<]+)<\/loc>(?:\s*<lastmod>([^<]+)<\/lastmod>)?/gi;
    let m;
    while ((m = re.exec(sitemapRaw)) !== null) {
      sitemap.push({ loc: m[1].trim(), lastmod: m[2] ? m[2].trim() : null });
    }
  }
  const sitemapFile = new Set();
  for (const u of sitemap) {
    const duong = u.loc.replace(/^https?:\/\/[^/]+/, '') || '/';
    const r = giaiDuongDan(root, 'index.html', duong);
    if (typeof r === 'string') sitemapFile.add(r);
    u.file = typeof r === 'string' ? r : null;
  }

  /* trang nào bị nhúng qua iframe từ trang khác → không tính là trang thật */
  const nhungQuaIframe = new Set();
  for (const [f, noi] of html) {
    for (const t of quetThe(noi, ['iframe', 'frame'])) {
      const src = t.thuoc_tinh.src;
      if (!src) continue;
      const r = giaiDuongDan(root, f, src);
      if (typeof r === 'string') nhungQuaIframe.add(r);
    }
  }

  const trangThat = new Set();
  for (const [f, noi] of html) {
    if (laTrangThat(f, noi, nhungQuaIframe.has(f))) trangThat.add(f);
  }

  /* ── bản đồ id → tên thẻ (cần cho việc suy directive của URL động) ── */
  const banDoIdTheoFile = new Map();
  for (const [f, noi] of html) {
    const bd = new Map();
    const re = /<([a-zA-Z][\w-]*)((?:[^>"']|"[^"]*"|'[^']*')*)\bid\s*=\s*["']([^"']+)["']/g;
    let m;
    while ((m = re.exec(xoaComment(noi))) !== null) bd.set(m[3].toLowerCase(), m[1].toLowerCase());
    banDoIdTheoFile.set(f, bd);
  }

  /* ── kho tài nguyên (host, directive) ── */
  const taiNguyen = [];
  // Host chỉ xuất hiện qua preconnect/dns-prefetch: CSP không quản chúng (chúng chỉ là
  // gợi ý), nhưng chúng CHỨNG MINH host đang được dùng lúc chạy — cần cho SEC-CSP-STALE
  // để không báo nhầm fonts.gstatic.com (font thật do CSS của Google Fonts tải).
  const hostGoiY = new Set();
  for (const [f, noiGoc] of html) {
    const noi = xoaComment(noiGoc);

    // Bỏ hẳn khối ld+json: "@context":"https://schema.org" là định danh, không phải request
    const vungLd = [];
    for (const k of quetKhoi(noiGoc, 'script')) {
      if (/ld\+json/i.test(k.thuoc_tinh.type || '')) {
        vungLd.push([k.offset_noi_dung, k.offset_noi_dung + k.noi_dung.length]);
      }
    }
    const trongLd = (off) => vungLd.some(([a, b]) => off >= a && off < b);

    for (const t of quetThe(noi, ['img', 'script', 'link', 'iframe', 'frame', 'embed', 'object', 'source', 'video', 'audio', 'track', 'input'])) {
      if (trongLd(t.offset)) continue;
      const a = t.thuoc_tinh;
      const day = (u, d) => themHost(taiNguyen, layHost(u), d, f, t.dong, `<${t.ten} … ${u}>`);
      switch (t.ten) {
        case 'img':
          day(a.src, 'img-src');
          for (const p of (a.srcset || '').split(',')) day(p.trim().split(/\s+/)[0], 'img-src');
          break;
        case 'input':
          if ((a.type || '').toLowerCase() === 'image') day(a.src, 'img-src');
          break;
        case 'script':
          day(a.src, 'script-src');
          break;
        case 'link': {
          const rel = (a.rel || '').toLowerCase();
          // canonical/alternate do crawler đọc, preconnect/dns-prefetch chỉ là gợi ý → CSP không quản
          if (/\b(dns-prefetch|preconnect)\b/.test(rel)) { const h = layHost(a.href); if (h) hostGoiY.add(h); break; }
          if (/\b(canonical|alternate|manifest|icon|apple-touch-icon)\b/.test(rel)) break;
          if (rel.includes('preload')) { day(a.href, AS_SANG_DIRECTIVE[(a.as || '').toLowerCase()] || 'khong_ro'); break; }
          if (rel.includes('stylesheet')) day(a.href, 'style-src');
          break;
        }
        case 'iframe': case 'frame': day(a.src, 'frame-src'); break;
        case 'embed': day(a.src, 'frame-src'); break;
        case 'object': day(a.data, 'object-src'); break;
        case 'source':
          day(a.src, 'media-src');
          for (const p of (a.srcset || '').split(',')) day(p.trim().split(/\s+/)[0], 'img-src');
          break;
        case 'video': case 'audio': day(a.src, 'media-src'); day(a.poster, 'img-src'); break;
        case 'track': day(a.src, 'media-src'); break;
      }
    }

    // <style> nội trang + thuộc tính style=""
    for (const k of quetKhoi(noiGoc, 'style')) {
      hostTuUrlTrongCss(k.noi_dung, f, k.offset_noi_dung, noiGoc, taiNguyen);
    }

    // <script> inline: literal URL + suy directive từ ngữ cảnh
    const banDoId = banDoIdTheoFile.get(f);
    for (const k of quetKhoi(noiGoc, 'script')) {
      if (k.thuoc_tinh.src) continue;
      if (/ld\+json/i.test(k.thuoc_tinh.type || '')) continue;
      const sach = xoaCommentJs(k.noi_dung);
      for (const lit of quetLiteralChuoi(sach)) {
        const host = layHost(lit.gia_tri);
        if (!host) continue;
        const d = directiveTuNguCanh(sach, lit.offset, banDoId);
        themHost(taiNguyen, host, d, f, soDong(noiGoc, k.offset_noi_dung + lit.offset),
          lit.gia_tri, d === 'khong_ro' ? 'thap' : 'cao');
      }
    }
  }

  // file .js riêng: dùng bản đồ id gộp của mọi trang nạp nó
  const banDoIdGop = new Map();
  for (const bd of banDoIdTheoFile.values()) for (const [k, v] of bd) if (!banDoIdGop.has(k)) banDoIdGop.set(k, v);
  for (const [f, noiGoc] of js) {
    const sach = xoaCommentJs(noiGoc);
    for (const lit of quetLiteralChuoi(sach)) {
      const host = layHost(lit.gia_tri);
      if (!host) continue;
      const d = directiveTuNguCanh(sach, lit.offset, banDoIdGop);
      themHost(taiNguyen, host, d, f, soDong(noiGoc, lit.offset), lit.gia_tri, d === 'khong_ro' ? 'thap' : 'cao');
    }
  }
  for (const [f, noiGoc] of css) hostTuUrlTrongCss(noiGoc, f, 0, noiGoc, taiNguyen);

  /* ── đồ thị link nội bộ (gồm cả literal chuỗi trong .js: footer.js dùng li('/blog/')) ── */
  const link = []; // {tu, den, den_thieu, dong, la_neo}
  const troToi = new Map(); // file → Set(file trỏ tới nó)
  const ghiLink = (tu, href, dong) => {
    if (!href) return;
    const neo = href.includes('#') ? href.split('#')[1] : null;
    const r = giaiDuongDan(root, tu, href);
    if (r === null) {
      if (/^#/.test(href.trim())) link.push({ tu, den: tu, dong, neo, trong_trang: true });
      return;
    }
    if (typeof r === 'string') {
      link.push({ tu, den: r, dong, neo });
      if (!troToi.has(r)) troToi.set(r, new Set());
      troToi.get(r).add(tu);
    } else {
      link.push({ tu, den: null, den_thieu: r.thieu, goc: r.goc, dong, neo });
    }
  };
  for (const [f, noi] of html) {
    for (const t of quetThe(noi, ['a', 'img', 'link', 'script', 'iframe', 'source', 'video', 'audio', 'embed', 'object'])) {
      const a = t.thuoc_tinh;
      for (const u of [a.href, a.src, a.data, a.poster]) if (u) ghiLink(f, u, t.dong);
      for (const p of (a.srcset || '').split(',')) { const u = p.trim().split(/\s+/)[0]; if (u) ghiLink(f, u, t.dong); }
    }
  }
  for (const [f, noiGoc] of js) {
    for (const lit of quetLiteralChuoi(xoaCommentJs(noiGoc))) {
      const v = lit.gia_tri;
      if (!/^\/[\w./-]*$/.test(v)) continue; // chỉ nhận path tuyệt đối trông rõ ràng
      ghiLink(f, v, soDong(noiGoc, lit.offset));
    }
  }

  /* trang nào nạp file js nào (để biết footer.js/header.js thuộc trang nào) */
  const trangNap = new Map(); // js file → Set(trang)
  for (const [f, noi] of html) {
    for (const t of quetThe(noi, ['script'])) {
      const src = t.thuoc_tinh.src;
      if (!src) continue;
      const r = giaiDuongDan(root, f, src);
      if (typeof r !== 'string') continue;
      if (!trangNap.has(r)) trangNap.set(r, new Set());
      trangNap.get(r).add(f);
    }
  }

  /* ngày commit cuối theo file — cho check lastmod và "tồn tại bao nhiêu ngày" */
  const ngayCommit = new Map();
  {
    const raw = git(root, 'log', '--name-only', '--pretty=format:@%ad', '--date=short', '-400');
    let ngay = null;
    for (const dong of raw.split('\n')) {
      if (dong.startsWith('@')) { ngay = dong.slice(1).trim(); continue; }
      const t = dong.trim();
      if (t && ngay && !ngayCommit.has(t)) ngayCommit.set(t, ngay);
    }
  }

  return {
    root, dsFile, file, html, js, css, boLoc, nguong: boLoc.nguong ?? {},
    htaccess, robots, claudeMd, ciYml, gitignore,
    sitemap, sitemapFile, sitemapRaw,
    trangThat, nhungQuaIframe, taiNguyen, hostGoiY, link, troToi, trangNap,
    banDoIdTheoFile, ngayCommit,
    commit: git(root, 'rev-parse', '--short', 'HEAD').trim(),
    commitNgay: git(root, 'log', '-1', '--date=short', '--pretty=%ad').trim(),
    nhanh: git(root, 'rev-parse', '--abbrev-ref', 'HEAD').trim(),
    bangHangSoChuoi,
  };
}

export { extname };
