/* Nhóm DỮ-LIỆU. Site không có database — nhóm này định nghĩa lại "vấn đề database"
 * thành cái thực sự đáng lo với site tĩnh: dữ liệu người dùng gửi lên CÓ TỚI NƠI KHÔNG. */

import { pt, NHOM } from '../lib/ket-qua.mjs';
import { quetKhoi, xoaCommentJs, bangHangSoChuoi, soDong, layHost, xoaComment } from '../lib/html.mjs';
import { bocCspTuHtaccess, phanTichCsp, duocPhep } from '../lib/csp.mjs';
import { DOMAIN } from '../lib/kho.mjs';

const BAO_THANH_CONG = /(đã nhận|đã ghi nhận|cảm ơn bạn|thank you|thankyou|🎉|đăng ký thành công|gửi thành công)/i;

/** Lấy thân khối `{…}` bắt đầu từ vị trí dấu `{` đầu tiên sau `tu`, khớp ngoặc lồng nhau. */
function thanKhoi(js, tu) {
  const mo = js.indexOf('{', tu);
  if (mo === -1) return '';
  let sau = 0;
  for (let i = mo; i < js.length; i++) {
    if (js[i] === '{') sau++;
    else if (js[i] === '}') { sau--; if (sau === 0) return js.slice(mo + 1, i); }
  }
  return '';
}

/**
 * Nhánh chạy khi biến URL rỗng có dẫn tới màn "thành công" không?
 *
 * Chỉ có chuỗi "🎉 Đã nhận đăng ký" trong trang KHÔNG đủ để kết luận nói dối —
 * trang tử tế vẫn cần chuỗi đó cho lúc gửi thành công thật. Điều đáng báo là
 * nhánh-khi-rỗng gọi đúng hàm hiện màn thành công. Phân biệt được hai ca này
 * chính là ranh giới giữa cảnh báo thật và báo động giả.
 */
