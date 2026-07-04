/* Google Analytics (GA4) — dùng chung cho mọi trang. Đổi ID 1 chỗ ở đây.
   Property: 10x-lifeos.com · Mã đo lường: G-NRTLMNR2KF (tạo 2026-07-03) */
(function () {
  var ID = 'G-NRTLMNR2KF';
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', ID);
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
  document.head.appendChild(s);
})();
