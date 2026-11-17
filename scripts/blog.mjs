// Genera el blog y el sitemap a partir de contenido/blog/*.md
//   node scripts/blog.mjs
// Cada artículo es un .md con cabecera:
//   ---
//   titulo: Título del artículo
//   descripcion: Resumen de 140-160 caracteres para Google
//   fecha: 2026-11-18            (no se publica hasta ese día)
//   categoria: Estrategia
//   mano: plan                   (palabra del título que va en manuscrita, opcional)
//   borrador: true               (opcional: no se publica)
//   ---
// El nombre del archivo es la URL: contenido/blog/mi-articulo.md → /blog/mi-articulo
import fs from 'node:fs';
import path from 'node:path';

const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DOMINIO = 'https://mrspinkagency.com';
const FUENTES = path.join(RAIZ, 'contenido/blog');
const SALIDA = path.join(RAIZ, 'blog');
const hoy = process.env.HOY || new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fechaLarga = (f) => { const [a, m, d] = f.split('-').map(Number); return `${d} de ${MESES[m - 1]} de ${a}`; };

function enLinea(t) {
  return esc(t)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, txt, url) => {
      const fuera = /^https?:\/\//.test(url) && !url.startsWith(DOMINIO);
      return `<a href="${url}"${fuera ? ' target="_blank" rel="noopener"' : ''}>${txt}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
}

function markdown(md) {
  const out = []; let lista = null, parrafo = [];
  const cierraP = () => { if (parrafo.length) { out.push(`<p>${enLinea(parrafo.join(' '))}</p>`); parrafo = []; } };
  const cierraL = () => { if (lista) { out.push(`<${lista.tipo}>${lista.items.map((i) => `<li>${enLinea(i)}</li>`).join('')}</${lista.tipo}>`); lista = null; } };
  for (const linea of md.split('\n')) {
    const l = linea.trimEnd();
    let m;
    if (!l.trim()) { cierraP(); cierraL(); continue; }
    if ((m = l.match(/^(#{2,3})\s+(.*)/))) { cierraP(); cierraL(); const n = m[1].length; out.push(`<h${n} class="${n === 2 ? 't-m' : 't-s'}">${enLinea(m[2])}</h${n}>`); continue; }
    if ((m = l.match(/^>\s?(.*)/))) { cierraP(); cierraL(); out.push(`<blockquote>${enLinea(m[1])}</blockquote>`); continue; }
    if ((m = l.match(/^[-*]\s+(.*)/))) { cierraP(); if (lista && lista.tipo !== 'ul') cierraL(); lista = lista || { tipo: 'ul', items: [] }; lista.items.push(m[1]); continue; }
    if ((m = l.match(/^\d+\.\s+(.*)/))) { cierraP(); if (lista && lista.tipo !== 'ol') cierraL(); lista = lista || { tipo: 'ol', items: [] }; lista.items.push(m[1]); continue; }
    cierraL(); parrafo.push(l.trim());
  }
  cierraP(); cierraL();
  return out.join('\n');
}

function lee(archivo) {
  const txt = fs.readFileSync(path.join(FUENTES, archivo), 'utf8');
  const m = txt.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`${archivo}: falta la cabecera ---`);
  const meta = {};
  for (const l of m[1].split('\n')) { const i = l.indexOf(':'); if (i > 0) meta[l.slice(0, i).trim()] = l.slice(i + 1).trim(); }
  for (const k of ['titulo', 'descripcion', 'fecha']) if (!meta[k]) throw new Error(`${archivo}: falta «${k}»`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.fecha)) throw new Error(`${archivo}: la fecha debe ser AAAA-MM-DD`);
  const cuerpo = m[2].trim();
  const palabras = cuerpo.split(/\s+/).length;
  return { ...meta, slug: archivo.replace(/\.md$/, ''), cuerpo, minutos: Math.max(1, Math.round(palabras / 220)) };
}

function tituloConMano(p) {
  const t = esc(p.titulo);
  if (!p.mano) return t;
  const i = t.toLowerCase().lastIndexOf(p.mano.toLowerCase());
  if (i < 0) return t;
  return t.slice(0, i) + `<span class="mano" style="color:var(--acento)">${t.slice(i, i + p.mano.length)}</span>` + t.slice(i + p.mano.length);
}

const cabecera = (titulo, descripcion, url, extra = '') => `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descripcion)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="${extra ? 'article' : 'website'}">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descripcion)}">
<meta property="og:url" content="${url}">
<meta property="og:site_name" content="Mrs. Pink Agency">
<meta property="og:locale" content="es_ES">
<link rel="preload" href="/fonts/cedarville-cursive.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/plus-jakarta-sans-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/css/fuentes.css">
<link rel="stylesheet" href="/css/web.css">
<link rel="stylesheet" href="/css/blog.css">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="alternate" type="application/rss+xml" title="Blog de Mrs. Pink Agency" href="/blog/feed.xml">
${extra}</head>
<body>
<div class="pagina">
<div class="barra-nav">
  <header class="wrap nav">
  <a href="/" class="marca">mrs. pink agency</a>
  <nav id="menu-nav" class="nav-links hide-m" aria-label="Principal">
    <a href="/servicios">Servicios</a>
    <a href="/sobre-mi">Sobre nosotras</a>
    <a href="/blog" aria-current="page">Blog</a>
    <a href="/contacto">Contacto</a>
    <a href="/el-desayuno" class="solo-m">Reserva 30 min</a>
  </nav>
  <div class="nav-acciones">
    <button class="nav-toggle" aria-label="Abrir menú" aria-expanded="false" aria-controls="menu-nav"><svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
    <a href="/el-desayuno" class="btn btn-acento hide-m" style="min-height:44px;padding:0 20px;font-size:15px">Reserva 30 min</a>
  </div>
