# Configuración de Firebase para DataMind

Esta guía te ayudará a configurar Firebase para obtener autenticación completa en DataMind.

## ¿Por qué Firebase?

Firebase proporciona:
- ✅ Autenticación segura con email/contraseña
- ✅ Base de datos Firestore para guardar análisis
- ✅ Completamente gratis con plan Spark
- ✅ Sin servidor (no requiere backend propio)

## Paso 1: Crear un Proyecto Firebase

1. Ve a [https://console.firebase.google.com](https://console.firebase.google.com)
2. Haz clic en "Agregar proyecto"
3. Nombre del proyecto: `datamind` (o el que prefieras)
4. Desactiva "Google Analytics" (no es necesario)
5. Haz clic en "Crear proyecto"
6. Espera a que se cree el proyecto (toma ~1 minuto)

## Paso 2: Crear una App Web

1. En la pantalla del proyecto, haz clic en el ícono de engranaje ⚙️ (Configuración del proyecto) en la esquina superior izquierda
2. En la sección "Tus apps", haz clic en el ícono web `</>` para agregar una aplicación web
3. Dale un nombre: `DataMind Web`
4. Desactiva "También configurar Firebase Hosting"
5. Haz clic en "Registrar app"
6. Se mostrará el código de configuración. **Guarda estos valores en un lugar seguro**

## Paso 3: Copiar la Configuración

En la pantalla de configuración, verás un objeto similar a este:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123..."
};
```

Necesitas extraer estos valores para las variables de entorno.

## Paso 4: Habilitar Autenticación por Email

1. En el menú lateral izquierdo, ve a **Build** → **Authentication**
2. Haz clic en el botón "Empezar"
3. En la sección "Método de inicio de sesión", busca "Email/Contraseña"
4. Haz clic en "Email/Contraseña"
5. Activa las opciones:
   - "Email/Contraseña" ✓
   - Desactiva "Vinculación de cuentas de cuenta anónima a cuenta nueva"
6. Haz clic en "Guardar"

## Paso 5: Crear Firestore Database

1. En el menú lateral, ve a **Build** → **Firestore Database**
2. Haz clic en "Crear base de datos"
3. En el cuadro de diálogo:
   - Selecciona "Comenzar en modo de prueba" (perfecto para desarrollo)
   - Elige tu región (la más cercana a ti)
   - Haz clic en "Crear"

## Paso 6: Configurar Variables de Entorno

Ahora vamos a agregar las variables de entorno en tu proyecto:

1. En la raíz del proyecto (al lado de `package.json`), crea un archivo `.env.local` si no existe:

```bash
touch .env.local
```

2. Abre `.env.local` en tu editor de código y agrega las variables de Firebase:

```
# OpenRouter (para IA - obtén en https://openrouter.io)
OPENROUTER_API_KEY=sk-or-...

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123...
```

3. Reemplaza los valores con los que obtuviste en el paso 3

## Paso 7: Reiniciar el Servidor

```bash
# Detén el servidor (Ctrl+C)
# Luego reinicia:
pnpm dev
```

## Paso 8: Verificar que Funciona

1. Abre [http://localhost:3000](http://localhost:3000)
2. Deberías ver la landing page con botones "Iniciar Sesión" y "Registrarse"
3. Haz clic en "Registrarse"
4. Crea una cuenta con:
   - Email: tu@correo.com
   - Contraseña: Tu contraseña segura (mínimo 6 caracteres)
5. Deberías ser redirigido al dashboard
6. ¡Felicitaciones! Firebase está funcionando correctamente

## Configuración de Reglas de Firestore (Opcional pero Recomendado)

Para proteger tus datos en Firestore:

1. Ve a **Firestore Database** → **Reglas**
2. Reemplaza el contenido con:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Solo usuarios autenticados pueden acceder a sus propios datos
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
    match /analyses/{uid}/{document=**} {
      allow read, write: if request.auth.uid == uid;
    }
  }
}
```

3. Haz clic en "Publicar"

## Solución de Problemas

### Error: "Firebase: Error (auth/invalid-api-key)"
- Verifica que hayas copiado correctamente las variables en `.env.local`
- Asegúrate de que los nombres de las variables sean exactos (NEXT_PUBLIC_FIREBASE_...)

### Error: "Firebase no está configurado"
- Aún no has creado el archivo `.env.local`
- Las variables de entorno no son visibles hasta que reinicies el servidor

### Error: "Permission denied" en Firestore
- Verifica que hayas configurado las reglas de Firestore
- O abre la base de datos al público en modo de prueba (solo para desarrollo)

### ¿Cómo obtengo mis variables de Firebase nuevamente?
1. Ve a [https://console.firebase.google.com](https://console.firebase.google.com)
2. Selecciona tu proyecto
3. Haz clic en ⚙️ (Configuración)
4. En "Tus apps", busca tu app web
5. Haz clic en "Config"
6. Copia los valores

## Límites del Plan Gratis

Firebase tiene generosos límites gratis:
- **Almacenamiento**: 1 GB
- **Descargas de base de datos**: 50,000 descargas/día
- **Escrituras**: 20,000 escrituras/día
- **Eliminaciones**: 20,000 eliminaciones/día
- **Autenticación**: Usuarios ilimitados

Para un uso personal o pequeña escala, **nunca alcanzarás estos límites**.

## ¿Necesitas ayuda?

- Documentación oficial Firebase: [https://firebase.google.com/docs](https://firebase.google.com/docs)
- Documentación autenticación: [https://firebase.google.com/docs/auth](https://firebase.google.com/docs/auth)
- Firestore: [https://firebase.google.com/docs/firestore](https://firebase.google.com/docs/firestore)

¡Ahora tienes autenticación completa en DataMind!
