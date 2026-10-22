/* =====================================================================
   PÁGINA DE UNA PROPIEDAD (propiedad.html?id=...)
   Muestra la ficha (fotos, datos, comodidades) y permite elegir fechas,
   ver el precio y reservar. Las fechas y huéspedes que venían del
   catálogo se cargan solos.
   ===================================================================== */

let propiedad = null;          // La propiedad que se está viendo
let calendarioReserva = null;  // Instancia de flatpickr
let seleccion = null;          // { desde, hasta, cotizacion } o null si aún no hay fechas válidas

// ---------- Ficha ----------

function renderFicha() {
    document.title = `${propiedad.nombre} | ${CONFIG.marca}`;

    // Galería: foto grande + hasta 4 miniaturas (clic = pantalla completa)
    const fotos = propiedad.fotos || [];
    const miniaturas = fotos.slice(1, 5);
    const foto = (f, clases) => `<button type="button" data-foto="${esc(f.src)}" data-alt="${esc(f.alt || '')}" class="${clases} overflow-hidden bg-sand-100 cursor-zoom-in group focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500"><img src="${esc(f.src)}" alt="${esc(f.alt || propiedad.nombre)}" class="w-full h-full object-cover group-hover:scale-105 transition duration-700"></button>`;
    document.getElementById('prop-galeria').innerHTML = fotos.length
        ? foto(fotos[0], `${miniaturas.length ? 'md:col-span-2 md:row-span-2' : 'md:col-span-4 md:row-span-2'} h-72 md:h-auto rounded-3xl`)
            + miniaturas.map((f) => foto(f, 'h-40 md:h-auto rounded-2xl')).join('')
        : '<p class="md:col-span-4 text-center text-ocean-600 py-20">Esta propiedad aún no tiene fotos.</p>';

    document.getElementById('prop-tipo').textContent = propiedad.tipo;
    document.getElementById('prop-titulo').textContent = propiedad.nombre;
    document.getElementById('prop-ubicacion').innerHTML = `<i class="fa-solid fa-location-dot mr-1"></i>${esc(propiedad.ubicacion)}`;
    document.getElementById('prop-descripcion').textContent = propiedad.descripcion || '';

    document.getElementById('prop-datos').innerHTML = [
        ['fa-user-group', `${propiedad.capacidad} huéspedes`],
        ['fa-bed', `${propiedad.dormitorios} ${propiedad.dormitorios === 1 ? 'dormitorio' : 'dormitorios'}`],
        ['fa-bath', `${propiedad.banos} ${propiedad.banos === 1 ? 'baño' : 'baños'}`],
        ['fa-moon', `Mínimo ${propiedad.minNoches} ${propiedad.minNoches === 1 ? 'noche' : 'noches'}`],
    ].map(([icono, texto]) => `<span class="inline-flex items-center gap-2 bg-white border border-sand-200 rounded-full px-4 py-2 text-sm"><i class="fa-solid ${icono} text-ocean-600"></i>${texto}</span>`).join('');

    const lista = COMODIDADES.filter((c) => (propiedad.comodidades || []).includes(c.id));
    document.getElementById('prop-comodidades').innerHTML = lista.length
        ? lista.map((c) => `<li class="flex items-center gap-3"><i class="fa-solid ${c.icon} w-5 text-center text-ocean-600"></i>${esc(c.label)}</li>`).join('')
        : '<li class="text-ocean-600">Sin comodidades informadas.</li>';

    document.getElementById('prop-precio').textContent = formatMoney(propiedad.precio);
    document.getElementById('prop-aseo').textContent = formatMoney(propiedad.aseo);
    document.getElementById('res-abono-pct').textContent = `${ajustes.porcentajeAbono}%`;

    // Huéspedes: de 1 hasta la capacidad de la propiedad
    const huespedes = Number(parametro('huespedes')) || 1;
    const selector = document.getElementById('cliente-huespedes');
    selector.innerHTML = Array.from({ length: propiedad.capacidad }, (_, i) =>
        `<option value="${i + 1}">${i + 1} ${i === 0 ? 'huésped' : 'huéspedes'}</option>`).join('');
    selector.value = String(Math.min(huespedes, propiedad.capacidad));
}

// ---------- Calendario y precio ----------

function initCalendario() {
    calendarioReserva = flatpickr('#calendario-reserva', {
        locale: 'es',
        mode: 'range',
        inline: true,
        minDate: 'today',
        dateFormat: 'Y-m-d',
        disable: [(d) => nocheOcupada(propiedad.id, d)],
        showMonths: window.innerWidth > 1024 ? 2 : 1,
        onChange: alCambiarFechas,
    });

    // Si venimos del catálogo con fechas elegidas, las cargamos
    const desde = parametro('desde');
    const hasta = parametro('hasta');
    if (desde && hasta) calendarioReserva.setDate([desde, hasta], true);
}

function mostrarErrorFechas(mensaje) {
    const el = document.getElementById('fecha-error');
    el.textContent = mensaje || '';
    el.classList.toggle('hidden', !mensaje);
}

