/* =====================================================================
   CATÁLOGO (index.html)
   Buscador por fechas, huéspedes y tipo de alojamiento, y listado de
   propiedades con su precio. Cada tarjeta lleva a propiedad.html
   conservando las fechas elegidas.
   ===================================================================== */

/** Filtros activos. `desde` y `hasta` son objetos Date (o null si no se eligió rango). */
const filtros = { desde: null, hasta: null, huespedes: 1, tipo: 'Todos' };

let calendarioFiltro = null;

// ---------- Filtros ----------

function initFiltros() {
    // Fechas: calendario desplegable en modo rango
    calendarioFiltro = flatpickr('#filtro-fechas', {
        locale: 'es',
        mode: 'range',
        minDate: 'today',
        dateFormat: 'd M',
        showMonths: window.innerWidth > 768 ? 2 : 1,
        onChange: (fechas) => {
            const completo = fechas.length === 2;
            filtros.desde = completo ? fechas[0] : null;
            filtros.hasta = completo ? fechas[1] : null;
            renderCatalogo();
        },
    });

    // Huéspedes: del 1 al 10
    const selector = document.getElementById('filtro-huespedes');
    selector.innerHTML = Array.from({ length: 10 }, (_, i) => `<option value="${i + 1}">${i + 1} ${i === 0 ? 'huésped' : 'huéspedes'}</option>`).join('');
    selector.addEventListener('change', () => { filtros.huespedes = Number(selector.value); renderCatalogo(); });

    // Tipo: botones tipo "chip"
    const contenedor = document.getElementById('filtro-tipos');
    contenedor.innerHTML = ['Todos', ...TIPOS].map((t) =>
        `<button type="button" data-tipo="${esc(t)}" class="chip-tipo px-4 py-2 rounded-full text-sm font-medium border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500">${esc(t)}</button>`
    ).join('');
    contenedor.addEventListener('click', (e) => {
        const boton = e.target.closest('[data-tipo]');
        if (!boton) return;
        filtros.tipo = boton.dataset.tipo;
        renderCatalogo();
    });

    document.getElementById('btn-limpiar').addEventListener('click', limpiarFiltros);
}

function limpiarFiltros() {
    filtros.desde = null; filtros.hasta = null; filtros.huespedes = 1; filtros.tipo = 'Todos';
    calendarioFiltro.clear(false);
    document.getElementById('filtro-huespedes').value = '1';
    renderCatalogo();
}

/** Aplica los filtros a la lista de propiedades activas. */
function propiedadesFiltradas() {
    const hayFechas = filtros.desde && filtros.hasta;
    return propiedadesActivas().filter((p) => {
        if (filtros.tipo !== 'Todos' && p.tipo !== filtros.tipo) return false;
        if (hayFechas) return disponibleEn(p, filtros.desde, filtros.hasta, filtros.huespedes);
        return filtros.huespedes <= p.capacidad;
    });
}

// ---------- Dibujo ----------

/** Enlace a la página de la propiedad, llevando las fechas y huéspedes elegidos. */
function enlacePropiedad(prop) {
    const params = new URLSearchParams({ id: prop.id, huespedes: filtros.huespedes });
    if (filtros.desde && filtros.hasta) {
        params.set('desde', iso(filtros.desde));
        params.set('hasta', iso(filtros.hasta));
    }
    return `propiedad.html?${params.toString()}`;
}

function tarjetaPropiedad(prop) {
    const hayFechas = filtros.desde && filtros.hasta;
    const portada = prop.fotos?.[0];
    let precio;
    if (hayFechas) {
        const c = cotizar(prop, filtros.desde, filtros.hasta);
        precio = `<span class="text-xl font-bold text-ocean-900">${formatMoney(c.total)}</span>
                  <span class="text-xs text-ocean-600">total · ${c.noches} ${c.noches === 1 ? 'noche' : 'noches'}</span>`;
    } else {
        precio = `<span class="text-xs text-ocean-600">Desde</span>
                  <span class="text-xl font-bold text-ocean-900">${formatMoney(prop.precio)}</span>
                  <span class="text-xs text-ocean-600">/noche</span>`;
    }
    return `
        <a href="${enlacePropiedad(prop)}" class="group block bg-white rounded-3xl overflow-hidden border border-sand-200 shadow-sm hover:shadow-xl transition duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500">
            <div class="relative h-56 overflow-hidden bg-sand-100">
                ${portada ? `<img src="${esc(portada.src)}" alt="${esc(portada.alt || prop.nombre)}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition duration-700">` : ''}
                <span class="absolute top-3 left-3 bg-white/95 text-ocean-800 text-xs font-semibold px-3 py-1 rounded-full shadow">${esc(prop.tipo)}</span>
            </div>
            <div class="p-5">
                <p class="text-xs text-coral-600 font-semibold uppercase tracking-wider mb-1"><i class="fa-solid fa-location-dot mr-1"></i>${esc(prop.ubicacion)}</p>
                <h3 class="font-serif text-xl text-ocean-900 mb-3">${esc(prop.nombre)}</h3>
                <p class="text-sm text-ocean-700 flex flex-wrap gap-x-4 gap-y-1 mb-4">
                    <span><i class="fa-solid fa-user-group mr-1 opacity-60"></i>${prop.capacidad}</span>
                    <span><i class="fa-solid fa-bed mr-1 opacity-60"></i>${prop.dormitorios}</span>
                    <span><i class="fa-solid fa-bath mr-1 opacity-60"></i>${prop.banos}</span>
                </p>
                <div class="flex items-baseline gap-1.5 pt-4 border-t border-sand-100">${precio}</div>
            </div>
        </a>`;
}

function renderCatalogo() {
    const lista = propiedadesFiltradas();
    const grid = document.getElementById('catalogo-grid');
    const vacio = document.getElementById('catalogo-vacio');

    grid.innerHTML = lista.map(tarjetaPropiedad).join('');
    vacio.classList.toggle('hidden', lista.length > 0);

    const total = lista.length;
    const sufijo = filtros.desde && filtros.hasta ? (total === 1 ? ' disponible en tus fechas' : ' disponibles en tus fechas') : '';
    document.getElementById('resultado-resumen').textContent = `${total} ${total === 1 ? 'alojamiento' : 'alojamientos'}${sufijo}`;

    // Resalta el chip de tipo activo
    document.querySelectorAll('.chip-tipo').forEach((chip) => {
        const activo = chip.dataset.tipo === filtros.tipo;
        chip.classList.toggle('bg-ocean-800', activo);
        chip.classList.toggle('text-white', activo);
        chip.classList.toggle('border-ocean-800', activo);
        chip.classList.toggle('bg-white', !activo);
        chip.classList.toggle('text-ocean-800', !activo);
        chip.classList.toggle('border-sand-200', !activo);
    });
}

// ---------- Arranque ----------

document.addEventListener('DOMContentLoaded', async () => {
    await cargarEstado();
    initFiltros();
    renderCatalogo();
    initCookies();
    initAnimacionesScroll();
    initModales();
    initWhatsApp();
});
