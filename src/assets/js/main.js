// MASAKRA — small progressive enhancements. The site works without this file.
(function () {
  document.documentElement.classList.remove('no-js');

  // Live clocks (For agencies section)
  var clocks = document.querySelectorAll('[data-tz]');
  function tick() {
    clocks.forEach(function (el) {
      try {
        var parts = new Intl.DateTimeFormat('en-GB', {
          timeZone: el.getAttribute('data-tz'), hour: '2-digit', minute: '2-digit', hour12: false
        }).formatToParts(new Date());
        var h = parts.find(function (p) { return p.type === 'hour'; }).value;
        var m = parts.find(function (p) { return p.type === 'minute'; }).value;
        el.querySelector('.h').textContent = h;
        el.querySelector('.m').textContent = m;
      } catch (e) { /* keep placeholder */ }
    });
  }
  if (clocks.length) { tick(); setInterval(tick, 20000); }

  // Reveal on scroll: only elements below the first screen start hidden,
  // so the page is complete at rest even without this script.
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var vh = window.innerHeight;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.remove('pending'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(function (el) {
    if (el.getBoundingClientRect().top > vh) { el.classList.add('pending'); io.observe(el); }
  });
})();
