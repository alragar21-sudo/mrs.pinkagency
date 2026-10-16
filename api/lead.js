// Mrs. Pink Agency · recepción de formularios -> email (Resend)
// Variables de entorno (se configuran en Vercel):
//   RESEND_API_KEY   (obligatoria)  clave de https://resend.com
//   LEAD_TO_EMAIL    (obligatoria)  dónde quieres recibir los avisos
//   LEAD_FROM_EMAIL  (opcional)     remitente verificado, p.ej. "Mrs. Pink Agency <hola@mrspinkagency.com>".
//                                   Si no está, usa el remitente compartido de Resend (solo envía a tu propio correo).

const CAMPOS = {
  nombre: 'Nombre',
  email: 'Email',
  web: 'Web o Instagram',
  reto: '¿Qué le preocupa?',
  servicio: '¿Qué necesita?',
  mensaje: 'Mensaje',
};

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const data = (req.body && typeof req.body === 'object') ? req.body : {};

  // Anti-spam: honeypot. Si viene relleno, fingimos éxito y no enviamos.
  if (data._gotcha) { res.status(200).json({ ok: true }); return; }

  const nombre = (data.nombre || '').toString().trim();
  const email = (data.email || '').toString().trim();
  if (!nombre || !email || !/.+@.+\..+/.test(email)) {
    res.status(400).json({ error: 'Faltan el nombre o un email válido.' });
    return;
  }

  const key = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_TO_EMAIL;
  const from = process.env.LEAD_FROM_EMAIL || 'Mrs. Pink Agency <onboarding@resend.dev>';
  if (!key || !to) {
    console.error('Faltan RESEND_API_KEY o LEAD_TO_EMAIL');
    res.status(503).json({ error: 'El envío aún no está configurado.' });
    return;
  }

  const origen = (data.origen || 'web').toString();
  const titulo = origen === 'reserva' ? 'Nueva reserva de El Desayuno' : 'Nuevo mensaje de contacto';

  const filas = Object.keys(CAMPOS)
    .filter((k) => data[k])
    .map((k) => `<tr><td style="padding:6px 16px 6px 0;color:#7A5A52;vertical-align:top">${CAMPOS[k]}</td><td style="padding:6px 0;color:#30150E"><strong>${esc(data[k])}</strong></td></tr>`)
    .join('');

  const html = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto">
      <p style="font-size:13px;color:#EEABC5;font-weight:600;letter-spacing:.04em;margin:0 0 4px">MRS. PINK AGENCY</p>
      <h2 style="font-size:22px;color:#530F0E;margin:0 0 16px">${titulo}</h2>
      <table style="border-collapse:collapse;font-size:15px;width:100%">${filas}</table>
      <p style="font-size:12px;color:#7A5A52;margin-top:24px;border-top:1px solid #30150E20;padding-top:12px">
        Enviado desde el formulario de mrspinkagency.com. Responde a este correo para contestar directamente a ${esc(nombre)}.
      </p>
    </div>`;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, reply_to: email, subject: `${titulo} · ${nombre}`, html }),
    });
    if (!r.ok) {
      const t = await r.text();
      console.error('Resend error:', r.status, t);
      res.status(502).json({ error: 'No se ha podido enviar el mensaje.' });
      return;
    }
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error inesperado.' });
  }
}
