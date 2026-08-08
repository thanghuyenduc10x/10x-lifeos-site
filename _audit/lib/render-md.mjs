/* Dựng báo cáo markdown 5 phút. HẠN NGẠCH LÀ CƯỠNG CHẾ, không phải khuyến nghị.
 * Bộ audit hằng ngày chết vì mệt-vì-cảnh-báo chứ không vì thiếu check. */

import { homNay, lechNgay } from './ket-qua.mjs';

export const HAN = {
  tong_dong: 110,
  tong_ky_tu: 6000,
  do_toi_da: 5,
  vang_toi_da: 6,
  bang_chung_ky_tu: 120,
  no_cu_ngay: 7,
};

const BIEU = { do: '🔴', vang: '🟡', xanh: '🟢' };

/* Thứ tự ưu tiên mặc định khi mọi thứ cùng mức đỏ.
 * Mất lead và chặn thanh toán đứng trên mọi thứ khác — một trang bán hàng hỏng
 * tốn tiền thật ngay hôm nay, còn nợ kiến trúc thì không. Chủ site đổi được
 * thứ tự này bằng quy tắc nang_muc trong policy.json. */
const UU_TIEN_NHOM = { 'DỮ-LIỆU': 0, 'BẢO-MẬT': 1, TRANG: 2, 'LIÊN-KẾT': 3, 'KIẾN-TRÚC': 4, 'HIỆU-NĂNG': 5 };
const trongSo = (p) => UU_TIEN_NHOM[p.nhom] ?? 9;
const tuoiVi = (p) => (p.so_ngay_ton_tai > 0 ? `${p.so_ngay_ton_tai} ngày` : 'mới hôm nay');
const THU = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

