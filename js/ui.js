/* =====================================================================
   INTERFAZ COMPARTIDA
   Comportamientos de pantalla que se repiten en varias páginas:
   animaciones al hacer scroll, cookies, ventanas modales, visor de
   fotos y botón de WhatsApp.
   ===================================================================== */

// ---------- Animación de entrada al hacer scroll ----------
/** Los elementos con la clase `.fade-in-up` aparecen suavemente al entrar en pantalla. */
function initAnimacionesScroll() {
    const observador = new IntersectionObserver((entradas) => {
        entradas.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.fade-in-up').forEach((el) => observador.observe(el));
}

// ---------- Ventanas modales ----------
// Una modal es cualquier elemento con la clase `.modal` (oculto con `hidden`).
// Si lleva el atributo `data-fija`, no se cierra con Esc ni con clic afuera (por ejemplo, el PIN).

function abrirModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function cerrarModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

/** Cierra las modales con la tecla Esc o al hacer clic en el fondo oscuro. */
function initModales() {
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        document.querySelectorAll('.modal:not(.hidden):not([data-fija])').forEach((m) => cerrarModal(m.id));
        cerrarVisor();
    });
    document.querySelectorAll('.modal').forEach((m) => {
        m.addEventListener('click', (e) => { if (e.target === m && !m.hasAttribute('data-fija')) cerrarModal(m.id); });
    });
}

// ---------- Visor de fotos ----------

/** Abre una foto en pantalla completa. */
function abrirVisor(src, alt) {
    let visor = document.getElementById('visor-fotos');
    if (!visor) {
        visor = document.createElement('div');
        visor.id = 'visor-fotos';
        visor.className = 'fixed inset-0 bg-black/90 z-[70] hidden items-center justify-center p-4 cursor-zoom-out';
        visor.innerHTML = '<img class="max-w-full max-h-[90vh] rounded-2xl shadow-2xl object-contain" src="" alt=""><p class="absolute bottom-6 text-white text-sm bg-black/60 px-4 py-2 rounded-full font-light"></p>';
        visor.addEventListener('click', cerrarVisor);
        document.body.appendChild(visor);
    }
    const img = visor.querySelector('img');
    img.src = src;
    img.alt = alt || '';
    visor.querySelector('p').textContent = alt || '';
    visor.classList.remove('hidden');
    visor.classList.add('flex');
}

function cerrarVisor() {
    const visor = document.getElementById('visor-fotos');
    if (visor) { visor.classList.add('hidden'); visor.classList.remove('flex'); }
}

// ---------- Cookies ----------

function initCookies() {
    let aceptadas = false;
    try { aceptadas = !!localStorage.getItem('cookiesAceptadas'); } catch (e) { /* sin acceso: se muestra igual */ }
    if (aceptadas) return;
    setTimeout(() => {
        const banner = document.getElementById('cookie-banner');
        if (banner) banner.classList.remove('translate-y-[150%]', 'opacity-0');
    }, 2500);
}

function aceptarCookies() {
    try { localStorage.setItem('cookiesAceptadas', 'true'); } catch (e) { /* sin acceso: no se recuerda */ }
    const banner = document.getElementById('cookie-banner');
    if (banner) banner.classList.add('translate-y-[150%]', 'opacity-0');
}

// ---------- WhatsApp ----------

/** Apunta el botón flotante al número configurado en CONFIG.whatsapp. */
function initWhatsApp() {
    const boton = document.getElementById('wa-float');
    if (boton) boton.href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(`Hola, quiero consultar por un arriendo en ${CONFIG.marca}`)}`;
}
