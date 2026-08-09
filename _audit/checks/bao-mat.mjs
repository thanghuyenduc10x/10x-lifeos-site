/* Nhóm BẢO-MẬT. Check đắt giá nhất ở đây là SEC-CSP-HOST. */

import { pt, NHOM } from '../lib/ket-qua.mjs';
import { bocCspTuHtaccess, phanTichCsp, duocPhep, soanDirectiveVa } from '../lib/csp.mjs';
import { DOMAIN } from '../lib/kho.mjs';

const HEADER_CHUAN = [
  ['Strict-Transport-Security', 'buộc HTTPS'],
  ['X-Content-Type-Options', 'chặn đoán sai loại file'],
  ['X-Frame-Options', 'chống clickjacking'],
  ['Referrer-Policy', 'không rò URL khi bấm ra ngoài'],
  ['Permissions-Policy', 'tắt quyền trình duyệt không dùng'],
  ['Content-Security-Policy', 'giới hạn nguồn tài nguyên'],
];

/** Mọi ID check module này có thể phát ra — nguồn để đếm 'N kiểm tra đạt'. */
export const IDS = [
  'SEC-CSP-HOST',
  'SEC-CSP-HOST-PHU',
  'SEC-CSP-STALE',
  'SEC-CSP-WEAK',
  'SEC-CSP-MISSING',
  'SEC-HEADER-MISSING',
  'SEC-HTACCESS-GAP',
  'SEC-AUDIT-EXPOSED',
  'SEC-MAU-EXPOSED',
  'SEC-SECRET-SCAN',
  'SEC-BINARY-BLOCKED',
  'SEC-GITIGNORE-GAP',
];

