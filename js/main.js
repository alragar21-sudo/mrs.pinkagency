// Mrs. Pink Agency · comportamiento de la web
// 1) Formularios  2) Carrusel de proyectos (auto + arrastrar)  3) Menú móvil  4) WhatsApp

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

/* ---------- 4) WhatsApp: botón flotante con popup ---------- */
// Botón fijo abajo a la derecha en todas las páginas. Al pulsarlo (o solo,
// una vez por visita a los 12 s) se abre una tarjeta que lleva a WhatsApp
// (+34 641 20 70 50) con un mensaje ya escrito. Estilos incluidos aquí para
// que funcione igual en la web y en las landings.
(function () {
  var TEL = '34641207050';
  var T = {
    es: { abrir: 'Escríbenos por WhatsApp', cerrar: 'Cerrar', titulo: '¿Hablamos?',
          texto: 'Cuéntanos qué tienes entre manos y te contestamos por WhatsApp.',
          boton: 'Abrir WhatsApp', msg: 'Hola, Mrs. Pink Agency. Vengo de vuestra web y me gustaría hablar con vosotras.' },
    en: { abrir: 'Message us on WhatsApp', cerrar: 'Close', titulo: 'Fancy a chat?',
          texto: 'Tell us what you’re working on and we’ll reply on WhatsApp.',
          boton: 'Open WhatsApp', msg: 'Hi Mrs. Pink Agency, I found you on your website and I’d like to talk.' }
  }[IDIOMA];
  var url = 'https://wa.me/' + TEL + '?text=' + encodeURIComponent(T.msg);
  var icono = '<svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true" fill="currentColor"><path d="M16 3C8.8 3 3 8.7 3 15.8c0 2.5.7 4.9 2 7L3 29l6.4-2c2 1.1 4.3 1.7 6.6 1.7 7.2 0 13-5.7 13-12.8S23.2 3 16 3zm0 23.4c-2.1 0-4.1-.6-5.9-1.7l-.4-.2-3.8 1.2 1.2-3.7-.3-.4a10.4 10.4 0 0 1-1.7-5.8C5.1 9.9 10 5.2 16 5.2s10.9 4.7 10.9 10.6S22 26.4 16 26.4zm6-7.9c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.4-.5-2.6-1.6-1-.9-1.6-1.9-1.8-2.2-.2-.3 0-.5.1-.7l.5-.6c.2-.2.2-.3.3-.6.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.8s1.2 3.2 1.4 3.5c.2.2 2.4 3.6 5.8 5 .8.3 1.4.5 1.9.7.8.3 1.6.2 2.2.1.7-.1 1.9-.8 2.2-1.5.3-.7.3-1.4.2-1.5-.1-.2-.3-.3-.6-.4z"/></svg>';

  var css = document.createElement('style');
  css.textContent =
    '.wa{position:fixed;right:20px;bottom:20px;z-index:900;font-family:"Plus Jakarta Sans",system-ui,sans-serif;color:#30150E}' +
    '.wa-btn{width:60px;height:60px;border-radius:999px;border:0;cursor:pointer;background:#530F0E;color:#EEABC5;border:2px solid #EEABC5;display:grid;place-items:center;box-shadow:0 8px 24px rgba(48,21,14,.28);transition:transform .2s}' +
    '.wa-btn:hover{transform:scale(1.06)}' +
    '.wa-btn:focus-visible,.wa-cerrar:focus-visible,.wa-ir:focus-visible{outline:2px solid #EEABC5;outline-offset:3px}' +
    '.wa-card{position:absolute;right:0;bottom:76px;width:min(300px,calc(100vw - 40px));background:#F6F5EC;border-radius:24px;padding:22px 22px 20px;box-shadow:0 16px 40px rgba(48,21,14,.25);opacity:0;transform:translateY(8px);pointer-events:none;transition:opacity .2s,transform .2s}' +
    '.wa.abierto .wa-card{opacity:1;transform:none;pointer-events:auto}' +
    '.wa-card h2{margin:0 0 6px;font-size:20px;font-weight:600;letter-spacing:-0.02em;color:#530F0E}' +
    '.wa-card p{margin:0 0 16px;font-size:15px;line-height:1.45}' +
    '.wa-ir{display:flex;align-items:center;justify-content:center;gap:8px;min-height:48px;border-radius:999px;background:#EEABC5;color:#30150E;font-weight:600;font-size:15px;text-decoration:none}' +
    '.wa-ir:hover{background:#530F0E;color:#F6F5EC}' +
    '.wa-cerrar{position:absolute;top:10px;right:12px;width:32px;height:32px;border:0;background:none;cursor:pointer;font-size:22px;line-height:1;color:#30150E;opacity:.6;border-radius:999px}' +
    '.wa-cerrar:hover{opacity:1}' +
    '@media (max-width:600px){.wa{right:16px;bottom:16px}.wa-btn{width:56px;height:56px}.wa-card{bottom:70px}}' +
    '@media (prefers-reduced-motion:reduce){.wa-btn,.wa-card{transition:none}}';
  document.head.appendChild(css);

  var wa = document.createElement('div');
  wa.className = 'wa';
  wa.innerHTML =
    '<div class="wa-card" id="wa-card" role="dialog" aria-labelledby="wa-titulo" aria-hidden="true">' +
      '<button class="wa-cerrar" type="button" aria-label="' + T.cerrar + '">×</button>' +
      '<h2 id="wa-titulo">' + T.titulo + '</h2><p>' + T.texto + '</p>' +
      '<a class="wa-ir" href="' + url + '" target="_blank" rel="noopener" tabindex="-1">' + T.boton + '</a>' +
    '</div>' +
    '<button class="wa-btn" type="button" aria-label="' + T.abrir + '" aria-controls="wa-card" aria-expanded="false">' + icono + '</button>';
  document.body.appendChild(wa);

  var btn = wa.querySelector('.wa-btn'), card = wa.querySelector('.wa-card'), ir = wa.querySelector('.wa-ir');
  function pon(abierto) {
    wa.classList.toggle('abierto', abierto);
    btn.setAttribute('aria-expanded', abierto ? 'true' : 'false');
    card.setAttribute('aria-hidden', abierto ? 'false' : 'true');
    ir.tabIndex = abierto ? 0 : -1;
    wa.querySelector('.wa-cerrar').tabIndex = abierto ? 0 : -1;
    try { sessionStorage.setItem('wa-visto', '1'); } catch (_) {}
  }
  wa.querySelector('.wa-cerrar').tabIndex = -1;
  btn.addEventListener('click', function () { pon(!wa.classList.contains('abierto')); });
  wa.querySelector('.wa-cerrar').addEventListener('click', function () { pon(false); btn.focus(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && wa.classList.contains('abierto')) pon(false); });

  // Se abre solo una vez por visita, a los 12 segundos.
  var visto = false;
  try { visto = sessionStorage.getItem('wa-visto') === '1'; } catch (_) {}
  if (!visto) setTimeout(function () { if (!wa.classList.contains('abierto')) pon(true); }, 12000);
})();
