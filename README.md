# DataMind 🧠📊

**Analista de Datos Inteligente impulsado por IA**

Carga tus archivos CSV, haz preguntas en lenguaje natural y obtén análisis, visualizaciones e insights instantáneamente. Completamente gratis, sin configuraciones complicadas.

## ✨ Características

- **📤 Upload Fácil**: Arrastra y suelta archivos CSV o haz clic para seleccionar
- **🤖 Análisis IA**: Obtén insights automáticos analizados por inteligencia artificial
- **📈 Visualizaciones**: Gráficos interactivos (línea, barra, scatter, pie) que se adaptan automáticamente
- **💬 Chat Inteligente**: Haz preguntas sobre tus datos en lenguaje natural
- **📋 Tabla de Datos**: Explora, busca y ordena tus datos
- **⚡ Estadísticas**: Medias, medianas, desviación estándar y más
- **🎨 Diseño Moderno**: Interfaz oscura, profesional y responsiva
- **💰 Completamente Gratis**: Usa OpenRouter sin costo alguno

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

## ⚙️ Configuración OpenRouter

DataMind usa **OpenRouter** para acceso a IA completamente gratis.

### Pasos:

1. **Crear cuenta gratuita**
   - Ve a [https://openrouter.io](https://openrouter.io)
   - Regístrate (es gratis y sin tarjeta de crédito)

2. **Obtener API Key**
   - Ve a [https://openrouter.io/keys](https://openrouter.io/keys)
   - Copia tu API key (comienza con `sk-or-`)

3. **Configurar variable de entorno**
   ```bash
   # Copiar archivo de ejemplo
   cp .env.example .env.local
   
   # Editar .env.local y pegar la API key:
   # OPENROUTER_API_KEY=tu_clave_aqui
   ```

4. **Reiniciar servidor**
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

### 3. Visualizar Datos
- Pestaña "Visualizaciones" con gráficos interactivos
- Cambia entre línea, barra, scatter y pie charts
- Selecciona qué columnas visualizar

### 4. Explorar Tabla
- Pestaña "Tabla de datos" con búsqueda y filtrado
- Ordena por columnas haciendo clic en los encabezados

### 5. Chat con IA
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
- **UI**: shadcn/ui + Tailwind CSS
- **Gráficos**: Recharts
- **Animaciones**: Framer Motion
- **IA**: AI SDK v6 + OpenRouter
- **Análisis**: simple-statistics + papaparse
- **Estado**: React Hooks + SWR (para datos)

## 🤖 Modelos de IA Disponibles

Por defecto usa **Mistral 7B** (súper rápido y gratis).

Otros disponibles en OpenRouter:
- Llama 2 7B
- Neural Chat 7B
- Mixtral 8x7B
- Y muchos más...

Para cambiar de modelo, edita `/app/api/analyze/route.ts` y `/app/api/chat/route.ts`:

```typescript
// Cambiar esta línea:
model: openrouter('mistral-7b-instruct'),

// Por el modelo que prefieras:
model: openrouter('meta-llama/llama-2-7b-chat'),
```

## 📁 Estructura del Proyecto

```
datamind/
├── app/
│   ├── api/
│   │   ├── analyze/      # Análisis IA de datos
│   │   └── chat/         # Chat conversacional
│   ├── layout.tsx        # Layout global
│   ├── page.tsx          # Página principal
│   └── globals.css       # Estilos globales
├── components/
│   ├── app-container.tsx # Contenedor principal
│   ├── landing-page.tsx  # Landing page
│   ├── data-upload.tsx   # Upload de archivos
│   ├── dashboard.tsx     # Dashboard principal
│   ├── analysis-results.tsx
│   ├── data-visualizations.tsx
│   ├── data-table.tsx
│   └── chat-interface.tsx
├── hooks/
│   └── useDataAnalysis.ts # Hook de gestión de datos
├── lib/
│   ├── types.ts          # Tipos TypeScript
│   └── analysis-utils.ts # Utilidades de análisis
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

**Hecho con ❤️ usando React, Next.js y OpenRouter**

Carga tu primer CSV ahora y comienza a explorar datos con IA 🚀
