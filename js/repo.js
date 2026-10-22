/* =====================================================================
   CAPA DE DATOS
   Es el ÚNICO archivo que guarda y lee datos. El resto de la app llama
   a `Repo.*` y no sabe dónde viven los datos.

   Hoy usa LocalRepo (el navegador, solo para la demo). Para producción
   se cambia la última línea por RemoteRepo(...) y se implementan los
   endpoints descritos en docs/API.md. La interfaz es idéntica:

     Repo.load(semilla)        -> { config, properties, ranges }
     Repo.saveConfig(cfg)      -> void
     Repo.saveProperty(prop)   -> Property   (crea o actualiza según `id`)
     Repo.removeProperty(id)   -> void       (borra también sus reservas)
     Repo.addRange(range)      -> Range      (Error('conflict') si se cruza con otra de la MISMA propiedad)
     Repo.removeRange(id)      -> void
     Repo.reset()              -> void       (solo demo)

   Range = { id, type: 'booking' | 'blocked', propId, from, to, ... }
   Las noches ocupadas son [from, to): el día `to` queda libre.
   ===================================================================== */

(function () {
    const CLAVES = {
        config: 'arriendos_config_v1',
        properties: 'arriendos_propiedades_v1',
        ranges: 'arriendos_reservas_v1',
    };

    const leer = (clave) => { try { return JSON.parse(localStorage.getItem(clave)); } catch (e) { return null; } };

    /** Guarda en el navegador. Solo lanza error si el almacenamiento se llenó (el resto se ignora). */
    const escribir = (clave, valor) => {
        try { localStorage.setItem(clave, JSON.stringify(valor)); }
        catch (e) { if (e.name === 'QuotaExceededError') throw e; }
    };

    const nuevoId = (prefijo) => `${prefijo}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

    /** Dos rangos [from, to) se cruzan si cada uno empieza antes de que termine el otro. */
    const seCruzan = (a, b) => a.propId === b.propId && a.from < b.to && b.from < a.to;

    // ---------- Demo: datos en el navegador ----------
    const LocalRepo = {
        /** Si es la primera vez, guarda `semilla` (datos de ejemplo) y la devuelve. */
        async load(semilla) {
            let config = leer(CLAVES.config);
            let properties = leer(CLAVES.properties);
            let ranges = leer(CLAVES.ranges);
            if (!Array.isArray(properties)) { properties = semilla.properties; escribir(CLAVES.properties, properties); }
            if (!Array.isArray(ranges)) { ranges = semilla.ranges; escribir(CLAVES.ranges, ranges); }
            return { config, properties, ranges };
        },

        async saveConfig(cfg) { escribir(CLAVES.config, cfg); },

        async saveProperty(prop) {
            const lista = leer(CLAVES.properties) || [];
            const guardada = { ...prop, id: prop.id || nuevoId('p') };
            const i = lista.findIndex((p) => p.id === guardada.id);
            if (i >= 0) lista[i] = guardada; else lista.push(guardada);
            escribir(CLAVES.properties, lista);
            return guardada;
        },

        async removeProperty(id) {
            escribir(CLAVES.properties, (leer(CLAVES.properties) || []).filter((p) => p.id !== id));
            escribir(CLAVES.ranges, (leer(CLAVES.ranges) || []).filter((r) => r.propId !== id));
        },

        async addRange(range) {
            const lista = leer(CLAVES.ranges) || [];
            if (lista.some((r) => seCruzan(r, range))) throw new Error('conflict');
            const guardado = { ...range, id: range.id || nuevoId('r') };
            escribir(CLAVES.ranges, [...lista, guardado]);
            return guardado;
        },

        async removeRange(id) {
            escribir(CLAVES.ranges, (leer(CLAVES.ranges) || []).filter((r) => r.id !== id));
        },

        async reset() {
            try { Object.values(CLAVES).forEach((c) => localStorage.removeItem(c)); } catch (e) { /* sin acceso: nada que borrar */ }
        },
    };

    // ---------- Producción: API REST ----------
    /**
     * `getToken` entrega el token del dueño para las operaciones de administración
     * (devuelve null en la web pública).
     */
    function RemoteRepo(baseUrl, getToken = () => null) {
        async function llamar(metodo, ruta, cuerpo) {
            const headers = { 'Content-Type': 'application/json' };
            const token = getToken();
            if (token) headers.Authorization = `Bearer ${token}`;
            const res = await fetch(baseUrl + ruta, { method: metodo, headers, body: cuerpo ? JSON.stringify(cuerpo) : undefined });
            if (res.status === 409) throw new Error('conflict');
            if (!res.ok) throw new Error(`http_${res.status}`);
            return res.status === 204 ? null : res.json();
        }
        return {
            load: () => llamar('GET', '/state'),
            saveConfig: (cfg) => llamar('PUT', '/config', cfg),
            saveProperty: (p) => (p.id ? llamar('PUT', `/properties/${encodeURIComponent(p.id)}`, p) : llamar('POST', '/properties', p)),
            removeProperty: (id) => llamar('DELETE', `/properties/${encodeURIComponent(id)}`),
            addRange: (r) => llamar('POST', '/ranges', r),
            removeRange: (id) => llamar('DELETE', `/ranges/${encodeURIComponent(id)}`),
            reset: async () => {},
        };
    }

    window.LocalRepo = LocalRepo;
    window.RemoteRepo = RemoteRepo;
    window.Repo = LocalRepo;   // <- en producción: RemoteRepo('https://api.tiforti.cl/v1/arriendos/<slug>', () => token)
})();
