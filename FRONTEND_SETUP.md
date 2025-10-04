# 🎨 FRONTEND - Setup con Live Server

## 📋 ¿Qué es Live Server?

Extensión de VSCode que:
- ✅ Corre un servidor web local automáticamente
- ✅ **Auto-refresh**: Guardas archivo → navegador se actualiza solo
- ✅ Ahorra tiempo: No necesitas presionar F5 cada cambio
- ✅ Esencial para desarrollo rápido en hackathons

---

## 🚀 INSTALACIÓN (5 MINUTOS)

### Paso 1: Abrir VSCode

```bash
# Desde la carpeta del proyecto
code .
```

### Paso 2: Instalar extensión Live Server

1. **Abrir Extensiones:** `Ctrl + Shift + X`
2. **Buscar:** "Live Server"
3. **Instalar:** La extensión de **Ritwick Dey** (40M+ descargas)
4. **Esperar:** 5 segundos hasta que diga "Installed"

**Visual:**
```
┌────────────────────────────────────┐
│ 🔍 Live Server                  [X]│
├────────────────────────────────────┤
│ 📦 Live Server                     │
│    Ritwick Dey                     │
│    ⭐ 40,000,000+ downloads        │
│    [Install] ← Click aquí          │
└────────────────────────────────────┘
```

---

## ⚙️ CONFIGURACIÓN (2 MINUTOS)

### Paso 1: Abrir Settings

- **Teclado:** `Ctrl + ,`
- **O:** File → Preferences → Settings

### Paso 2: Buscar "Live Server"

En la barra de búsqueda de Settings

### Paso 3: Configurar puerto (Recomendado)

```
Live Server > Settings: Port
Valor: 5500
```

### Paso 4: Configurar navegador (Opcional)

```
Live Server > Settings: Custom Browser
Opciones:
- chrome (Google Chrome)
- firefox (Mozilla Firefox)
- edge (Microsoft Edge)
- null (Navegador por defecto)
```

---

## 🎯 CÓMO USAR (CADA VEZ QUE TRABAJES)

### Método 1: Click Derecho (Recomendado)

```
1. En VSCode, barra lateral izquierda (Explorer)
2. Ir a: frontend/index.html
3. Click DERECHO en "index.html"
4. Seleccionar: "Open with Live Server"
5. ✅ Se abre automáticamente en: http://localhost:5500
```

### Método 2: Botón "Go Live" (Más rápido)

```
1. Abrir frontend/index.html en VSCode
2. Mirar barra inferior derecha de VSCode
3. Click en botón "Go Live"
4. ✅ Se abre automáticamente
```

### Para DETENER Live Server:

```
Opción A: Click en "Port: 5500" en barra inferior de VSCode
Opción B: Click derecho en index.html → "Stop Live Server"
```

---

## ✨ VENTAJAS - AUTO-REFRESH

### SIN Live Server:
```
1. Editar archivo CSS/JS/HTML
2. Ctrl + S (guardar)
3. Alt + Tab (cambiar a navegador)
4. F5 (refrescar manualmente)
5. Ver cambio
6. Alt + Tab (volver a VSCode)
7. Repetir 100 veces en el hackathon...
```

⏰ **Tiempo perdido:** ~5 seg × 100 cambios = **8 minutos**

### CON Live Server:
```
1. Editar archivo CSS/JS/HTML
2. Ctrl + S (guardar)
3. ✅ AUTOMÁTICO - navegador se actualiza solo
4. Ver cambio (sin salir de VSCode)
```

⏰ **Tiempo ahorrado:** ~8 minutos por hora = **2+ horas en hackathon** 🚀

---

## 🧪 TEST - Verificar que funciona

### Test 1: Auto-Refresh

**1. Iniciar Live Server** (click derecho en index.html → Open with Live Server)

**2. Abrir:** `frontend/css/styles.css`

**3. Agregar al final:**
```css
body {
    background: lightblue; /* TEST */
}
```

**4. Guardar:** `Ctrl + S`

**5. Mirar navegador:**
- ✅ Fondo se vuelve azul claro **automáticamente**
- ❌ Si no cambia → Live Server no funciona, reinstalar

**6. Borrar la línea de prueba** y guardar

---

## 🔄 WORKFLOW DIARIO

### Al empezar a trabajar:

```bash
# 1. Actualizar rama
git checkout frontend/devX  # Tu rama
git pull origin develop

# 2. Abrir VSCode
code .

# 3. Abrir index.html
# 4. Click derecho → "Open with Live Server"
# 5. ✅ Ya puedes trabajar
```

### Mientras trabajas:

```
📝 Editar HTML/CSS/JS
💾 Ctrl + S (guardar)
👀 Ver cambios automáticamente en navegador
🔁 Repetir
```

### Al terminar:

```bash
# 1. Detener Live Server (click en "Port: 5500")
# 2. Guardar cambios en Git
git add .
git commit -m "feat: descripción"
git push origin tu-rama
```

---

## 🐛 TROUBLESHOOTING

### Problema 1: No veo "Open with Live Server"

**Solución:**
1. Verificar que Live Server esté instalado
2. Reiniciar VSCode
3. Click derecho en un archivo `.html` (no funciona en otros tipos)

---

### Problema 2: Puerto 5500 ocupado

**Error:** `Port 5500 is already in use`

**Solución:**
```
1. Cerrar otros Live Servers abiertos
2. O cambiar puerto en Settings:
   Live Server > Settings: Port → 5501
```

---

### Problema 3: No auto-refresh

**Solución:**
1. Verificar que estés editando archivos dentro de `frontend/`
2. Guardar con `Ctrl + S`
3. Verificar consola del navegador (F12) por errores
4. Reiniciar Live Server

---

### Problema 4: "Cannot GET /"

**Solución:**
- Asegúrate de abrir `index.html` específicamente
- No abrir la carpeta `frontend/` directamente

---

## 📊 COMPARACIÓN: Live Server vs Python HTTP Server

| Característica | python -m http.server | Live Server |
|----------------|----------------------|-------------|
| **Setup** | Terminal cada vez | Una vez (extensión) |
| **Auto-refresh** | ❌ Manual (F5) | ✅ Automático |
| **Terminales** | Necesita terminal | ❌ No necesita |
| **Velocidad** | Lenta | Rápida |
| **Para hackathon** | ⚠️ Aceptable | ✅ Ideal |

---

## ✅ CHECKLIST PRE-HACKATHON

Antes de empezar a programar:

- [ ] Live Server instalado en VSCode ✅
- [ ] Configurado puerto 5500 ✅
- [ ] Test de auto-refresh funciona ✅
- [ ] Sé cómo iniciar Live Server ✅
- [ ] Sé cómo detener Live Server ✅

---

## 🎯 RESUMEN RÁPIDO

### Para instalar:
```
Ctrl + Shift + X → Buscar "Live Server" → Install
```

### Para usar:
```
Click derecho en index.html → "Open with Live Server"
```

### Para trabajar:
```
Editar → Ctrl + S → Ver cambios automáticamente
```

---

## 📞 AYUDA

Si tienes problemas:
1. Verificar que Live Server esté instalado
2. Reiniciar VSCode
3. Preguntar en el grupo del equipo
4. Contactar coordinador: @Eljuguito90

---

**🔥 Con Live Server, serás 10x más productivo en el hackathon. ¡Úsalo!** 🚀