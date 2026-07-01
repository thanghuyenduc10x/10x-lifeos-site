/* ============================================================
   FOOTER CHUẨN 10X LIFE OS — dùng chung cho MỌI trang.
   Cách dùng trên mỗi trang: đặt  <div id="site-footer"></div>
   ngay trước </body>, rồi thêm   <script src="/footer.js"></script>
   → Sửa file NÀY 1 lần là cập nhật footer ở tất cả các trang.
   v3 (2026-07-01): bản đầy đủ — 4 cột (Khám phá / Sản phẩm & Tài nguyên /
     Khu vực thành viên) + social + liên hệ, SONG NGỮ (VI mặc định, theo
     html[data-lang] của trang chủ), nền watermark la bàn + hải đăng.
   Link đăng nhập/social để href="#" (điền URL thật sau).
   ============================================================ */
(function () {
  var YEAR = 2026;

  var CSS = '\
  .x10f{position:relative;overflow:hidden;background:#070718;border-top:1px solid rgba(255,255,255,.07);\
    font-family:"Be Vietnam Pro",sans-serif;color:#8888C0;font-size:15px;line-height:1.7;margin-top:60px}\
  .x10f a{color:#B0B0D8;text-decoration:none;transition:color .2s}\
  .x10f a:hover{color:#fff}\
  .x10f .lang{display:none}\
  .x10f .lang-vi{display:inline}\
  html[data-lang="en"] .x10f .lang-vi{display:none}\
  html[data-lang="en"] .x10f .lang-en{display:inline}\
  .x10f__bg{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden}\
  .x10f__bg img{position:absolute;display:block;object-fit:contain;filter:grayscale(1) brightness(2.4)}\
  .x10f__bg .laban{left:50%;top:50%;width:440px;height:451px;transform:translate(-50%,-48%);opacity:.05}\
  .x10f__wrap{position:relative;z-index:1;max-width:1080px;margin-inline:auto;padding:0 24px}\
  .x10f__divider{display:flex;align-items:center;gap:18px;padding-top:48px}\
  .x10f__divider .line{flex:1;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent)}\
  .x10f__divider svg{width:26px;height:26px;color:#C96028;flex-shrink:0;opacity:.9}\
  .x10f__main{display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr;gap:36px;padding:34px 0 30px}\
  .x10f__mark{margin-bottom:14px}\
  .x10f__mark svg{width:48px;height:48px;color:#EDEDFA}\
  .x10f__brand .name{font-family:"Montserrat",sans-serif;font-weight:800;font-size:20px;color:#fff;letter-spacing:-.01em;margin-bottom:12px}\
  .x10f__brand .name b{color:#D97538}\
  .x10f__motto{font-family:"Montserrat",sans-serif;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#8888C0;margin-bottom:10px}\
  .x10f__tag{font-size:14px;color:#8888C0;font-style:italic;max-width:300px}\
  .x10f__tag em{color:#D97538;font-style:normal}\
  .x10f__social{display:flex;gap:10px;margin-top:18px}\
  .x10f__social a{width:36px;height:36px;border-radius:9px;border:1px solid rgba(136,136,192,.22);display:grid;place-items:center;color:#B0B0D8;transition:transform .2s,border-color .2s,color .2s}\
  .x10f__social a:hover{border-color:#C96028;color:#D97538;transform:translateY(-2px)}\
  .x10f__social svg{width:17px;height:17px}\
  .x10f__col h4{font-family:"Montserrat",sans-serif;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#D97538;margin-bottom:16px}\
  .x10f__col ul{list-style:none;margin:0;padding:0}\
  .x10f__col li{margin-bottom:12px}\
  .x10f__col li a{display:inline-flex;align-items:center;gap:11px}\
  .x10f__ico{width:18px;height:18px;flex-shrink:0;color:#7E7EAE;display:inline-flex;transition:color .2s}\
  .x10f__ico svg{width:18px;height:18px}\
  .x10f__col li a:hover .x10f__ico{color:#D97538}\
  .x10f__bar{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;\
    border-top:1px solid rgba(255,255,255,.06);padding:22px 0 40px;font-size:13px;color:#7A7AB0}\
  .x10f__bar b{color:#B0B0D8;font-weight:600}\
  .x10f__bar a{color:#9A9AC8}\
  .x10f__bar .right{font-family:"Montserrat",sans-serif;font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;color:#7A7AB0}\
  @media(max-width:860px){.x10f__main{grid-template-columns:1fr 1fr;gap:30px}.x10f__brand{grid-column:1/-1}}\
  @media(max-width:720px){.x10f__bar{justify-content:center;text-align:center}\
    .x10f__bg .laban{width:320px;height:328px;opacity:.05}}\
  @media(max-width:480px){.x10f__main{grid-template-columns:1fr}}\
  ';

  /* la bàn nhỏ trên đường kẻ phân cách */
  var COMPASS = '<svg viewBox="0 0 52 52" fill="none"><circle cx="26" cy="26" r="22" stroke="currentColor" stroke-width="1.4" opacity=".5"/><circle cx="26" cy="26" r="15" stroke="currentColor" stroke-width=".8" opacity=".2"/><path d="M26 6 L29 24 L26 26 L23 24 Z" fill="currentColor"/><path d="M26 46 L23 28 L26 26 L29 28 Z" fill="currentColor" opacity=".3"/><path d="M46 26 L28 23 L26 26 L28 29 Z" fill="currentColor" opacity=".22"/><path d="M6 26 L24 29 L26 26 L24 23 Z" fill="currentColor" opacity=".22"/><circle cx="26" cy="26" r="3.4" fill="currentColor"/><circle cx="26" cy="26" r="1.7" fill="#070718"/></svg>';

  /* DẤU HIỆU THƯƠNG HIỆU — la bàn: mũi Bắc cam */
  var MARK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-label="10X Life OS"><circle cx="12" cy="12" r="9.3"/><path d="M12 18.6 L10.2 12.7 L12 12 L13.8 12.7 Z"/><path d="M12 5.4 L13.8 12 L12 12.7 L10.2 12 Z" fill="#C96028" stroke="#C96028"/><circle cx="12" cy="12" r="1.05" fill="currentColor" stroke="none"/></svg>';

  /* ICON DẪN ĐƯỜNG cho mỗi link (đơn sắc) */
  var IS = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"';
  var IC_home = '<svg ' + IS + '><circle cx="12" cy="12" r="9"/><path d="M12 18 L10.4 12.7 L12 12 L13.6 12.7 Z"/><path d="M12 6 L13.6 12 L12 12.6 L10.4 12 Z" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/></svg>';
  var IC_community = '<svg ' + IS + '><circle cx="9" cy="9" r="3"/><path d="M3.8 19c0-2.9 2.3-5.2 5.2-5.2s5.2 2.3 5.2 5.2"/><path d="M16 7.2a2.7 2.7 0 0 1 0 5.2M20.3 19c0-2.1-1.3-4-3.2-4.7"/></svg>';
  var IC_route = '<svg ' + IS + '><circle cx="6.5" cy="18.5" r="2"/><circle cx="17.5" cy="5.5" r="2"/><path d="M8.4 17.7 13 13a3.5 3.5 0 0 0 1-2.5V7.4M6.6 16.5V9a3.5 3.5 0 0 1 3.5-3.5h5"/></svg>';
  var IC_blog = '<svg ' + IS + '><path d="M12 7C10.4 6 8 5.6 6 5.8V18C8 17.8 10.4 18.2 12 19.2M12 7C13.6 6 16 5.6 18 5.8V18C16 17.8 13.6 18.2 12 19.2M12 7V19.2"/><path d="M12 4.4 L13 6.8 L12 7.4 L11 6.8 Z" fill="currentColor"/></svg>';
  var IC_coach = '<svg ' + IS + '><path d="M8.5 20.5H15.5"/><path d="M10 20.5L11 11H13L14 20.5"/><path d="M10.4 15.5H13.6"/><path d="M10.6 11H13.4V8.4H10.6Z"/><path d="M10 8.4L12 6.4L14 8.4"/><path d="M15.2 7.7L18 6.4M15.2 9.4H18.2"/><circle cx="12" cy="9.4" r=".8" fill="currentColor" stroke="none"/></svg>';
  var IC_mic = '<svg ' + IS + '><rect x="9" y="3.5" width="6" height="10.5" rx="3"/><path d="M6.7 11.5a5.3 5.3 0 0 0 10.6 0"/><path d="M12 16.8v3.4M8.7 20.2h6.6"/><circle cx="12" cy="6.8" r="1" fill="currentColor" stroke="none"/></svg>';
  var IC_ai = '<svg ' + IS + '><path d="M12 3.2 13.7 8 18.5 9.5 13.7 11.3 12 16 10.3 11.3 5.5 9.5 10.3 8 Z"/><path d="M18.6 14.4 19.4 16.5 21.5 17.3 19.4 18.1 18.6 20.2 17.8 18.1 15.7 17.3 17.8 16.5 Z" fill="currentColor" stroke="none"/></svg>';
  var IC_play = '<svg ' + IS + '><rect x="3" y="6" width="18" height="12" rx="3"/><path d="M11 9.4 15 12 11 14.6 Z" fill="currentColor" stroke="none"/></svg>';
  var IC_skool = '<svg ' + IS + '><path d="M3 9l9-3.8L21 9l-9 3.8z"/><path d="M7.5 11v4.2c0 .9 2 1.8 4.5 1.8s4.5-.9 4.5-1.8V11"/></svg>';
  var IC_lms = '<svg ' + IS + '><path d="M5 5.4A1.4 1.4 0 0 1 6.4 4H18.5v15.2H6.4A1.4 1.4 0 0 0 5 20.6z"/><path d="M5 20.6A1.4 1.4 0 0 1 6.4 19.2H18.5"/><path d="M8.5 8.4h6M8.5 11.4h4"/></svg>';
  var IC_track = '<svg ' + IS + '><circle cx="12" cy="12" r="8.4"/><circle cx="12" cy="12" r="3.6"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><path d="M12 3.6v2.2M12 18.2v2.2M3.6 12h2.2M18.2 12h2.2"/></svg>';
  var IC_capture = '<svg ' + IS + '><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3.1"/></svg>';
  var IC_wave = '<svg ' + IS + '><path d="M4 10.5v3M8 7.8v8.4M12 4.6v14.8M16 7.8v8.4M20 10.5v3"/></svg>';

  /* SOCIAL (đơn sắc, lấy từ trang chủ) */
  var SO_yt = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.6 7.2c-.2-.9-.9-1.6-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4c-.9.2-1.6.9-1.8 1.8C2 8.8 2 12 2 12s0 3.2.4 4.8c.2.9.9 1.6 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4c.9-.2 1.6-.9 1.8-1.8C22 15.2 22 12 22 12s0-3.2-.4-4.8zM10 15V9l5.2 3z"/></svg>';
  var SO_fb = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-7.3h2.5l.4-2.9h-2.9V8.9c0-.8.2-1.4 1.4-1.4h1.6V4.9c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.1H7.8v2.9h2.5V21z"/></svg>';
  var SO_tt = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.6 3h-2.7v11.2a2.3 2.3 0 1 1-2.3-2.3c.2 0 .4 0 .6.1V9.2a5 5 0 1 0 4.4 5V8.6a6 6 0 0 0 3.4 1.1V7a3.4 3.4 0 0 1-3.4-3.4z"/></svg>';
  var SO_sk = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9l9-3.8L21 9l-9 3.8z"/><path d="M7.5 11v4.2c0 .9 2 1.8 4.5 1.8s4.5-.9 4.5-1.8V11"/></svg>';

  function L(vi, en) {
    return '<span class="lang lang-vi">' + vi + '</span><span class="lang lang-en">' + en + '</span>';
  }
  function ext(href) {
    return /^https?:/.test(href) ? ' target="_blank" rel="noopener noreferrer"' : '';
  }
  function li(href, ico, label) {
    return '<li><a href="' + href + '"' + ext(href) + '><span class="x10f__ico">' + ico + '</span>' + label + '</a></li>';
  }
  function so(href, name, svg) {
    return '<a href="' + href + '"' + ext(href) + ' aria-label="' + name + '">' + svg + '</a>';
  }

  var HTML = '\
  <footer class="x10f">\
    <div class="x10f__bg" aria-hidden="true">\
      <img class="laban" src="/assets/emblems/la-ban.svg" alt="" loading="lazy" decoding="async">\
    </div>\
    <div class="x10f__wrap">\
    <div class="x10f__divider"><span class="line"></span>' + COMPASS + '<span class="line"></span></div>\
    <div class="x10f__main">\
      <div class="x10f__brand">\
        <div class="x10f__mark">' + MARK + '</div>\
        <div class="name">10X <b>Life OS</b></div>\
        <div class="x10f__motto">Khai Thông · Khai Mở · Khai Phóng</div>\
        <div class="x10f__tag">' + L('<em>Tròn đầy bên trong</em> — Đủ đầy bên ngoài.', '<em>Whole within</em> — abundant without.') + '</div>\
        <div class="x10f__social">' +
          so('https://www.youtube.com/@Th%E1%BA%AFngHuy%E1%BB%81n%C4%90%E1%BB%A9cCoach', 'YouTube', SO_yt) + so('https://www.facebook.com/CoachThangHuyenDuc', 'Facebook', SO_fb) + so('#', 'TikTok', SO_tt) + so('https://www.skool.com/leader-10x-mo-khoa-lanh-ao-7648', 'Skool', SO_sk) +
        '</div>\
      </div>\
      <div class="x10f__col">\
        <h4>' + L('Khám phá', 'Explore') + '</h4>\
        <ul>' +
          li('/', IC_home, L('Trang chủ', 'Home')) +
          li('/#community', IC_community, L('Cộng đồng 10X', '10X Community')) +
          li('/#tiers', IC_route, L('Lộ trình', 'Programs')) +
          li('/blog/', IC_blog, L('Blog · Case thực chiến', 'Blog · Case studies')) +
          li('/coach-thang/', IC_coach, L('Về Coach Thắng', 'About Coach Thắng')) +
        '</ul>\
      </div>\
      <div class="x10f__col">\
        <h4>' + L('Sản phẩm & Tài nguyên', 'Products & Resources') + '</h4>\
        <ul>' +
          li('/chep-loi/', IC_mic, L('Chép Lời — chép âm thanh', 'Chép Lời — audio to text')) +
          li('/fc-fastcapture/', IC_capture, L('FC-FastCapture — ảnh &amp; GIF', 'FC-FastCapture — screenshots &amp; GIF')) +
          li('/voiceflow/', IC_wave, L('VoiceFlow — nói thành chữ', 'VoiceFlow — voice to text')) +
          li('/#resources', IC_ai, L('Hệ thống AI 7 ngày', '7-Day AI System')) +
          li('https://www.youtube.com/@Th%E1%BA%AFngHuy%E1%BB%81n%C4%90%E1%BB%A9cCoach', IC_play, L('Thư viện 10X (YouTube)', '10X Library (YouTube)')) +
        '</ul>\
      </div>\
      <div class="x10f__col">\
        <h4>' + L('Khu vực thành viên', 'Member Area') + '</h4>\
        <ul>' +
          li('https://www.skool.com/leader-10x-mo-khoa-lanh-ao-7648', IC_skool, L('Cộng đồng (Skool)', 'Community (Skool)')) +
          li('#', IC_lms, L('Học tập (LMS)', 'Learning (LMS)')) +
          li('#', IC_track, L('Tracking 10X', '10X Tracking')) +
        '</ul>\
      </div>\
    </div>\
    <div class="x10f__bar">\
      <div>© ' + YEAR + ' · <b>10X Life OS</b> · Coach Thắng Huyền Đức · <a href="mailto:hello@10x-lifeos.com">hello@10x-lifeos.com</a></div>\
      <div class="right">' + L('Thiết kế &amp; phát triển bởi Thắng Huyền Đức', 'Designed &amp; built by Thắng Huyền Đức') + '</div>\
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
