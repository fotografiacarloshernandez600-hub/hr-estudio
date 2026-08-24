# Astro Starter Kit: Basics

```sh
npm create astro@latest -- --template basics
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src
│   ├── assets
│   │   └── astro.svg
│   ├── components
│   │   └── Welcome.astro
│   ├── layouts
│   │   └── Layout.astro
│   └── pages
│       └── index.astro
└── package.json
```

To learn more about the folder structure of an Astro project, refer to [our guide on project structure](https://docs.astro.build/en/basics/project-structure/).

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

---

## 📸 Módulo de galería con código de acceso

Un solo flujo, para clientes y para carreras por igual: subes las fotos de un
evento, se genera un código, y quien tenga ese código entra y descarga todo
directo. Sin selección, sin selfie, sin pago — la etiqueta "cliente" o
"carrera" es solo para que tú organices tus eventos, no cambia nada del
funcionamiento.

### 1. Instalar dependencias

```bash
npm install
```

(ya están en `package.json`: `@supabase/supabase-js`, `jose`, `sharp`)

### 2. Crear tu proyecto en Supabase (todo en un solo lugar, gratis, sin tarjeta)

Ve a supabase.com, crea un proyecto, y en SQL Editor ejecuta el contenido de
`supabase/schema.sql`. Ese archivo crea las tablas **y** el bucket de
almacenamiento de fotos automáticamente — no necesitas entrar a ninguna otra
plataforma ni crear ninguna cuenta aparte.

**Si ya habías corrido una versión anterior de `schema.sql`** (antes de este
cambio), no lo vuelvas a correr completo — te va a marcar error porque las
tablas `events` y `photos` ya existen. Solo corre esta parte, que es la única
nueva:

```sql
insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', false)
on conflict (id) do nothing;
```

### 3. Variables de entorno

Completa en `.env` (local) y en Vercel > Project Settings > Environment
Variables los valores de `.env.example`: `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, `GALLERY_JWT_SECRET`, `ADMIN_JWT_SECRET` y
`ADMIN_PASSWORD` (tu contraseña para entrar al panel). Ya no se necesita
ninguna variable de Cloudflare R2.

Además, agrega `PUBLIC_SUPABASE_URL` (mismo valor que `SUPABASE_URL`) y
`PUBLIC_SUPABASE_ANON_KEY` (en Supabase: Project Settings > API > Project
API keys > **anon / public** — ojo, no es la `service_role`). Estas dos sí
son seguras de exponer al navegador; permiten subir fotos grandes directo
a Supabase Storage sin pasar por el límite de tamaño de Vercel.

### 4. Usarlo

1. Entra a `/admin/login` con tu `ADMIN_PASSWORD`.
2. En `/admin/eventos`, crea un evento — elige la etiqueta (cliente o
   carrera) solo para tu propia organización, fecha opcional, y cuántos días
   quieres que dure el código (o déjalo en blanco para que no expire nunca).
3. Entra al evento recién creado y sube las fotos.
4. Copia el código de acceso y compártelo por WhatsApp — con bodas, XV años,
   o con todos los atletas de una carrera, es exactamente el mismo código
   para todos los que compartan ese evento.
5. Quien reciba el código entra a `/galeria`, lo escribe, y ve/descarga
   todas las fotos del evento.

### Borrar una foto subida por error

Desde `/admin/eventos/[id]`, cada foto de la grilla tiene una ✕ en la
esquina — te pide confirmación y la borra (original, thumbnail y el
registro en la base) de una vez.

### Descargar todas las fotos en un ZIP

En `/galeria/[eventId]`, además del botón de descarga individual por foto,
hay un botón "Descargar todas (.zip)" que arma el ZIP en el momento y lo
manda directo.

**Límite real, no solo trámite:** armar el ZIP tiene un tope de 60 segundos
(el máximo que permite una función de Vercel en el plan gratis). Para una
boda de unas cuantas decenas o cientos de fotos, no hay problema. Para un
evento de miles de fotos en alta resolución, es posible que el ZIP no
alcance a terminar en ese tiempo y la descarga falle — en ese caso, la
descarga foto por foto sigue funcionando sin límite.

### "Guardar todas en tu galería" (mejor que el ZIP en celular)

**Límite real que no se puede evitar:** ningún sitio web puede guardar fotos
automáticamente en la galería de un celular sin que la persona haga nada —
es una restricción de seguridad de iOS y Android a propósito (si cualquier
página pudiera hacerlo, sería un riesgo de privacidad). No hay forma de
saltarse esto con tecnología web.

Lo que sí se puede, y es mucho mejor que un ZIP para alguien que no es
técnico: en `/galeria/[eventId]` hay un botón **"Guardar todas en tu
galería"** que abre un panel y va mostrando las fotos una por una. En cada
una, toca "Guardar esta foto" y se abre el panel nativo de "Compartir" del
celular — ahí eligen "Guardar imagen" o "Guardar en Fotos" y queda directo
en su galería, sin descomprimir nada. Es un toque por foto, pero es el flujo
que la mayoría de la gente ya conoce (es el mismo que usan para guardar
fotos de WhatsApp o Instagram).

En computadora (donde no existe ese panel de compartir), el mismo botón cae
automáticamente a una descarga normal. El botón de ZIP se dejó como opción
secundaria, más chica, para quien prefiera todo de una vez y sepa
descomprimir.

### Pendientes / decisiones futuras

- [ ] **Límite de almacenamiento gratis**: el plan gratis de Supabase
      Storage da 1 GB. Con fotos de buena resolución esto se llena rápido
      (unos cientos de fotos, según el peso de cada una). Cuando te acerques
      al límite, Supabase te avisa; en ese momento puedes borrar eventos
      viejos ya entregados, o pasar al plan Pro de Supabase (~$25 USD/mes,
      da 100 GB) si el negocio ya lo justifica.

- [ ] Si subes 1,000+ fotos de golpe, hazlo en lotes de 50-100 — un solo
      request con miles de fotos puede chocar con el límite de tamaño/tiempo
      de Vercel.
- [ ] Decidir si quieres botón de "descargar todo" (zip) además de foto por
      foto.
- [ ] `ADMIN_PASSWORD` es una sola contraseña compartida — suficiente para
      un solo administrador (tú). Si en el futuro varias personas necesitan
      su propio usuario, se cambia a Supabase Auth.
- [ ] Si más adelante quieres cobrar por foto o agregar reconocimiento
      facial para que cada atleta vea solo las suyas, es un módulo aparte
      que se puede agregar sin tocar lo que ya funciona — avísame cuando
      llegue ese momento.
