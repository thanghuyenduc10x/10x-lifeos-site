/* ============================================================
   HEADER / MENU CHUẨN 10X LIFE OS — dùng chung cho các trang con.
   Cách dùng: đặt  <div id="site-header"></div>  ngay sau <body>,
   rồi thêm   <script src="/header.js"></script>  (đặt cuối, trước </body>).
   → Sửa file NÀY 1 lần là cập nhật menu ở tất cả các trang con.
   Menu 6 mục + 1 CTA, href tuyệt đối (chạy đúng từ mọi trang con),
   tự tô đậm mục đang đứng, SONG NGỮ (VI mặc định, theo html[data-lang]).
   Trang chủ (/) GIỮ header riêng vì có nút chuyển VI/EN.
   ============================================================ */
(function () {
  var CSS = '\
  .x10h{position:sticky;top:0;z-index:50;background:rgba(10,10,36,.82);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);\
    border-bottom:1px solid rgba(136,136,192,.12);font-family:"Be Vietnam Pro",sans-serif}\
  .x10h a{text-decoration:none}\
  .x10h .lang{display:none}\
  .x10h .lang-vi{display:inline}\
  html[data-lang="en"] .x10h .lang-vi{display:none}\
  html[data-lang="en"] .x10h .lang-en{display:inline}\
  .x10h__wrap{max-width:1180px;margin-inline:auto;padding:14px clamp(20px,5vw,40px);display:flex;align-items:center;justify-content:space-between;gap:22px}\
  .x10h__brand{display:flex;align-items:center;gap:11px;flex-shrink:0}\
  .x10h__brand svg{width:30px;height:30px;color:#EDEDFA}\
  .x10h__brand b{font-family:"Montserrat",sans-serif;color:#fff;font-weight:800;font-size:1rem;letter-spacing:-.01em}\
  .x10h__brand b i{color:#D97538;font-style:normal}\
  .x10h__nav{display:flex;align-items:center;gap:28px;font-size:.93rem;font-weight:500}\
  .x10h__nav a{color:#B0B0D8;transition:color .2s;position:relative;white-space:nowrap}\
  .x10h__nav a:hover,.x10h__nav a.active{color:#fff}\
  .x10h__nav a.active::after{content:"";position:absolute;left:0;right:0;bottom:-7px;height:2px;background:#C96028;border-radius:2px}\
  .x10h__right{display:flex;align-items:center;gap:16px;flex-shrink:0}\
  .x10h__cta{display:inline-flex;align-items:center;gap:8px;font-family:"Montserrat",sans-serif;font-weight:700;font-size:.88rem;\
    padding:11px 20px;border-radius:999px;background:#C96028;color:#fff;white-space:nowrap;box-shadow:0 10px 28px -8px rgba(201,96,40,.55);\
    transition:transform .25s,background .25s}\
  .x10h__cta:hover{transform:translateY(-2px);background:#D97538}\
  @media(max-width:880px){.x10h__nav{display:none}}\
  ';

  var MARK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-label="10X Life OS"><circle cx="12" cy="12" r="9.3"/><path d="M12 18.6 L10.2 12.7 L12 12 L13.8 12.7 Z"/><path d="M12 5.4 L13.8 12 L12 12.7 L10.2 12 Z" fill="#C96028" stroke="#C96028"/><circle cx="12" cy="12" r="1.05" fill="currentColor" stroke="none"/></svg>';

  function L(vi, en) {
    return '<span class="lang lang-vi">' + vi + '</span><span class="lang lang-en">' + en + '</span>';
  }
  function navA(href, match, label) {
    return '<a href="' + href + '"' + (match ? ' data-match="' + match + '"' : '') + '>' + label + '</a>';
  }

  var HTML = '\
  <header class="x10h"><div class="x10h__wrap">\
    <a class="x10h__brand" href="/">' + MARK + '<b>10X <i>Life OS</i></b></a>\
    <nav class="x10h__nav">' +
      navA('/#community', '', L('Cộng đồng', 'Community')) +
      navA('/#tiers', '', L('Lộ trình', 'Programs')) +
      navA('/blog/', '/blog', 'Blog') +
      navA('/chep-loi/', '/chep-loi', 'Chép Lời') +
      navA('/coach-thang/', '/coach-thang', L('Về Coach', 'About')) +
    '</nav>\
    <div class="x10h__right">\
      <a class="x10h__cta" href="/#resources">' + L('Khai phóng ngay', 'Get started') + ' <span>→</span></a>\
    </div>\
  </div></header>';

  function mount() {
    if (!document.getElementById('x10h-css')) {
      var s = document.createElement('style'); s.id = 'x10h-css'; s.textContent = CSS;
      document.head.appendChild(s);
    }
    var ph = document.getElementById('site-header');
    if (ph) { ph.innerHTML = HTML; } else { document.body.insertAdjacentHTML('afterbegin', HTML); }
    // tô đậm mục đang đứng theo đường dẫn
    var path = location.pathname;
    var links = document.querySelectorAll('.x10h__nav a[data-match]');
    for (var i = 0; i < links.length; i++) {
      var m = links[i].getAttribute('data-match');
      if (path === m || path.indexOf(m + '/') === 0 || path.indexOf(m) === 0) { links[i].classList.add('active'); break; }
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
