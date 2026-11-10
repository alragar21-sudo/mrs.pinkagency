// Mrs. Pink Agency · formulario de cualificación de El Desayuno (landing de prueba)
// Pasos: 1) ¿negocio o marca personal?  2) inversión  3) qué le preocupa  4) datos
// Después, reservar.js se encarga del calendario y la confirmación.
(function () {
  var root = document.querySelector('.dp-quiz');
  if (!root) return;
  var form = root.querySelector('[data-booking]');
  var pasos = Array.prototype.slice.call(root.querySelectorAll('[data-paso]'));
  var total = pasos.length;
  var fueraBox = root.querySelector('[data-fuera-box]');
  var txt = root.querySelector('[data-paso-txt]');
  var barra = root.querySelector('[data-paso-barra]');
  var cal = root.querySelector('[data-booking-cal]');
  var ok = root.querySelector('[data-booking-ok]');
  var actual = 1;

  function progreso(texto, pct) { txt.textContent = texto; barra.style.width = pct + '%'; }

  function ir(n, enfocar) {
    actual = n;
    pasos.forEach(function (p) {
      var oculto = Number(p.getAttribute('data-paso')) !== n;
      if (p.hidden !== oculto) p.hidden = oculto;
    });
    progreso('Paso ' + n + ' de ' + total, Math.round(n / total * 100));
    var visible = pasos[n - 1];
    if (enfocar) {
      var foco = visible.querySelector('.dp-opcion[aria-pressed="true"], .dp-opcion, input:not([type=hidden])');
      if (foco) foco.focus({ preventScroll: true });
      var r = root.getBoundingClientRect();
      if (r.top < 0 || r.top > window.innerHeight * 0.5) root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  root.querySelectorAll('.dp-opcion').forEach(function (b) {
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', function () {
      var campo = b.getAttribute('data-set');
      form.querySelector('[data-campo="' + campo + '"]').value = b.getAttribute('data-valor');
      b.parentNode.querySelectorAll('.dp-opcion').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      b.setAttribute('aria-pressed', 'true');
      if (b.hasAttribute('data-fuera')) {
        setTimeout(function () {
          form.hidden = true; fueraBox.hidden = false;
          progreso('Gracias', 100);
          var foco = fueraBox.querySelector('a, button'); if (foco) foco.focus({ preventScroll: true });
        }, 200);
        return;
      }
      setTimeout(function () { ir(Math.min(actual + 1, total), true); }, 220);
    });
  });

  root.querySelectorAll('[data-atras]').forEach(function (b) {
    b.addEventListener('click', function () { ir(Math.max(actual - 1, 1), true); });
  });

  var reiniciar = root.querySelector('[data-reiniciar]');
  if (reiniciar) reiniciar.addEventListener('click', function () {
    fueraBox.hidden = true; form.hidden = false; ir(1, true);
  });

  // Barra de progreso durante el calendario y la confirmación (los muestra reservar.js).
  // Solo vigila esos dos bloques y solo toca textos, para no provocarse a sí mismo.
  function alCambiar() {
    if (!ok.hidden) progreso('Reserva hecha', 100);
    else if (!cal.hidden) progreso('Último paso: día y hora', 100);
    else if (!form.hidden) progreso('Paso ' + actual + ' de ' + total, Math.round(actual / total * 100));
  }
  var obs = new MutationObserver(alCambiar);
  [cal, ok].forEach(function (el) { obs.observe(el, { attributes: true, attributeFilter: ['hidden'] }); });

  ir(1, false);

  // Botón fijo en móvil: se esconde cuando el formulario ya está a la vista
  var fijo = document.querySelector('[data-fijo]');
  var reserva = document.getElementById('reserva');
  var pie = document.querySelector('footer');
  if (fijo && 'IntersectionObserver' in window) {
    var visibles = new Set();
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) { if (e.isIntersecting) visibles.add(e.target); else visibles.delete(e.target); });
      fijo.classList.toggle('oculto', visibles.size > 0 || window.scrollY < 200);
    }, { threshold: 0.15 });
    [reserva, pie].forEach(function (el) { if (el) io.observe(el); });
    window.addEventListener('scroll', function () {
      fijo.classList.toggle('oculto', visibles.size > 0 || window.scrollY < 200);
    }, { passive: true });
    fijo.classList.add('oculto');
  }
})();