export function chay(kho) {
  const ra = [];
  const cspChuoi = bocCspTuHtaccess(kho.htaccess);
  const csp = phanTichCsp(cspChuoi);

  /* ── SEC-CSP-HOST — host tài nguyên thật bị CSP chặn ─────────────────
   * Mức: 🔴 nếu tài nguyên nằm trên trang CÓ trong sitemap (người lạ vào được),
   *      🟡 nếu chỉ ở trang ngoài sitemap. Tiêu chí máy móc, không cảm tính. */
  if (cspChuoi) {
    const chanDo = [];
    const chanVang = [];
    const hostThieu = new Set();
    for (const t of kho.taiNguyen) {
      const dirs = t.directive === 'khong_ro'
        ? ['img-src', 'script-src', 'style-src', 'font-src', 'connect-src', 'frame-src', 'media-src']
        : [t.directive];
      // 'khong_ro': chỉ báo khi KHÔNG directive nào cho qua — tránh báo động giả
      const bịChan = dirs.every((d) => !duocPhep(csp, d, t.host, DOMAIN));
      if (!bịChan) continue;
      hostThieu.add(t.host);
      const trongSitemap = kho.sitemapFile.has(t.file);
      const ca = {
        file: t.file, dong: t.dong,
        bang_chung: `${t.host} (${t.directive}) — ${t.bang_chung}`,
      };
      (trongSitemap && t.do_tin_cay === 'cao' ? chanDo : chanVang).push(ca);
    }
    if (chanDo.length) {
      const soan = soanDirectiveVa(csp, 'img-src', [...hostThieu]);
      ra.push(pt({
        id: 'SEC-CSP-HOST', nhom: NHOM.BAO_MAT, muc: 'do',
        tieu_de: 'Trình duyệt đang CHẶN tài nguyên trên trang công khai',
        vi_sao: 'host được dùng trên trang nằm trong sitemap.xml nhưng không có trong allowlist CSP',
        ca: chanDo,
        cach_sua: `Thêm host vào directive tương ứng trong .htaccess.${soan ? ` Dòng thay thế: ${soan}` : ''} Luật 4: sau khi push BẮT BUỘC curl -sI để xác nhận site còn sống.`,
        phut: 5, lop: 'C',
      }));
    }
    if (chanVang.length) {
      ra.push(pt({
        id: 'SEC-CSP-HOST-PHU', nhom: NHOM.BAO_MAT, muc: 'vang',
        tieu_de: 'Tài nguyên bị CSP chặn trên trang ngoài sitemap',
        vi_sao: 'host bị chặn nhưng trang không nằm trong sitemap nên ít người thấy',
        ca: chanVang,
        cach_sua: 'Thêm host vào CSP, hoặc bỏ tài nguyên ngoài đó đi.',
        phut: 5, lop: 'C',
      }));
    }

    /* SEC-CSP-STALE — host có trong CSP mà không tài nguyên nào dùng */
    const hostDung = new Set([
      ...kho.taiNguyen.map((t) => t.host), ...kho.hostGoiY,
      ...(kho.boLoc.host_chay_luc_runtime || []),
    ]);
    const thua = [];
    for (const [dir, nguon] of csp) {
      for (const n of nguon) {
        // Bỏ qua keyword ('self'…), wildcard, và MỌI scheme (data:, blob:, https:)
        // — scheme không phải host, báo chúng là "thừa" là báo động giả.
        if (n.startsWith("'") || n === '*' || /^[a-z][a-z0-9+.-]*:$/i.test(n)) continue;
        const h = n.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').toLowerCase();
        if (h.startsWith('*.')) continue;
        if (![...hostDung].some((d) => d === h)) {
          thua.push({ file: '.htaccess', dong: null, bang_chung: `${dir}: ${n} — không tài nguyên nào dùng` });
        }
      }
    }
    if (thua.length) {
      ra.push(pt({
        id: 'SEC-CSP-STALE', nhom: NHOM.BAO_MAT, muc: 'vang',
        tieu_de: 'CSP cho phép host không còn ai dùng',
        vi_sao: 'mỗi host thừa là một bề mặt tấn công không cần thiết',
        ca: thua, do_tin_cay: 'vua',
        cach_sua: 'Gỡ host khỏi CSP nếu chắc chắn không còn dùng. Lưu ý: host chỉ xuất hiện lúc chạy (vd endpoint analytics) sẽ bị báo nhầm ở đây.',
        phut: 5, lop: 'C',
      }));
    }

    /* SEC-CSP-WEAK */
    const yeu = [];
    const script = csp.get('script-src') || csp.get('default-src') || [];
    if (script.includes("'unsafe-eval'")) yeu.push({ file: '.htaccess', dong: null, bang_chung: "script-src có 'unsafe-eval'" });
    if (script.includes('*')) yeu.push({ file: '.htaccess', dong: null, bang_chung: "script-src có '*'" });
    if (!csp.has('object-src') && !csp.has('default-src')) yeu.push({ file: '.htaccess', dong: null, bang_chung: 'thiếu object-src' });
    if (!csp.has('base-uri')) yeu.push({ file: '.htaccess', dong: null, bang_chung: 'thiếu base-uri (không rơi về default-src)' });
    if (!csp.has('form-action')) yeu.push({ file: '.htaccess', dong: null, bang_chung: 'thiếu form-action — form có thể bị chuyển hướng đi nơi khác' });
    if (yeu.length) {
      ra.push(pt({
        id: 'SEC-CSP-WEAK', nhom: NHOM.BAO_MAT, muc: 'vang',
        tieu_de: 'CSP còn chỗ lỏng', vi_sao: 'thiếu directive không rơi về default-src, hoặc cho phép nguồn quá rộng',
        ca: yeu, cach_sua: 'Bổ sung directive còn thiếu vào CSP trong .htaccess.', phut: 10, lop: 'C',
      }));
    }
  } else {
    ra.push(pt({
      id: 'SEC-CSP-MISSING', nhom: NHOM.BAO_MAT, muc: 'do',
      tieu_de: 'Không tìm thấy Content-Security-Policy trong .htaccess',
      vi_sao: 'không có CSP nghĩa là mọi script/ảnh từ mọi nơi đều chạy được',
      ca: [{ file: '.htaccess', dong: null, bang_chung: 'không khớp Header set Content-Security-Policy' }],
      cach_sua: 'Khôi phục khối CSP trong .htaccess.', phut: 15, lop: 'C',
    }));
  }

  /* ── Header bảo mật (OWASP Secure Headers) ── */
  const thieuHeader = HEADER_CHUAN
    .filter(([h]) => !new RegExp(`Header\\s+(?:always\\s+)?set\\s+${h}`, 'i').test(kho.htaccess))
    .map(([h, y]) => ({ file: '.htaccess', dong: null, bang_chung: `thiếu ${h} — ${y}` }));
  if (thieuHeader.length) {
    ra.push(pt({
      id: 'SEC-HEADER-MISSING', nhom: NHOM.BAO_MAT, muc: 'vang',
      tieu_de: `Thiếu ${thieuHeader.length} header bảo mật`, vi_sao: 'so với bộ chuẩn OWASP Secure Headers',
      ca: thieuHeader, cach_sua: 'Bổ sung vào khối <IfModule mod_headers.c> trong .htaccess.', phut: 10, lop: 'C',
    }));
  }

  /* ── .htaccess: các cổng còn thiếu ── */
  const cong = [];
  if (!/RewriteCond\s+%\{HTTPS\}/i.test(kho.htaccess)) {
    cong.push({ file: '.htaccess', dong: null, bang_chung: 'không có redirect ép HTTPS — HSTS chỉ bảo vệ SAU lần vào đầu tiên' });
  }
  if (!/Options\s+-Indexes/i.test(kho.htaccess)) {
    cong.push({ file: '.htaccess', dong: null, bang_chung: 'thiếu Options -Indexes — thư mục không có index.html bị liệt kê công khai' });
  }
  if (!/ErrorDocument\s+404/i.test(kho.htaccess)) {
    cong.push({ file: '.htaccess', dong: null, bang_chung: 'thiếu ErrorDocument 404' });
  }
  if (cong.length) {
    ra.push(pt({
      id: 'SEC-HTACCESS-GAP', nhom: NHOM.BAO_MAT, muc: 'vang',
      tieu_de: 'Cửa an toàn .htaccess còn thiếu cổng', vi_sao: 'các directive phòng thủ cơ bản chưa có',
      ca: cong, cach_sua: 'Bổ sung vào .htaccess, push xong kiểm curl -sI ngay (luật 4).', phut: 15, lop: 'C',
    }));
  }

  /* ── Bộ audit tự soi: _audit/ và _mau/ phải bị chặn ──
   * Công cụ audit mà chính nó bị Google index là tự mâu thuẫn. */
  for (const [thuMuc, id] of [['_audit', 'SEC-AUDIT-EXPOSED'], ['_mau', 'SEC-MAU-EXPOSED']]) {
    const chanHtaccess = new RegExp(`RedirectMatch\\s+40[13][^\\n]*${thuMuc}`, 'i').test(kho.htaccess)
      || new RegExp(`Deny[^\\n]*${thuMuc}`, 'i').test(kho.htaccess)
      || new RegExp(`\\^/_\\([^)]*${thuMuc.replace('_', '')}`, 'i').test(kho.htaccess);
    const chanRobots = new RegExp(`Disallow:\\s*/${thuMuc}/`, 'i').test(kho.robots);
    if (!chanHtaccess || !chanRobots) {
      ra.push(pt({
        id, nhom: NHOM.BAO_MAT, muc: 'do',
        tieu_de: `Thư mục /${thuMuc}/ không được chặn đầy đủ`,
        vi_sao: 'repo = docroot, nên mọi file trong đó được phục vụ công khai tại 10x-lifeos.com',
        ca: [
          ...(chanHtaccess ? [] : [{ file: '.htaccess', dong: null, bang_chung: `không có luật chặn /${thuMuc}/` }]),
          ...(chanRobots ? [] : [{ file: 'robots.txt', dong: null, bang_chung: `không có Disallow: /${thuMuc}/` }]),
        ],
        cach_sua: `Thêm RedirectMatch 403 cho /${thuMuc}/ vào .htaccess và Disallow: /${thuMuc}/ vào robots.txt.`,
        phut: 3, lop: 'C',
      }));
    }
  }

  /* ── Quét secret. KHÔNG BAO GIỜ in giá trị — chỉ file:dòng + loại. ── */
  const MAU = [
    [/\bAKIA[0-9A-Z]{16}\b/, 'AWS access key'],
    [/\bghp_[A-Za-z0-9]{30,}\b/, 'GitHub personal token'],
    [/\bgithub_pat_[A-Za-z0-9_]{50,}\b/, 'GitHub fine-grained token'],
    [/\bxox[baprs]-[A-Za-z0-9-]{10,}\b/, 'Slack token'],
    [/\bsk-[A-Za-z0-9]{32,}\b/, 'OpenAI-style key'],
    [/\bsk-ant-[A-Za-z0-9_-]{20,}\b/, 'Anthropic key'],
    [/\bAIza[0-9A-Za-z_-]{35}\b/, 'Google API key'],
    [/-----BEGIN\s+(?:RSA|EC|OPENSSH|PGP|DSA)?\s*PRIVATE KEY-----/, 'private key'],
    [/\b(?:api[_-]?key|secret|password|access[_-]?token|client[_-]?secret)\s*[:=]\s*["'][A-Za-z0-9+/_-]{24,}["']/i, 'biến bí mật có giá trị dài'],
  ];
  const loRi = [];
  for (const f of kho.dsFile) {
    if (f.startsWith('_audit/')) continue; // chính file này chứa các mẫu regex
    const noi = kho.html.get(f) ?? kho.js.get(f) ?? kho.css.get(f);
    if (noi === undefined) continue;
    for (const [re, loai] of MAU) {
      const m = re.exec(noi);
      if (m) {
        const dong = noi.slice(0, m.index).split('\n').length;
        loRi.push({ file: f, dong, bang_chung: `${loai} (giá trị KHÔNG in ra)` });
      }
    }
  }
  if (loRi.length) {
    ra.push(pt({
      id: 'SEC-SECRET-SCAN', nhom: NHOM.BAO_MAT, muc: 'do',
      tieu_de: 'Nghi ngờ có khoá bí mật trong repo', vi_sao: 'repo public — bất kỳ ai cũng đọc được',
      ca: loRi, cach_sua: 'Thu hồi khoá NGAY, gỡ khỏi mã, và dọn khỏi lịch sử git nếu cần.', phut: 30, lop: 'C',
    }));
  }

  /* ── Luật 1: không file cài đặt trong repo ── */
  const nhiPhan = kho.dsFile.filter((f) => /\.(dmg|exe|zip|pkg|msi|apk|iso|7z)$/i.test(f))
    .map((f) => ({ file: f, dong: null, bang_chung: 'file cài đặt bị git theo dõi' }));
  if (nhiPhan.length) {
    ra.push(pt({
      id: 'SEC-BINARY-BLOCKED', nhom: NHOM.BAO_MAT, muc: 'do',
      tieu_de: 'Có file cài đặt trong repo (vi phạm luật 1)', vi_sao: 'luật 1 trong CLAUDE.md — phát hành qua GitHub Releases',
      ca: nhiPhan, cach_sua: 'Gỡ khỏi git, phát hành qua GitHub Releases.', phut: 20, lop: 'C',
    }));
  }

  /* ── .gitignore có chặn được file bí mật không ── */
  const thieuIgnore = ['.env', '*.pem', '*.key', '*.p12']
    .filter((p) => !kho.gitignore.split('\n').some((d) => d.trim() === p))
    .map((p) => ({ file: '.gitignore', dong: null, bang_chung: `chưa chặn ${p}` }));
  if (thieuIgnore.length) {
    ra.push(pt({
      id: 'SEC-GITIGNORE-GAP', nhom: NHOM.BAO_MAT, muc: 'vang',
      tieu_de: '.gitignore chưa chặn file bí mật', vi_sao: 'phòng ngừa — hiện chưa có file nào loại này bị commit',
      ca: thieuIgnore, cach_sua: 'Thêm các pattern còn thiếu vào .gitignore.', phut: 2, lop: 'B',
    }));
  }

  return ra;
}
