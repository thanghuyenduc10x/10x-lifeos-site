/* Đọc và luận Content-Security-Policy từ .htaccess.
 * Chỗ nhạy cảm nhất là fallback chain: sai ở đây là sinh báo động giả hàng loạt. */

/** Directive nào rơi về default-src khi vắng mặt (theo CSP Level 3). */
export const RA_DEFAULT = new Set([
  'script-src', 'style-src', 'img-src', 'font-src', 'connect-src',
  'media-src', 'object-src', 'frame-src', 'worker-src', 'manifest-src',
  'child-src', 'prefetch-src', 'script-src-elem', 'script-src-attr',
  'style-src-elem', 'style-src-attr',
]);

/** Directive KHÔNG rơi về default-src — nhầm chỗ này là nguồn báo động giả kinh điển. */
export const KHONG_RA_DEFAULT = new Set([
  'frame-ancestors', 'base-uri', 'form-action', 'report-uri', 'report-to',
  'upgrade-insecure-requests', 'sandbox', 'require-trusted-types-for', 'trusted-types',
]);

/**
 * Bóc chuỗi CSP từ .htaccess.
 * Xử lý được: dòng nối bằng dấu \, và chuỗi trải nhiều dòng trong dấu ".
 */
export function bocCspTuHtaccess(htaccess) {
  const noiDong = htaccess.replace(/\\\r?\n\s*/g, ' ');
  const re = /Header\s+(?:always\s+)?set\s+Content-Security-Policy(?:-Report-Only)?\s+"([\s\S]*?)"/i;
  const m = re.exec(noiDong);
  if (!m) return null;
  return m[1].replace(/\s+/g, ' ').trim();
}

/** "a 'self' b; c d" → Map{ a => ["'self'","b"], c => ["d"] } */
export function phanTichCsp(chuoi) {
  const ra = new Map();
  if (!chuoi) return ra;
  for (const phan of chuoi.split(';')) {
    const t = phan.trim();
    if (!t) continue;
    const [ten, ...nguon] = t.split(/\s+/);
    ra.set(ten.toLowerCase(), nguon);
  }
  return ra;
}

/**
 * Danh sách nguồn có hiệu lực cho một directive, đã áp fallback chain.
 * Trả null nghĩa là "CSP không quản directive này" → mọi host đều qua.
 */
export function nguonHieuLuc(csp, directive) {
  const d = directive.toLowerCase();
  if (csp.has(d)) return csp.get(d);
  if (KHONG_RA_DEFAULT.has(d)) return null;
  // frame-src rơi về child-src trước, rồi mới tới default-src
  if (d === 'frame-src' && csp.has('child-src')) return csp.get('child-src');
  if (d === 'worker-src' && csp.has('child-src')) return csp.get('child-src');
  if (RA_DEFAULT.has(d) && csp.has('default-src')) return csp.get('default-src');
  return null;
}

/** Host có khớp một mục nguồn CSP không. `tuMinh` = domain của chính site (cho 'self'). */
export function khopNguon(host, nguon, tuMinh) {
  const s = nguon.trim();
  if (s === '*') return true;
  if (s === 'https:' || s === 'http:') return true;
  if (s === "'self'") return host === tuMinh || host === `www.${tuMinh}`;
  if (s.startsWith("'")) return false; // 'unsafe-inline', 'none', nonce, hash…
  const chi = s.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').toLowerCase().replace(/:\d+$/, '');
  if (chi.startsWith('*.')) return host === chi.slice(2) || host.endsWith(chi.slice(1));
  return host === chi;
}

/** Host này có được CSP cho phép với directive này không. */
export function duocPhep(csp, directive, host, tuMinh) {
  const nguon = nguonHieuLuc(csp, directive);
  if (nguon === null) return true; // không directive nào quản → không chặn
  if (nguon.length === 1 && nguon[0] === "'none'") return false;
  return nguon.some((n) => khopNguon(host, n, tuMinh));
}

/** Soạn sẵn dòng directive thay thế, đã thêm host còn thiếu — để dán thẳng, khỏi tự ghép. */
export function soanDirectiveVa(csp, directive, hostThem) {
  const hienCo = csp.get(directive) ?? nguonHieuLuc(csp, directive) ?? ["'self'"];
  const them = hostThem.filter((h) => !hienCo.some((n) => khopNguon(h, n, '10x-lifeos.com')));
  if (!them.length) return null;
  return `${directive} ${[...hienCo, ...them.map((h) => `https://${h}`)].join(' ')}`;
}
