# DataMind 🧠📊

**Analista de Datos Inteligente impulsado por IA**

Carga tus archivos CSV, haz preguntas en lenguaje natural y obtén análisis, visualizaciones 3D interactivas e insights instantáneamente. Con autenticación Firebase y análisis IA con OpenRouter.

## ✨ Características

- **🔐 Autenticación**: Login y registro con Firebase
- **📤 Upload Fácil**: Arrastra y suelta archivos CSV o haz clic para seleccionar
- **🤖 Análisis IA**: Obtén insights automáticos analizados por inteligencia artificial
- **📈 Visualizaciones 2D y 3D**: Gráficos interactivos 2D (línea, barra, scatter, pie, área, radar, mixto) y **3D verdaderos** (scatter, burbuja, línea, superficie, malla) con WebGL
- **🔄 Orbit Controls**: Gira, escala y panea gráficos 3D con el mouse — arrastra para orbitar, scroll para zoom
- **💬 Chat Inteligente**: Haz preguntas sobre tus datos en lenguaje natural
- **📋 Tabla de Datos**: Explora, busca y ordena tus datos
- **🧹 Depurador de Datos**: Limpia nulos, elimina duplicados, selecciona columnas y ordena filas
- **⚡ Estadísticas**: Medias, medianas, desviación estándar y más
- **🎨 Diseño Moderno**: Interfaz oscura, profesional y responsiva
- **🔗 OpenRouter**: Modelos de IA vía API

## 🚀 Inicio Rápido

### Requisitos
- Node.js 18+ 
- pnpm (o npm/yarn)

### Instalación

```bash
# Clonar o descargar el proyecto
cd datamind

# Instalar dependencias
pnpm install

# Iniciar servidor de desarrollo
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## ⚙️ Configuración

DataMind necesita dos configuraciones simples (ambas gratis):

### 1️⃣ OpenRouter (IA - OBLIGATORIO)

DataMind usa **OpenRouter** para acceso a modelos de IA.

1. Ve a [https://openrouter.io](https://openrouter.io) y crea una cuenta
2. Genera una API key en [https://openrouter.io/keys](https://openrouter.io/keys)
3. Configura la variable de entorno:
   ```bash
   cp .env.example .env.local
   # Editar .env.local con tu API key:
   # OPENROUTER_API_KEY=tu_clave_aqui
   ```

### 2️⃣ Firebase (Autenticación - RECOMENDADO)

Para acceso con login y registro, configura Firebase:

1. **Lee la guía completa**: Abre `FIREBASE_SETUP.md` (toma ~15 minutos)
2. **O sáltalo por ahora**: La app funciona sin autenticación

### ✅ Reiniciar servidor

```bash
# Presiona Ctrl+C y vuelve a ejecutar:
pnpm dev
```

¡Listo! Ahora puedes usar DataMind sin límites.

## 📚 Cómo Usar

### 1. Cargar Datos
- Arrastra un archivo CSV o haz clic en "Seleccionar archivo"
- Soporta cualquier CSV con datos numéricos o textuales

### 2. Explorar Análisis
- Recibirás un análisis automático con insights principales
- Ve estadísticas, patrones detectados y gráficos recomendados

### 3. Visualizar Datos (2D)
- Pestaña "Visualizaciones" con gráficos interactivos 2D
- Cambia entre línea, barra, scatter, pie, área, radar y mixto
- Selecciona qué columnas visualizar

### 4. Visualización 3D Interactiva
- Pestaña "3D" con gráficos tridimensionales reales (WebGL)
- Tipos: Scatter 3D, Burbuja 3D, Línea 3D, Superficie 3D, Malla 3D
- Arrastra para orbitar, scroll para zoom, click derecho para paneo
- Mapea color y tamaño por columna

### 5. Explorar Tabla
- Pestaña "Tabla de datos" con búsqueda y filtrado
- Ordena por columnas haciendo clic en los encabezados

### 6. Chat con IA
- Pestaña "Chat con IA" para hacer preguntas
- Ejemplos:
  - "Cuál es la venta promedio?"
  - "Hay alguna tendencia ascendente?"
  - "Qué mes tuvo más ingresos?"

## 📄 Formato de Datos

Los archivos CSV deben cumplir este formato:

```csv
Columna1,Columna2,Columna3,Columna4
Valor1,100,Texto,2024
Valor2,200,Otro,2024
Valor3,150,Más,2024
```

**Tipos soportados:**
- ✅ Números (enteros y decimales)
- ✅ Texto (cadenas de caracteres)
- ✅ Fechas (se tratarán como texto)
- ✅ Valores vacíos

**Notas:**
- La primera fila se trata como encabezados
- Máximo recomendado: ~50,000 filas
- Los gráficos se generan con las primeras 50 filas por performance

## 🛠️ Tecnologías

- **Frontend**: Next.js 16 + React 19 + TypeScript
- **UI**: shadcn/ui + Tailwind CSS v4
- **Gráficos 2D**: Recharts
- **Gráficos 3D**: Three.js + OrbitControls (WebGL)
- **Animaciones**: Framer Motion
- **IA**: AI SDK v6 + OpenRouter
- **Autenticación**: Firebase Auth (Email/Password)
- **Base de Datos**: Firestore (opcional)
- **Análisis**: simple-statistics + papaparse + ml-matrix
- **Estado**: React Hooks + Context API

## 🤖 Modelos de IA

Por defecto usa **Mistral 7B** vía OpenRouter.

Para cambiar de modelo, edita `/app/api/analyze/route.ts` y `/app/api/chat/route.ts`.

## 📁 Estructura del Proyecto

```
datamind/
├── app/
│   ├── api/
│   │   ├── analyze/      # Análisis IA de datos
│   │   ├── chat/         # Chat conversacional
│   │   └── prep-suggest/ # Sugerencias de preparación
│   ├── auth/
│   │   ├── login/        # Página de inicio de sesión
│   │   └── register/     # Página de registro
│   ├── dashboard/        # Dashboard principal
│   ├── layout.tsx        # Layout global
│   ├── page.tsx          # Página principal
│   └── globals.css       # Estilos globales
├── components/
│   ├── ui/               # Componentes shadcn/ui
│   ├── app-container.tsx # Contenedor principal
│   ├── landing-page.tsx  # Landing page
│   ├── data-upload.tsx   # Upload de archivos
│   ├── dashboard.tsx     # Dashboard principal
│   ├── analysis-results.tsx  # Resultados de análisis IA
│   ├── data-visualizations.tsx # Gráficos 2D (Recharts)
│   ├── visualization-3d.tsx   # Gráficos 3D (Three.js)
│   ├── data-table.tsx    # Tabla interactiva de datos
│   ├── data-prep-wizard.tsx   # Asistente de depuración
│   ├── data-storytelling.tsx  # Narrativa automática
│   ├── chat-interface.tsx     # Chat con IA
│   ├── ml-analysis.tsx        # ML: clustering, regresión
│   └── export-analysis.tsx    # Exportación de resultados
├── hooks/
│   ├── useAuth.ts        # Autenticación Firebase
│   └── useDataAnalysis.ts # Gestión de datos
├── lib/
│   ├── firebase.ts       # Config Firebase
│   ├── ml-utils.ts       # ML: regresión, clustering
│   ├── types.ts          # Tipos TypeScript
│   ├── analysis-utils.ts # Utilidades de análisis
│   └── visualization-3d.ts # Helpers 3D (Three.js)
├── types/
│   └── lucide-react.d.ts # Tipos manuales lucide-react
├── public/
│   └── example-data.csv  # Datos de ejemplo
└── package.json
```

## 🔧 Scripts Disponibles

```bash
# Desarrollo
pnpm dev              # Inicia servidor dev en localhost:3000

