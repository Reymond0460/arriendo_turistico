# Contrato de API (para reemplazar `LocalRepo` por `RemoteRepo`)

En [js/repo.js](../js/repo.js) la app llama solo a `Repo.*`. Para pasar a producción:

1. Implementar los endpoints de abajo.
2. En `js/repo.js`, última línea: `window.Repo = RemoteRepo('https://api.tiforti.cl/v1/arriendos/<slug>', () => token)`.

Base: `/v1/arriendos/{slug}`. Fechas en `YYYY-MM-DD`. Las noches ocupadas son `[from, to)`: el día `to` queda libre.

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/state` | pública | `{ config, properties, ranges }`. A la web pública **no** se le deben enviar nombre, correo ni teléfono de los huéspedes: solo `{id, type, propId, from, to}`. El admin (con token) recibe el detalle completo. |
| PUT | `/config` | token | Guarda los ajustes (abono, temporada alta, recargo). |
| POST | `/properties` | token | Crea una propiedad. Devuelve la propiedad con su `id`. |
| PUT | `/properties/{id}` | token | Actualiza una propiedad (incluye activarla u ocultarla). |
| DELETE | `/properties/{id}` | token | Elimina la propiedad y sus reservas. `204`. |
| POST | `/ranges` | pública para `type: "booking"`, token para `"blocked"` | Crea reserva o bloqueo. **409** si se cruza con otro rango de la **misma** `propId`. |
| DELETE | `/ranges/{id}` | token | Cancela reserva o desbloquea. `204`. |

## Reglas que el servidor debe aplicar (no confiar en el navegador)

- **Precio**: recalcular alojamiento, aseo, total y abono desde los datos de la propiedad y los ajustes; ignorar los montos que mande el cliente.
- **Disponibilidad, estadía mínima y capacidad**: validar en la misma transacción que inserta la reserva.
- **Pago**: la reserva nace `pendiente` y pasa a `confirmada` cuando la pasarela (Webpay, Flow, Mercado Pago) avisa el pago por webhook. Si no paga en X minutos, se libera.
- **Fotos**: subirlas a un almacenamiento de archivos (por ejemplo Firebase Storage) y guardar solo su URL. Hoy, en la demo, las subidas viajan dentro de los datos.
- **Acceso de admin**: reemplazar el PIN por un login real.
- **Rate limit** y captcha en `POST /ranges`.

## Forma de los datos

```json
// Property
{ "id": "p1", "activo": true, "tipo": "Departamento", "nombre": "Depto Vista al Mar", "ubicacion": "Viña del Mar",
  "capacidad": 4, "dormitorios": 2, "banos": 1, "precio": 55000, "aseo": 15000, "minNoches": 2,
  "descripcion": "...", "comodidades": ["wifi", "cocina"], "fotos": [{ "src": "https://...", "alt": "Living" }] }

// Range (reserva)
{ "id": "r1", "type": "booking", "propId": "p1", "from": "2026-12-07", "to": "2026-12-09",
  "name": "Ana", "email": "a@b.cl", "phone": "+569...", "guests": 3,
  "total": 155000, "deposit": 46500, "status": "pending|confirmed" }

// Range (bloqueo)
{ "id": "r9", "type": "blocked", "propId": "p2", "from": "2026-11-05", "to": "2026-11-07", "name": "Mantenimiento" }

// config
{ "porcentajeAbono": 30, "mesesTemporadaAlta": [0, 1, 6], "recargoTemporadaAlta": 25 }
```
