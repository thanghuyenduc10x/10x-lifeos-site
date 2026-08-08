/* Tiện ích đọc HTML — cố tình KHÔNG dùng DOM parser để giữ zero-dependency.
 * Ranh giới của chỗ này: đủ tốt cho <head>, thuộc tính thẻ và khối <script>/<style>.
 * Không đủ để suy luận cây DOM. Check nào cần cây DOM phải khai do_tin_cay:'thap'. */

/** Đánh dấu vùng comment/CDATA để không quét nhầm, nhưng GIỮ NGUYÊN độ dài chuỗi
 *  → mọi offset tính được vẫn trỏ đúng dòng trong file gốc. */
export function xoaComment(html) {
  return html.replace(/<!--[\s\S]*?-->/g, (m) => ' '.repeat(m.length));
}

/** Xoá comment JS (// và /* *\/) nhưng giữ độ dài. Bỏ qua comment nằm trong chuỗi. */
export function xoaCommentJs(js) {
  let ra = '';
  let i = 0;
  let trongChuoi = null; // ký tự mở chuỗi đang dở
  while (i < js.length) {
    const c = js[i];
    const c2 = js[i + 1];
    if (trongChuoi) {
      if (c === '\\') { ra += js.slice(i, i + 2); i += 2; continue; }
      if (c === trongChuoi) trongChuoi = null;
      ra += c; i++; continue;
    }
    if (c === '"' || c === "'" || c === '`') { trongChuoi = c; ra += c; i++; continue; }
    if (c === '/' && c2 === '/') {
      const het = js.indexOf('\n', i);
      const cuoi = het === -1 ? js.length : het;
      ra += ' '.repeat(cuoi - i); i = cuoi; continue;
    }
    if (c === '/' && c2 === '*') {
      const het = js.indexOf('*/', i + 2);
      const cuoi = het === -1 ? js.length : het + 2;
      ra += js.slice(i, cuoi).replace(/[^\n]/g, ' '); i = cuoi; continue;
    }
    ra += c; i++;
  }
  return ra;
}

/** Số dòng (1-based) của offset ký tự. */
export function soDong(noiDung, offset) {
  let d = 1;
  for (let i = 0; i < offset && i < noiDung.length; i++) if (noiDung[i] === '\n') d++;
  return d;
}