</header>
</div>
`;

const pie = `
<footer class="oscuro grano" style="padding:88px 0 40px">
  <div class="wrap" style="display:flex;flex-direction:column;gap:56px">
    <div class="pie-marca">mrs. pink agency</div>
    <div class="hair-claro" style="display:flex;justify-content:space-between;gap:24px;flex-wrap:wrap;align-items:center;padding-top:28px;font-size:15px">
      <span class="mano" style="font-size:26px">Cabeza fría. Marcas que arden.</span>
      <nav aria-label="Pie" style="display:flex;gap:24px;flex-wrap:wrap">
        <a href="/servicios">Servicios</a>
        <a href="/sobre-mi">Sobre nosotras</a>
        <a href="/blog">Blog</a>
        <a href="/contacto">Contacto</a>
        <a href="mailto:info@mrspinkagency.com">info@mrspinkagency.com</a>
        <a href="https://www.instagram.com/mrs.pinkagency/">Instagram</a>
        <a href="https://www.linkedin.com/company/mrs-pink-agency/">LinkedIn</a>
        <a href="/privacidad">Privacidad</a>
      </nav>
    </div>
  </div>
</footer>

</div>
<script src="/js/main.js"></script>
</body>
</html>
`;

const cta = `
<aside class="blog-cta oscuro grano">
  <p class="kicker" style="color:var(--acento)">El Desayuno</p>
  <h2 class="t-m" style="margin-top:12px">¿Lo vemos con <span class="mano" style="color:var(--acento)">café?</span></h2>
  <p style="margin:16px 0 28px;max-width:32em">30 minutos gratis por videollamada. Revisamos tu web, tus anuncios y tus datos, y te llevas tres mejoras por escrito. Nos contrates o no.</p>
  <a href="/el-desayuno" class="btn btn-acento">Reserva tus 30 minutos gratis</a>
</aside>`;

function articulo(p, todos) {
  const url = `${DOMINIO}/blog/${p.slug}`;
  const ld = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.titulo, description: p.descripcion,
    datePublished: p.fecha, dateModified: p.actualizado || p.fecha, inLanguage: 'es-ES', mainEntityOfPage: url,
    author: { '@type': 'Organization', name: 'Mrs. Pink Agency', url: DOMINIO },
    publisher: { '@type': 'Organization', name: 'Mrs. Pink Agency', url: DOMINIO } };
  const extra = `<meta property="article:published_time" content="${p.fecha}">\n<script type="application/ld+json">${JSON.stringify(ld)}</script>\n`;
  const mas = todos.filter((o) => o.slug !== p.slug).slice(0, 3);
  return cabecera(`${p.titulo} · Mrs. Pink Agency`, p.descripcion, url, extra) + `
<div class="oscuro grano">
  <section class="wrap" style="padding-top:72px;padding-bottom:72px">
    <p class="kicker" style="color:var(--acento)"><a href="/blog" style="text-decoration:none">Blog</a>${p.categoria ? ' · ' + esc(p.categoria) : ''}</p>
    <h1 class="t-xl" style="max-width:900px;margin-top:20px">${tituloConMano(p)}</h1>
    <p class="small suave" style="margin-top:28px"><time datetime="${p.fecha}">${fechaLarga(p.fecha)}</time> · ${p.minutos} min de lectura</p>
  </section>
