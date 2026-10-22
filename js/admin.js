/* =====================================================================
   PANEL DE ADMINISTRACIÓN (admin.html)
   - Acceso con PIN (demo)
   - Reservas y bloqueos de fechas por propiedad
   - Alta, edición, activación y borrado de propiedades (con fotos)
   - Ajustes generales: abono y temporada alta
   ===================================================================== */

const CLAVE_SESION = 'arriendos_admin_ok';
let panelDesbloqueado = false;
let calendarioBloqueo = null;
let fechasBloqueo = [];          // Fechas elegidas en el formulario de bloqueo
let fotosBorrador = [];          // Fotos de la propiedad que se está editando

// ---------- Acceso con PIN (demo; en producción lo valida el backend) ----------

function sesionActiva() {
    try { return panelDesbloqueado || sessionStorage.getItem(CLAVE_SESION) === '1'; } catch (e) { return panelDesbloqueado; }
}

function validarPin(evento) {
    evento.preventDefault();
    if (document.getElementById('pin-input').value !== CONFIG.adminPin) {
        document.getElementById('pin-error').textContent = 'PIN incorrecto';
        return;
    }
    panelDesbloqueado = true;
    try { sessionStorage.setItem(CLAVE_SESION, '1'); } catch (e) { /* sin acceso: vale solo esta carga */ }
    cerrarModal('modal-pin');
    iniciarPanel();
}

// ---------- Pestañas ----------

function mostrarPestana(nombre) {
    ['reservas', 'propiedades', 'ajustes'].forEach((t) => {
        document.getElementById(`tab-${t}`).classList.toggle('hidden', t !== nombre);
        const boton = document.querySelector(`[data-tab="${t}"]`);
        boton.classList.toggle('bg-white', t === nombre);
        boton.classList.toggle('shadow-sm', t === nombre);
        boton.classList.toggle('text-gray-900', t === nombre);
        boton.classList.toggle('text-gray-600', t !== nombre);
    });
}

// ---------- Resumen y tabla de reservas ----------

const nombrePropiedad = (id) => buscarPropiedad(id)?.nombre || 'Propiedad eliminada';

function renderResumen() {
    const reservasReales = reservas.filter((r) => r.type === 'booking');
    document.getElementById('stat-reservas').textContent = reservasReales.length;
    document.getElementById('stat-noches').textContent = reservas.reduce((s, r) => s + nightsBetween(r.from, r.to), 0);
    document.getElementById('stat-abonos').textContent = formatMoney(reservasReales.reduce((s, r) => s + (r.deposit || 0), 0));
    document.getElementById('stat-propiedades').textContent = propiedadesActivas().length;
}

function renderTablaReservas() {
    const filtro = document.getElementById('filtro-propiedad').value;
    const filas = reservas
        .filter((r) => !filtro || r.propId === filtro)
        .sort((a, b) => a.from.localeCompare(b.from))
        .map((r) => {
            const noches = nightsBetween(r.from, r.to);
            const periodo = `${esc(r.from)} a ${esc(r.to)}<br><span class="text-xs text-gray-400">(${noches} ${noches === 1 ? 'noche' : 'noches'})</span>`;
            const propiedadCelda = `<td class="px-5 py-4 text-sm text-gray-700 font-medium">${esc(nombrePropiedad(r.propId))}</td>`;
            if (r.type === 'booking') {
                return `<tr>
                    <td class="px-5 py-4"><span class="px-2.5 py-1 text-xs font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">Reserva</span></td>
                    ${propiedadCelda}
                    <td class="px-5 py-4 text-sm">
                        <div class="font-medium text-gray-900">${esc(r.name)} <span class="text-gray-400 font-normal">· ${r.guests || '-'} pers.</span></div>
                        <div class="text-gray-500">${esc(r.email)} · ${esc(r.phone || '')}</div>
                        <div class="text-xs text-gray-400">Abono ${formatMoney(r.deposit || 0)} de ${formatMoney(r.total || 0)}</div>
                    </td>
                    <td class="px-5 py-4 text-sm text-gray-500">${periodo}</td>
                    <td class="px-5 py-4 text-right"><button type="button" data-borrar-rango="${esc(r.id)}" class="text-red-500 hover:text-red-700 text-sm"><i class="fa-solid fa-trash mr-1"></i>Cancelar</button></td>
                </tr>`;
            }
            return `<tr class="bg-gray-50/60">
                <td class="px-5 py-4"><span class="px-2.5 py-1 text-xs font-bold rounded-md bg-gray-100 text-gray-600 border border-gray-200">Bloqueo</span></td>
                ${propiedadCelda}
                <td class="px-5 py-4 text-sm text-gray-900 font-medium">${esc(r.name || 'Sin motivo')}</td>
                <td class="px-5 py-4 text-sm text-gray-500">${periodo}</td>
                <td class="px-5 py-4 text-right"><button type="button" data-borrar-rango="${esc(r.id)}" class="text-red-500 hover:text-red-700 text-sm"><i class="fa-solid fa-unlock mr-1"></i>Desbloquear</button></td>
            </tr>`;
        });
    document.getElementById('tabla-reservas').innerHTML = filas.join('');
    document.getElementById('reservas-vacio').classList.toggle('hidden', filas.length > 0);
}

