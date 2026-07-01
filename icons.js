/* ============================================================
   BỘ ICON CHỨC NĂNG CHUẨN 10X — dùng chung mọi trang.
   Cách dùng:  <span class="ic10" data-ic="shield"></span>
               <script src="/icons.js"></script>   (đặt cuối trang)
   → icons.js tự chèn SVG vào mọi phần tử có [data-ic].
   Sửa/thêm icon 1 lần ở ĐÂY → cả web đổi. ĐỪNG vẽ icon inline trong trang nữa.

   Chuẩn nhận diện (brand-identity v2):
   - viewBox 24×24 · nét 1.8 · bo tròn · fill=none stroke=currentColor
   - ĐÚNG MỘT chấm/nét cam #C96028 mỗi icon ("la bàn luôn chỉ Bắc")
   - Thân icon nên để màu trung tính (vd color:#DDDDF0) để chấm cam nổi lên.
   ============================================================ */
(function () {
  var A = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
  var O = '#C96028'; // chấm/nét cam "chỉ Bắc" — đúng 1 cái mỗi icon

  var ICONS = {
    /* la bàn (emblem gốc) */
    'compass': '<svg ' + A + '><circle cx="12" cy="12" r="9"/><path d="M12 18 L10.4 12.7 L12 12 L13.6 12.7 Z"/><path d="M12 6 L13.6 12 L12 12.6 L10.4 12 Z" fill="' + O + '" stroke="' + O + '"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/></svg>',
    /* riêng tư / bảo mật */
    'shield': '<svg ' + A + '><path d="M12 3 L19.4 6.1 V11.5 C19.4 16 16 19.4 12 20.6 C8 19.4 4.6 16 4.6 11.5 V6.1 Z"/><path d="M9 12 L11 14 L15 9.9" stroke="' + O + '"/></svg>',
    /* micro / giọng nói */
    'mic': '<svg ' + A + '><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6.5 11a5.5 5.5 0 0 0 11 0"/><path d="M12 16.5v3.5M8.5 20h7"/><circle cx="12" cy="6.6" r="1" fill="' + O + '" stroke="none"/></svg>',
    /* sóng âm / nói thành chữ */
    'wave': '<svg ' + A + '><path d="M4 10.5v3M8 7.8v8.4M16 7.8v8.4M20 10.5v3"/><path d="M12 4.6v14.8" stroke="' + O + '"/></svg>',
    /* chụp màn hình */
    'capture': '<svg ' + A + '><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="1" fill="' + O + '" stroke="none"/></svg>',
    /* sửa / bút chì */
    'edit': '<svg ' + A + '><path d="M5 19 L5.7 15.6 L15.4 5.9 A2 2 0 0 1 18.2 8.7 L8.5 18.4 Z"/><path d="M13.6 7.7 L16.4 10.5"/><circle cx="5.95" cy="18.05" r="1" fill="' + O + '" stroke="none"/></svg>',
    /* quay GIF / video (chấm ghi cam) */
    'video': '<svg ' + A + '><rect x="3.3" y="5.5" width="17.4" height="13" rx="2.5"/><path d="M10.4 9.9 L14.6 12 L10.4 14.1 Z"/><circle cx="7" cy="8.7" r="1.1" fill="' + O + '" stroke="none"/></svg>',
    /* vô cực / không giới hạn */
    'infinity': '<svg ' + A + '><path d="M9.6 12 C9.6 13.9 8.1 15 6.6 15 C5.1 15 4 13.8 4 12 C4 10.2 5.1 9 6.6 9 C8.6 9 9.9 12 12 12 C14.1 12 15.4 9 17.4 9 C18.9 9 20 10.2 20 12 C20 13.8 18.9 15 17.4 15 C15.9 15 14.4 13.9 14.4 12"/><circle cx="12" cy="12" r="1.05" fill="' + O + '" stroke="none"/></svg>',
    /* offline / máy tính riêng tư */
    'offline': '<svg ' + A + '><rect x="3" y="4.5" width="18" height="12" rx="2"/><path d="M8 20h8M12 16.5V20"/><circle cx="12" cy="10.5" r="1" fill="' + O + '" stroke="none"/></svg>',
    /* ngôn ngữ / dịch (Việt–Anh) — thanh ngang chữ A màu cam */
    'translate': '<svg ' + A + '><path d="M3 5h9M7.5 3.5v1.5c0 5-3 8-5 9M4.5 9c0 3.5 4.5 6.5 8 7"/><path d="M13 20l4-9 4 9"/><path d="M14.5 17h5" stroke="' + O + '"/></svg>',
    /* tự cập nhật */
    'refresh': '<svg ' + A + '><path d="M20.5 12a8.5 8.5 0 1 1-2.5-6"/><path d="M20.5 4v5h-5" stroke="' + O + '"/></svg>',
    /* nhanh / tia sét — lõi sét chấm cam */
    'bolt': '<svg ' + A + '><path d="M13 3 L5 13h6l-1 8 8-11h-6z"/><circle cx="11" cy="12" r="1" fill="' + O + '" stroke="none"/></svg>',
    /* miễn phí / quà tặng */
    'gift': '<svg ' + A + '><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13"/><path d="M12 8C12 8 11 3.5 8.7 3.5A2.3 2.3 0 0 0 8.7 8H12M12 8s1-4.5 3.3-4.5A2.3 2.3 0 0 1 15.3 8H12" stroke="' + O + '"/></svg>',
    /* dán / clipboard */
    'paste': '<svg ' + A + '><rect x="5" y="4.5" width="14" height="16" rx="2"/><path d="M9 4.5V3.5h6v1"/><path d="M8.5 11h7M8.5 14.5h5" stroke="' + O + '"/></svg>',
    /* tim / tặng bằng lòng */
    'heart': '<svg ' + A + '><path d="M12 20.5 C6 16.5 4 12.8 4 9.6 A3.6 3.6 0 0 1 12 7.4 A3.6 3.6 0 0 1 20 9.6 C20 12.8 18 16.5 12 20.5Z"/><circle cx="12" cy="10.5" r="1" fill="' + O + '" stroke="none"/></svg>'
  };

  function render(root) {
    (root || document).querySelectorAll('[data-ic]').forEach(function (el) {
      var k = el.getAttribute('data-ic');
      if (ICONS[k] && !el.firstElementChild) el.innerHTML = ICONS[k];
    });
  }
  if (document.readyState !== 'loading') render();
  else document.addEventListener('DOMContentLoaded', function () { render(); });

  window.IC10 = ICONS;      // truy cập chuỗi SVG nếu cần chèn tay
  window.renderIcons = render;
})();
