/* Check chế độ --live: chỉ chạy khi container ra được Internet.
 * Nếu mạng bị chặn, TOÀN BỘ nhóm này báo "không kiểm được" chứ KHÔNG báo đỏ giả.
 * Nhầm "không kiểm được" thành "hỏng" là cách nhanh nhất giết niềm tin vào báo cáo. */

import { connect } from 'node:tls';
import { pt, NHOM } from '../lib/ket-qua.mjs';
import { DOMAIN } from '../lib/kho.mjs';

const HET_GIO = 15000;

async function thu(url, method = 'GET') {
  const bo = new AbortController();
  const h = setTimeout(() => bo.abort(), HET_GIO);
  const t0 = Date.now();
  try {
    const r = await fetch(url, { method, redirect: 'manual', signal: bo.signal });
    return { ok: true, status: r.status, headers: r.headers, ms: Date.now() - t0, viTri: r.headers.get('location') };
  } catch (e) {
    return { ok: false, loi: String(e.message || e).slice(0, 120) };
  } finally {
    clearTimeout(h);
  }
}

function hanTls(host) {
  return new Promise((giaiQuyet) => {
    const s = connect({ host, port: 443, servername: host, timeout: HET_GIO }, () => {
      const c = s.getPeerCertificate();
      s.end();
      giaiQuyet(c && c.valid_to ? new Date(c.valid_to) : null);
    });
    s.on('error', () => giaiQuyet(null));
    s.on('timeout', () => { s.destroy(); giaiQuyet(null); });
  });
}

/** Mọi ID check module này có thể phát ra — nguồn để đếm 'N kiểm tra đạt'. */
export const IDS = [
  'TRANG-LIVE-STATUS',
  'TRANG-LIVE-HEADER',
  'PERF-LIVE-TTFB',
  'SEC-LIVE-TLS',
  'LINK-EXT-DEAD',
];

