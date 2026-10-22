/* =====================================================================
   CONFIGURACIÓN Y DATOS INICIALES
   Aquí está todo lo que se cambia al adaptar la demo a un cliente:
   marca, WhatsApp, PIN, tipos de alojamiento, comodidades y las
   propiedades de ejemplo. No contiene lógica.
   ===================================================================== */

/** Datos fijos del negocio. */
const CONFIG = {
    marca: 'Lago Azul',
    whatsapp: '56900000000',   // Reemplazar por el número real (código de país + número, sin + ni espacios)
    adminPin: '1234',          // Solo demo: en producción el acceso lo valida el backend
};

/** Ajustes que el administrador puede cambiar desde el panel (pestaña Ajustes). */
const AJUSTES_INICIALES = {
    porcentajeAbono: 30,           // % del total que se paga para confirmar
    mesesTemporadaAlta: [0, 1, 6], // 0 = enero ... 11 = diciembre (aquí: enero, febrero y julio)
    recargoTemporadaAlta: 25,      // % extra sobre el precio por noche en temporada alta
};

/** Tipos de alojamiento disponibles en el filtro y en el formulario del panel. */
const TIPOS = ['Departamento', 'Casa', 'Cabaña', 'Loft'];

/** Comodidades que se pueden marcar en cada propiedad. `icon` es una clase de Font Awesome. */
const COMODIDADES = [
    { id: 'wifi', label: 'WiFi', icon: 'fa-wifi' },
    { id: 'estacionamiento', label: 'Estacionamiento', icon: 'fa-car' },
    { id: 'cocina', label: 'Cocina equipada', icon: 'fa-kitchen-set' },
    { id: 'piscina', label: 'Piscina', icon: 'fa-water-ladder' },
    { id: 'tinaja', label: 'Tinaja', icon: 'fa-hot-tub-person' },
    { id: 'calefaccion', label: 'Calefacción', icon: 'fa-fire' },
    { id: 'aire', label: 'Aire acondicionado', icon: 'fa-snowflake' },
    { id: 'vista', label: 'Vista panorámica', icon: 'fa-mountain-sun' },
    { id: 'terraza', label: 'Terraza / quincho', icon: 'fa-umbrella-beach' },
    { id: 'tv', label: 'TV cable', icon: 'fa-tv' },
    { id: 'lavadora', label: 'Lavadora', icon: 'fa-shirt' },
    { id: 'mascotas', label: 'Acepta mascotas', icon: 'fa-paw' },
];

