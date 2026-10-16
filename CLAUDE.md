# Mrs. Pink Agency · web

Web estática (HTML + CSS + un poco de JS, sin frameworks ni build) de Mrs. Pink Agency, agencia de marketing digital de Alba.

## Antes de tocar nada

Lee `docs/guia-de-marca.md`. Resumen de lo que no se negocia:

- **Colores:** fondos solo crema `#F6F5EC` o granate `#530F0E`. Rosa `#EEABC5` solo como acento (botones, palabra manuscrita sobre granate, sello, cifras). Texto en cacao `#30150E`. Nunca negro ni blanco puros.
- **Tipografía:** Plus Jakarta Sans para todo. Cedarville Cursive solo para una palabra por titular (clase `.mano`) y para los nombres de los servicios.
- **Sin cara:** no se usan fotos de Alba. La confianza la dan la voz, la firma, las cifras y El Desayuno.
- **Tono:** de tú, frases cortas, sin jerga. Guiños a *Reservoir Dogs* (Señor Rosa, propina, golpe, botín), como mucho uno por pieza, y nunca imágenes de películas reales.
- **Nombre:** siempre "Mrs. Pink Agency" (en diálogos y la ficha, "Mrs. Pink" es el personaje). No se menciona ninguna ciudad.

## Estructura

| Archivo | Página |
| --- | --- |
| `index.html` | Inicio |
| `servicios.html` | Servicios (El Plan, El Golpe, Los Diamantes) |
| `sobre-mi.html` | Sobre mí (ficha del personaje) |
| `contacto.html` | Contacto (formulario) |
| `el-desayuno.html` | Landing de captación de la llamada gratuita de 15 min |
| `css/web.css` | Estilos compartidos de las 4 páginas de la web |
| `css/tokens.css` + `css/landing.css` | Estilos de la landing |
| `js/main.js` | Envío de formularios (de momento solo muestra la confirmación) |

Los estilos van en parte en línea (`style="…"`) porque vienen de un diseño hecho en un lienzo. Si refactorizas a clases, mantén exactamente el mismo aspecto.

## Hecho (oct 2026)

- **Landing:** sustituidos los marcadores `[Foto de Alba]` (hero) y `[Retrato de Alba]` por la cuenta de El Desayuno y el póster de marca. Componentes `.cuenta` y `.poster` portados a `css/landing.css`. Carga de fuentes recortada a Plus Jakarta Sans + Cedarville Cursive.
- **Testimonios:** rellenados con 3 testimonios **ficticios** (Laura Méndez · Flora & Co., Diego Narváez · Casa Oliva, Patricia Alonso · Estudio Brota). ⚠️ Sustituir por reales cuando los haya.
- **Redes:** enlaces apuntados a `instagram.com/mrspinkagency` y `linkedin.com/company/mrs-pink-agency`. ⚠️ Confirmar/crear esos perfiles.
- **Legal:** creada `privacidad.html` (base) y enlazada desde pies y casillas de los formularios. ⚠️ Faltan datos legales entre corchetes (nombre/NIF/dirección).
- **SEO:** añadidos `favicon.svg` y `robots.txt`.
- **Publicación:** desplegada en Vercel como deployment temporal (preview).

## Pendiente

1. **Formularios:** conectar `js/main.js` a un servicio real (Formspree, Netlify Forms, Brevo, HubSpot…). Los campos ya tienen `name` y validación. (Se dejó como marcador a propósito.)
2. **Privacidad:** completar los datos legales de `privacidad.html` y crear aviso legal y cookies (+ banner si se añade analítica).
3. **Datos de ejemplo:** la sección "Lo que vas a ver cada mes" de la home usa datos ficticios y lo dice. Si se usan datos reales de un cliente, pedir permiso y cambiar la nota.
4. **Proyectos del carrusel** (Umbro, Pablo Gil, Distrito Legal, Fixcora): confirmar que Alba puede mencionarlos.
5. **SEO:** añadir imagen para compartir (Open Graph) y `sitemap.xml` cuando haya dominio.
6. **Publicación:** dominio mrspinkagency.com. El código vive en GitHub (`alragar21-sudo/mrs.pinkagency`). Cada push a `main` publica en producción con GitHub Actions (`.github/workflows/publicar-en-vercel.yml`), que necesita el secreto `VERCEL_TOKEN`. El proyecto de Vercel tiene el Git gestionado por v0, por eso no está enlazado desde Settings → Git. No se suben `.env*` ni `.vercel` (las claves están en las variables de entorno de Vercel).