# Build
pnpm build            # Compila para producción
pnpm start            # Inicia servidor de producción

# Linting
pnpm lint             # Ejecuta ESLint
```

## 🐛 Solución de Problemas

### "OPENROUTER_API_KEY no está configurada"
- Verifica que .env.local exista en la raíz del proyecto
- Revisa que la variable esté correctamente escrita
- Reinicia el servidor (`pnpm dev`)

### El chat no responde
- Verifica tu API key en [OpenRouter](https://openrouter.io)
- Abre consola del navegador (F12) para ver errores
- Comprueba que el CSV se cargó correctamente

### Los gráficos no aparecen
- El CSV necesita tener al menos una columna numérica
- Las columnas solo de texto no generan gráficos

### "Error: No space left on device"
- Intenta con un CSV más pequeño (<10MB)
- O aumenta el espacio en disco

## 💡 Tips

1. **Primeras filas**: El análisis IA se basa en las primeras 50 filas para rapidez
2. **Columnas numéricas**: Los mejores gráficos son con datos numéricos
3. **Preguntas específicas**: El chat responde mejor a preguntas concretas
4. **CSV limpio**: Asegúrate que tu CSV esté bien formateado

## 📊 Ejemplo de Uso

```csv
Mes,Ventas,Visitas,Clientes,Ingresos
Enero,1250,8500,145,62500
Febrero,1380,9200,156,69000
Marzo,1520,10100,172,76000
...
```

Luego puedes:
- Ver gráficos de tendencias de ventas vs visitas
- Hacer preguntas como "¿Cuál es la correlación entre visitas e ingresos?"
- Obtener estadísticas automáticas
- Exportar análisis

## 🎓 Aprende Más

- [Documentación Next.js](https://nextjs.org/docs)
- [Documentación OpenRouter](https://openrouter.io/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Recharts](https://recharts.org)

## 📝 Licencia

MIT - Libre para usar en proyectos personales y comerciales

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Siéntete libre de abrir issues o pull requests.

## 📞 Soporte

Si encuentras problemas:
1. Revisa la sección de "Solución de Problemas" arriba
2. Verifica que OpenRouter esté configurado correctamente
3. Abre un issue con detalles del error

---

**Hecho con React, Next.js y OpenRouter**
