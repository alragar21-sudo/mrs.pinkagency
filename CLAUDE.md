# Mrs. Pink Agency · web

Web estática (HTML + CSS + un poco de JS, sin frameworks ni build) de Mrs. Pink Agency, agencia de marketing digital de Alba.

## Antes de tocar nada

Lee `docs/guia-de-marca.md`. Resumen de lo que no se negocia:

- **Colores:** fondos solo crema `#F6F5EC` o granate `#530F0E`. Rosa `#EEABC5` solo como acento (botones, palabra manuscrita sobre granate, sello, cifras). Texto en cacao `#30150E`. Nunca negro ni blanco puros.
- **Tipografía:** Plus Jakarta Sans para todo. Cedarville Cursive solo para una palabra por titular (clase `.mano`) y para los nombres de los servicios.
- **Sin cara:** no se usan fotos de Alba, salvo en Sobre Mrs. Pink, rediseñada el 25 nov 2026 (retrato en blanco y negro con grano elegido por Alba, `img/sobre/retrato.webp`; estilos en `css/sobre.css`). La confianza la dan la voz, la firma, las cifras y El Desayuno.
- **Tono:** de tú, frases cortas, sin jerga. Guiños a *Reservoir Dogs* (Señor Rosa, propina, golpe, botín), como mucho uno por pieza, y nunca imágenes de películas reales.
- **Nombre:** siempre "Mrs. Pink Agency" (en diálogos y la ficha, "Mrs. Pink" es el personaje). No se menciona ninguna ciudad.

## Estructura

| Archivo | Página |
| --- | --- |
| `index.html` | Inicio |
| `servicios.html` | Servicios (El Plan, El Golpe, Los Diamantes) |
| `sobre-mi.html` | Sobre mí (ficha del personaje) |
| `contacto.html` | Contacto (formulario) |
| `el-desayuno.html` | Landing de El Desayuno (llamada gratuita de **30 min**): hero con la promesa de la agencia y formulario de cualificación por pasos en crudo (negocio o marca personal → presupuesto, que es el filtro → preocupación → datos → calendario real de 30 min). `js/cualificacion.js` + `js/reservar.js` (`data-duracion="30"`), `css/desayuno-prueba.css`. Todos los botones de la web llevan aquí. `/el-desayuno-prueba` redirige aquí (`vercel.json`). ⚠️ La versión en inglés (`en/breakfast.html`) sigue siendo la antigua de 15 min. |
| `css/web.css` | Estilos compartidos de las 4 páginas de la web |
| `css/tokens.css` + `css/landing.css` | Estilos de la landing (base) |
| `js/main.js` | Formularios (envían a `/api/lead`), carrusel y menú móvil |
| `js/reservar.js` | Reserva de El Desayuno (`/api/slots` y `/api/book`) |
| `el-desayuno-optin.html` | **Prueba** de El Desayuno para leads más cualificados: mismo diseño que `el-desayuno.html` con el copy del lienzo de Alba (para quién es / no es, precio desde 1.200 €/mes, voz de Alba en primera persona). Formulario de 12 preguntas con tres salidas (encaja / lo reviso / no encaja) en `js/optin.js` + `css/optin.css`. **Sin conectar**: no envía ni reserva y el calendario es de muestra. `noindex` y sin enlazar. |
| `blog/` | **Generado, no editar a mano.** Blog en español (`/blog` y `/blog/<slug>`), más `blog/feed.xml` y `sitemap.xml`. Se genera con `node scripts/blog.mjs` desde `contenido/blog/*.md` (cabecera `titulo`, `descripcion`, `fecha`, `categoria`, `mano`, `borrador` y, opcional, `imagen` + `imagen_alt`). Cada artículo lleva portada: si hay `imagen` (p. ej. `/img/blog/<slug>.webp` generada con Midjourney) se usa; si no, el script dibuja una portada de marca en SVG (sello, cuenta o gráfico, con la palabra `mano`). Fotos de Midjourney: cuenta `mrs.pinkagency`, con sesión abierta en el Chrome **Browser 2 (macOS)** de Alba (Claude in Chrome). El CDN de Midjourney está bloqueado desde el contenedor, así que la imagen se abre a pantalla completa en Chrome, se captura con zoom `save_to_disk` y se guarda en `img/blog/<slug>.webp` + `.jpg` (1200 px; el `.jpg` sirve de `og:image`). Estilo: bodegón editorial sobre terciopelo granate, crema y rosa empolvado, luz lateral, grano, sin personas ni texto. Un artículo con fecha futura no sale hasta ese día (hay que volver a generar). Estilos en `css/blog.css`. `contenido/` y `scripts/` no se publican (`.vercelignore`). |
| `contenido/CALENDARIO-BLOG.md` | Lista de temas del blog. La tarea programada (lunes, miércoles y viernes, 9:00 hora de Madrid) coge el primero sin marcar, escribe el artículo, lo publica directamente (decidido por Alba) y lo marca. |
| `en/` | Versión en inglés: `index`, `services`, `about`, `contact`, `breakfast`, `privacy` |

## Idiomas (ES / EN)

