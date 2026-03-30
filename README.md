# TGC-Arkade

Arkanoid-style game (The Giveaways Club Arkade).

## Tus enlaces (GitHub: **gus09090909** / repo: **TGC-Arkade**)

| Qué | Enlace |
|-----|--------|
| **Código en GitHub** | https://github.com/gus09090909/TGC-Arkade |
| **Clonar** | `git clone https://github.com/gus09090909/TGC-Arkade.git` |
| **Descargar ZIP** | https://github.com/gus09090909/TGC-Arkade/archive/refs/heads/master.zip |
| **Juego online** (cuando lo despliegues en Render) | https://tgc-arkade.onrender.com |

La URL del juego (`*.onrender.com`) es la que eliges al crear el servicio en Render. En [`render.yaml`](render.yaml) el nombre del servicio es `tgc-arkade`, así que Render suele asignar **`https://tgc-arkade.onrender.com`**. Si pones otro nombre al servicio, la URL será `https://OTRO-NOMBRE.onrender.com`.

> **Sobre los cambios en el repo:** todo lo que hacemos en Cursor se guarda en **los archivos de tu carpeta del proyecto** en el PC. Eso es tu copia local del repo. Para que aparezca en GitHub tienes que hacer tú **`git add` → `git commit` → `git push`** (como con tus otros juegos). Desde aquí no se sube nada a GitHub por ti.

## Jugar online con un solo enlace

El juego y la API van **en el mismo sitio**: abres la URL y ya puedes jugar (sin otro servidor aparte).

### Opción recomendada: Render (gratis)

1. Sube este repo a GitHub (si aún no está).
2. Entra en [render.com](https://render.com), crea cuenta y **New → Web Service**.
3. Conecta el repositorio `TGC-Arkade`.
4. Configuración sugerida:
   - **Build command:** `npm install && npx bower install --allow-root && npx grunt build`
   - **Start command:** `npm start`
   - **Instance type:** Free (o la que quieras)
5. Despliega. Render te dará una URL pública, por ejemplo `https://tgc-arkade.onrender.com`.
6. **Ese es el enlace** que puedes pasar a todo el mundo: al abrirlo carga el juego y las peticiones van a `/api/...` en el mismo dominio.

En producción, `js/_config_prod.js` deja `TGC_CLOUD_SYNC_URL` vacío: el cliente usa la **misma URL** que la página (`/api/register`, `/api/leaderboard`, etc.).

> **Nota:** En el plan gratuito de Render el servicio “se duerme” tras un rato sin uso; la primera carga puede tardar ~1 minuto. Los datos del ranking viven en disco del servidor (`server/data.json`); en free tier pueden perderse si el contenedor se recrea.

También hay un [`render.yaml`](render.yaml) en la raíz para despliegue declarativo en Render.

### Probar en tu PC (misma experiencia que online)

```sh
npm install
npx bower install
npx grunt build
npm start
```

Abre **http://localhost:3847/** (el puerto lo define `PORT` o por defecto 3847).

### GitHub Pages (`https://TU-USUARIO.github.io/TGC-Arkade/`)

Pages **no ejecuta Node**: el HTML/CSS/JS del juego se sirve desde el repo, pero la **API tiene que estar en otro sitio** (por defecto el juego en `github.io` llama a **`https://tgc-arkade.onrender.com`**). Por eso:

1. Despliega antes la API en **Render** (o cambia la URL en `js/_config_prod.js` en la línea que detecta `github.io`).
2. En el repo deben existir **`dist/`** y **`bower_components/`** (ya no están en `.gitignore`) tras `grunt build` y `bower install`, y subirlos con `git push` para que Pages no quede en blanco.

Si quieres **un solo enlace** sin depender de dos sitios, usa solo **Render** y no hace falta Pages.

---

## Ver tu progreso

1. Con el juego abierto, pulsa el **icono de usuario** del panel.
2. Pestaña **Profile**: estadísticas y logros.
3. Pestaña **Leaderboard**: ranking.

También: `GET https://TU-SITIO/api/profile/TU_NOMBRE` devuelve JSON del perfil.

---

## Install (desarrollo)

[Código fuente (ZIP)](https://github.com/gus09090909/TGC-Arkade/archive/refs/heads/master.zip)

```sh
npm install
bower install
```

Archivos `*_dev.html` usan assets sin empaquetar. Para producción local:

```sh
npx grunt build
```

## API (referencia)

Rutas en [`server/index.js`](server/index.js): `/api/register`, `/api/profile/:username`, `/api/session-end`, `/api/leaderboard`.

El servidor sirve el juego estático y bloquea rutas como `/server` y `/node_modules`.

## License

[MIT License](http://opensource.org/licenses/MIT)