const RE_THUOC_TINH = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>`]+)))?/g;

/** Bóc thuộc tính từ phần bên trong một thẻ mở. Tên thuộc tính hạ về chữ thường. */
export function docThuocTinh(phanTrongThe) {
  const ra = {};
  let m;
  RE_THUOC_TINH.lastIndex = 0;
  while ((m = RE_THUOC_TINH.exec(phanTrongThe)) !== null) {
    const ten = m[1].toLowerCase();
    if (ten in ra) continue; // thuộc tính trùng: trình duyệt lấy cái đầu
    ra[ten] = m[2] ?? m[3] ?? m[4] ?? '';
  }
  return ra;
}

/**
 * Quét mọi thẻ mở có tên trong `ten` (mảng, chữ thường).
 * Trả [{ten, thuoc_tinh, dong, offset}]. Đã bỏ qua vùng comment.
 */
export function quetThe(html, ten) {
  const sach = xoaComment(html);
  const tap = new Set(ten.map((t) => t.toLowerCase()));
  const re = /<([a-zA-Z][a-zA-Z0-9-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
  const ra = [];
  let m;
  while ((m = re.exec(sach)) !== null) {
    const tenThe = m[1].toLowerCase();
    if (!tap.has(tenThe)) continue;
    ra.push({
      ten: tenThe,
      thuoc_tinh: docThuocTinh(m[2]),
      offset: m.index,
      dong: soDong(html, m.index),
    });
  }
  return ra;
}

/** Bóc mọi khối <script>…</script> hoặc <style>…</style> cùng thuộc tính và số dòng. */
export function quetKhoi(html, tenThe) {
  const sach = xoaComment(html);
  const re = new RegExp(`<${tenThe}((?:[^>"']|"[^"]*"|'[^']*')*)>([\\s\\S]*?)</${tenThe}\\s*>`, 'gi');
  const ra = [];
  let m;
  while ((m = re.exec(sach)) !== null) {
    ra.push({
      thuoc_tinh: docThuocTinh(m[1]),
      noi_dung: m[2],
      offset_noi_dung: m.index + m[0].length - m[2].length - (tenThe.length + 3),
      dong: soDong(html, m.index),
    });
  }
  return ra;
}

/** Phần <head>…</head>; nếu không có thẻ head thì lấy 8000 ký tự đầu (đủ mọi meta thực tế). */
export function layHead(html) {
  const m = /<head\b[^>]*>([\s\S]*?)<\/head\s*>/i.exec(xoaComment(html));
  return m ? m[1] : xoaComment(html).slice(0, 8000);
}

/** Nội dung <body>; dùng để cấm sửa chữ nghĩa và để đếm thẻ hiển thị. */
export function layBody(html) {
  const m = /<body\b[^>]*>([\s\S]*?)<\/body\s*>/i.exec(xoaComment(html));
  return m ? m[1] : '';
}

/** Mọi literal chuỗi trong JS (nháy đơn/kép/backtick) kèm offset — nền cho việc dò host động. */
export function quetLiteralChuoi(js) {
  const ra = [];
  const re = /"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|`((?:[^`\\]|\\.)*)`/g;
  let m;
  while ((m = re.exec(js)) !== null) {
    ra.push({ gia_tri: m[1] ?? m[2] ?? m[3] ?? '', offset: m.index, do_dai: m[0].length });
  }
  return ra;
}

/**
 * Bảng hằng số chuỗi cấp cao nhất: `var|let|const TEN = "..."`.
 * Gán nhiều lần cho cùng tên → 'khong_ro' (không dám kết luận).
 * Đây là nền của DATA-FORM-SINK: biết được biến URL có rỗng hay không.
 */
export function bangHangSoChuoi(js) {
  const sach = xoaCommentJs(js);
  const bang = new Map();
  const re = /\b(?:var|let|const)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)')\s*[;,\n]/g;
  let m;
  while ((m = re.exec(sach)) !== null) {
    const ten = m[1];
    const gia_tri = m[2] ?? m[3] ?? '';
    if (bang.has(ten) && bang.get(ten).gia_tri !== gia_tri) {
      bang.set(ten, { gia_tri: null, khong_ro: true, offset: bang.get(ten).offset });
    } else if (!bang.has(ten)) {
      // offset TƯƠNG ĐỐI trong chuỗi js truyền vào — nơi gọi phải cộng offset gốc
      // để ra số dòng đúng trong file. Trả dong sẵn ở đây là nguồn sai số dòng.
      bang.set(ten, { gia_tri, khong_ro: false, offset: m.index });
    }
  }
  // Gán lại ngoài khai báo (TEN = "...") cũng tính là đổi giá trị
  const re2 = /(?:^|[;{}\n])\s*([A-Za-z_$][\w$]*)\s*=\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)')\s*[;,\n]/g;
  while ((m = re2.exec(sach)) !== null) {
    const ten = m[1];
    const gia_tri = m[2] ?? m[3] ?? '';
    const cu = bang.get(ten);
    if (cu && !cu.khong_ro && cu.gia_tri !== gia_tri) bang.set(ten, { ...cu, gia_tri: null, khong_ro: true });
  }
  return bang;
}

/** Host của một URL tuyệt đối http(s); null nếu không phải. */
export function layHost(url) {
  const m = /^https?:\/\/([^/?#'"\s\\]+)/i.exec(String(url).trim());
  return m ? m[1].toLowerCase().replace(/:\d+$/, '') : null;
}