/** Construye la URL de una foto de ejemplo (Unsplash). */
const foto = (id, ancho = 1200) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${ancho}&q=80`;

/** Propiedades de ejemplo. En producción vienen de la base de datos. */
const PROPIEDADES_INICIALES = [
    {
        id: 'p1', activo: true, tipo: 'Departamento', nombre: 'Depto Vista al Mar', ubicacion: 'Viña del Mar',
        capacidad: 4, dormitorios: 2, banos: 1, precio: 55000, aseo: 15000, minNoches: 2,
        descripcion: 'Departamento luminoso a pasos de la playa, con balcón y vista al mar. Ideal para familias o grupos pequeños que quieren descansar sin depender del auto.',
        comodidades: ['wifi', 'estacionamiento', 'cocina', 'vista', 'tv'],
        fotos: [
            { src: foto('1502672260266-1c1ef2d93688'), alt: 'Living con vista' },
            { src: foto('1505691938895-1758d7feb511'), alt: 'Sala de estar' },
            { src: foto('1560448204-e02f11c3d0e2'), alt: 'Dormitorio principal' },
            { src: foto('1522708323590-d24dbb6b0267'), alt: 'Cocina y comedor' },
        ],
    },
    {
        id: 'p2', activo: true, tipo: 'Casa', nombre: 'Casa del Lago', ubicacion: 'Pucón',
        capacidad: 8, dormitorios: 4, banos: 3, precio: 140000, aseo: 30000, minNoches: 3,
        descripcion: 'Casa amplia frente al lago, con tinaja y quincho. Perfecta para reuniones familiares o grupos de amigos que buscan naturaleza y comodidad.',
        comodidades: ['wifi', 'estacionamiento', 'cocina', 'tinaja', 'calefaccion', 'vista', 'terraza', 'mascotas'],
        fotos: [
            { src: foto('1470770841072-f978cf4d019e'), alt: 'Vista al lago' },
            { src: foto('1564013799919-ab600027ffc6'), alt: 'Fachada de la casa' },
            { src: foto('1507089947368-19c1da9775ae'), alt: 'Terraza' },
            { src: foto('1484154218962-a197022b5858'), alt: 'Cocina' },
        ],
    },
    {
        id: 'p3', activo: true, tipo: 'Cabaña', nombre: 'Cabaña Bosque Nativo', ubicacion: 'Puerto Varas',
        capacidad: 5, dormitorios: 2, banos: 1, precio: 75000, aseo: 20000, minNoches: 2,
        descripcion: 'Cabaña de madera rodeada de bosque nativo, con estufa a leña y silencio total. A 15 minutos del centro.',
        comodidades: ['wifi', 'estacionamiento', 'cocina', 'calefaccion', 'terraza', 'mascotas'],
        fotos: [
            { src: foto('1449844908441-8829872d2607'), alt: 'Exterior de la cabaña' },
            { src: foto('1587061949409-02df41d5e562'), alt: 'Interior' },
            { src: foto('1510798831971-661eb04b3739'), alt: 'Dormitorio' },
        ],
    },
    {
        id: 'p4', activo: true, tipo: 'Loft', nombre: 'Loft Centro Histórico', ubicacion: 'Santiago Centro',
        capacidad: 2, dormitorios: 1, banos: 1, precio: 38000, aseo: 10000, minNoches: 1,
        descripcion: 'Loft moderno en el corazón de la ciudad, cerca de metro, restaurantes y museos. Pensado para escapadas cortas y viajes de trabajo.',
        comodidades: ['wifi', 'cocina', 'aire', 'tv', 'lavadora'],
        fotos: [
            { src: foto('1493809842364-78817add7ffb'), alt: 'Ambiente principal' },
            { src: foto('1554995207-c18c203602cb'), alt: 'Living' },
            { src: foto('1536376072261-38c75010e6c9'), alt: 'Dormitorio' },
        ],
    },
    {
        id: 'p5', activo: true, tipo: 'Casa', nombre: 'Casa con Piscina', ubicacion: 'Valdivia',
        capacidad: 6, dormitorios: 3, banos: 2, precio: 110000, aseo: 25000, minNoches: 2,
        descripcion: 'Casa moderna con piscina y jardín, a minutos del río. Espacios amplios para compartir y un entorno muy tranquilo.',
        comodidades: ['wifi', 'estacionamiento', 'cocina', 'piscina', 'terraza', 'tv', 'lavadora'],
        fotos: [
            { src: foto('1600596542815-ffad4c1539a9'), alt: 'Casa y piscina' },
            { src: foto('1499793983690-e29da59ef1c2'), alt: 'Jardín' },
            { src: foto('1613490493576-7fde63acd811'), alt: 'Fachada' },
        ],
    },
];

/** Reservas y bloqueos de ejemplo, con fechas relativas a hoy para que siempre se vean. */
function reservasIniciales() {
    const dia = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
    return [
        { id: 'r1', type: 'booking', propId: 'p1', name: 'Juan Pérez', email: 'juan@test.com', phone: '+56 9 1111 1111', guests: 3, from: dia(4), to: dia(7), total: 180000, deposit: 54000 },
        { id: 'r2', type: 'blocked', propId: 'p2', name: 'Mantenimiento', from: dia(10), to: dia(12) },
        { id: 'r3', type: 'booking', propId: 'p3', name: 'María Soto', email: 'maria@test.com', phone: '+56 9 2222 2222', guests: 4, from: dia(6), to: dia(9), total: 245000, deposit: 73500 },
    ];
}
