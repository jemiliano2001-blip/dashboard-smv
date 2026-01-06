# SMV Dashboard - Sincronización

## Sincronización con Git (Recomendado)

### Primera vez - Configuración inicial

1. **En esta computadora (donde ya tienes el código):**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Crea un repositorio en GitHub:**
   - Ve a https://github.com/new
   - Crea un repositorio nuevo (público o privado)
   - **NO** inicialices con README

3. **Conecta tu repositorio local con GitHub:**
   ```bash
   git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
   git branch -M main
   git push -u origin main
   ```

### En la otra computadora

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/TU_USUARIO/TU_REPOSITORIO.git
   cd tv-dashboard
   ```

### Sincronización diaria

**Para subir cambios:**
```bash
git add .
git commit -m "Actualización"
git push
```

**Para bajar cambios:**
```bash
git pull
```

---

## Alternativa: Sincronización con Dropbox/OneDrive/Google Drive

1. Mueve la carpeta `tv-dashboard` a tu carpeta de Dropbox/OneDrive/Google Drive
2. En la otra computadora, instala el mismo servicio de nube
3. Los cambios se sincronizarán automáticamente

**Nota:** Asegúrate de que ambas computadoras tengan el servicio de nube abierto.
