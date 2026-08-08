#!/usr/bin/env node
/* Bộ audit hằng ngày cho 10x-lifeos.com.
 *
 *   node _audit/chay.mjs              → markdown ra stdout (chế độ tĩnh)
 *   node _audit/chay.mjs --live       → thêm nhóm check gọi ra site thật
 *   node _audit/chay.mjs --json       → JSON đầy đủ ra stdout
 *   node _audit/chay.mjs --ghi <thư-mục>  → ghi latest.json + latest.md
 *   node _audit/chay.mjs --truoc <file>   → đọc latest.json cũ để tính delta
 *
 * Zero dependency. Repo là docroot nên không được có package.json/node_modules.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { quetKho } from './lib/kho.mjs';
import { apPolicy } from './lib/xep-hang.mjs';
import { render, tinhDelta, ganTuoi, dungTrangThai } from './lib/render-md.mjs';
import { homNay } from './lib/ket-qua.mjs';

import * as cTrang from './checks/trang.mjs';
import * as cLienKet from './checks/lien-ket.mjs';
import * as cBaoMat from './checks/bao-mat.mjs';
import * as cKienTruc from './checks/kien-truc.mjs';
import * as cHieuNang from './checks/hieu-nang.mjs';
import * as cDuLieu from './checks/du-lieu.mjs';
import * as cLive from './checks/live.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..');

/* Tổng số check tự đếm từ danh mục ID mà mỗi module khai báo — không hardcode,
 * nên thêm check mới là con số "N kiểm tra đạt" tự đúng theo. */
const MOI_ID = [...new Set([
  ...cTrang.IDS, ...cLienKet.IDS, ...cBaoMat.IDS,
  ...cKienTruc.IDS, ...cHieuNang.IDS, ...cDuLieu.IDS, ...cLive.IDS,
])];

function docJson(duong, mac_dinh = null) {
  try { return JSON.parse(readFileSync(duong, 'utf8')); } catch { return mac_dinh; }
}

function thamSo(ten) {
  const i = process.argv.indexOf(ten);
  return i === -1 ? null : (process.argv[i + 1] ?? true);
}

async function main() {
  const coLive = process.argv.includes('--live');
  const raJson = process.argv.includes('--json');
  const thuMucGhi = thamSo('--ghi');
  const duongTruoc = thamSo('--truoc');

  const kho = quetKho(GOC);
  const policy = docJson(join(GOC, '_audit/cau-hinh/policy.json'), { schema: 1, muc_tu_chu: 0, quy_tac: [], hoan: [], bai_hoc: [] });

  let phatHien = [
    ...cTrang.chay(kho), ...cLienKet.chay(kho), ...cBaoMat.chay(kho),
    ...cKienTruc.chay(kho), ...cHieuNang.chay(kho), ...cDuLieu.chay(kho),
  ];
  let khongKiemDuoc = [];

  if (coLive) {
    const kq = await cLive.chay(kho);
    phatHien.push(...kq.phat_hien);
    khongKiemDuoc = kq.khong_kiem_duoc;
  } else {
    khongKiemDuoc = ['TRANG-LIVE-STATUS', 'TRANG-LIVE-HEADER', 'PERF-LIVE-TTFB', 'SEC-LIVE-TLS', 'LINK-EXT-DEAD']
      .map((id) => ({ id, ly_do: 'chạy ở chế độ tĩnh (không có --live)' }));
  }

  const truoc = duongTruoc ? docJson(duongTruoc) : null;
  const apDung = apPolicy(phatHien, policy);
  phatHien = ganTuoi(apDung.phat_hien, truoc);
  const delta = tinhDelta(phatHien, truoc);

  const ketQua = {
    schema: 1,
    ngay: homNay(),
    chay_luc: new Date().toISOString(),
    che_do: coLive ? 'live' : 'static',
    nhanh: kho.nhanh,
    commit: kho.commit,
    commit_ngay: kho.commitNgay,
    trang_that: kho.trangThat.size,
    muc_tu_chu: policy.muc_tu_chu ?? 0,
    tom_tat: {
      do: phatHien.filter((p) => p.muc === 'do').length,
      vang: phatHien.filter((p) => p.muc === 'vang').length,
      tong_check: MOI_ID.length,
      dat: MOI_ID.filter((id) => !phatHien.some((p) => p.id === id)
        && !khongKiemDuoc.some((k) => k.id === id)).length,
      hoan: apDung.dang_hoan,
      da_ha: apDung.da_ha,
      khong_kiem_duoc: khongKiemDuoc.length,
    },
    delta,
    phat_hien: phatHien,
    hoan: apDung.hoan,
    khong_kiem_duoc: khongKiemDuoc,
    trang_thai: dungTrangThai(phatHien),
  };

  const md = render({
    phat_hien: phatHien, kho, delta, che_do: ketQua.che_do,
    khong_kiem_duoc: khongKiemDuoc, da_ha: apDung.da_ha, hoan: apDung.hoan,
    so_check_dat: ketQua.tom_tat.dat, policy,
  });

  if (thuMucGhi && typeof thuMucGhi === 'string') {
    if (!existsSync(thuMucGhi)) mkdirSync(thuMucGhi, { recursive: true });
    writeFileSync(join(thuMucGhi, 'latest.json'), `${JSON.stringify(ketQua, null, 2)}\n`);
    writeFileSync(join(thuMucGhi, 'latest.md'), `${md}\n`);
    process.stderr.write(`đã ghi ${join(thuMucGhi, 'latest.json')} và latest.md\n`);
  }

  process.stdout.write(raJson ? `${JSON.stringify(ketQua, null, 2)}\n` : `${md}\n`);

  // Mã thoát: 2 nếu có đỏ, 1 nếu có vàng, 0 nếu sạch — để dùng được trong CI.
  process.exit(ketQua.tom_tat.do ? 2 : ketQua.tom_tat.vang ? 1 : 0);
}

main().catch((e) => {
  process.stderr.write(`LỖI BỘ AUDIT: ${e.stack || e}\n`);
  process.exit(3);
});
