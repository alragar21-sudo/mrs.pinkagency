// Landing de anuncios: píxel de Meta. Pon aquí el ID del píxel (dataset) para activarlo.
// Eventos: PageView al cargar, Lead al enviar los datos (paso 4) y Schedule al confirmar la reserva.
(function () {
  var PIXEL_ID = '';
  if (!PIXEL_ID) return;
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', PIXEL_ID);
  fbq('track', 'PageView');
  var form = document.querySelector('[data-booking]');
  if (form) form.addEventListener('submit', function () { if (form.checkValidity()) fbq('track', 'Lead'); });
  var ok = document.querySelector('[data-booking-ok]');
  if (ok) new MutationObserver(function (m, obs) { if (!ok.hidden) { fbq('track', 'Schedule'); obs.disconnect(); } }).observe(ok, { attributes: true, attributeFilter: ['hidden'] });
})();
