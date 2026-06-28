/* ============================================================
   FOOTER CHUẨN 10X LIFE OS — dùng chung cho MỌI trang.
   Cách dùng trên mỗi trang: đặt  <div id="site-footer"></div>
   ngay trước </body>, rồi thêm   <script src="/footer.js"></script>
   → Sửa file NÀY 1 lần là cập nhật footer ở tất cả các trang.
   ============================================================ */
(function () {
  var YEAR = 2026;

  var CSS = '\
  .x10f{position:relative;background:#070718;border-top:1px solid rgba(255,255,255,.07);\
    font-family:"Be Vietnam Pro",sans-serif;color:#8888C0;font-size:15px;line-height:1.7;margin-top:60px}\
  .x10f a{color:#B0B0D8;text-decoration:none;transition:color .2s}\
  .x10f a:hover{color:#fff}\
  .x10f__wrap{max-width:1080px;margin-inline:auto;padding:0 24px}\
  .x10f__divider{display:flex;align-items:center;gap:18px;padding-top:48px}\
  .x10f__divider .line{flex:1;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent)}\
  .x10f__divider svg{width:26px;height:26px;color:#C96028;flex-shrink:0;opacity:.9}\
  .x10f__main{display:grid;grid-template-columns:1.6fr 1fr 1fr;gap:40px;padding:34px 0 30px}\
  .x10f__mark{margin-bottom:14px}\
  .x10f__mark svg{width:46px;height:46px;color:#EDEDFA}\
  .x10f__brand .name{font-family:"Montserrat",sans-serif;font-weight:800;font-size:20px;color:#fff;letter-spacing:-.01em;margin-bottom:12px}\
  .x10f__brand .name b{color:#D97538}\
  .x10f__motto{font-family:"Montserrat",sans-serif;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#8888C0;margin-bottom:10px}\
  .x10f__tag{font-size:14px;color:#8888C0;font-style:italic;max-width:300px}\
  .x10f__tag em{color:#D97538;font-style:normal}\
  .x10f__col h4{font-family:"Montserrat",sans-serif;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#D97538;margin-bottom:16px}\
  .x10f__col ul{list-style:none;margin:0;padding:0}\
  .x10f__col li{margin-bottom:11px}\
  .x10f__bar{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;\
    border-top:1px solid rgba(255,255,255,.06);padding:22px 0 40px;font-size:13px;color:#7A7AB0}\
  .x10f__bar b{color:#B0B0D8;font-weight:600}\
  .x10f__bar .right{font-family:"Montserrat",sans-serif;font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;color:#7A7AB0}\
  @media(max-width:720px){.x10f__main{grid-template-columns:1fr 1fr;gap:30px}.x10f__brand{grid-column:1/-1}.x10f__bar{justify-content:center;text-align:center}}\
  ';

  var COMPASS = '<svg viewBox="0 0 52 52" fill="none"><circle cx="26" cy="26" r="22" stroke="currentColor" stroke-width="1.4" opacity=".5"/><circle cx="26" cy="26" r="15" stroke="currentColor" stroke-width=".8" opacity=".2"/><path d="M26 6 L29 24 L26 26 L23 24 Z" fill="currentColor"/><path d="M26 46 L23 28 L26 26 L29 28 Z" fill="currentColor" opacity=".3"/><path d="M46 26 L28 23 L26 26 L28 29 Z" fill="currentColor" opacity=".22"/><path d="M6 26 L24 29 L26 26 L24 23 Z" fill="currentColor" opacity=".22"/><circle cx="26" cy="26" r="3.4" fill="currentColor"/><circle cx="26" cy="26" r="1.7" fill="#070718"/></svg>';

  /* Dấu hiệu thương hiệu: LA BÀN tinh giản — nét mảnh, đơn sắc trắng */
  var MARK = '<svg viewBox="0 0 52 52" fill="none" stroke="currentColor" aria-label="10X Life OS"><circle cx="26" cy="26" r="22" stroke-width="1.4" opacity=".85"/><circle cx="26" cy="26" r="15" stroke-width=".8" opacity=".25"/><path d="M26 6 L29 24 L26 26 L23 24 Z" fill="currentColor"/><path d="M26 46 L23 28 L26 26 L29 28 Z" fill="currentColor" opacity=".3"/><path d="M46 26 L28 23 L26 26 L28 29 Z" fill="currentColor" opacity=".25"/><path d="M6 26 L24 29 L26 26 L24 23 Z" fill="currentColor" opacity=".25"/><circle cx="26" cy="26" r="3.2" fill="currentColor"/></svg>';

  var HTML = '\
  <footer class="x10f"><div class="x10f__wrap">\
    <div class="x10f__divider"><span class="line"></span>' + COMPASS + '<span class="line"></span></div>\
    <div class="x10f__main">\
      <div class="x10f__brand">\
        <div class="x10f__mark">' + MARK + '</div>\
        <div class="name">10X <b>Life OS</b></div>\
        <div class="x10f__motto">Khai Thông · Khai Mở · Khai Phóng</div>\
        <div class="x10f__tag"><em>Tròn đầy bên trong</em> — Đủ đầy bên ngoài.</div>\
      </div>\
      <div class="x10f__col">\
        <h4>Khám phá</h4>\
        <ul>\
          <li><a href="https://10x-lifeos.com">Trang chủ</a></li>\
          <li><a href="/blog/">Blog · Case thực chiến</a></li>\
          <li><a href="https://10x-lifeos.com/coach-thang">Về Coach Thắng</a></li>\
        </ul>\
      </div>\
      <div class="x10f__col">\
        <h4>Sản phẩm</h4>\
        <ul>\
          <li><a href="/chep-loi/">Chép Lời — Chép lời offline</a></li>\
        </ul>\
      </div>\
    </div>\
    <div class="x10f__bar">\
      <div>© ' + YEAR + ' · <b>10X Life OS</b> · Coach Thắng Huyền Đức</div>\
      <div class="right">Thiết kế &amp; phát triển bởi Thắng Huyền Đức</div>\
    </div>\
  </div></footer>';

  function mount() {
    if (!document.getElementById('x10f-css')) {
      var s = document.createElement('style'); s.id = 'x10f-css'; s.textContent = CSS;
      document.head.appendChild(s);
    }
    var ph = document.getElementById('site-footer');
    if (ph) { ph.innerHTML = HTML; } else { document.body.insertAdjacentHTML('beforeend', HTML); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
