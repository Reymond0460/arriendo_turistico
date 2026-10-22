# Lago Azul · Maqueta de arriendos turísticos

Maqueta de un sitio de **arriendo turístico con varias propiedades** (departamentos, casas, cabañas y lofts), hecha con HTML, CSS y JavaScript, sin base de datos real todavía.
Los datos de la demo (propiedades, reservas, bloqueos y ajustes) se guardan en el navegador de quien la abre.

- **Catálogo:** `index.html` (buscador por fechas, huéspedes y tipo; listado de alojamientos)
- **Ficha y reserva de una propiedad:** `propiedad.html?id=...` (fotos, comodidades, calendario, precio y reserva)
- **Panel de administración:** `admin.html` (reservas, bloqueos por propiedad, alta y edición de propiedades con fotos, ajustes). PIN de la demo: `1234`
- **Páginas legales:** `politica-de-privacidad.html`, `cookies.html`, `terminos.html`

## Estructura

| Carpeta o archivo | Qué contiene |
|---|---|
| `css/` | Estilos. Empieza por `css/estilos.css`, que importa el resto en orden. `tailwind.css` es **generado**, no se edita a mano |
| `js/config.js` | Marca, WhatsApp, PIN, tipos, comodidades y las propiedades de ejemplo |
| `js/utils.js` | Fechas, moneda, texto seguro, avisos y compresión de imágenes |
| `js/repo.js` | **Único** lugar que guarda y lee datos. Hoy usa el navegador; para producción se cambia por la API (ver `docs/API.md`) |
| `js/nucleo.js` | Estado compartido y reglas de negocio: disponibilidad, temporada alta y precios |
| `js/ui.js` | Animaciones, ventanas modales, visor de fotos, cookies y WhatsApp |
| `js/catalogo.js` | Página de inicio: filtros y tarjetas |
| `js/propiedad.js` | Ficha, calendario, precio y reserva de una propiedad |
| `js/admin.js` | Panel: PIN, reservas, bloqueos, propiedades y ajustes |
| `tailwind.config.js` | Colores y tipografías de la marca |
| `docs/` | `API.md`: contrato para el backend |

Cada página carga solo los `js/` que necesita (mira el final de cada `.html`). El orden importa.

## Cómo calcula el precio

`total = Σ precio de cada noche + aseo`. Las noches de **temporada alta** (meses elegidos en Ajustes) llevan un recargo en %. El **abono** es un porcentaje del total (también en Ajustes). Una noche está ocupada en el rango `[entrada, salida)`: el día de salida queda libre para otro huésped.

## Probar en el computador

Opción 1: abrir la carpeta en VS Code y usar la extensión Live Server sobre `index.html`.
Opción 2: doble clic en `servir.bat` (necesita Python); abre http://localhost:5174.

## Cambiar estilos

Los estilos de diseño vienen de Tailwind y están ya compilados en `css/tailwind.css`.
Si cambias clases en los `.html` o `.js`, o colores en `tailwind.config.js`, vuelve a generarlo:

```
npm install      (solo la primera vez)
npm run css
```

## Datos de demostración

En el panel, **Ajustes → Restablecer demo** borra todo lo guardado en el navegador.
Las fotos subidas desde el equipo se guardan en el navegador (límite aproximado: 15 a 20 fotos en total); en producción irían a un servidor.

## Publicar

```
firebase deploy --only hosting
```

## Antes de entregar a un cliente

- Cambiar el número de WhatsApp (`CONFIG.whatsapp` en `js/config.js`) y la marca.
- Reemplazar propiedades, fotos y textos; los textos legales son de ejemplo y deben revisarse con un abogado.
- El PIN, el pago y el guardado son simulados: ver `docs/API.md`.
