/* Khuôn chung của một phát hiện. Mọi check trả về mảng các object hình này. */

export const NHOM = {
  TRANG: 'TRANG', LIEN_KET: 'LIÊN-KẾT', BAO_MAT: 'BẢO-MẬT',
  KIEN_TRUC: 'KIẾN-TRÚC', HIEU_NANG: 'HIỆU-NĂNG', DU_LIEU: 'DỮ-LIỆU',
};

/**
 * @param {object} o
 * @param {string} o.id           ID bất biến, vd 'SEC-CSP-HOST'
 * @param {string} o.nhom
 * @param {'do'|'vang'|'xanh'} o.muc
 * @param {string} o.tieu_de
 * @param {string} o.vi_sao       vì sao mức này — phải là tiêu chí máy móc, không cảm tính
 * @param {Array}  o.ca           [{file, dong, bang_chung}]
 * @param {string} o.cach_sua
 * @param {number} o.phut         ước tính phút sửa
 * @param {'A'|'B'|'C'} o.lop     lớp tự chủ
 * @param {'cao'|'vua'|'thap'} [o.do_tin_cay]
 */
export function pt(o) {
  const doTinCay = o.do_tin_cay ?? 'cao';
  // Van an toàn: check độ tin cậy thấp KHÔNG BAO GIỜ được lên đỏ.
  // Một regex đoán sai không được phép làm chủ site hoảng lúc 8h30.
  const muc = doTinCay === 'thap' && o.muc === 'do' ? 'vang' : o.muc;
  return {
    id: o.id, nhom: o.nhom, muc, muc_goc: muc, do_tin_cay: doTinCay,
    tieu_de: o.tieu_de, vi_sao_muc_nay: o.vi_sao,
    so_ca: o.ca.length, ca: o.ca.slice(0, 12), ca_bi_cat: Math.max(0, o.ca.length - 12),
    cach_sua: o.cach_sua, phut_uoc_tinh: o.phut, lop_tu_chu: o.lop,
  };
}

/** Ngày hôm nay dạng YYYY-MM-DD (UTC — khớp với cách git ghi --date=short). */
export function homNay() {
  return new Date().toISOString().slice(0, 10);
}

export function lechNgay(a, b) {
  return Math.round((new Date(a) - new Date(b)) / 86400000);
}
