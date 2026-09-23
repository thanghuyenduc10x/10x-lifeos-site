(() => {
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const targets = document.querySelectorAll('.hero .eyebrow, .hero h1, .hero .intro, .hero .btn, .hero .meta, .section h2, .story, .level, .step, .date, .quote blockquote');
  targets.forEach((element) => element.setAttribute('data-reveal', ''));
  document.documentElement.classList.add('js-motion');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (!isIntersecting) return;
      target.classList.add('is-visible');
      observer.unobserve(target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -36px 0px' });
  targets.forEach((element) => observer.observe(element));
})();