</div>

<article class="wrap blog-texto">
${markdown(p.cuerpo)}
${cta}
</article>
${mas.length ? `
<section class="wrap" style="padding-bottom:120px">
  <h2 class="t-m">Sigue <span class="mano" style="color:var(--granate)">leyendo</span></h2>
  <div class="blog-lista" style="margin-top:32px">${mas.map(tarjeta).join('')}</div>
</section>` : ''}
` + pie;
}

function tarjeta(p) {
  return `
    <a class="blog-tarjeta" href="/blog/${p.slug}">
      <span class="small suave">${p.categoria ? esc(p.categoria) + ' · ' : ''}${fechaLarga(p.fecha)}</span>
      <span class="t-s blog-tarjeta-titulo">${esc(p.titulo)}</span>
      <span class="small">${esc(p.descripcion)}</span>
      <span class="enlace small" style="margin-top:auto">Leer artículo</span>
    </a>`;
}

function portada(posts) {
  return cabecera('Blog · Mrs. Pink Agency', 'Estrategia, publicidad e IA para marcas que quieren saber, por fin, qué funciona. Sin jerga y sin humo.', `${DOMINIO}/blog`) + `
<div class="oscuro grano">
  <section class="wrap" style="padding-top:88px;padding-bottom:80px">
    <p class="kicker" style="color:var(--acento)">Blog</p>
    <h1 class="t-xl" style="max-width:820px;margin-top:20px">Lo que funciona, contado <span class="mano" style="color:var(--acento)">claro.</span></h1>
    <p class="lead" style="margin-top:24px">Estrategia, anuncios, datos e IA para marcas que ya lo han probado casi todo. Sin jerga y sin humo.</p>
  </section>
</div>

<section class="wrap" style="padding-top:72px;padding-bottom:120px">
  ${posts.length ? `<div class="blog-lista">${posts.map(tarjeta).join('')}</div>` : '<p class="lead">Muy pronto, el primer golpe.</p>'}
</section>
` + pie;
}

function feed(posts) {
  const items = posts.slice(0, 20).map((p) => `  <item><title>${esc(p.titulo)}</title><link>${DOMINIO}/blog/${p.slug}</link><guid>${DOMINIO}/blog/${p.slug}</guid><pubDate>${new Date(p.fecha + 'T08:00:00Z').toUTCString()}</pubDate><description>${esc(p.descripcion)}</description></item>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel>\n  <title>Blog de Mrs. Pink Agency</title><link>${DOMINIO}/blog</link><description>Estrategia, publicidad e IA, sin jerga.</description><language>es-es</language>\n${items}\n</channel></rss>\n`;
}

function sitemap(posts) {
  const paginas = [
    ['/', 'es'], ['/servicios'], ['/sobre-mi'], ['/contacto'], ['/el-desayuno'], ['/blog'],
    ['/en'], ['/en/services'], ['/en/about'], ['/en/contact'], ['/en/breakfast'],
  ];
  const urls = paginas.map(([u]) => `  <url><loc>${DOMINIO}${u === '/' ? '/' : u}</loc></url>`)
    .concat(posts.map((p) => `  <url><loc>${DOMINIO}/blog/${p.slug}</loc><lastmod>${p.actualizado || p.fecha}</lastmod></url>`));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

const todos = fs.readdirSync(FUENTES).filter((f) => f.endsWith('.md')).map(lee);
const publicados = todos.filter((p) => p.borrador !== 'true' && p.fecha <= hoy).sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
const pendientes = todos.filter((p) => !publicados.includes(p));

fs.rmSync(SALIDA, { recursive: true, force: true });
fs.mkdirSync(SALIDA, { recursive: true });
for (const p of publicados) fs.writeFileSync(path.join(SALIDA, `${p.slug}.html`), articulo(p, publicados));
fs.writeFileSync(path.join(SALIDA, 'index.html'), portada(publicados));
fs.writeFileSync(path.join(SALIDA, 'feed.xml'), feed(publicados));
fs.writeFileSync(path.join(RAIZ, 'sitemap.xml'), sitemap(publicados));

console.log(`Hoy: ${hoy}. Publicados: ${publicados.length}. Pendientes o borradores: ${pendientes.map((p) => `${p.slug} (${p.fecha}${p.borrador === 'true' ? ', borrador' : ''})`).join(', ') || 'ninguno'}.`);
