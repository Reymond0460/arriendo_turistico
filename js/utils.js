/* =====================================================================
   UTILIDADES
   Funciones pequeñas y sin estado que usan todas las páginas:
   fechas, moneda, texto seguro, avisos y compresión de imágenes.
   ===================================================================== */

// ---------- Fechas ----------
// Las fechas se guardan como texto 'AAAA-MM-DD' para evitar problemas de zona horaria.

const pad = (n) => String(n).padStart(2, '0');

/** Date -> 'AAAA-MM-DD' */
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** 'AAAA-MM-DD' -> Date (a medianoche, hora local) */
const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };

/** Suma `n` días a una fecha sin modificar la original. */
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

/** Cantidad de noches entre dos fechas 'AAAA-MM-DD'. */
const nightsBetween = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);

/** 'AAAA-MM-DD' -> '12 nov' */
const fechaCorta = (s) => parse(s).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }).replace('.', '');

// ---------- Texto y dinero ----------

/** Escapa texto para insertarlo en HTML sin riesgo (los datos del cliente nunca se inyectan crudos). */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** 55000 -> '$55.000' */
const formatMoney = (n) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

/** Lee un parámetro de la URL (por ejemplo ?id=p1). */
const parametro = (nombre) => new URLSearchParams(location.search).get(nombre);

// ---------- Avisos ----------

/** Muestra un aviso breve arriba a la derecha. `tipo`: 'success' | 'error'. */
function showToast(mensaje, tipo = 'success') {
    let contenedor = document.getElementById('toast-container');
    if (!contenedor) {
        contenedor = document.createElement('div');
        contenedor.id = 'toast-container';
        contenedor.className = 'fixed top-24 right-4 z-[60] flex flex-col gap-2 max-w-sm w-full pointer-events-none';
        document.body.appendChild(contenedor);
    }
    const aviso = document.createElement('div');
    const color = tipo === 'success' ? 'bg-ocean-900 text-white' : 'bg-red-800 text-white';
    aviso.className = `${color} p-4 rounded-xl shadow-2xl text-sm flex items-center justify-between pointer-events-auto transition-all duration-300 -translate-y-2 opacity-0`;
    aviso.setAttribute('role', 'status');
    aviso.innerHTML = `<span>${esc(mensaje)}</span><button type="button" aria-label="Cerrar aviso" class="ml-4 text-xs opacity-70 hover:opacity-100">&times;</button>`;
    aviso.querySelector('button').addEventListener('click', () => aviso.remove());
    contenedor.appendChild(aviso);

    setTimeout(() => aviso.classList.remove('-translate-y-2', 'opacity-0'), 10);
    setTimeout(() => { aviso.classList.add('opacity-0'); setTimeout(() => aviso.remove(), 300); }, 3500);
}

// ---------- Imágenes ----------

/**
 * Reduce una imagen a `maxLado` px (JPEG) para no llenar el almacenamiento del navegador.
 * Devuelve una promesa con la imagen como texto (data URL).
 */
function comprimirImagen(archivo, maxLado = 1400, calidad = 0.82) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(archivo);
        const img = new Image();
        img.onload = () => {
            const escala = Math.min(1, maxLado / Math.max(img.width, img.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(img.width * escala);
            canvas.height = Math.round(img.height * escala);
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(url);
            resolve(canvas.toDataURL('image/jpeg', calidad));
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('imagen_invalida')); };
        img.src = url;
    });
}