/** Valida el rango elegido y, si es correcto, calcula el precio. */
function alCambiarFechas(fechas) {
    mostrarErrorFechas('');
    seleccion = null;

    if (fechas.length === 2 && fechas[1] > fechas[0]) {
        const [desde, hasta] = fechas;
        const noches = nightsBetween(iso(desde), iso(hasta));
        if (!rangoLibre(propiedad.id, desde, hasta)) {
            calendarioReserva.clear();   // clear() dispara este mismo evento con []; el aviso va después
            mostrarErrorFechas('Ese rango incluye noches ya ocupadas. Elige otras fechas.');
        } else if (noches < propiedad.minNoches) {
            calendarioReserva.clear();
            mostrarErrorFechas(`La estadía mínima es de ${propiedad.minNoches} ${propiedad.minNoches === 1 ? 'noche' : 'noches'}.`);
        } else {
            seleccion = { desde, hasta, cotizacion: cotizar(propiedad, desde, hasta) };
        }
    }
    renderResumen();
}

function renderResumen() {
    const form = document.getElementById('reserva-form');
    document.getElementById('resumen-reserva').classList.toggle('hidden', !seleccion);
    document.getElementById('resumen-vacio').classList.toggle('hidden', !!seleccion);
    form.classList.toggle('opacity-50', !seleccion);
    form.classList.toggle('pointer-events-none', !seleccion);
    if (!seleccion) return;

    const { desde, hasta, cotizacion: c } = seleccion;
    document.getElementById('res-fechas').textContent = `${fechaCorta(iso(desde))} → ${fechaCorta(iso(hasta))}`;
    document.getElementById('res-detalle').innerHTML = `
        <div class="flex justify-between"><span>Alojamiento · ${c.noches} ${c.noches === 1 ? 'noche' : 'noches'}</span><span>${formatMoney(c.alojamiento)}</span></div>
        ${c.nochesAltas ? `<div class="text-xs text-coral-600">Incluye ${c.nochesAltas} ${c.nochesAltas === 1 ? 'noche' : 'noches'} de temporada alta (+${ajustes.recargoTemporadaAlta}%)</div>` : ''}
        <div class="flex justify-between"><span>Aseo (único)</span><span>${formatMoney(c.aseo)}</span></div>`;
    document.getElementById('res-total').textContent = formatMoney(c.total);
    document.getElementById('res-abono').textContent = formatMoney(c.abono);
}

// ---------- Reserva ----------

async function procesarReserva(evento) {
    evento.preventDefault();
    if (!seleccion) return;

    const campo = (id) => document.getElementById(id).value.trim();
    const { desde, hasta, cotizacion: c } = seleccion;
    const reserva = {
        type: 'booking',
        propId: propiedad.id,
        name: campo('cliente-nombre'),
        email: campo('cliente-correo'),
        phone: campo('cliente-telefono'),
        guests: Number(campo('cliente-huespedes')) || 1,
        from: iso(desde),
        to: iso(hasta),
        total: c.total,
        deposit: c.abono,
    };

    try {
        const guardada = await Repo.addRange(reserva);   // el repositorio vuelve a validar que no se cruce
        reservas.push(guardada);
    } catch (err) {
        if (err.message === 'conflict') {
            await cargarEstado();
            calendarioReserva.clear();
            calendarioReserva.redraw();
            mostrarErrorFechas('Esas fechas se acaban de ocupar. Elige otras.');
        } else {
            showToast('No pudimos registrar tu reserva. Intenta nuevamente.', 'error');
        }
        return;
    }

    const mensaje = `Hola, acabo de reservar en ${CONFIG.marca}.\nPropiedad: ${propiedad.nombre}\nNombre: ${reserva.name}\nFechas: ${reserva.from} al ${reserva.to} (${c.noches} noches)\nHuéspedes: ${reserva.guests}\nAbono: ${formatMoney(c.abono)}`;
    document.getElementById('exito-detalle').textContent =
        `${propiedad.nombre} · ${c.noches} ${c.noches === 1 ? 'noche' : 'noches'} · abono ${formatMoney(c.abono)}. Te enviamos las instrucciones a ${reserva.email}.`;
    document.getElementById('exito-wa').href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(mensaje)}`;
    abrirModal('modal-exito');

    document.getElementById('reserva-form').reset();
    document.getElementById('cliente-huespedes').value = String(Math.min(reserva.guests, propiedad.capacidad));
    calendarioReserva.clear();
    calendarioReserva.redraw();
}

// ---------- Arranque ----------

document.addEventListener('DOMContentLoaded', async () => {
    await cargarEstado();
    propiedad = buscarPropiedad(parametro('id'));

    initCookies();
    initModales();
    initWhatsApp();

    if (!propiedad || propiedad.activo === false) {
        document.getElementById('prop-no-existe').classList.remove('hidden');
        return;
    }
    document.getElementById('prop-contenido').classList.remove('hidden');
    renderFicha();
    initCalendario();
    initAnimacionesScroll();

    // Fotos: un solo oyente para todas (delegación de eventos)
    document.getElementById('prop-galeria').addEventListener('click', (e) => {
        const boton = e.target.closest('[data-foto]');
        if (boton) abrirVisor(boton.dataset.foto, boton.dataset.alt);
    });
});
