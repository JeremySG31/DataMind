# 🔧 Cómo Editar DataMind en Tu IDE Favorito

## Descarga el Proyecto

El proyecto está en `/vercel/share/v0-project` y listo para usar.

### Opción 1: Desde v0
- Click en "Download ZIP" en v0.app
- Extrae el archivo
- Abre la carpeta en tu IDE

### Opción 2: Desde GitHub (si está conectado)
```bash
git clone <repo-url>
cd datamind
```

## Configuración Inicial

### 1. Instalar Dependencias
```bash
pnpm install
# o si prefieres npm:
npm install
# o yarn:
yarn install
```

### 2. Crear archivo .env.local
```bash
cp .env.example .env.local
```

Luego edita `.env.local` y agrega:
```
OPENROUTER_API_KEY=sk-or-tu-api-key-aqui
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### 3. Iniciar Servidor de Desarrollo
```bash
pnpm dev
```

Abre `http://localhost:3000`

## Estructura del Proyecto

```
datamind/
├── app/                    # Next.js App Router
│   ├── api/               # Endpoints API
│   ├── auth/              # Páginas de autenticación
│   ├── dashboard/         # Dashboard protegido
│   ├── layout.tsx         # Layout global
│   ├── page.tsx           # Página principal
│   └── providers.tsx      # Auth Context Provider
├── components/            # Componentes React
│   ├── auth/             # Formularios de login/registro
│   ├── dashboard.tsx     # Dashboard principal
│   ├── data-upload.tsx   # Upload CSV/Excel
│   ├── ml-analysis.tsx   # Machine Learning
│   └── ...
├── lib/                   # Utilidades y tipos
│   ├── firebase.ts       # Config Firebase
│   ├── ml-utils.ts       # Funciones de ML
│   ├── visualization-3d.ts # Gráficos 3D
│   └── ...
├── hooks/                 # React Hooks personalizados
│   ├── useAuth.ts        # Autenticación
│   └── useDataAnalysis.ts # Análisis de datos
├── public/               # Assets estáticos
├── .env.example         # Variables de entorno
├── package.json         # Dependencias
├── tsconfig.json        # Config TypeScript
└── tailwind.config.ts   # Config Tailwind
```

## IDEs Recomendados

### VS Code (Recomendado)
1. Instala extensiones:
   - ESLint
   - Prettier
   - Tailwind CSS IntelliSense
   - TypeScript Vue Plugin
   - Next.js + React/React Native snippets

2. Abre la carpeta en VS Code
3. Usa `pnpm dev` en la terminal

### WebStorm / PyCharm Professional
1. File → Open → Selecciona carpeta
2. Configura Node en Settings
3. Usa terminal integrada para `pnpm dev`

### Sublime Text
1. File → Open Folder
2. Instala: LSP, TypeScript, Prettier
3. Usa terminal externa para `pnpm dev`

## Comandos Útiles

```bash
# Desarrollo
pnpm dev              # Inicia servidor dev (http://localhost:3000)

# Compilación
pnpm build            # Compila para producción
pnpm build --no-lint  # Compila sin linting

# Testing
pnpm lint             # Ejecuta ESLint
pnpm type-check       # Valida TypeScript

# Limpieza
pnpm clean            # Limpia caché de Next.js
rm -rf node_modules   # Borra dependencias
```

## Edición de Código

### Agregar Nueva Página
```typescript
// app/new-feature/page.tsx
export default function NewFeature() {
  return <div>Nueva Característica</div>;
}
```

### Agregar Nuevo Componente
```typescript
// components/my-component.tsx
'use client';

export function MyComponent() {
  return <div>Mi Componente</div>;
}
```

### Agregar Nueva API
```typescript
// app/api/new-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const data = await request.json();
  return NextResponse.json({ success: true });
}
```

## Debugging

### Usar Console Logs
```typescript
console.log('[v0] Debug info:', variable);
```

### Inspeccionar Elementos
- Abre DevTools (F12)
- Ve a la pestaña "Sources"
- Establece breakpoints en el código

### Debugging con VS Code
Agrega a `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/next",
      "args": ["dev"],
      "console": "integratedTerminal"
    }
  ]
}
```

## Personalización

### Cambiar Colores
Edita `app/globals.css`:
```css
@theme {
  --color-primary: #3b82f6;  /* Azul */
  --color-secondary: #8b5cf6; /* Púrpura */
}
```

### Cambiar Fuentes
Edita `app/layout.tsx`:
```typescript
import { Geist_Mono } from 'next/font/google';
const mono = Geist_Mono({ subsets: ['latin'] });
```

### Agregar Dependencias Nuevas
```bash
pnpm add nuevo-paquete
# TypeScript
pnpm add -D @types/nuevo-paquete
```

## Deploying a Producción

### Vercel (Recomendado - 1 click)
1. Push a GitHub
2. Ve a vercel.com
3. Conecta tu repo
4. Configura variables de entorno
5. Deploy automático

### Docker
```bash
docker build -t datamind .
docker run -p 3000:3000 datamind
```

### Manual Node.js
```bash
pnpm build
pnpm start
```

## Troubleshooting

### Error: "Module not found"
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Error: "OPENROUTER_API_KEY not configured"
- Verifica que `.env.local` exista
- Verifica que la variable esté correctamente configurada
- Reinicia el servidor dev

### Errores de TypeScript
```bash
pnpm tsc --noEmit
```

### Port 3000 en uso
```bash
# Linux/Mac
lsof -i :3000
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

## Recursos Útiles

- **Documentación Next.js**: https://nextjs.org/docs
- **Documentación React**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com
- **Firebase**: https://firebase.google.com/docs
- **AI SDK**: https://sdk.vercel.ai
- **OpenRouter**: https://openrouter.io/docs

## Contacto & Soporte

Si tienes problemas:
1. Lee VERIFICATION_COMPLETE.md
2. Verifica las variables de entorno
3. Reinicia el servidor dev
4. Limpia caché: `pnpm clean`
5. Reinstala dependencias

---

**El proyecto está completamente listo para edición en cualquier IDE.**
Disfruta desarrollando con DataMind 🚀
