// Mrs. Pink Agency · comportamiento de la web
// 1) Formularios  2) Carrusel de proyectos (auto + arrastrar)  3) Menú móvil

/* ---------- 1) Formularios ---------- */
// Envían a /api/lead, que manda el aviso por email (Resend).
// Los mensajes salen en el idioma de la página (<html lang="es|en">).
var IDIOMA = (document.documentElement.lang || 'es').slice(0, 2) === 'en' ? 'en' : 'es';
var TXT_FORM = {
  es: { enviando: 'Enviando…', error: 'Ups, no se ha podido enviar. Escríbenos a info@mrspinkagency.com y lo vemos enseguida.' },
  en: { enviando: 'Sending…', error: 'Oops, that didn’t go through. Email us at info@mrspinkagency.com and we’ll sort it out right away.' },
}[IDIOMA];
document.querySelectorAll('[data-form]').forEach(function (form) {
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;
    var btn = form.querySelector('button[type="submit"],button:not([type])');
    var txt = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = TXT_FORM.enviando; }

    var payload = {};
    new FormData(form).forEach(function (v, k) { payload[k] = v; });
    payload.origen = form.getAttribute('data-form') || 'web';
    payload.idioma = IDIOMA;

    fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(function (r) {
      if (!r.ok) throw new Error('bad');
      var wrap = form.closest('[data-form-wrap]');
      var ok = wrap && wrap.parentElement.querySelector('[data-form-ok]');
      if (wrap) wrap.hidden = true;
      if (ok) { ok.hidden = false; ok.setAttribute('tabindex', '-1'); ok.focus(); }
    }).catch(function () {
      if (btn) { btn.disabled = false; btn.textContent = txt; }
      alert(TXT_FORM.error);
    });
  });
});

/* ---------- 2) Carrusel: avanza solo y se puede arrastrar ---------- */
// La pista tiene el contenido duplicado (2 copias); hacemos bucle infinito
// desplazando scrollLeft y saltando medio ancho. Al pasar el ratón por encima
// se para y se puede arrastrar para mover los nombres a mano.
var sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
document.querySelectorAll('.carrusel').forEach(function (carrusel) {
  var pista = carrusel.querySelector('.carrusel-pista');
  if (!pista) return;

  var hover = false, arrastrando = false, startX = 0, startScroll = 0, movido = false, capturado = false;
  var velocidad = 0.6; // px por frame (~36 px/s)

  function medio() { return pista.scrollWidth / 2; }
  function normaliza() {
    var m = medio();
    if (m <= 0) return;
    if (carrusel.scrollLeft >= m) carrusel.scrollLeft -= m;
    else if (carrusel.scrollLeft < 0) carrusel.scrollLeft += m;
  }

  function tick() {
    if (!sinMovimiento && !hover && !arrastrando) {
      carrusel.scrollLeft += velocidad;
      normaliza();
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  carrusel.addEventListener('pointerenter', function () { hover = true; });
  carrusel.addEventListener('pointerleave', function () { hover = false; });

  carrusel.addEventListener('pointerdown', function (e) {
    arrastrando = true; movido = false; capturado = false;
    startX = e.clientX; startScroll = carrusel.scrollLeft;
    // Aún no capturamos: así un clic limpio sobre un nombre abre su enlace.
  });
  carrusel.addEventListener('pointermove', function (e) {
    if (!arrastrando) return;
    var dx = e.clientX - startX;
    if (Math.abs(dx) > 3) {
      movido = true;
      if (!capturado) {
        try { carrusel.setPointerCapture(e.pointerId); } catch (_) {}
        capturado = true;
        carrusel.classList.add('arrastrando');
      }
    }
    if (movido) { carrusel.scrollLeft = startScroll - dx; normaliza(); }
  });
  function fin(e) {
    if (!arrastrando) return;
    arrastrando = false;
    carrusel.classList.remove('arrastrando');
    if (capturado) { try { carrusel.releasePointerCapture(e.pointerId); } catch (_) {} }
  }
  carrusel.addEventListener('pointerup', fin);
  carrusel.addEventListener('pointercancel', fin);
  // Evita que el arrastre dispare clics/selección de los nombres
  carrusel.addEventListener('click', function (e) { if (movido) { e.preventDefault(); } }, true);
  carrusel.addEventListener('dragstart', function (e) { e.preventDefault(); });
});

/* ---------- 3) Menú móvil ---------- */
document.querySelectorAll('.nav-toggle').forEach(function (toggle) {
  var menu = document.getElementById(toggle.getAttribute('aria-controls'));
  if (!menu) return;
  function cerrar() { menu.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
  toggle.addEventListener('click', function () {
    var abierto = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', abierto ? 'true' : 'false');
  });
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) cerrar();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrar(); });
});