function nhanhRongDanToiThanhCong(js, tenBien) {
  const reIf = new RegExp(`if\\s*\\(\\s*!?\\s*${tenBien}\\b[^)]*\\)`, 'g');
  let m;
  while ((m = reIf.exec(js)) !== null) {
    const phuDinh = /\(\s*!/.test(m[0]);
    const thanThen = thanKhoi(js, m.index + m[0].length);
    const sauThen = js.indexOf('}', m.index + m[0].length + thanThen.length);
    const mElse = /^\s*else\b/.exec(js.slice(sauThen + 1, sauThen + 30));
    // Nhánh chạy khi biến rỗng: `else` của `if (VAR)`, hoặc `then` của `if (!VAR)`
    const nhanhRong = phuDinh ? thanThen : (mElse ? thanKhoi(js, sauThen + 1) : null);
    if (!nhanhRong) continue;

    for (const g of nhanhRong.matchAll(/\b([A-Za-z_$][\w$]*)\s*\(/g)) {
      const ten = g[1];
      if (['if', 'for', 'while', 'switch', 'catch', 'return', 'function'].includes(ten)) continue;
      const mHam = new RegExp(`function\\s+${ten}\\s*\\([^)]*\\)`).exec(js);
      const than = mHam ? thanKhoi(js, mHam.index + mHam[0].length) : '';
      if (BAO_THANH_CONG.test(than) || /thankyou/i.test(than)) return true;
    }
    if (BAO_THANH_CONG.test(nhanhRong) || /thankyou/i.test(nhanhRong)) return true;
  }
  return false;
}
const TEN_PII = /\b(sdt|so_?dien_?thoai|phone|tel|email|mail|hoten|ho_?ten|fullname|name|cccd|cmnd|dia_?chi|address)\b/i;

/** Gom mọi JS mà một trang thực sự chạy: inline + file .js nó nạp. */
function jsCuaTrang(kho, file) {
  const manh = [];
  for (const k of quetKhoi(kho.html.get(file), 'script')) {
    if (k.thuoc_tinh.src || /ld\+json/i.test(k.thuoc_tinh.type || '')) continue;
    manh.push({ nguon: file, noi_dung: k.noi_dung, offset_goc: k.offset_noi_dung });
  }
  for (const [jsFile, trang] of kho.trangNap) {
    if (trang.has(file) && kho.js.has(jsFile)) {
      manh.push({ nguon: jsFile, noi_dung: kho.js.get(jsFile), offset_goc: 0 });
    }
  }
  return manh;
}

/** Mọi ID check module này có thể phát ra — nguồn để đếm 'N kiểm tra đạt'. */
export const IDS = [
  'DATA-FORM-SINK',
  'DATA-FORM-FAKE-OK',
  'DATA-SINK-HOST-CSP',
  'DATA-PII-POLICY',
  'DATA-GA-CONSENT',
  'DATA-PAYMENT-EXPOSED',
];

export function chay(kho) {
  const ra = [];
  const cuaRaChet = [];
  const noiDoi = [];
  const hostCuaRa = [];
  const trangCoPII = [];

  for (const file of kho.trangThat) {
    const htmlGoc = kho.html.get(file);
    const html = xoaComment(htmlGoc);

    const form = [...html.matchAll(/<form\b((?:[^>"']|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/form\s*>/gi)];
    if (!form.length) continue;

    for (const f of form) {
      const thuocTinh = f[1];
      const than = f[2];
      const dongForm = soDong(htmlGoc, f.index);
      if (!/<(input|textarea|select)\b/i.test(than)) continue;

      const coPII = [...than.matchAll(/<input\b([^>]*)>/gi)].some((i) => {
        const a = i[1];
        return /type\s*=\s*["'](?:tel|email)["']/i.test(a) || TEN_PII.test(a);
      });
      if (coPII) trangCoPII.push({ file, dong: dongForm });

      /* Cửa ra 1: action không rỗng */
      const mAction = /\baction\s*=\s*["']([^"']*)["']/i.exec(thuocTinh);
      if (mAction && mAction[1].trim()) {
        const h = layHost(mAction[1]);
        if (h) hostCuaRa.push({ host: h, file, dong: dongForm, directive: 'form-action' });
        continue;
      }

      /* Cửa ra 2: fetch/XHR/sendBeacon trong JS của trang */
      const manh = jsCuaTrang(kho, file);
      let coCuaRaSong = false;
      let coCuaRaChet = null;
      let khongRo = false;

      for (const m of manh) {
        const sach = xoaCommentJs(m.noi_dung);
        const hangSo = bangHangSoChuoi(m.noi_dung);
        const reGoi = /(?:fetch|sendBeacon|\.open|new\s+WebSocket|new\s+EventSource)\s*\(\s*([^,)]+)/g;
        let g;
        while ((g = reGoi.exec(sach)) !== null) {
          const doiSo = g[1].trim().replace(/^['"]|['"]$/g, '');
          const laLiteral = /^['"]/.test(g[1].trim());
          if (laLiteral) {
            if (doiSo) { coCuaRaSong = true; const h = layHost(doiSo); if (h) hostCuaRa.push({ host: h, file, dong: dongForm, directive: 'connect-src' }); }
            continue;
          }
          const tenBien = /^[A-Za-z_$][\w$]*$/.exec(g[1].trim())?.[0];
          if (tenBien && hangSo.has(tenBien)) {
            const hs = hangSo.get(tenBien);
            if (hs.khong_ro) { khongRo = true; continue; }
            if (!hs.gia_tri) {
              const goc = m.nguon === file ? htmlGoc : kho.js.get(m.nguon);
              coCuaRaChet = { ten: tenBien, dong: soDong(goc, m.offset_goc + hs.offset), nguon: m.nguon };
            } else {
              coCuaRaSong = true;
              const h = layHost(hs.gia_tri);
              if (h) hostCuaRa.push({ host: h, file, dong: dongForm, directive: 'connect-src' });
            }
          } else {
            khongRo = true;
          }
        }
        // form.submit() hoặc location = ... cũng là cửa ra
        if (/\.submit\s*\(|location\s*(?:\.href)?\s*=/.test(sach)) khongRo = true;
      }

      if (!coCuaRaSong && coCuaRaChet) {
        cuaRaChet.push({
          file: coCuaRaChet.nguon, dong: coCuaRaChet.dong,
          bang_chung: `${coCuaRaChet.ten} = "" → nhánh gửi bất khả đạt (form ở ${file}:${dongForm})`,
        });
        const jsGop = manh.map((x) => xoaCommentJs(x.noi_dung)).join('\n');
        if (nhanhRongDanToiThanhCong(jsGop, coCuaRaChet.ten)) {
          noiDoi.push({
            file, dong: dongForm,
            bang_chung: `nhánh chạy khi ${coCuaRaChet.ten} rỗng vẫn gọi hàm hiện màn thành công`,
          });
        }
      } else if (!coCuaRaSong && !khongRo) {
        cuaRaChet.push({ file, dong: dongForm, bang_chung: 'form có input nhưng không tìm thấy cửa ra nào (không action, không fetch)' });
      }
    }
  }

  if (cuaRaChet.length) {
    ra.push(pt({
      id: 'DATA-FORM-SINK', nhom: NHOM.DU_LIEU, muc: 'do',
      tieu_de: 'Form thu thông tin nhưng dữ liệu KHÔNG đi đâu cả',
      vi_sao: 'mọi cửa ra tìm được đều là hằng số rỗng hoặc không tồn tại → mất 100% người đăng ký',
      ca: cuaRaChet,
      cach_sua: 'Nối endpoint thật (Apps Script/Formspree), HOẶC gỡ form thay bằng nút Zalo/email. Nhớ thêm host endpoint vào connect-src của CSP.',
      phut: 15, lop: 'C',
    }));
  }
  if (noiDoi.length) {
    ra.push(pt({
      id: 'DATA-FORM-FAKE-OK', nhom: NHOM.DU_LIEU, muc: 'do',
      tieu_de: 'Trang báo "đã nhận đăng ký" trong khi thực ra không nhận gì',
      vi_sao: 'form không có cửa ra sống mà vẫn hiện thông báo thành công — nói dối người dùng',
      ca: noiDoi,
      cach_sua: 'Chỉ hiện màn thành công SAU khi gửi thật sự thành công. Khi chưa nối endpoint thì hiện đường liên hệ thay thế.',
      phut: 10, lop: 'C',
    }));
  }

  /* DATA-SINK-HOST-CSP — cái bẫy nổ đúng lúc tưởng đã sửa xong */
  const csp = phanTichCsp(bocCspTuHtaccess(kho.htaccess));
  const bịChan = hostCuaRa
    .filter((h) => !duocPhep(csp, h.directive, h.host, DOMAIN))
    .map((h) => ({ file: h.file, dong: h.dong, bang_chung: `${h.host} không có trong ${h.directive}` }));
  if (bịChan.length) {
    ra.push(pt({
      id: 'DATA-SINK-HOST-CSP', nhom: NHOM.DU_LIEU, muc: 'do',
      tieu_de: 'Nơi nhận dữ liệu form bị chính CSP chặn',
      vi_sao: 'code gửi đúng nhưng trình duyệt chặn → vẫn mất dữ liệu',
      ca: bịChan, cach_sua: 'Thêm host vào connect-src (hoặc form-action) trong .htaccess.', phut: 5, lop: 'C',
    }));
  }

  /* DATA-PII-POLICY — thu SĐT/email mà không có trang chính sách */
  if (trangCoPII.length) {
    const coTrangChinhSach = kho.dsFile.some((f) => /(chinh-sach|privacy|dieu-khoan|terms)/i.test(f) && f.endsWith('.html'));
    if (!coTrangChinhSach) {
      ra.push(pt({
        id: 'DATA-PII-POLICY', nhom: NHOM.DU_LIEU, muc: 'do',
        tieu_de: 'Thu số điện thoại / email nhưng không có trang Chính sách bảo mật',
        vi_sao: 'Nghị định 13/2023/NĐ-CP yêu cầu thông báo và có căn cứ trước khi xử lý dữ liệu cá nhân',
        ca: trangCoPII.map((t) => ({ ...t, bang_chung: 'form thu dữ liệu cá nhân' })),
        cach_sua: 'Tạo /chinh-sach-bao-mat/ (thu gì, dùng làm gì, giữ bao lâu, liên hệ xoá) và link từ footer + cạnh form.',
        phut: 45, lop: 'C',
      }));
    }
  }

  /* DATA-GA-CONSENT */
  if (trangCoPII.length) {
    const coConsent = /gtag\(\s*['"]consent['"]/.test(kho.js.get('ga.js') || '')
      || kho.dsFile.some((f) => /consent|cookie-banner/i.test(f));
    if (!coConsent) {
      ra.push(pt({
        id: 'DATA-GA-CONSENT', nhom: NHOM.DU_LIEU, muc: 'vang',
        tieu_de: 'GA4 đặt cookie mà chưa có cơ chế đồng ý',
        vi_sao: 'site thu dữ liệu cá nhân + đặt cookie theo dõi, chưa có consent',
        ca: [{ file: 'ga.js', dong: null, bang_chung: 'không thấy gtag consent mode hay banner' }],
        cach_sua: 'Thêm consent mode mặc định denied, hoặc banner đồng ý gọn nhẹ.',
        phut: 30, lop: 'C',
      }));
    }
  }

  /* DATA-PAYMENT-EXPOSED — số tài khoản hardcode: cần chủ site xác nhận mỗi khi đổi */
  const tienTe = [];
  for (const file of kho.trangThat) {
    const noi = kho.html.get(file);
    const re = /\b(VPB|VCB|TCB|MBB?|ACB|BIDV|VTB|TPB|STB)[-\s]?(\d{8,16})\b/g;
    let m;
    while ((m = re.exec(noi)) !== null) {
      tienTe.push({ file, dong: soDong(noi, m.index), bang_chung: `số tài khoản ${m[1]} hardcode trong HTML` });
      break;
    }
  }
  if (tienTe.length) {
    ra.push(pt({
      id: 'DATA-PAYMENT-EXPOSED', nhom: NHOM.DU_LIEU, muc: 'vang',
      tieu_de: 'Số tài khoản ngân hàng nằm cứng trong HTML',
      vi_sao: 'chủ ý nhận tiền, nhưng đã vào lịch sử git vĩnh viễn và phải sửa tay mỗi khi đổi',
      ca: tienTe, do_tin_cay: 'vua',
      cach_sua: 'Giữ nguyên nếu cố ý. Ghi vào policy để tôi không hỏi lại. Nếu đổi số thì nhớ sửa cả QR động lẫn tĩnh.',
      phut: 5, lop: 'C',
    }));
  }

  return ra;
}