async function borrarRango(id) {
    const rango = reservas.find((r) => r.id === id);
    if (!rango || !confirm(rango.type === 'booking' ? `¿Cancelar la reserva de ${rango.name}?` : '¿Desbloquear estas fechas?')) return;
    try { await Repo.removeRange(id); } catch (e) { showToast('No se pudo eliminar el registro.', 'error'); return; }
    reservas = reservas.filter((r) => r.id !== id);
    refrescarReservas();
    showToast('Registro eliminado.');
}

// ---------- Bloqueo de fechas ----------

/** Dibuja el calendario de bloqueos según la propiedad elegida (cada una tiene su propia ocupación). */
function initCalendarioBloqueo() {
    if (calendarioBloqueo) calendarioBloqueo.destroy();
    fechasBloqueo = [];
    const propId = document.getElementById('bloqueo-propiedad').value;
    calendarioBloqueo = flatpickr('#bloqueo-fechas', {
        locale: 'es',
        mode: 'range',
        minDate: 'today',
        dateFormat: 'Y-m-d',
        disable: [(d) => nocheOcupada(propId, d)],
        showMonths: window.innerWidth > 768 ? 2 : 1,
        onChange: (fechas) => { fechasBloqueo = fechas; },
    });
}

async function bloquearFechas(evento) {
    evento.preventDefault();
    const propId = document.getElementById('bloqueo-propiedad').value;
    if (!propId) { showToast('Primero crea una propiedad.', 'error'); return; }
    if (fechasBloqueo.length !== 2 || fechasBloqueo[1] <= fechasBloqueo[0]) {
        showToast('Elige fecha de inicio y de término.', 'error');
        return;
    }
    if (!rangoLibre(propId, fechasBloqueo[0], fechasBloqueo[1])) {
        showToast('El rango incluye noches ya ocupadas.', 'error');
        return;
    }
    try {
        const guardado = await Repo.addRange({
            type: 'blocked',
            propId,
            name: document.getElementById('bloqueo-motivo').value.trim() || 'Mantenimiento',
            from: iso(fechasBloqueo[0]),
            to: iso(fechasBloqueo[1]),
        });
        reservas.push(guardado);
    } catch (e) {
        showToast(e.message === 'conflict' ? 'El rango incluye noches ya ocupadas.' : 'No se pudieron bloquear las fechas.', 'error');
        return;
    }
    document.getElementById('bloqueo-motivo').value = '';
    refrescarReservas();
    showToast('Fechas bloqueadas.');
}

/** Redibuja todo lo que depende de las reservas. */
function refrescarReservas() {
    renderResumen();
    renderTablaReservas();
    initCalendarioBloqueo();
}

/** Rellena los selectores de propiedad (filtro de la tabla y formulario de bloqueo). */
function renderSelectoresPropiedad() {
    const opciones = propiedades.map((p) => `<option value="${esc(p.id)}">${esc(p.nombre)}</option>`).join('');
    const filtro = document.getElementById('filtro-propiedad');
    const previo = filtro.value;
    filtro.innerHTML = `<option value="">Todas las propiedades</option>${opciones}`;
    filtro.value = propiedades.some((p) => p.id === previo) ? previo : '';

    const bloqueo = document.getElementById('bloqueo-propiedad');
    const previoBloqueo = bloqueo.value;
    bloqueo.innerHTML = opciones;
    if (propiedades.some((p) => p.id === previoBloqueo)) bloqueo.value = previoBloqueo;
}

