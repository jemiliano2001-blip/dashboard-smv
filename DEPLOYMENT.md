# Manual de Despliegue (CI/CD)

Referencia central para DevOps: variables de entorno, comandos de producción y errores frecuentes.

---

## Variables de entorno requeridas

Configura estas variables en cada entorno donde se construya o ejecute la aplicación:

| Variable                                | Descripción                                                                                 |
| --------------------------------------- | ------------------------------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`                     | URL del proyecto Supabase (Project URL). Ejemplo: `https://xxxx.supabase.co`                |
| `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Clave anónima pública (anon public key) de Supabase.                                        |
| `VITE_SUPABASE_ANON_KEY`                | Alias aceptado en código; puede usarse en lugar de `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY`. |

### Dónde configurarlas

- **Entorno local:** archivo `.env` en la raíz del proyecto. No commitear `.env` (debe estar en `.gitignore`).
- **CI/CD (GitHub Actions):** Repository Settings → Secrets and variables → Actions → añadir las variables como Repository Secrets. Usarlas en el workflow como `env.VITE_SUPABASE_URL`, etc.
- **Hosting (Vercel / Netlify):** Panel del proyecto → Environment Variables (o Settings → Environment variables). Añadir las mismas variables para el entorno de build (y runtime si aplica). En Vercel, definir para Production/Preview según corresponda.

---

## Comandos de producción

- **Instalar dependencias (recomendado en CI):**  
  `npm ci`

- **Compilar:**  
  `npm run build`

- **Probar el build localmente:**  
  `npm run preview`  
  Opcionales: `npm run preview:local`, `npm run preview:ip` (ver `package.json`).

- **Validación previa al despliegue (typecheck + lint + tests):**  
  `npm run validate`

---

## Guía de errores comunes

### El build falla por terser

Si el error apunta a `terser` (minificador), el proyecto ya lo incluye en `devDependencies`. Asegúrate de:

1. Instalar dependencias completas: `npm ci` o `npm install` (no usar `--omit=dev` en el paso de build).
2. Ejecutar el build en el mismo entorno donde se instalaron las dependencias (por ejemplo, en GitHub Actions no instalar con `--omit=dev` si el build necesita terser).

### Husky bloquea el commit

El pre-commit ejecuta `lint-staged`: ESLint y `tsc --noEmit` sobre los archivos preparados, y Prettier sobre JSON/MD/HTML/CSS.

- **Solución recomendada:** corregir errores antes de commitear:
  - `npm run lint:fix`
  - `npm run typecheck`
  - Si hay archivos no formateados, Prettier se ejecutará sobre los que estén en el commit; o ejecutar `npx prettier --write .` en el proyecto.
- **Evitar el hook puntualmente:** `git commit --no-verify`. No recomendado para uso habitual; solo en casos excepcionales.

---

## Generar tipos de Supabase

Para mantener los tipos TypeScript alineados con el esquema de la base de datos:

1. **Requisito:** [Supabase CLI](https://supabase.com/docs/guides/cli) instalado (por ejemplo `npm i -g supabase`) o uso vía `npx`.
2. **Project ID:** el script usa `SUPABASE_PROJECT_ID` si está definido en `.env`, o extrae el project ref desde `VITE_SUPABASE_URL` (ej. `https://nuazbpcfgapukqoblnyi.supabase.co` → `nuazbpcfgapukqoblnyi`).
3. **Ejecutar:**  
   `npm run update-types`  
   Escribe/actualiza `src/types/supabase.ts`. Ejecutar tras cambios en el schema de la base de datos.
