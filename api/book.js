// Mrs. Pink Agency · crear reserva de El Desayuno en Google Calendar (con Meet)
const TZ = 'Europe/Madrid';
const SLOT_MIN = 15;

const MSG = {
  es: {
    noConfig: 'Reservas no configuradas todavía.',
    faltan: 'Faltan datos de la reserva.',
    fecha: 'Fecha inválida.',
    antelacion: 'Ese hueco ya no cumple las 48 h de antelación.',
    ventana: 'Ese hueco está fuera de la ventana de reservas.',
    ocupado: 'Vaya, ese hueco se acaba de ocupar. Elige otro, porfa.',
    crear: 'No se pudo crear la reserva.',
    inesperado: 'Error inesperado al reservar.',
  },
  en: {
    noConfig: 'Online booking is not set up yet.',
    faltan: 'Some booking details are missing.',
    fecha: 'Invalid date.',
    antelacion: 'That slot is now less than 48 hours away. Please pick another one.',
    ventana: 'That slot is outside the booking window.',
    ocupado: 'Oh no, someone just took that slot. Please pick another one.',
    crear: 'We couldn’t create the booking.',
    inesperado: 'Something went wrong with the booking.',
  },
};

async function getAccessToken() {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });
  if (!r.ok) throw new Error('token ' + r.status + ' ' + (await r.text()));
  return (await r.json()).access_token;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }
  const d = (req.body && typeof req.body === 'object') ? req.body : {};
  const en = d.idioma === 'en';
  const M = en ? MSG.en : MSG.es;
  try {
    if (!process.env.GOOGLE_REFRESH_TOKEN) { res.status(503).json({ error: M.noConfig }); return; }
    if (d._gotcha) { res.status(200).json({ ok: true }); return; }

    const nombre = (d.nombre || '').toString().trim();
    const email = (d.email || '').toString().trim();
    const startISO = (d.start || '').toString().trim();
    if (!nombre || !/.+@.+\..+/.test(email) || !startISO) { res.status(400).json({ error: M.faltan }); return; }

    const start = new Date(startISO);
    if (isNaN(start.getTime())) { res.status(400).json({ error: M.fecha }); return; }
    const now = Date.now();
    if (start.getTime() < now + 48 * 3600 * 1000 - 60000) { res.status(409).json({ error: M.antelacion }); return; }
    if (start.getTime() > now + 7 * 24 * 3600 * 1000 + 60000) { res.status(409).json({ error: M.ventana }); return; }
    const end = new Date(start.getTime() + SLOT_MIN * 60000);

    const token = await getAccessToken();
    const calId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    // Re-chequeo de que el hueco sigue libre
    const fbRes = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeMin: start.toISOString(), timeMax: end.toISOString(), items: [{ id: calId }] }),
    });
    if (fbRes.ok) {
      const fbj = await fbRes.json();
      const busy = (((fbj.calendars || {})[calId] || {}).busy || []);
      if (busy.length) { res.status(409).json({ error: M.ocupado }); return; }
    }

    const body = {
      summary: (en ? 'The Breakfast · 15 min with ' : 'El Desayuno · 15 min con ') + nombre,
      description: [
        'Reserva desde mrspinkagency.com' + (en ? ' (versión en inglés: la llamada es en inglés)' : ''),
        '',
        'Nombre: ' + nombre,
        'Email: ' + email,
        'Web / Instagram: ' + (d.web || '—'),
        'Qué le preocupa: ' + (d.reto || '—'),
      ].join('\n'),
      start: { dateTime: start.toISOString(), timeZone: TZ },
      end: { dateTime: end.toISOString(), timeZone: TZ },
      attendees: [{ email: email, displayName: nombre }],
      conferenceData: { createRequest: { requestId: 'mp-' + start.getTime(), conferenceSolutionKey: { type: 'hangoutsMeet' } } },
      reminders: { useDefault: true },
    };
    const evRes = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/' + encodeURIComponent(calId) + '/events?conferenceDataVersion=1&sendUpdates=all',
      { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    );
    if (!evRes.ok) { const t = await evRes.text(); console.error('event error', evRes.status, t); res.status(502).json({ error: M.crear }); return; }
    const ev = await evRes.json();
    const fechaLabel = new Intl.DateTimeFormat(en ? 'en-GB' : 'es-ES', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(start);
    res.status(200).json({ ok: true, meet: ev.hangoutLink || null, htmlLink: ev.htmlLink || null, cuando: fechaLabel });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: M.inesperado });
  }
}