// ---------- Propiedades ----------

function renderPropiedades() {
    const contenedor = document.getElementById('lista-propiedades');
    contenedor.innerHTML = propiedades.length ? propiedades.map((p) => `
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col ${p.activo === false ? 'opacity-60' : ''}">
            <div class="h-36 bg-gray-100">${p.fotos?.[0] ? `<img src="${esc(p.fotos[0].src)}" alt="${esc(p.nombre)}" class="w-full h-full object-cover">` : ''}</div>
            <div class="p-4 flex-grow">
                <p class="text-xs text-gray-400 uppercase tracking-wider">${esc(p.tipo)} · ${esc(p.ubicacion)}</p>
                <h3 class="font-medium text-gray-900">${esc(p.nombre)}</h3>
                <p class="text-sm text-gray-500">${formatMoney(p.precio)}/noche · ${p.capacidad} pers.${p.activo === false ? ' · <b>Oculta</b>' : ''}</p>
            </div>
            <div class="px-4 pb-4 flex gap-2 text-sm">
                <button type="button" data-editar="${esc(p.id)}" class="flex-1 bg-ocean-800 hover:bg-ocean-900 text-white rounded-lg py-2 transition">Editar</button>
                <button type="button" data-alternar="${esc(p.id)}" class="px-3 border border-gray-200 hover:bg-gray-50 rounded-lg" title="${p.activo === false ? 'Mostrar en el sitio' : 'Ocultar del sitio'}" aria-label="${p.activo === false ? 'Mostrar en el sitio' : 'Ocultar del sitio'}"><i class="fa-solid ${p.activo === false ? 'fa-eye' : 'fa-eye-slash'}"></i></button>
                <button type="button" data-eliminar="${esc(p.id)}" class="px-3 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg" title="Eliminar" aria-label="Eliminar propiedad"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>`).join('')
        : '<p class="col-span-full text-center text-gray-400 py-12">Aún no hay propiedades. Crea la primera con el botón de arriba.</p>';
}

async function alternarPropiedad(id) {
    const prop = buscarPropiedad(id);
    if (!prop) return;
    try {
        const guardada = await Repo.saveProperty({ ...prop, activo: prop.activo === false });
        propiedades = propiedades.map((p) => (p.id === id ? guardada : p));
    } catch (e) { showToast('No se pudo actualizar la propiedad.', 'error'); return; }
    renderPropiedades();
    renderResumen();
}

async function eliminarPropiedad(id) {
    const prop = buscarPropiedad(id);
    if (!prop || !confirm(`¿Eliminar "${prop.nombre}"? También se borrarán sus reservas y bloqueos.`)) return;
    try { await Repo.removeProperty(id); } catch (e) { showToast('No se pudo eliminar la propiedad.', 'error'); return; }
    propiedades = propiedades.filter((p) => p.id !== id);
    reservas = reservas.filter((r) => r.propId !== id);
    renderSelectoresPropiedad();
    renderPropiedades();
    refrescarReservas();
    showToast('Propiedad eliminada.');
}

// ----- Formulario de propiedad (crear / editar) -----

const campoProp = (id) => document.getElementById(`pf-${id}`);

function abrirFormularioPropiedad(id) {
    const prop = id ? buscarPropiedad(id) : null;
    document.getElementById('pf-titulo').textContent = prop ? 'Editar propiedad' : 'Nueva propiedad';
    campoProp('id').value = prop?.id || '';
    campoProp('nombre').value = prop?.nombre || '';
    campoProp('tipo').value = prop?.tipo || TIPOS[0];
    campoProp('ubicacion').value = prop?.ubicacion || '';
    campoProp('capacidad').value = prop?.capacidad ?? 2;
    campoProp('dormitorios').value = prop?.dormitorios ?? 1;
    campoProp('banos').value = prop?.banos ?? 1;
    campoProp('precio').value = prop?.precio ?? 50000;
    campoProp('aseo').value = prop?.aseo ?? 10000;
    campoProp('minNoches').value = prop?.minNoches ?? 1;
    campoProp('descripcion').value = prop?.descripcion || '';
    campoProp('activo').checked = prop ? prop.activo !== false : true;
    document.querySelectorAll('[name="pf-comodidad"]').forEach((c) => { c.checked = (prop?.comodidades || []).includes(c.value); });
    fotosBorrador = (prop?.fotos || []).map((f) => ({ ...f }));
    renderFotosBorrador();
    abrirModal('modal-propiedad');
}

