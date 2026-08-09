/* Nhóm LIÊN-KẾT — "backlink" theo nghĩa kiểm được từ repo.
 * Backlink thật (ai trỏ VỀ mình) cần Search Console; ở đây không giả vờ đo.
 * Cái đo được: link mình trỏ đi, và đường vào của từng trang. */

import { pt, NHOM } from '../lib/ket-qua.mjs';
import { quetThe, quetLiteralChuoi, xoaCommentJs, soDong } from '../lib/html.mjs';

/** Mọi ID check module này có thể phát ra — nguồn để đếm 'N kiểm tra đạt'. */
export const IDS = [
  'LINK-INTERNAL-DEAD',
  'LINK-INTERNAL-DEAD-MAU',
  'LINK-ANCHOR-DEAD',
  'LINK-PLACEHOLDER',
  'LINK-ORPHAN-PAGE',
  'LINK-EXT-NOOPENER',
  'LINK-RELEASE-PINNED',
];

export function chay(kho) {
  const ra = [];

  /* ── Link nội bộ gãy ── */
  const gayTrangThat = [];
  const gayKhac = [];
  for (const l of kho.link) {
    if (!l.den_thieu) continue;
    const ca = { file: l.tu, dong: l.dong, bang_chung: `${l.goc} → không có file ${l.den_thieu}` };
    (kho.trangThat.has(l.tu) ? gayTrangThat : gayKhac).push(ca);
  }
  if (gayTrangThat.length) {
    ra.push(pt({
      id: 'LINK-INTERNAL-DEAD', nhom: NHOM.LIEN_KET, muc: 'do',
      tieu_de: 'Link nội bộ gãy trên trang thật', vi_sao: 'người dùng bấm vào sẽ ra trang 404',
      ca: gayTrangThat, cach_sua: 'Sửa đường dẫn hoặc tạo file còn thiếu.', phut: 5, lop: 'B',
    }));
  }
  if (gayKhac.length) {
    ra.push(pt({
      id: 'LINK-INTERNAL-DEAD-MAU', nhom: NHOM.LIEN_KET, muc: 'vang',
      tieu_de: 'Link gãy trong template nội bộ', vi_sao: 'không lộ ra site thật, nhưng template đẻ trang mới sẽ nhân bản link gãy',
      ca: gayKhac, cach_sua: 'Sửa trong _mau/ để trang sinh ra từ template không kế thừa link gãy.', phut: 10, lop: 'B',
    }));
  }

  /* ── Neo (#id) trỏ tới id không tồn tại ── */
  const idTheoFile = new Map();
  for (const [f, bd] of kho.banDoIdTheoFile) idTheoFile.set(f, new Set(bd.keys()));
  const neoChet = [];
  for (const l of kho.link) {
    if (!l.neo || !l.den) continue;
    const tap = idTheoFile.get(l.den);
    if (!tap) continue;
    if (!tap.has(l.neo.toLowerCase())) {
      neoChet.push({ file: l.tu, dong: l.dong, bang_chung: `#${l.neo} không tồn tại trong ${l.den}` });
    }
  }
  if (neoChet.length) {
    ra.push(pt({
      id: 'LINK-ANCHOR-DEAD', nhom: NHOM.LIEN_KET, muc: 'vang',
      tieu_de: 'Link neo trỏ tới mục không tồn tại', vi_sao: 'bấm vào không nhảy tới đâu',
      ca: neoChet, do_tin_cay: 'vua',
      cach_sua: 'Sửa id đích hoặc bỏ neo.', phut: 5, lop: 'B',
    }));
  }

  /* ── href="#" trong file trang thật thực sự nạp ── */
  const gia = [];
  const quetGia = (f, noi, laJs) => {
    if (laJs) {
      for (const lit of quetLiteralChuoi(xoaCommentJs(noi))) {
        if (lit.gia_tri === '#' || lit.gia_tri === '') {
          const truoc = noi.slice(Math.max(0, lit.offset - 40), lit.offset);
          if (/\b(?:li|so|a|link|href)\s*\(\s*$/.test(truoc)) {
            gia.push({ file: f, dong: soDong(noi, lit.offset), bang_chung: 'link rỗng "#" — bấm không đi đâu' });
          }
        }
      }
    } else {
      for (const t of quetThe(noi, ['a'])) {
        const h = (t.thuoc_tinh.href ?? '').trim();
        if (h === '#' || h === '') gia.push({ file: f, dong: t.dong, bang_chung: `<a href="${h}"> — bấm không đi đâu` });
      }
    }
  };
  for (const f of kho.trangThat) quetGia(f, kho.html.get(f), false);
  for (const [jsFile, trang] of kho.trangNap) {
    if (![...trang].some((t) => kho.trangThat.has(t))) continue;
    if (kho.js.has(jsFile)) quetGia(jsFile, kho.js.get(jsFile), true);
  }
  if (gia.length) {
    ra.push(pt({
      id: 'LINK-PLACEHOLDER', nhom: NHOM.LIEN_KET, muc: 'vang',
      tieu_de: 'Còn link giữ chỗ chưa nối', vi_sao: 'href="#" hoặc rỗng trong file mà trang thật đang nạp',
      ca: gia, cach_sua: 'Nối đúng địa chỉ, hoặc gỡ mục đó khỏi giao diện cho tới khi có.', phut: 10, lop: 'B',
    }));
  }

  /* ── Trang mồ côi: không trang nào trỏ tới ── */
  const moCoi = [];
  for (const f of kho.trangThat) {
    if (f === 'index.html') continue;
    const vao = kho.troToi.get(f);
    const soVao = vao ? [...vao].filter((t) => t !== f).length : 0;
    if (soVao === 0) {
      moCoi.push({ file: f, dong: null, bang_chung: 'không file nào trên site trỏ tới trang này' });
    }
  }
  if (moCoi.length) {
    ra.push(pt({
      id: 'LINK-ORPHAN-PAGE', nhom: NHOM.LIEN_KET, muc: 'vang',
      tieu_de: 'Trang thật không có đường vào từ site',
      vi_sao: 'không link nội bộ nào trỏ tới → Google khó tìm, người dùng không bao giờ tới được nếu không có link ngoài',
      ca: moCoi, cach_sua: 'Thêm link từ footer.js, trang chủ, hoặc bài blog liên quan.', phut: 10, lop: 'B',
    }));
  }

  /* ── target="_blank" thiếu noopener ── */
  const hoHang = [];
  for (const f of kho.trangThat) {
    for (const t of quetThe(kho.html.get(f), ['a'])) {
      const a = t.thuoc_tinh;
      if ((a.target || '').toLowerCase() !== '_blank') continue;
      if (!/noopener/i.test(a.rel || '')) hoHang.push({ file: f, dong: t.dong, bang_chung: `target=_blank thiếu rel=noopener → ${a.href || ''}`.slice(0, 110) });
    }
  }
  if (hoHang.length) {
    ra.push(pt({
      id: 'LINK-EXT-NOOPENER', nhom: NHOM.LIEN_KET, muc: 'vang',
      tieu_de: 'Link mở tab mới thiếu rel="noopener"', vi_sao: 'trang đích có thể điều khiển tab gốc',
      ca: hoHang, cach_sua: 'Thêm rel="noopener" (kèm noreferrer nếu muốn).', phut: 3, lop: 'A',
    }));
  }

  /* ── Link tải app ghim cứng số phiên bản ── */
  const ghim = [];
  for (const f of [...kho.trangThat, ...kho.js.keys()]) {
    const noi = kho.html.get(f) ?? kho.js.get(f);
    if (!noi) continue;
    const re = /https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/releases\/download\/([^/'"\s]+)\//g;
    let m;
    while ((m = re.exec(noi)) !== null) {
      ghim.push({ file: f, dong: soDong(noi, m.index), bang_chung: `ghim phiên bản ${m[1]} — sẽ chết khi ra bản mới` });
    }
  }
  if (ghim.length) {
    ra.push(pt({
      id: 'LINK-RELEASE-PINNED', nhom: NHOM.LIEN_KET, muc: 'vang',
      tieu_de: 'Link tải app ghim cứng số phiên bản',
      vi_sao: 'luật 1 yêu cầu dạng releases/latest/download/<file> — link ghim sẽ chết im lặng khi phát hành bản mới',
      ca: ghim, cach_sua: 'Đổi sang /releases/latest/download/<tên-file>.', phut: 10, lop: 'B',
    }));
  }

  return ra;
}
