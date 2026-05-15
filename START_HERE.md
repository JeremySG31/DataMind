# 🚀 EMPIEZA AQUÍ

Bienvenido a **DataMind** - Tu Analista de Datos Inteligente

## Estado Actual

✅ **La aplicación está lista para usar**  
✅ **Servidor corriendo sin errores**  
✅ **Todas las características implementadas**

## 3 Pasos para Empezar

### Paso 1: Configura OpenRouter (5 minutos)

Este es **OBLIGATORIO** para que funcione el análisis con IA.

```bash
# 1. Ve a https://openrouter.io
# 2. Crea una cuenta GRATIS (sin tarjeta de crédito)
# 3. Obtén tu API key en https://openrouter.io/keys
# 4. En tu proyecto, copia el archivo de ejemplo:
cp .env.example .env.local

# 5. Abre .env.local en tu editor y pega:
OPENROUTER_API_KEY=sk-or-xxxxxxxxxxxxx
```

Reinicia el servidor:
```bash
# Presiona Ctrl+C si está corriendo
pnpm dev
```

**¡Listo!** Ahora abre http://localhost:3000

---

### Paso 2 (Opcional): Configura Firebase (15 minutos)

Si deseas agregar **login y registro**, sigue esta guía:

👉 **Lee el archivo: `FIREBASE_SETUP.md`**

Es muy detallado y toma solo 15 minutos.

Sin Firebase, la app funciona pero sin autenticación.

---

### Paso 3: ¡Úsala!

1. Abre http://localhost:3000
2. **Sin Firebase**: Carga un CSV directamente
3. **Con Firebase**: Haz clic en "Registrarse" primero

## ¿Qué Puede Hacer DataMind?

| Característica | Descripción |
|---|---|
| 📤 **Upload** | Arrastra CSV o haz clic para cargar |
| 🤖 **Análisis IA** | Análisis automático de datos |
| 📊 **Gráficos** | Visualizaciones interactivas |
| 💬 **Chat** | Haz preguntas sobre tus datos |
| 📋 **Tabla** | Explora datos con búsqueda |
| 🔐 **Login** | Autenticación (opcional) |

## Documentación

- 📖 **README.md** - Documentación general
- 🔐 **FIREBASE_SETUP.md** - Configuración de autenticación
- ✅ **IMPLEMENTATION_COMPLETE.md** - Qué se implementó
- ⚙️ **SETUP.md** - Instalación detallada
- 🏗️ **ARCHITECTURE.md** - Arquitectura técnica

## Preguntas Frecuentes

### ¿Es completamente gratis?
**SÍ.** OpenRouter y Firebase ofrecen tiers gratis muy generosos.

### ¿Necesito tarjeta de crédito?
**NO.** Tanto OpenRouter como Firebase pueden usarse sin tarjeta.

### ¿Sin Firebase funciona?
**SÍ.** La app funciona sin autenticación. Firebase es opcional.

### ¿Dónde corro la app?
Puedes deployar a:
- **Vercel** (recomendado, gratuito)
- **Netlify** (gratuito)
- **Tu servidor** (cualquier place)

### ¿Qué datos se guardan?
Sin Firebase: **Ninguno** (todo en memoria)  
Con Firebase: Datos de usuario en Firestore

### ¿Cuál es el límite de datos?
- Archivos hasta 50MB funcionan bien
- Análisis IA se basa en primeras 50 filas
- Sin límites de consultas reales

## Archivo CSV de Ejemplo

Prueba con este formato:

```csv
Mes,Ventas,Visitas,Clientes
Enero,1250,8500,145
Febrero,1380,9200,156
Marzo,1520,10100,172
Abril,1100,7800,120
Mayo,1650,11200,185
```

O usa el ejemplo incluido:
```bash
# Descarga este archivo y cárgalo:
public/example-data.csv
```

## Stack Técnico

```
Frontend: Next.js 16 + React 19
UI: shadcn/ui + Tailwind CSS
IA: OpenRouter (Mistral 7B)
Auth: Firebase
Charts: Recharts
```

Todo moderno, performante y mantenible.

## Pasos Siguientes

### Inmediatamente
1. ✅ Configura OpenRouter
2. ✅ Carga un CSV de prueba
3. ✅ Prueba el análisis y gráficos

### Luego (Opcional)
1. Configura Firebase (FIREBASE_SETUP.md)
2. Crea una cuenta de usuario
3. Personaliza los estilos si quieres

### Para Producción
1. Configura variables de entorno en tu servidor
2. Deploy a Vercel: `vercel deploy`
3. Tu app estará en línea para todos

## Errores Comunes

| Error | Solución |
|---|---|
| "OpenRouter API Key no encontrada" | Configura .env.local con OPENROUTER_API_KEY |
| "Firebase no está configurado" | Es normal si no lo configuraste. Sigue FIREBASE_SETUP.md |
| "CSV no analiza" | Verifica que sea CSV válido con datos numéricos |
| "Sin conexión a OpenRouter" | Revisa tu API key y conexión a internet |

## URLs Importantes

- 🌐 **App**: http://localhost:3000
- 🔑 **OpenRouter**: https://openrouter.io/keys
- 🔥 **Firebase Console**: https://console.firebase.google.com
- 📚 **Docs OpenRouter**: https://openrouter.io/docs
- 📚 **Docs Firebase**: https://firebase.google.com/docs

## Soporte

Si hay problemas:

1. **Revisa la consola**: F12 en el navegador
2. **Revisa logs del servidor**: Terminal donde corres `pnpm dev`
3. **Lee FIREBASE_SETUP.md** si es sobre autenticación
4. **Lee IMPLEMENTATION_COMPLETE.md** para detalles técnicos

## ¡Listo!

Tienes una aplicación profesional de análisis de datos con IA.

**Ahora**:
1. Configura OpenRouter (5 min)
2. Reinicia el servidor
3. ¡Pruébala en http://localhost:3000!

---

**¡A disfrutar DataMind! 🎉**

Tu analista de datos con IA está listo para usar.
