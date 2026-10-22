/* =====================================================================
   NÚCLEO
   Estado compartido (propiedades, reservas, ajustes) y las reglas de
   negocio: disponibilidad, temporada alta y cálculo de precios.
   Lo usan la página pública y el panel. No toca el HTML.
   ===================================================================== */

/** Ajustes vigentes (se mezclan con los guardados por el administrador). */
let ajustes = { ...AJUSTES_INICIALES };

/** Lista de propiedades. */
let propiedades = [];

/** Reservas y bloqueos de todas las propiedades. */
let reservas = [];

/** Carga el estado desde Repo. Si falla, la página sigue con listas vacías y avisa. */
async function cargarEstado() {
    try {
        const estado = await Repo.load({ properties: PROPIEDADES_INICIALES, ranges: reservasIniciales() });
        propiedades = estado.properties || [];
        reservas = estado.ranges || [];
        if (estado.config) ajustes = { ...AJUSTES_INICIALES, ...estado.config };
    } catch (e) {
        showToast('No se pudo cargar la disponibilidad. Intenta recargar la página.', 'error');
    }
}

/** Guarda los ajustes y avisa si no se pudo. */
function guardarAjustes() {
    return Repo.saveConfig(ajustes).catch(() => showToast('No se pudieron guardar los ajustes.', 'error'));
}

// ---------- Búsqueda ----------

const buscarPropiedad = (id) => propiedades.find((p) => p.id === id) || null;

const propiedadesActivas = () => propiedades.filter((p) => p.activo !== false);

// ---------- Disponibilidad ----------

/** ¿La noche que empieza en el día `d` ya está ocupada en esa propiedad? */
function nocheOcupada(propId, d) {
    const dia = iso(d);
    return reservas.some((r) => r.propId === propId && dia >= r.from && dia < r.to);
}

/** ¿Todas las noches entre `desde` y `hasta` están libres? (`hasta` es el día de salida) */
function rangoLibre(propId, desde, hasta) {
    for (let d = new Date(desde); d < hasta; d = addDays(d, 1)) {
        if (nocheOcupada(propId, d)) return false;
    }
    return true;
}

/** ¿Se puede ofrecer esta propiedad para esas fechas y esa cantidad de huéspedes? */
function disponibleEn(prop, desde, hasta, huespedes) {
    if (huespedes > prop.capacidad) return false;
    if (nightsBetween(iso(desde), iso(hasta)) < prop.minNoches) return false;
    return rangoLibre(prop.id, desde, hasta);
}

// ---------- Precios ----------

const esTemporadaAlta = (d) => ajustes.mesesTemporadaAlta.includes(d.getMonth());

/** Precio de una noche concreta (con recargo si cae en temporada alta). */
function precioNoche(prop, d) {
    const recargo = esTemporadaAlta(d) ? 1 + ajustes.recargoTemporadaAlta / 100 : 1;
    return Math.round(prop.precio * recargo);
}

/**
 * Calcula el valor de una estadía.
 * Devuelve { noches, nochesAltas, alojamiento, aseo, total, abono }.
 */
function cotizar(prop, desde, hasta) {
    let alojamiento = 0;
    let nochesAltas = 0;
    for (let d = new Date(desde); d < hasta; d = addDays(d, 1)) {
        alojamiento += precioNoche(prop, d);
        if (esTemporadaAlta(d)) nochesAltas++;
    }
    const total = alojamiento + prop.aseo;
    return {
        noches: nightsBetween(iso(desde), iso(hasta)),
        nochesAltas,
        alojamiento,
        aseo: prop.aseo,
        total,
        abono: Math.round(total * ajustes.porcentajeAbono / 100),
    };
}
