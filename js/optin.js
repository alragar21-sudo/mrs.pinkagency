// Mrs. Pink Agency · El Desayuno, versión para leads cualificados (/el-desayuno-optin)
// Mismo aspecto que el formulario de /el-desayuno (clases dp-*).
// 12 pantallas → evaluación → encaja (calendario) · lo reviso yo · no encaja.
// Encaja: calendario real de Google Calendar (/api/slots?dur=30) y reserva con Meet (/api/book).
// Lo reviso: manda los datos por email (/api/lead). Si las reservas no están configuradas (503), también.
(function () {
  var root = document.getElementById('optin');
  if (!root) return;
  var tarjeta = document.getElementById('reserva');

  var PANTALLAS = [
    { k: 'estado', p: '¿En qué punto está tu negocio?', o: [['marcha', 'En marcha y facturando'], ['empezando', 'Empezando: menos de un año'], ['idea', 'Todavía no he lanzado']] },
    { k: 'sector', p: '¿A qué te dedicas?', o: [['salud', 'Clínica o salud'], ['servicios', 'Servicios profesionales'], ['formacion', 'Formación'], ['tienda', 'Tienda online'], ['otro', 'Otro sector']] },
    { k: 'negocio', tipo: 'negocio' },
    { k: 'equipo', p: '¿Cuántas personas trabajan contigo?', o: [['1', 'Solo yo'], ['2-5', 'De 2 a 5'], ['6-20', 'De 6 a 20'], ['20+', 'Más de 20']] },
    { k: 'fact', p: '¿Cuánto factura tu negocio al año, más o menos?', o: [['<150', 'Menos de 150.000 €'], ['150-500', '150.000–500.000 €'], ['500-1M', '500.000 € – 1 M€'], ['>1M', 'Más de 1 M€']] },
    { k: 'inv', p: '¿Cuánto inviertes al mes en anuncios?', o: [['0', 'Nada'], ['<500', 'Menos de 500 €'], ['500-1k', '500–1.000 €'], ['1-3k', '1.000–3.000 €'], ['>3k', 'Más de 3.000 €']] },
    { k: 'ticket', p: '¿Cuánto vale de media un cliente para ti?', o: [['<100', 'Menos de 100 €'], ['100-500', '100–500 €'], ['500-2k', '500–2.000 €'], ['>2k', 'Más de 2.000 €']] },
    { k: 'dolor', p: '¿Qué te quita el sueño?', o: [['anuncios', 'Gasto en anuncios y no sé cuál me trae clientes'], ['noCompran', 'Me llegan contactos, pero no compran'], ['tiempo', 'No tengo tiempo de ocuparme'], ['agencia', 'Mi agencia actual no me da resultados']] },
    { k: 'encaje', p: 'Mis planes empiezan en 1.200 € al mes, más la inversión en anuncios. ¿Encaja en lo que tienes previsto?', o: [['si', 'Sí, encaja'], ['ver', 'Lo tendría que ver'], ['no', 'Ahora mismo no']] },
    { k: 'cuando', p: '¿Cuándo quieres empezar?', o: [['ya', 'Ya'], ['1-3', 'En 1–3 meses'], ['mirando', 'Solo estoy mirando']] },
    { k: 'decide', p: '¿Quién toma la decisión?', o: [['yo', 'Yo'], ['socio', 'Yo, con mi socio o socia'], ['otra', 'Otra persona']] },
    { k: 'contacto', tipo: 'contacto' }
  ];
  var TOTAL = PANTALLAS.length;
  var LETRAS = 'ABCDEFGH';
  var estado = { i: 0, a: {}, datos: {}, dias: null, dia: 0, hora: null, error: '' };
  var MAIL = '<a href="mailto:info@mrspinkagency.com">info@mrspinkagency.com</a>';

  function evaluar(a) {
    var noInvierte = a.inv === '0' || a.inv === '<500';
    if (a.estado === 'idea' || a.encaje === 'no' || a.cuando === 'mirando' || (a.fact === '<150' && noInvierte)) return 'no';
    var grande = a.inv === '1-3k' || a.inv === '>3k' || a.fact === '500-1M' || a.fact === '>1M';
    var pronto = a.cuando === 'ya' || a.cuando === '1-3';
    var decide = a.decide === 'yo' || a.decide === 'socio';
    if (a.encaje === 'si' && grande && pronto && decide) return 'encaja';
    return 'revisar';
  }

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function progreso(texto, pct) {
    return '<div class="dp-progreso" aria-hidden="true"><span class="dp-progreso-txt">' + texto + '</span><span class="dp-barra"><i style="width:' + pct + '%"></i></span></div>';
  }
  function progresoPaso() { return progreso('Pregunta ' + (estado.i + 1) + ' de ' + TOTAL, Math.round((estado.i + 1) / TOTAL * 100)); }
  function atras() { return estado.i > 0 ? '<button type="button" class="dp-atras" data-atras>← Atrás</button>' : ''; }

  function pinta(html, enfocar) {
    root.innerHTML = html;
    var b = root.querySelector('[data-atras]');
    if (b) b.addEventListener('click', function () { estado.i = Math.max(0, estado.i - 1); render(true); });
    if (enfocar) {
      var f = root.querySelector('.dp-opcion[aria-pressed="true"], .dp-opcion, input:not([type=hidden]):not(.ox-trampa), .ox-dia');
      if (f) f.focus({ preventScroll: true });
      var r = tarjeta.getBoundingClientRect();
      if (r.top < 0 || r.top > window.innerHeight * 0.6) tarjeta.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function avanzar() {
    if (estado.i + 1 < TOTAL) { estado.i += 1; render(true); return; }
    estado.i = evaluar(estado.a);
    if (estado.i === 'encaja') prepararCalendario();
    if (estado.i === 'revisar') enviarLead('Lo reviso yo');
    render(true);
  }

  function campo(id, label, tipo, extra) {
    return '<div class="campo"><label for="ox-' + id + '">' + label + '</label><input id="ox-' + id + '" name="' + id + '" type="' + tipo + '" value="' + esc(estado.datos[id] || '') + '" ' + (extra || '') + '></div>';
  }

  function firma() { return '<p class="ox-firma">Alba</p>'; }

  function render(enfocar) {
    var i = estado.i;
    if (typeof i === 'number') {
      var p = PANTALLAS[i];
      if (p.o) {
        var ops = p.o.map(function (o, j) {
          return '<button type="button" class="dp-opcion" data-v="' + o[0] + '" aria-pressed="' + (estado.a[p.k] === o[0]) + '"><span class="dp-letra">' + LETRAS[j] + '</span>' + esc(o[1]) + '</button>';
        }).join('');
        pinta(progresoPaso() + '<fieldset class="dp-paso"><legend class="dp-pregunta">' + esc(p.p) + '</legend><div class="dp-opciones">' + ops + '</div>' + atras() + '</fieldset>', enfocar);
        root.querySelectorAll('.dp-opcion').forEach(function (b) {
          b.addEventListener('click', function () {
            estado.a[p.k] = b.getAttribute('data-v');
            root.querySelectorAll('.dp-opcion').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
            setTimeout(avanzar, 220);
          });
        });
        return;
      }
      if (p.tipo === 'negocio') {
        pinta(progresoPaso() + '<form class="dp-paso" novalidate><p class="dp-pregunta">¿Cómo se llama tu negocio y dónde lo encuentro?</p><div class="dp-campos">' +
          campo('empresa', 'Nombre del negocio', 'text', 'autocomplete="organization"') +
          campo('web', 'Tu web', 'text', 'placeholder="tuweb.com" autocomplete="url"') +
          campo('instagram', 'Instagram (opcional)', 'text', 'placeholder="@tunegocio"') +
          '<p class="ox-error" data-error hidden>Necesito el nombre del negocio y tu web o tu Instagram.</p></div>' +
          '<div class="dp-acciones"><button type="submit" class="btn btn-oscuro">Continuar →</button>' + atras() + '</div></form>', enfocar);
        root.querySelector('form').addEventListener('submit', function (e) {
          e.preventDefault();
          ['empresa', 'web', 'instagram'].forEach(function (k) { estado.datos[k] = root.querySelector('[name=' + k + ']').value.trim(); });
          var ok = estado.datos.empresa && (estado.datos.web || estado.datos.instagram);
          root.querySelector('[data-error]').hidden = !!ok;
          if (ok) avanzar();
        });
        return;
      }
      if (p.tipo === 'contacto') {
        pinta(progresoPaso() + '<form class="dp-paso" novalidate><p class="dp-pregunta">Última: ¿cómo te llamo?</p><div class="dp-campos">' +
          '<input type="text" name="_gotcha" tabindex="-1" autocomplete="off" aria-hidden="true" class="ox-trampa">' +
          campo('nombre', 'Tu nombre', 'text', 'required autocomplete="given-name" placeholder="Marta"') +
          campo('email', 'Email', 'email', 'required autocomplete="email" placeholder="marta@tunegocio.com"') +
          campo('telefono', 'Móvil (te confirmo por WhatsApp)', 'tel', 'required autocomplete="tel" placeholder="600 000 000"') +
          '<label class="dp-check"><input type="checkbox" name="privacidad" required' + (estado.datos.privacidad ? ' checked' : '') + '><span>He leído la <a href="privacidad.html">política de privacidad</a> y acepto que Alba, de Mrs. Pink Agency, me escriba sobre El Desayuno y sus servicios.</span></label></div>' +
          '<div class="dp-acciones"><button type="submit" class="btn btn-oscuro">Ver si encajamos →</button>' + atras() + '</div></form>', enfocar);
        var form = root.querySelector('form');
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          if (form._gotcha.value) return;
          if (!form.reportValidity()) return;
          ['nombre', 'email', 'telefono'].forEach(function (k) { estado.datos[k] = form[k].value.trim(); });
          estado.datos.privacidad = true;
          avanzar();
        });
        return;
      }
    }
    if (i === 'encaja') { pintaCalendario(enfocar); return; }
    if (i === 'revisar') {
      pinta(progreso('Lo miro yo', 100) + '<div class="ox-res"><p class="dp-pregunta">Gracias. Quiero mirar tu web antes de proponerte una hora.</p><p class="dp-ayuda ox-p">En menos de 24 horas laborables te escribo por WhatsApp o email. Si veo que puedo ayudarte, te mando el enlace para reservar. Si no, te lo digo igual, con alguna pista útil.</p>' + firma() + '</div>', enfocar);
      return;
    }
    if (i === 'no') {
      pinta(progreso('Ahora mismo, no', 100) + '<div class="ox-res"><p class="dp-pregunta">Gracias por contármelo. Prefiero ser sincera antes de hacerte perder un café.</p><p class="dp-ayuda ox-p">Ahora mismo no soy la mejor opción para tu negocio. Si tu situación cambia, aquí estoy. Mientras tanto, en Instagram comparto lo que voy aprendiendo.</p>' +
        '<div class="dp-acciones"><a href="https://www.instagram.com/mrs.pinkagency/" class="btn btn-oscuro" target="_blank" rel="noopener">Ver Instagram</a><button type="button" class="dp-atras" data-revisar>← Revisar mis respuestas</button></div>' + firma() + '</div>', enfocar);
      root.querySelector('[data-revisar]').addEventListener('click', function () { estado.i = 0; render(true); });
      return;
    }
    if (i === 'reservado') {
      pinta(progreso('Reserva hecha', 100) + '<div class="ox-res"><span class="tag" style="align-self:flex-start">Reserva confirmada</span><p style="margin:0;font-size:34px;letter-spacing:-0.04em;line-height:1.05">Café <span class="serif" style="color:var(--granate)">reservado.</span></p><p class="ox-cuando">' + esc(estado.cuando) + '</p><p class="dp-ayuda ox-p">Te llega la invitación al email con el enlace de Google Meet, y te escribo por WhatsApp para confirmar. Y sí, la propina corre de mi cuenta.</p>' + '<div class="dp-acciones"><a href="' + esc(enlaceCalendario()) + '" class="btn btn-oscuro" target="_blank" rel="noopener">Guardar en mi calendario</a></div>' + firma() + '</div>', enfocar);
    }
  }

  // Enlace para añadir la llamada a Google Calendar (con el Meet en el lugar y la descripción)
  function enlaceCalendario() {
    var f = function (d) { return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); };
    var ini = new Date(estado.inicio), fin = new Date(ini.getTime() + 30 * 60000);
    var q = { action: 'TEMPLATE', text: 'El Desayuno con Mrs. Pink Agency', dates: f(ini) + '/' + f(fin), details: estado.meet ? 'Enlace de Google Meet: ' + estado.meet : '', location: estado.meet || '' };
    return 'https://calendar.google.com/calendar/render?' + Object.keys(q).map(function (k) { return k + '=' + encodeURIComponent(q[k]); }).join('&');
  }

  // ---------- Datos que viajan a la API ----------
  function respuestas() {
    return PANTALLAS.filter(function (p) { return p.o; }).map(function (p) {
      var v = estado.a[p.k], op = p.o.filter(function (o) { return o[0] === v; })[0];
      return p.p + ' → ' + (op ? op[1] : '—');
    }).join('\n');
  }
  function payload(extra) {
    var d = estado.datos;
    return Object.assign({
      nombre: d.nombre, email: d.email, telefono: d.telefono, empresa: d.empresa,
      web: [d.web, d.instagram].filter(Boolean).join(' · '), instagram: d.instagram,
      respuestas: respuestas(), idioma: 'es', duracion: '30', fuente: 'Opt-in (el-desayuno-optin)'
    }, extra || {});
  }
  function enviarLead(resultado) {
    return fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload({ origen: 'optin', resultado: resultado })) })
      .catch(function () {});
  }

  // ---------- Encaja: calendario real (Google Calendar) ----------
  function prepararCalendario() {
    estado.dias = null; estado.dia = 0; estado.hora = null; estado.error = '';
    fetch('/api/slots?dur=30')
      .then(function (r) {
        if (r.status === 503) throw { noConfig: true };
        if (!r.ok) throw 0;
        return r.json();
      })
      .then(function (d) {
        estado.dias = d.days || [];
        if (!estado.dias.length) estado.error = 'Ahora mismo no me quedan huecos libres esta semana. Escríbeme a ' + MAIL + ' y lo cuadramos.';
        if (estado.i === 'encaja') pintaCalendario();
      })
      .catch(function (err) {
        if (err && err.noConfig) {
          // Reservas sin configurar: no perdemos el contacto, se lo mandamos a Alba por email.
          enviarLead('Encaja (reservas sin configurar)');
          estado.i = 'revisar'; render(true); return;
        }
        estado.dias = [];
        estado.error = 'No he podido cargar mi calendario. Prueba en un momento o escríbeme a ' + MAIL + '.';
        if (estado.i === 'encaja') pintaCalendario();
      });
  }

  function cabeceraCal() {
    return progreso('Encajamos · elige tu hueco', 100) + '<div class="ox-res"><p class="dp-pregunta">Tenemos mucho de qué hablar. Elige tu hueco.</p><p class="dp-ayuda ox-p" style="margin-top:-10px">Llamadas de 30 minutos por Google Meet, de lunes a jueves (hora de España).</p>';
  }

  function pintaCalendario(enfocar) {
    if (estado.dias === null) {
      pinta(cabeceraCal() + '<p class="cal-cargando">Cargando mi calendario…</p></div>', enfocar);
      return;
    }
    if (!estado.dias.length) {
      pinta(cabeceraCal() + '<p class="cal-cargando">' + estado.error + '</p></div>', enfocar);
      return;
    }
    var dia = estado.dias[estado.dia];
    var chipsDias = estado.dias.map(function (d, j) {
      var f = new Date(d.slots[0].iso);
      var c = new Intl.DateTimeFormat('es-ES', { weekday: 'short', timeZone: 'Europe/Madrid' }).format(f).replace('.', '');
      var n = new Intl.DateTimeFormat('es-ES', { day: 'numeric', timeZone: 'Europe/Madrid' }).format(f);
      return '<button type="button" class="ox-dia" data-d="' + j + '" aria-pressed="' + (j === estado.dia) + '"><span>' + esc(c.charAt(0).toUpperCase() + c.slice(1)) + '</span><strong>' + n + '</strong></button>';
    }).join('');
    var chipsHoras = dia.slots.map(function (s, j) {
      return '<button type="button" class="cal-slot" data-h="' + j + '" aria-pressed="' + (estado.hora === j) + '">' + esc(s.label) + '</button>';
    }).join('');
    var slot = estado.hora === null ? null : dia.slots[estado.hora];
    var nombreDia = dia.label.split(',')[0];
    var texto = slot ? 'Reservar el ' + nombreDia + ' a las ' + slot.label : 'Elige día y hora';
    var cols = Math.min(estado.dias.length, 5);
    pinta(cabeceraCal() +
      '<div class="ox-dias" role="group" aria-label="Día" style="grid-template-columns:repeat(' + cols + ',minmax(0,1fr))">' + chipsDias + '</div><div class="cal-slots" role="group" aria-label="Hora">' + chipsHoras + '</div>' +
      '<p class="ox-error" data-error' + (estado.error ? '' : ' hidden') + '>' + esc(estado.error) + '</p>' +
      '<div class="dp-acciones"><button type="button" class="btn btn-oscuro" data-reservar' + (slot ? '' : ' disabled') + '>' + esc(texto) + '</button></div>' +
      '<p class="dp-ayuda ox-p" style="font-size:13px;margin:0">Te llega la invitación al email con el enlace de Meet, y un WhatsApp mío para confirmar.</p></div>', enfocar);
    root.querySelectorAll('.ox-dia').forEach(function (b) { b.addEventListener('click', function () { estado.dia = +b.getAttribute('data-d'); estado.hora = null; estado.error = ''; pintaCalendario(); }); });
    root.querySelectorAll('.cal-slot').forEach(function (b) { b.addEventListener('click', function () { estado.hora = +b.getAttribute('data-h'); estado.error = ''; pintaCalendario(); }); });
    var btn = root.querySelector('[data-reservar]');
    btn.addEventListener('click', function () {
      if (!slot) return;
      btn.disabled = true; btn.textContent = 'Reservando…';
      fetch('/api/book', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload({ start: slot.iso })) })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, status: r.status, j: j }; }); })
        .then(function (res) {
          if (!res.ok) {
            estado.error = (res.j && res.j.error) || 'No se ha podido reservar. Inténtalo de nuevo.';
            if (res.status === 409) { var e = estado.error; prepararCalendario(); estado.error = e; pintaCalendario(); return; }
            pintaCalendario(); return;
          }
          var t = res.j.cuando || (dia.label + ', ' + slot.label);
          estado.cuando = t.charAt(0).toUpperCase() + t.slice(1);
          estado.meet = res.j.meet || '';
          estado.inicio = slot.iso;
          estado.i = 'reservado';
          render(true);
        })
        .catch(function () { estado.error = 'No se ha podido reservar. Inténtalo de nuevo.'; pintaCalendario(); });
    });
  }

  render(false);

  // Botón fijo en móvil: se esconde cuando el formulario o el pie están a la vista
  var fijo = document.querySelector('[data-fijo]');
  var pie = document.querySelector('footer');
  if (fijo && 'IntersectionObserver' in window) {
    var visibles = new Set();
    var actualizar = function () { fijo.classList.toggle('oculto', visibles.size > 0 || window.scrollY < 200); };
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) visibles.add(e.target); else visibles.delete(e.target); });
      actualizar();
    }, { threshold: 0.15 });
    [tarjeta, pie].forEach(function (el) { if (el) io.observe(el); });
    window.addEventListener('scroll', actualizar, { passive: true });
    fijo.classList.add('oculto');
  }
})();
