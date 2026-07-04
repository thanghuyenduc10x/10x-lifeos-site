/* THEME.JS — lớp tương tác v2 dùng chung (đi cặp với theme.css)
   Gồm: (1) đèn cam mờ theo con trỏ, (2) hover-lift tiêu đề hero.
   An toàn: tự tắt khi touch / prefers-reduced-motion. Additive 100%. */
(function () {
  var rm = matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* (1) cursor spotlight */
  if (!rm && !matchMedia('(hover:none)').matches && !document.querySelector('.cursor-glow')) {
    var g = document.createElement('div');
    g.className = 'cursor-glow';
    document.body.appendChild(g);
    var mx = innerWidth / 2, my = innerHeight * .4, tx = mx, ty = my, on = false, raf = false;
    function u() {
      raf = false;
      mx += (tx - mx) * .18; my += (ty - my) * .18;
      g.style.setProperty('--mx', mx.toFixed(1) + 'px');
      g.style.setProperty('--my', my.toFixed(1) + 'px');
      if (Math.abs(tx - mx) > .4 || Math.abs(ty - my) > .4) { raf = true; requestAnimationFrame(u); }
    }
    addEventListener('mousemove', function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!on) { on = true; g.classList.add('on'); }
      if (!raf) { raf = true; requestAnimationFrame(u); }
    }, { passive: true });
  }

  /* (2) hover-lift cho tiêu đề hero (nếu trang có) */
  function ready(fn){ if(document.readyState !== 'loading') fn(); else addEventListener('DOMContentLoaded', fn); }
  ready(function () {
    var h = document.querySelector('.hero h1, .kb-head h1, .case-hero h1, .blog-hero h1');
    if (h) h.classList.add('v2-lift');
  });
})();