export async function chay(kho) {
  const ra = [];
  const khongKiemDuoc = [];

  const goc = await thu(`https://${DOMAIN}/?cb=${Date.now()}`);
  if (!goc.ok) {
    // Không phân biệt được "site chết" với "container bị chặn mạng" → không dám kết luận.
    for (const id of ['TRANG-LIVE-STATUS', 'TRANG-LIVE-HEADER', 'PERF-LIVE-TTFB', 'SEC-LIVE-TLS', 'LINK-EXT-DEAD']) {
      khongKiemDuoc.push({ id, ly_do: `không ra được Internet: ${goc.loi}` });
    }
    return { phat_hien: ra, khong_kiem_duoc: khongKiemDuoc };
  }

  /* ── Trang chủ và mọi URL trong sitemap phải trả 200 ── */
  const chet = [];
  if (goc.status !== 200) chet.push({ file: '/', dong: null, bang_chung: `trang chủ trả HTTP ${goc.status}` });
  for (const u of kho.sitemap) {
    const r = await thu(`${u.loc}${u.loc.includes('?') ? '&' : '?'}cb=${Date.now()}`, 'HEAD');
    if (!r.ok) { chet.push({ file: u.loc, dong: null, bang_chung: `không truy cập được: ${r.loi}` }); continue; }
    if (r.status >= 400) chet.push({ file: u.loc, dong: null, bang_chung: `HTTP ${r.status}` });
    else if (r.status >= 300) chet.push({ file: u.loc, dong: null, bang_chung: `HTTP ${r.status} → ${r.viTri || '?'} (sitemap nên khai URL đích)` });
  }
  if (chet.length) {
    ra.push(pt({
      id: 'TRANG-LIVE-STATUS', nhom: NHOM.TRANG, muc: 'do',
      tieu_de: 'URL trong sitemap không trả về 200', vi_sao: 'Google crawl vào lỗi',
      ca: chet, cach_sua: 'Sửa trang hoặc cập nhật sitemap.', phut: 15, lop: 'C',
    }));
  }

  /* ── Header khai trong .htaccess có thực sự tới trình duyệt không ──
   * Quan trọng: toàn bộ header nằm trong <IfModule mod_headers.c>. Nếu LiteSpeed
   * không nạp module đó thì header biến mất IM LẶNG, không báo lỗi ở đâu cả. */
  const canCo = [...kho.htaccess.matchAll(/Header\s+(?:always\s+)?set\s+([\w-]+)/gi)].map((m) => m[1]);
  const thieu = canCo.filter((h) => !goc.headers.get(h.toLowerCase()))
    .map((h) => ({ file: '.htaccess', dong: null, bang_chung: `.htaccess khai ${h} nhưng server không trả về` }));
  if (thieu.length) {
    ra.push(pt({
      id: 'TRANG-LIVE-HEADER', nhom: NHOM.BAO_MAT, muc: 'do',
      tieu_de: '.htaccess khai header nhưng server không áp dụng',
      vi_sao: 'header nằm trong <IfModule mod_headers.c> — module không nạp thì header biến mất im lặng',
      ca: thieu, cach_sua: 'Kiểm tra LiteSpeed có bật mod_headers không; liên hệ Hostinger nếu cần.', phut: 20, lop: 'C',
    }));
  }

  /* ── TTFB ── */
  const nguongTtfb = kho.nguong.ttfb_ms ?? 1500;
  if (goc.ms > nguongTtfb) {
    ra.push(pt({
      id: 'PERF-LIVE-TTFB', nhom: NHOM.HIEU_NANG, muc: 'vang',
      tieu_de: 'Trang chủ phản hồi chậm', vi_sao: `TTFB ${goc.ms}ms > ngưỡng ${nguongTtfb}ms`,
      ca: [{ file: '/', dong: null, bang_chung: `${goc.ms}ms` }],
      cach_sua: 'Kiểm tra cache LiteSpeed và kích thước trang chủ.', phut: 20, lop: 'C',
    }));
  }

  /* ── Chứng chỉ TLS ── */
  const han = await hanTls(DOMAIN);
  if (han) {
    const conLai = Math.round((han - Date.now()) / 86400000);
    if (conLai < (kho.nguong.tls_con_lai_ngay ?? 14)) {
      ra.push(pt({
        id: 'SEC-LIVE-TLS', nhom: NHOM.BAO_MAT, muc: 'do',
        tieu_de: 'Chứng chỉ HTTPS sắp hết hạn', vi_sao: `còn ${conLai} ngày`,
        ca: [{ file: DOMAIN, dong: null, bang_chung: `hết hạn ${han.toISOString().slice(0, 10)}` }],
        cach_sua: 'Gia hạn chứng chỉ trong bảng điều khiển Hostinger.', phut: 15, lop: 'C',
      }));
    }
  } else {
    khongKiemDuoc.push({ id: 'SEC-LIVE-TLS', ly_do: 'không đọc được chứng chỉ TLS' });
  }

  /* ── Link ngoài chết (gồm link tải app từ GitHub Releases) ── */
  const hostNgoai = new Map();
  for (const f of [...kho.trangThat, ...kho.js.keys()]) {
    const noi = kho.html.get(f) ?? kho.js.get(f);
    if (!noi) continue;
    for (const m of noi.matchAll(/https:\/\/(?:github\.com|www\.youtube\.com|www\.skool\.com|zalo\.me|app\.notion\.com)\/[^\s"'<>)]+/g)) {
      const u = m[0].replace(/[.,)]+$/, '').replace(/&amp;/g, '&');
      if (!hostNgoai.has(u)) hostNgoai.set(u, f);
    }
  }
  const ngoaiChet = [];
  for (const [u, f] of [...hostNgoai].slice(0, 40)) {
    const r = await thu(u, 'HEAD');
    if (!r.ok) continue; // lỗi mạng ≠ link chết
    if (r.status >= 400) ngoaiChet.push({ file: f, dong: null, bang_chung: `HTTP ${r.status} — ${u}`.slice(0, 130) });
  }
  if (ngoaiChet.length) {
    ra.push(pt({
      id: 'LINK-EXT-DEAD', nhom: NHOM.LIEN_KET, muc: 'vang',
      tieu_de: 'Link ra ngoài đã chết', vi_sao: 'trả về mã lỗi 4xx/5xx', ca: ngoaiChet, do_tin_cay: 'vua',
      cach_sua: 'Cập nhật hoặc gỡ link. Chú ý link tải app: release cũ bị xoá là link chết im lặng.', phut: 10, lop: 'B',
    }));
  }

  return { phat_hien: ra, khong_kiem_duoc: khongKiemDuoc };
}
