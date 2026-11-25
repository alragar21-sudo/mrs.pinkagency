// Sobre Mrs. Pink: la palabra gigante se desliza en horizontal al hacer scroll.
(function () {
  var el = document.querySelector('.s-gigante');
  if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var escena = el.parentElement, pendiente = false;
  function mover() {
    pendiente = false;
    var r = escena.getBoundingClientRect(), vh = window.innerHeight;
    var t = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
    var sobra = el.scrollWidth - escena.clientWidth;
    el.style.setProperty('--desliza', (-sobra * (0.15 + t * 0.7)).toFixed(1) + 'px');
  }
  window.addEventListener('scroll', function () { if (!pendiente) { pendiente = true; requestAnimationFrame(mover); } }, { passive: true });
  window.addEventListener('resize', mover);
  mover();
})();
