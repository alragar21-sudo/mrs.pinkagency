// Mrs. Pink Agency · huecos disponibles para El Desayuno
// Reglas: L-J 17:00-18:00 (Europe/Madrid), 15 min, desde 48h y hasta 7 días vista,
// descontando lo que ya esté ocupado en el calendario.

const TZ = 'Europe/Madrid';
const SLOT_MIN = 15;
const START_H = 17, START_M = 0;   // 17:00
const END_H = 18, END_M = 0;       // 18:00 (último inicio 17:45)
const LEAD_MS = 48 * 3600 * 1000;  // 48 h de antelación mínima
const WINDOW_DAYS = 7;             // ventana de 7 días
const DIAS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const LABORABLES = ['Mon', 'Tue', 'Wed', 'Thu'];

function partsOf(date, opts) {
  return new Intl.DateTimeFormat('en-US', Object.assign({ timeZone: TZ, hour12: false }, opts))
    .formatToParts(date).reduce((a, p) => { a[p.type] = p.value; return a; }, {});
}
// offset (ms) de Madrid respecto a UTC en ese instante
function tzOffsetMs(date) {
  const p = partsOf(date, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return asUTC - date.getTime();
}
// hora de pared en Madrid -> Date UTC (con corrección de DST en dos pasos)
function madridToUTC(y, mo, d, h, mi) {
  const naive = Date.UTC(y, mo - 1, d, h, mi, 0);
  let utc = naive - tzOffsetMs(new Date(naive));
  utc = naive - tzOffsetMs(new Date(utc));
  return new Date(utc);
}

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
  const en = ((req.query && req.query.lang) || '') === 'en';
  try {
    if (!process.env.GOOGLE_REFRESH_TOKEN) { res.status(503).json({ error: en ? 'Online booking is not set up yet.' : 'Reservas no configuradas todavía.' }); return; }
    const calId = process.env.GOOGLE_CALENDAR_ID || 'primary';
    const now = new Date();
    const earliest = now.getTime() + LEAD_MS;
    const latest = now.getTime() + WINDOW_DAYS * 24 * 3600 * 1000;

    const token = await getAccessToken();
    const fbRes = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeMin: now.toISOString(), timeMax: new Date(latest).toISOString(), timeZone: TZ, items: [{ id: calId }] }),
    });
    if (!fbRes.ok) throw new Error('freebusy ' + fbRes.status + ' ' + (await fbRes.text()));
    const fbj = await fbRes.json();
    const busy = (((fbj.calendars || {})[calId] || {}).busy || [])
      .map((b) => ({ s: new Date(b.start).getTime(), e: new Date(b.end).getTime() }));

    const days = [];
    for (let i = 0; i <= WINDOW_DAYS; i++) {
      const probe = new Date(now.getTime() + i * 24 * 3600 * 1000);
      const p = partsOf(probe, { weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit' });
      if (LABORABLES.indexOf(p.weekday) === -1) continue;
      const y = +p.year, mo = +p.month, d = +p.day;
      const slots = [];
      let h = START_H, m = START_M;
      while (h < END_H || (h === END_H && m < END_M)) {
        const start = madridToUTC(y, mo, d, h, m);
        const t = start.getTime();
        const endT = t + SLOT_MIN * 60000;
        const libre = t >= earliest && t <= latest && !busy.some((b) => t < b.e && endT > b.s);
        if (libre) slots.push({ iso: start.toISOString(), label: String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') });
        m += SLOT_MIN; if (m >= 60) { m -= 60; h++; }
      }
      if (slots.length) {
        const label = new Intl.DateTimeFormat(en ? 'en-GB' : 'es-ES', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(slots[0].iso));
        days.push({ fecha: y + '-' + String(mo).padStart(2, '0') + '-' + String(d).padStart(2, '0'), label, slots });
      }
    }
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ tz: TZ, days });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: en ? 'We couldn’t load the available times.' : 'No se pudieron cargar los horarios.' });
  }
}