function ngayVi(iso) {
  const d = new Date(`${iso}T12:00:00Z`);
  return `${THU[d.getUTCDay()]} ${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
}

const cat = (s, n) => (s && s.length > n ? `${s.slice(0, n - 1)}…` : s || '');

/** So với lần chạy trước: mới / hết / nặng thêm / nhẹ đi. */
export function tinhDelta(phatHien, truoc) {
  if (!truoc?.trang_thai) return null;
  const nay = new Map(phatHien.map((p) => [p.id, p]));
  const cu = truoc.trang_thai;
  const moi = [];
  const het = [];
  const nang = [];
  for (const [id, p] of nay) if (!(id in cu)) moi.push({ id, tieu_de: p.tieu_de, muc: p.muc });
  for (const id of Object.keys(cu)) if (!nay.has(id)) het.push({ id, tieu_de: cu[id].tieu_de });
  for (const [id, p] of nay) {
    if (!(id in cu)) continue;
    if (cu[id].muc === 'vang' && p.muc === 'do') nang.push({ id, tieu_de: p.tieu_de, tu: 'vang', len: 'do' });
  }
  return { so_voi: truoc.ngay, moi, het, nang };
}

/** Gắn "lần đầu thấy" và "tồn tại bao nhiêu ngày" — thứ làm nên tính hành động của báo cáo. */
export function ganTuoi(phatHien, truoc) {
  const ngay = homNay();
  for (const p of phatHien) {
    const cu = truoc?.trang_thai?.[p.id];
    p.lan_dau_thay = cu?.lan_dau_thay ?? ngay;
    p.so_ngay_ton_tai = lechNgay(ngay, p.lan_dau_thay);
  }
  return phatHien;
}

export function dungTrangThai(phatHien) {
  const t = {};
  for (const p of phatHien) {
    t[p.id] = { muc: p.muc, so_ca: p.so_ca, tieu_de: p.tieu_de, lan_dau_thay: p.lan_dau_thay };
  }
  return t;
}

/** Việc 5 phút hôm nay: đỏ nặng nhất; nếu không có đỏ thì vàng lời/phút cao nhất. */
function chonViecHomNay(phatHien) {
  const do_ = phatHien.filter((p) => p.muc === 'do');
  if (do_.length) {
    // Trong nhóm ưu tiên cao nhất, chọn việc nhanh nhất — để 5 phút là làm xong thật.
    const nhomCao = Math.min(...do_.map(trongSo));
    return [...do_].filter((p) => trongSo(p) === nhomCao)
      .sort((a, b) => a.phut_uoc_tinh - b.phut_uoc_tinh || b.so_ngay_ton_tai - a.so_ngay_ton_tai)[0];
  }
  const vang = phatHien.filter((p) => p.muc === 'vang');
  if (!vang.length) return null;
  return [...vang].sort((a, b) => (b.so_ca / b.phut_uoc_tinh) - (a.so_ca / a.phut_uoc_tinh))[0];
}

export function render(kq) {
  const { phat_hien: ph, kho, delta, che_do, khong_kiem_duoc = [], da_ha = 0, hoan = [], policy } = kq;
  const ngay = homNay();
  const do_ = ph.filter((p) => p.muc === 'do');
  const vang = ph.filter((p) => p.muc === 'vang');
  const D = [];

  D.push(`# Sức khoẻ 10x-lifeos.com · ${ngayVi(ngay)}`, '');
  D.push(`${BIEU.do} ${do_.length}   ${BIEU.vang} ${vang.length}   ${BIEU.xanh} ${kq.so_check_dat} kiểm tra đạt   ⏸ ${hoan.length} hoãn   ❓ ${khong_kiem_duoc.length} không kiểm được`);
  D.push(`Chế độ: ${che_do === 'live' ? 'có kiểm site thật' : 'chỉ đọc repo (mạng ra ngoài đang chặn)'} · nhánh ${kho.nhanh} · commit ${kho.commit} · sửa lần cuối ${kho.commitNgay}`);

  if (delta) {
    const p = [];
    if (delta.moi.length) p.push(`${delta.moi.length} mới`);
    if (delta.het.length) p.push(`${delta.het.length} đã hết`);
    if (delta.nang.length) p.push(`${delta.nang.length} nặng thêm`);
    D.push(`Đổi so với ${delta.so_voi}: ${p.length ? p.join(' · ') : 'không có gì đổi'}`);
    for (const m of delta.moi.slice(0, 3)) D.push(`  ↑ MỚI ${BIEU[m.muc]} ${m.tieu_de}`);
    for (const m of delta.het.slice(0, 3)) D.push(`  ↓ HẾT ${m.tieu_de}`);
  } else {
    D.push('Đổi so với hôm qua: (lần chạy đầu — chưa có mốc so sánh)');
  }
  if (da_ha || hoan.length) D.push(`Đã hạ mức theo quyết định của bạn: ${da_ha} mục · Đang hoãn: ${hoan.length} mục`);
  D.push('');

  /* ── Chế độ yên tĩnh: không có đỏ và không có gì đổi → báo cáo rút gọn ──
   * Nếu sáng nào cũng in 20 mục y hệt thì tới ngày thứ ba là không ai đọc nữa. */
  const yenTinh = !do_.length && delta && !delta.moi.length && !delta.het.length && !delta.nang.length;
  if (yenTinh) {
    D.push(`${BIEU.xanh} **Không có gì cần bạn xử lý hôm nay.**`, '');
    D.push(`Còn ${vang.length} mục vàng tồn đọng (đã báo từ trước, không mục nào xấu thêm).`);
    const v = chonViecHomNay(ph);
    if (v) D.push('', `Nếu rảnh 5 phút: ${v.tieu_de} — ${cat(v.cach_sua, 150)}`);
    if (khong_kiem_duoc.length) D.push('', `❓ ${khong_kiem_duoc.length} kiểm tra không chạy được: ${khong_kiem_duoc[0].ly_do}`);
    return D.join('\n');
  }

  /* ── ĐỎ: tối đa 5 mục × 3 dòng ── */
  if (do_.length) {
    D.push('## 🔴 Phải xử lý');
    const xep = [...do_].sort((a, b) => trongSo(a) - trongSo(b)
      || b.so_ngay_ton_tai - a.so_ngay_ton_tai || a.phut_uoc_tinh - b.phut_uoc_tinh);
    xep.slice(0, HAN.do_toi_da).forEach((p, i) => {
      D.push(`**${i + 1}. ${p.tieu_de}** · ${tuoiVi(p)}${p.so_ca > 1 ? ` · ${p.so_ca} chỗ` : ''}`);
      const c = p.ca[0];
      if (c) D.push(`   \`${c.file}${c.dong ? `:${c.dong}` : ''}\` — ${cat(c.bang_chung, HAN.bang_chung_ky_tu)}`);
      D.push(`   → ${cat(p.cach_sua, 190)} ~${p.phut_uoc_tinh} phút.`);
    });
    if (xep.length > HAN.do_toi_da) D.push(`… còn ${xep.length - HAN.do_toi_da} mục đỏ nữa → xem latest.json`);
    D.push('');
  }

  /* ── VÀNG: tối đa 6 mục × 1 dòng, nợ cũ gộp 1 dòng ── */
  const vangMoi = vang.filter((p) => p.so_ngay_ton_tai <= HAN.no_cu_ngay);
  const vangCu = vang.filter((p) => p.so_ngay_ton_tai > HAN.no_cu_ngay);
  const vangHien = (vangMoi.length ? vangMoi : vang);
  if (vangHien.length) {
    D.push('## 🟡 Nên xử lý');
    const xepV = [...vangHien].sort((a, b) => trongSo(a) - trongSo(b) || b.so_ca - a.so_ca);
    for (const p of xepV.slice(0, HAN.vang_toi_da)) {
      D.push(`- \`${p.id}\` · ${cat(p.tieu_de, 78)}${p.so_ca > 1 ? ` (${p.so_ca} chỗ)` : ''} · ${tuoiVi(p)}`);
    }
    const con = vangHien.length - HAN.vang_toi_da;
    if (con > 0) D.push(`- … còn ${con} mục nữa → xem latest.json`);
    D.push('');
  }
  if (vangMoi.length && vangCu.length) {
    D.push(`**Nợ cũ:** ${vangCu.length} mục vàng tồn hơn ${HAN.no_cu_ngay} ngày, không mục nào xấu thêm.`, '');
  }

  if (hoan.length) {
    D.push(`**⏸ Đang hoãn:** ${hoan.map((h) => `${h.id} (đến ${h.hoan_den})`).join(' · ')}`, '');
  }

  /* ── Đúng 1 việc ── */
  const viec = chonViecHomNay(ph);
  if (viec) {
    D.push('## ⏱ Việc 5 phút hôm nay');
    D.push(`**${viec.tieu_de}**`);
    D.push(cat(viec.cach_sua, 260));
    if (viec.lop_tu_chu === 'C') D.push('_Mục này cần bạn quyết — tôi không tự sửa._');
    D.push('');
  }

  /* Thứ Hai: khối 5 việc tuần — đây là 5 phút/tuần */
  if (new Date(`${ngay}T12:00:00Z`).getUTCDay() === 1 && vang.length) {
    D.push('## 📋 5 việc tuần này');
    const xep = [...vang].sort((a, b) => (b.so_ca / b.phut_uoc_tinh) - (a.so_ca / a.phut_uoc_tinh));
    xep.slice(0, 5).forEach((p, i) => D.push(`${i + 1}. ${cat(p.tieu_de, 80)} (~${p.phut_uoc_tinh}p)`));
    D.push('');
  }

  if (khong_kiem_duoc.length) {
    D.push('## ❓ Không kiểm được hôm nay');
    D.push(`${khong_kiem_duoc.map((k) => k.id).join(', ')} — ${khong_kiem_duoc[0].ly_do}`);
    D.push('Mở Network access → Custom cho 10x-lifeos.com để bật nhóm kiểm tra này.');
  }

  /* ── Cưỡng chế hạn ngạch ── */
  let ra = D.join('\n');
  let dong = ra.split('\n');
  if (dong.length > HAN.tong_dong) {
    dong = dong.slice(0, HAN.tong_dong - 1);
    dong.push(`… (đã cắt cho vừa ${HAN.tong_dong} dòng — chi tiết đầy đủ trong latest.json)`);
    ra = dong.join('\n');
  }
  if (ra.length > HAN.tong_ky_tu) {
    ra = `${ra.slice(0, HAN.tong_ky_tu - 60)}\n… (đã cắt — chi tiết đầy đủ trong latest.json)`;
  }
  return ra;
}
