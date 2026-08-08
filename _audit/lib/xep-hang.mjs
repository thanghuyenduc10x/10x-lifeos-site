/* Áp policy.json lên mức gốc mà check trả về.
 * Nguyên tắc cứng: policy CHỈ ĐƯỢC đổi cách trình bày, KHÔNG được xoá sự thật.
 * muc_goc luôn giữ nguyên trong JSON, và báo cáo luôn in số mục đã hạ/hoãn. */

import { homNay } from './ket-qua.mjs';

const THU_TU = { do: 0, vang: 1, xanh: 2 };

function khopPhamVi(quyTac, phatHien) {
  const pv = quyTac.pham_vi || {};
  if (pv.tat_ca) return true;
  if (Array.isArray(pv.file) && pv.file.length) {
    return phatHien.ca.some((c) => pv.file.includes(c.file));
  }
  return false;
}

function khopId(mau, id) {
  if (mau === id) return true;
  if (mau.endsWith('*')) return id.startsWith(mau.slice(0, -1));
  return false;
}

function conHan(ngayHet) {
  return !ngayHet || ngayHet >= homNay();
}

/**
 * @returns {{phat_hien: Array, da_ha: number, dang_hoan: number, hoan: Array}}
 */
export function apPolicy(phatHien, policy) {
  const quyTac = (policy?.quy_tac ?? []).filter((r) => r.da_xac_nhan && conHan(r.het_han));
  const hoanCauHinh = (policy?.hoan ?? []).filter((h) => conHan(h.den_ngay));

  let daHa = 0;
  const hoan = [];
  const giuLai = [];

  for (const p of phatHien) {
    // 1. Hoãn có thời hạn — ra khỏi đỏ/vàng, vào mục ⏸ riêng
    const h = hoanCauHinh.find((x) => khopId(x.ap_cho, p.id) && khopPhamVi(x, p));
    if (h) {
      hoan.push({ ...p, hoan_den: h.den_ngay, hoan_ly_do: h.ly_do });
      continue;
    }

    let ra = { ...p, policy_ap_dung: null };

    // 2. Nâng mức trước — bảo vệ mối lo lớn nhất của chủ site
    for (const r of quyTac) {
      if (r.hanh_dong !== 'nang_muc') continue;
      if (!khopId(r.ap_cho, p.id) || !khopPhamVi(r, p)) continue;
      if (THU_TU[r.muc_moi] < THU_TU[ra.muc]) {
        ra = { ...ra, muc: r.muc_moi, policy_ap_dung: r.id };
      }
    }

    // 3. Hạ mức / bỏ qua — chỉ khi đã xác nhận và còn hạn
    for (const r of quyTac) {
      if (r.hanh_dong !== 'ha_muc' && r.hanh_dong !== 'bo_qua') continue;
      if (!khopId(r.ap_cho, p.id) || !khopPhamVi(r, p)) continue;
      const mucMoi = r.hanh_dong === 'bo_qua' ? 'xanh' : (r.muc_moi ?? 'vang');
      if (THU_TU[mucMoi] > THU_TU[ra.muc]) {
        ra = { ...ra, muc: mucMoi, policy_ap_dung: r.id };
        daHa++;
      }
    }

    if (ra.muc !== 'xanh') giuLai.push(ra);
    else if (ra.policy_ap_dung) daHa = daHa; // đã đếm ở trên
  }

  return { phat_hien: giuLai, da_ha: daHa, dang_hoan: hoan.length, hoan };
}

/** Loại lỗi nào được phép tự sửa ở mức tự chủ hiện tại. */
export function duocTuSua(phatHien, policy) {
  const muc = policy?.muc_tu_chu ?? 0;
  if (muc < 3) return false;
  if (phatHien.lop_tu_chu === 'A') return true;
  // Chủ site có thể nâng B → A bằng quy tắc cho_tu_sua. C thì KHÔNG BAO GIỜ.
  if (phatHien.lop_tu_chu === 'C') return false;
  return (policy?.quy_tac ?? []).some(
    (r) => r.hanh_dong === 'cho_tu_sua' && r.da_xac_nhan && conHan(r.het_han) && khopId(r.ap_cho, phatHien.id),
  );
}