- El español es el idioma principal y vive en la raíz. El inglés está en `en/`, con nombres de archivo en inglés (servicios → services, sobre-mi → about, contacto → contact, el-desayuno → breakfast, privacidad → privacy).
- **Cualquier cambio de texto o diseño se hace en las dos versiones.** Las páginas en inglés usan rutas absolutas (`/en/…`, `/css/…`) porque la portada se sirve en `/en` sin barra final.
- Selector `ES / EN` en la cabecera (`.idioma`, dentro de `.nav-acciones`) que lleva a la misma página en el otro idioma, más `<link rel="alternate" hreflang>` en cada `<head>`.
- Los scripts leen `<html lang>` para sus mensajes y mandan `idioma` a la API: `/api/slots?lang=en` y `/api/book` devuelven fechas y errores en inglés, y `/api/lead` marca el aviso con «(EN)».
- En inglés, los servicios son The Plan, The Heist y The Diamonds, y El Desayuno es The Breakfast. Lema: «Cool heads. Brands on fire.» Mismo tono: de tú (you), frases cortas, sin jerga, inglés británico.

Los estilos van en parte en línea (`style="…"`) porque vienen de un diseño hecho en un lienzo. Si refactorizas a clases, mantén exactamente el mismo aspecto.

## Hecho (oct 2026)

- **Landing:** sustituidos los marcadores `[Foto de Alba]` (hero) y `[Retrato de Alba]` por la cuenta de El Desayuno y el póster de marca. Componentes `.cuenta` y `.poster` portados a `css/landing.css`. Carga de fuentes recortada a Plus Jakarta Sans + Cedarville Cursive.
- **Testimonios:** rellenados con 3 testimonios **ficticios** (Laura Méndez · Flora & Co., Diego Narváez · Casa Oliva, Patricia Alonso · Estudio Brota). ⚠️ Sustituir por reales cuando los haya.
- **Redes:** enlaces apuntados a `instagram.com/mrs.pinkagency` (confirmado por Alba) y `linkedin.com/company/mrs-pink-agency`. ⚠️ Confirmar/crear el de LinkedIn.
- **Legal:** creada `privacidad.html` (base) y enlazada desde pies y casillas de los formularios. ⚠️ Faltan datos legales entre corchetes (nombre/NIF/dirección).
- **SEO:** añadidos `favicon.svg` y `robots.txt`.
- **Software a medida:** sección con los mockups del CRM (`img/crm/*.webp`) en la home (antes de «Alba») y en servicios (`#software`, con su píldora en el menú de servicios), en ES y EN. Los datos de los mockups son inventados (confirmado por Alba).
- **Publicación:** desplegada en Vercel como deployment temporal (preview).
- **Fuentes propias (nov 2026):** Plus Jakarta Sans y Cedarville Cursive se sirven desde `fonts/` con `css/fuentes.css` (enlazado con ruta absoluta y `preload` en todas las páginas), no desde Google Fonts. Antes, si un navegador bloqueaba Google, la manuscrita caía en la `cursive` del sistema y se veía distinta en cada navegador. No volver a enlazar Google Fonts.
- **Blog y Search Console (nov 2026):** sección `/blog` solo en español, enlazada en el menú y el pie de las páginas ES de la web (no en las landings). `sitemap.xml` + `robots.txt` apuntando a él. Alba tiene la propiedad de dominio `mrspinkagency.com` en Search Console (cuenta info@mrspinkagency.com, abierta en el Chrome **Browser 2**; no hace falta etiqueta de verificación). Sitemap enviado el 18 nov 2026.
- **SEO (18 nov 2026):** cada página indexable lleva título con palabra clave (≤60 caracteres), descripción de 130-155, `canonical` a la URL limpia, Open Graph + Twitter con `img/og-es.jpg` / `img/og-en.jpg` (1200×630, de marca) y datos estructurados JSON-LD (`data-seo`): `ProfessionalService` + `WebSite` en la home, `ItemList` de `Service` en servicios, `AboutPage`, `ContactPage`, `FAQPage` en El Desayuno (sacado de los `<details>`) y `BreadcrumbList` en las interiores. Los enlaces internos van sin `.html` (`/servicios`, `/en/services`) para evitar la redirección de `cleanUrls`. Si creas una página nueva, ponle lo mismo. El blog (`scripts/blog.mjs`) genera lo suyo (`Blog`, `BlogPosting`, og:image con la foto o `og-es.jpg`).
- **WhatsApp (nov 2026):** botón flotante abajo a la derecha en todas las páginas (ES y EN) con popup que lleva a WhatsApp +34 641 20 70 50 con mensaje ya escrito. Se abre solo una vez por visita a los 12 s. Halo rosa y ondas que laten hasta que se pulsa (se apagan con «reducir movimiento»). Todo en la sección 4 de `js/main.js` (estilos incluidos).

## Pendiente

1. **Formularios:** conectar `js/main.js` a un servicio real (Formspree, Netlify Forms, Brevo, HubSpot…). Los campos ya tienen `name` y validación. (Se dejó como marcador a propósito.)
2. **Privacidad:** completar los datos legales de `privacidad.html` y crear aviso legal y cookies (+ banner si se añade analítica).
3. **Datos de ejemplo:** la sección "Lo que vas a ver cada mes" de la home usa datos ficticios y lo dice. Si se usan datos reales de un cliente, pedir permiso y cambiar la nota.
4. **Proyectos del carrusel** (Umbro, Pablo Gil, Distrito Legal; Fixcora quitado a petición de Alba, nov 2026): confirmar que Alba puede mencionarlos.
5. **Publicación:** dominio mrspinkagency.com. El código vive en GitHub (`alragar21-sudo/mrs.pinkagency`). Cada push a `main` publica en producción con GitHub Actions (`.github/workflows/publicar-en-vercel.yml`), que necesita el secreto `VERCEL_TOKEN`. El proyecto de Vercel tiene el Git gestionado por v0, por eso no está enlazado desde Settings → Git. No se suben `.env*` ni `.vercel` (las claves están en las variables de entorno de Vercel).
