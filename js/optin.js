// Mrs. Pink Agency · El Desayuno, versión para leads cualificados (/el-desayuno-optin)
// Mismo aspecto que el formulario de /el-desayuno (clases dp-*).
// 12 pantallas → evaluación → encaja (calendario) · lo reviso yo · no encaja.
// DE MOMENTO SIN CONECTAR: no envía datos ni reserva; el calendario es de muestra.
// Para conectarlo: /api/slots?dur=30 + /api/book (encaja) y /api/lead (lo reviso / no encaja).
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
  var HORAS = ['9:30', '11:00', '12:30', '16:00', '17:30']; // muestra; al conectar saldrán del calendario real
  var estado = { i: 0, a: {}, datos: {}, dias: [], dia: 0, hora: null };

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
      pinta(progreso('Reserva hecha', 100) + '<div class="ox-res"><span class="tag" style="align-self:flex-start">Reserva confirmada</span><p style="margin:0;font-size:34px;letter-spacing:-0.04em;line-height:1.05">Café <span class="serif" style="color:var(--granate)">reservado.</span></p><p class="ox-cuando">' + esc(estado.cuando) + '</p><p class="dp-ayuda ox-p">Te llega la invitación al email con el enlace de Google Meet, y te escribo por WhatsApp para confirmar. Y sí, la propina corre de mi cuenta.</p>' + firma() + '</div>', enfocar);
    }
  }

  // ---------- Encaja: calendario (de muestra hasta conectarlo) ----------
  function prepararCalendario() {
    var dias = [], f = new Date();
    f.setHours(12, 0, 0, 0);
    f.setDate(f.getDate() + 2);
    while (dias.length < 4) {
      var wd = f.getDay();
      if (wd >= 1 && wd <= 4) dias.push(new Date(f));
      f.setDate(f.getDate() + 1);
    }
    estado.dias = dias; estado.dia = 0; estado.hora = null;
  }

  function pintaCalendario(enfocar) {
    var corto = new Intl.DateTimeFormat('es-ES', { weekday: 'short' });
    var largo = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    var dia = estado.dias[estado.dia];
    var chipsDias = estado.dias.map(function (d, j) {
      var c = corto.format(d).replace('.', '');
      return '<button type="button" class="ox-dia" data-d="' + j + '" aria-pressed="' + (j === estado.dia) + '"><span>' + esc(c.charAt(0).toUpperCase() + c.slice(1)) + '</span><strong>' + d.getDate() + '</strong></button>';
    }).join('');
    var chipsHoras = HORAS.map(function (h) {
      return '<button type="button" class="cal-slot" data-h="' + h + '" aria-pressed="' + (estado.hora === h) + '">' + h + '</button>';
    }).join('');
    var nombreDia = largo.format(dia).split(',')[0];
    var texto = estado.hora ? 'Reservar el ' + nombreDia + ' ' + dia.getDate() + ' a las ' + estado.hora : 'Elige día y hora';
    pinta(progreso('Encajamos · elige tu hueco', 100) + '<div class="ox-res"><p class="dp-pregunta">Tenemos mucho de qué hablar. Elige tu hueco.</p><p class="dp-ayuda ox-p" style="margin-top:-10px">Llamadas de 30 minutos, de lunes a jueves (hora de España).</p>' +
      '<div class="ox-dias" role="group" aria-label="Día">' + chipsDias + '</div><div class="cal-slots" role="group" aria-label="Hora">' + chipsHoras + '</div>' +
      '<div class="dp-acciones"><button type="button" class="btn btn-oscuro" data-reservar' + (estado.hora ? '' : ' disabled') + '>' + esc(texto) + '</button></div>' +
      '<p class="dp-ayuda ox-p" style="font-size:13px;margin:0">Te llega la invitación al email y un WhatsApp mío para confirmar.</p></div>', enfocar);
    root.querySelectorAll('.ox-dia').forEach(function (b) { b.addEventListener('click', function () { estado.dia = +b.getAttribute('data-d'); estado.hora = null; pintaCalendario(); }); });
    root.querySelectorAll('.cal-slot').forEach(function (b) { b.addEventListener('click', function () { estado.hora = b.getAttribute('data-h'); pintaCalendario(); }); });
    root.querySelector('[data-reservar]').addEventListener('click', function () {
      if (!estado.hora) return;
      var t = largo.format(dia) + ', ' + estado.hora;
      estado.cuando = t.charAt(0).toUpperCase() + t.slice(1);
      estado.i = 'reservado';
      render(true);
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
