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

  // Video loops: load and play only while on screen; pause when scrolled away.
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var vids = document.querySelectorAll('.media.vid video[data-src]');
  function load(v) { if (!v.src) { v.src = v.getAttribute('data-src'); } }
  if (vids.length && 'IntersectionObserver' in window && !reduce) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) { load(v); var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
        else if (v.src) { v.pause(); }
      });
    }, { rootMargin: '200px 0px', threshold: 0.01 });
    vids.forEach(function (v) { vio.observe(v); });
  }
  var film = document.querySelector('.cs-film video');
  if (film && reduce) { film.pause(); film.removeAttribute('autoplay'); }

  // Work cards: play the project's clip on hover (devices with a mouse).
  if (!reduce && window.matchMedia && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.work-card').forEach(function (card) {
      var v = card.querySelector('.hover-vid');
      if (!v) return;
      card.addEventListener('mouseenter', function () {
        load(v); var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
        card.classList.add('playing');
      });
      card.addEventListener('mouseleave', function () { card.classList.remove('playing'); setTimeout(function () { if (!card.classList.contains('playing')) v.pause(); }, 450); });
    });
  }

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
