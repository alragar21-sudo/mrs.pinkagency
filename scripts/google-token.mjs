// Uso: GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... node scripts/google-token.mjs
// Abre el navegador, autorizas con tu cuenta de Google (la del calendario donde quieres
// las reservas) y el script imprime un REFRESH TOKEN. Ese token se guarda luego en Vercel.
import http from 'node:http';
import { exec } from 'node:child_process';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const PORT = 5555;
const REDIRECT = `http://localhost:${PORT}/oauth2callback`;
const SCOPE = 'https://www.googleapis.com/auth/calendar';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Falta GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET en el entorno.');
  process.exit(1);
}

const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
  client_id: CLIENT_ID,
  redirect_uri: REDIRECT,
  response_type: 'code',
  scope: SCOPE,
  access_type: 'offline',
  prompt: 'consent',
}).toString();

const server = http.createServer(async (req, res) => {
  if (!req.url.startsWith('/oauth2callback')) { res.writeHead(404); res.end(); return; }
  const code = new URL(req.url, REDIRECT).searchParams.get('code');
  if (!code) { res.writeHead(400); res.end('Sin code'); return; }
  try {
    const r = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: CLIENT_ID, client_secret: CLIENT_SECRET, redirect_uri: REDIRECT, grant_type: 'authorization_code' }),
    });
    const j = await r.json();
    if (!j.refresh_token) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h2>No llegó refresh_token.</h2><p>Revoca el acceso en myaccount.google.com/permissions y vuelve a ejecutar.</p>');
      console.error('Respuesta sin refresh_token:', j);
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h2>¡Listo! Ya puedes cerrar esta pestaña.</h2>');
      console.log('\n==================  REFRESH TOKEN  ==================\n');
      console.log(j.refresh_token);
      console.log('\n====================================================\n');
    }
  } catch (e) {
    res.writeHead(500); res.end('Error');
    console.error(e);
  } finally {
    setTimeout(() => server.close(() => process.exit(0)), 500);
  }
});

server.listen(PORT, () => {
  console.log('\nAbre esta URL en el navegador (e inicia sesión con la cuenta del calendario):\n');
  console.log(authUrl + '\n');
  exec(`open "${authUrl}"`); // macOS: intenta abrirlo solo
});