function renderFotosBorrador() {
    document.getElementById('pf-fotos').innerHTML = fotosBorrador.length
        ? fotosBorrador.map((f, i) => `
            <div class="relative rounded-xl overflow-hidden border border-gray-200 aspect-[4/3] bg-gray-100">
                <img src="${esc(f.src)}" alt="${esc(f.alt || '')}" class="w-full h-full object-cover">
                ${i === 0 ? '<span class="absolute top-2 left-2 bg-ocean-800 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">Principal</span>' : ''}
                <div class="absolute top-2 right-2 flex gap-1">
                    ${i > 0 ? `<button type="button" data-foto-principal="${i}" aria-label="Poner como principal" title="Poner como principal" class="w-7 h-7 rounded-full bg-white/90 text-ocean-800 text-xs shadow"><i class="fa-solid fa-star"></i></button>` : ''}
                    <button type="button" data-foto-borrar="${i}" aria-label="Quitar foto" title="Quitar foto" class="w-7 h-7 rounded-full bg-white/90 text-red-600 text-xs shadow"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>`).join('')
        : '<p class="col-span-full text-sm text-gray-400 italic">Sin fotos. Agrega al menos una.</p>';
}

async function agregarFotosArchivo(input) {
    for (const archivo of [...input.files]) {
        try {
            fotosBorrador.push({ src: await comprimirImagen(archivo), alt: archivo.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ') });
        } catch (e) {
            showToast(`No se pudo leer "${archivo.name}".`, 'error');
        }
    }
    input.value = '';
    renderFotosBorrador();
}

function agregarFotoUrl() {
    const url = document.getElementById('pf-foto-url').value.trim();
    const alt = document.getElementById('pf-foto-alt').value.trim();
    if (!/^https?:\/\//i.test(url)) { showToast('El enlace debe empezar con http:// o https://', 'error'); return; }
    fotosBorrador.push({ src: url, alt: alt || 'Foto de la propiedad' });
    document.getElementById('pf-foto-url').value = '';
    document.getElementById('pf-foto-alt').value = '';
    renderFotosBorrador();
}

async function guardarPropiedad(evento) {
    evento.preventDefault();
    const numero = (id, minimo) => Math.max(minimo, Number(campoProp(id).value) || minimo);
    const datos = {
        id: campoProp('id').value || undefined,
        nombre: campoProp('nombre').value.trim(),
        tipo: campoProp('tipo').value,
        ubicacion: campoProp('ubicacion').value.trim(),
        capacidad: numero('capacidad', 1),
        dormitorios: numero('dormitorios', 0),
        banos: numero('banos', 1),
        precio: numero('precio', 1),
        aseo: numero('aseo', 0),
        minNoches: numero('minNoches', 1),
        descripcion: campoProp('descripcion').value.trim(),
        activo: campoProp('activo').checked,
        comodidades: [...document.querySelectorAll('[name="pf-comodidad"]:checked')].map((c) => c.value),
        fotos: fotosBorrador,
    };
    if (!datos.nombre) { showToast('Escribe un nombre para la propiedad.', 'error'); return; }

    try {
        const guardada = await Repo.saveProperty(datos);
        propiedades = propiedades.some((p) => p.id === guardada.id)
            ? propiedades.map((p) => (p.id === guardada.id ? guardada : p))
            : [...propiedades, guardada];
    } catch (e) {
        showToast('No se pudo guardar: el navegador se quedó sin espacio. Quita alguna foto o usa enlaces.', 'error');
        return;
    }
    cerrarModal('modal-propiedad');
    renderSelectoresPropiedad();
    renderPropiedades();
    renderResumen();
    showToast('Propiedad guardada.');
}

// ---------- Ajustes ----------

const NOMBRES_MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function renderAjustes() {
    document.getElementById('aj-abono').value = ajustes.porcentajeAbono;
    document.getElementById('aj-recargo').value = ajustes.recargoTemporadaAlta;
    document.getElementById('aj-meses').innerHTML = NOMBRES_MESES.map((m, i) => `
        <label class="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" name="aj-mes" value="${i}" ${ajustes.mesesTemporadaAlta.includes(i) ? 'checked' : ''} class="rounded text-ocean-700 focus:ring-ocean-500">${m}
        </label>`).join('');
}

async function guardarFormularioAjustes(evento) {
    evento.preventDefault();
    ajustes.porcentajeAbono = Math.min(100, Math.max(1, Number(document.getElementById('aj-abono').value) || 30));
    ajustes.recargoTemporadaAlta = Math.max(0, Number(document.getElementById('aj-recargo').value) || 0);
    ajustes.mesesTemporadaAlta = [...document.querySelectorAll('[name="aj-mes"]:checked')].map((c) => Number(c.value));
    await guardarAjustes();
    showToast('Ajustes guardados.');
}

async function restablecerDemo() {
    if (!confirm('¿Restablecer propiedades, reservas y ajustes de demostración?')) return;
    await Repo.reset();
    location.reload();
}

// ---------- Arranque ----------

/** Conecta todos los botones del panel (se hace una sola vez, con delegación de eventos). */
function conectarEventos() {
    document.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => mostrarPestana(b.dataset.tab)));
    document.getElementById('filtro-propiedad').addEventListener('change', renderTablaReservas);
    document.getElementById('bloqueo-propiedad').addEventListener('change', initCalendarioBloqueo);
    document.getElementById('bloqueo-form').addEventListener('submit', bloquearFechas);
    document.getElementById('btn-nueva-propiedad').addEventListener('click', () => abrirFormularioPropiedad());
    document.getElementById('propiedad-form').addEventListener('submit', guardarPropiedad);
    document.getElementById('pf-foto-archivo').addEventListener('change', (e) => agregarFotosArchivo(e.target));
    document.getElementById('pf-foto-agregar').addEventListener('click', agregarFotoUrl);
    document.getElementById('ajustes-form').addEventListener('submit', guardarFormularioAjustes);
    document.getElementById('btn-reset').addEventListener('click', restablecerDemo);

    // Botones que se dibujan dinámicamente (tabla, tarjetas y fotos del formulario)
    document.getElementById('tabla-reservas').addEventListener('click', (e) => {
        const b = e.target.closest('[data-borrar-rango]');
        if (b) borrarRango(b.dataset.borrarRango);
    });
    document.getElementById('lista-propiedades').addEventListener('click', (e) => {
        const editar = e.target.closest('[data-editar]');
        const alternar = e.target.closest('[data-alternar]');
        const eliminar = e.target.closest('[data-eliminar]');
        if (editar) abrirFormularioPropiedad(editar.dataset.editar);
        if (alternar) alternarPropiedad(alternar.dataset.alternar);
        if (eliminar) eliminarPropiedad(eliminar.dataset.eliminar);
    });
    document.getElementById('pf-fotos').addEventListener('click', (e) => {
        const borrar = e.target.closest('[data-foto-borrar]');
        const principal = e.target.closest('[data-foto-principal]');
        if (borrar) fotosBorrador.splice(Number(borrar.dataset.fotoBorrar), 1);
        if (principal) fotosBorrador.unshift(...fotosBorrador.splice(Number(principal.dataset.fotoPrincipal), 1));
        if (borrar || principal) renderFotosBorrador();
    });
}

/** Rellena los formularios fijos que dependen de las listas (tipos y comodidades). */
function prepararFormularios() {
    campoProp('tipo').innerHTML = TIPOS.map((t) => `<option>${esc(t)}</option>`).join('');
    document.getElementById('pf-comodidades').innerHTML = COMODIDADES.map((c) => `
        <label class="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" name="pf-comodidad" value="${c.id}" class="rounded text-ocean-700 focus:ring-ocean-500"><i class="fa-solid ${c.icon} w-4 text-center text-gray-400"></i>${esc(c.label)}
        </label>`).join('');
}

async function iniciarPanel() {
    document.getElementById('panel').classList.remove('hidden');
    await cargarEstado();
    prepararFormularios();
    conectarEventos();
    renderSelectoresPropiedad();
    renderPropiedades();
    renderAjustes();
    refrescarReservas();
    mostrarPestana('reservas');
}

document.addEventListener('DOMContentLoaded', () => {
    initModales();
    document.getElementById('pin-form').addEventListener('submit', validarPin);
    document.getElementById('pin-cancelar').addEventListener('click', () => { location.href = 'index.html'; });
    if (sesionActiva()) { iniciarPanel(); return; }
    abrirModal('modal-pin');
    document.getElementById('pin-input').focus();
});
