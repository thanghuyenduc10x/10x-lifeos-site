/* CAPTURE.JS — hộp nhận "Thư Khai Phóng" dùng chung (GĐ2)
   Mount: <div class="x10-capture"></div> + <script src="/capture.js" defer></script>
   (một trang đặt được nhiều hộp — trên hero + trước footer)
   CẤU HÌNH 1 CHỖ Ở ĐÂY — đổi tên thư / lời hứa / số / Brevo action là cả site đổi theo. */
(function () {
  var CFG = {
    name_vi: 'Thư Khai Phóng',
    name_en: 'The Khai Phóng Letter',
    day_vi: 'mỗi sáng thứ Bảy', day_en: 'every Saturday morning',
    promise_vi: 'Một lá thư ngắn: một câu chuyện thực chiến, một góc nhìn lật lại, một việc làm được trong 30 phút.',
    promise_en: 'One short letter: a real story, one reframe, one action you can do in 30 minutes.',
    proof_vi: 'Cùng 47+ người đã bắt đầu với Hệ thống AI 7 ngày.',
    proof_en: 'Join 47+ people who started with the 7-Day AI System.',
    btn_vi: 'Nhận thư đầu tiên', btn_en: 'Get the first letter',
    consent_vi: 'Bấm gửi là bạn đồng ý nhận thư hằng tuần — đôi khi tôi nhắc tới app và khoá học của mình. Hủy bất cứ lúc nào, một chạm.',
    consent_en: 'By subscribing you agree to the weekly letter — I sometimes mention my apps and courses. Unsubscribe anytime, one tap.',
    privacy_url: '/chinh-sach-bao-mat/',
    /* ⚠️ DÁN FORM ACTION CỦA BREVO VÀO ĐÂY trước khi deploy (Brevo → Forms → HTML → action URL).
       Còn trống → form chuyển hướng khách sang cộng đồng miễn phí (không nuốt email như form cũ). */
    action: '',
    email_field: 'EMAIL', /* tên field Brevo mặc định */
    fallback_url: 'https://www.skool.com/leader-10x-mo-khoa-lanh-ao-7648',
    fallback_vi: 'Hệ thống thư đang kết nối — trong lúc chờ, cộng đồng miễn phí đang mở:',
    fallback_en: 'The letter system is being wired up — meanwhile, the free community is open:'
  };

  var css = '.x10cap{background:linear-gradient(150deg,#12123A,#0A0A24);border:1px solid rgba(201,96,40,.4);border-radius:var(--r-lg,18px);padding:clamp(24px,4vw,36px);max-width:640px;box-shadow:0 18px 50px rgba(7,7,24,.45)}'
    + '.x10cap .cap-label{font-family:var(--f-label,Montserrat);font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--o-300,#E89060);margin-bottom:10px;display:block}'
    + '.x10cap h3{font-family:var(--f-head,Fraunces);font-size:clamp(22px,3vw,28px);color:#fff;margin:0 0 8px}'
    + '.x10cap .cap-promise{font-size:15px;color:var(--text-body,#B0B0D8);line-height:1.65;margin-bottom:18px}'
    + '.x10cap form{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px}'
    + '.x10cap input[type=email]{flex:1;min-width:220px;padding:14px 16px;border-radius:var(--r-md,12px);border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.95);color:#12123A;font:inherit;font-size:.95rem}'
    + '.x10cap button{font-family:var(--f-body);font-weight:600;font-size:15px;padding:14px 22px;border-radius:var(--r-md,12px);border:1px solid var(--o-500,#C96028);background:var(--o-500,#C96028);color:#fff;cursor:pointer;transition:all .25s var(--ease,ease)}'
    + '.x10cap button:hover{background:var(--o-400,#D97538);transform:translateY(-2px)}'
    + '.x10cap .cap-proof{font-size:13px;color:var(--o-200,#F0B090);margin-bottom:6px}'
    + '.x10cap .cap-consent{font-size:12px;color:var(--text-muted,#8888C0);line-height:1.6}'
    + '.x10cap .cap-consent a{color:var(--o-300,#E89060);text-decoration:underline}'
    + '.x10cap .cap-fallback{display:none;font-size:14px;color:var(--text,#DDDDF0);padding:12px 0}'
    + '.x10cap .cap-fallback a{color:var(--o-400);font-weight:600;text-decoration:underline}';

  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function L(vi, en) { return '<span class="lang lang-vi">' + vi + '</span><span class="lang lang-en">' + en + '</span>'; }

  function render(el) {
    el.innerHTML =
      '<div class="x10cap">'
      + '<span class="cap-label">' + L('Thư hằng tuần · miễn phí', 'Weekly letter · free') + '</span>'
      + '<h3>' + L(CFG.name_vi + ' — ' + CFG.day_vi, CFG.name_en + ' — ' + CFG.day_en) + '</h3>'
      + '<p class="cap-promise">' + L(CFG.promise_vi, CFG.promise_en) + '</p>'
      + '<form novalidate>'
      + '<input type="email" required name="' + CFG.email_field + '" placeholder="email@cua-ban.com" aria-label="Email" />'
      + '<button type="submit">' + L(CFG.btn_vi, CFG.btn_en) + ' →</button>'
      + '</form>'
      + '<div class="cap-fallback">' + L(CFG.fallback_vi, CFG.fallback_en) + ' <a href="' + CFG.fallback_url + '" target="_blank" rel="noopener noreferrer">Skool — Leader 10X →</a></div>'
      + '<p class="cap-proof">' + L(CFG.proof_vi, CFG.proof_en) + '</p>'
      + '<p class="cap-consent">' + L(CFG.consent_vi, CFG.consent_en) + ' <a href="' + CFG.privacy_url + '">' + L('Chính sách bảo mật', 'Privacy policy') + '</a></p>'
      + '</div>';

    var form = el.querySelector('form');
    form.addEventListener('submit', function (e) {
      if (!CFG.action) {
        e.preventDefault();
        el.querySelector('.cap-fallback').style.display = 'block';
        return;
      }
      /* Brevo: POST chuẩn form HTML */
      form.method = 'POST'; form.action = CFG.action;
    });
  }

  function ready(fn){ if(document.readyState !== 'loading') fn(); else addEventListener('DOMContentLoaded', fn); }
  ready(function () {
    document.querySelectorAll('.x10-capture').forEach(render);
  });
})();
