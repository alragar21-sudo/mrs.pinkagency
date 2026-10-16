// Mrs. Pink Agency · reserva de El Desayuno (formulario -> calendario -> confirmación)
(function () {
  var form = document.querySelector('[data-booking]');
  if (!form) return;
  var root = form.closest('[data-booking-root]');
  var wrap = root.querySelector('[data-booking-wrap]');
  var cal = root.querySelector('[data-booking-cal]');
  var okBox = root.querySelector('[data-booking-ok]');
  var slotsBox = root.querySelector('[data-booking-slots]');
  var backBtn = root.querySelector('[data-booking-back]');
  var cuandoEl = root.querySelector('[data-booking-cuando]');
  var meetEl = root.querySelector('[data-booking-meet]');
  var datos = {};
  var elegido = null;

  function show(el) { el.hidden = false; }
  function hide(el) { el.hidden = true; }
  function escapeAttr(s) { return String(s).replace(/"/g, '&quot;'); }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;
    datos = {};
    new FormData(form).forEach(function (v, k) { datos[k] = v; });
    hide(wrap); show(cal); elegido = null;
    cargarHuecos();
  });

  if (backBtn) backBtn.addEventListener('click', function () { show(wrap); hide(cal); });

  function cargarHuecos() {
    slotsBox.innerHTML = '<p class="cal-cargando">Cargando horarios…</p>';
    fetch('/api/slots')
      .then(function (r) {
        if (r.status === 503) { return r.json().then(function () { throw { noConfig: true }; }); }
        if (!r.ok) throw 0;
        return r.json();
      })
      .then(function (d) {
        if (!d.days || !d.days.length) {
          slotsBox.innerHTML = '<p class="cal-cargando">Ahora mismo no hay huecos en los próximos días. Escríbenos a <a href="mailto:info@mrspinkagency.com" style="color:var(--acento)">info@mrspinkagency.com</a> y lo cuadramos.</p>';
          return;
        }
        render(d.days);
      })
      .catch(function (err) {
        if (err && err.noConfig) { respaldoEmail(); return; }
        slotsBox.innerHTML = '<p class="cal-cargando">No hemos podido cargar los horarios. Inténtalo en un momento o escríbenos a <a href="mailto:info@mrspinkagency.com" style="color:var(--acento)">info@mrspinkagency.com</a>.</p>';
      });
  }

  // Respaldo mientras las reservas online no están activas: enviamos los datos por email.
  function respaldoEmail() {
    slotsBox.innerHTML = '<p class="cal-cargando">Enviando tus datos…</p>';
    var payload = Object.assign({}, datos, { origen: 'reserva' });
    fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(function () {
        if (backBtn) backBtn.style.display = 'none';
        slotsBox.innerHTML = '<p style="margin:4px 0;font-size:17px;line-height:1.6">¡Gracias! Hemos recibido tus datos. Te escribimos en menos de 24 h con el enlace para elegir día. Y sí, la propina corre de nuestra cuenta.</p>';
      })
      .catch(function () {
        slotsBox.innerHTML = '<p class="cal-cargando">No hemos podido enviar tus datos. Escríbenos a <a href="mailto:info@mrspinkagency.com" style="color:var(--acento)">info@mrspinkagency.com</a>.</p>';
      });
  }

  function render(days) {
    var html = '';
    days.forEach(function (day) {
      html += '<div class="cal-dia"><h4>' + day.label + '</h4><div class="cal-slots">';
      day.slots.forEach(function (s) {
        html += '<button type="button" class="cal-slot" data-iso="' + s.iso + '" data-dia="' + escapeAttr(day.label) + '" data-hora="' + s.label + '" aria-pressed="false">' + s.label + '</button>';
      });
      html += '</div></div>';
    });
    html += '<div class="cal-acciones"><button type="button" class="btn btn-acento" data-confirm disabled>Confirmar reserva</button></div>';
    slotsBox.innerHTML = html;

    var confirmBtn = slotsBox.querySelector('[data-confirm]');
    slotsBox.querySelectorAll('.cal-slot').forEach(function (b) {
      b.addEventListener('click', function () {
        slotsBox.querySelectorAll('.cal-slot').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        elegido = { iso: b.getAttribute('data-iso'), hora: b.getAttribute('data-hora'), dia: b.getAttribute('data-dia') };
        confirmBtn.disabled = false;
      });
    });
    confirmBtn.addEventListener('click', function () { reservar(confirmBtn); });
  }

  function reservar(btn) {
    if (!elegido) return;
    var txt = btn.textContent;
    btn.disabled = true; btn.textContent = 'Reservando…';
    var payload = Object.assign({}, datos, { start: elegido.iso });
    fetch('/api/book', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (!res.ok) {
          btn.disabled = false; btn.textContent = txt;
          var msg = (res.j && res.j.error) || 'No se ha podido reservar. Inténtalo de nuevo.';
          alert(msg);
          if (/ocup|disponible|48|ventana/i.test(msg)) cargarHuecos();
          return;
        }
        cuandoEl.textContent = res.j.cuando || (elegido.dia + ' · ' + elegido.hora);
        if (res.j.meet) {
          meetEl.innerHTML = '<a href="' + res.j.meet + '" target="_blank" rel="noopener" class="btn btn-acento" style="margin-top:4px">Abrir Google Meet</a>';
        }
        hide(cal); show(okBox); okBox.setAttribute('tabindex', '-1'); okBox.focus();
      })
      .catch(function () { btn.disabled = false; btn.textContent = txt; alert('No se ha podido reservar. Inténtalo de nuevo.'); });
  }
})();
