# Arquitectura de DataMind

## Flujo de Datos

```
┌─────────────────────────────────────────────────────────────┐
│                        USUARIO                               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
        ┌────────────────┐
        │  Landing Page  │
        └────────┬───────┘
                 │
        ┌─────────────────────────┐
        │ Upload CSV (Drag & Drop)│
        └────────┬────────────────┘
                 │
                 ▼
        ┌─────────────────────────┐
        │  useDataAnalysis Hook   │◄──────┐
        │  (Papa.parse CSV)       │       │
        └────────┬────────────────┘       │
                 │                        │
    ┌────────────┴────────────────┐      │
    │                             │      │
    ▼                             ▼      │
┌─────────────┐          ┌────────────────┐
│  Local State│          │ API: /analyze  │
│  Data[]     │          │ (OpenRouter IA)│
└──┬──────┬───┘          └────────────────┘
   │      │                     │
   │      │                     ▼
   │      │          ┌──────────────────────┐
   │      │          │ Analysis Result      │
   │      │          │ - Summary            │
   │      │          │ - Statistics         │
   │      │          │ - Insights           │
   │      │          │ - Recommended Charts │
   │      │          └──────────────────────┘
   │      │                     │
   │      │                     ▼
   │      │          ┌──────────────────────┐
   │      │          │ Dashboard.tsx        │
   │      │          │ - Shows Analysis     │
   │      │          │ - Tabs Navigation    │
   │      │          └──────────────────────┘
   │      │                 │
   │      │        ┌────────┴────────┬──────────┐
   │      │        │                 │          │
   │      │        ▼                 ▼          ▼
   │      │    ┌─────────┐    ┌──────────┐  ┌──────────┐
   │      │    │  Viz    │    │ DataTable│  │   Chat   │
   │      │    │ Charts  │    │ Search   │  │  IA Room │
   │      │    │ Recharts│    │ Sort     │  │ OpenRouter
   │      │    └─────────┘    └──────────┘  └──────────┘
   │      │
   │      └──────────────────────────┬──────────────────┐
   │                                 │                  │
   └─────────────────────────────────┼──────────────────┘
                                     │
                    API: /chat (OpenRouter)
                                     │
                                     ▼
                          ┌──────────────────┐
                          │  Chat Response   │
                          │  from LLM        │
                          └──────────────────┘
```

## Componentes Principales

### Frontend (React/Next.js)

```
App (page.tsx)
├── AppContainer
│   ├── Landing Page (cuando no hay datos)
│   ├── Data Upload
│   │   ├── Drag & Drop Zone
│   │   └── File Input
│   └── Dashboard (cuando hay datos)
│       ├── Header
│       ├── Analysis Results
│       │   ├── Summary Card
│       │   ├── Statistics
│       │   ├── Insights
│       │   └── Recommended Charts
│       └── Tabs
│           ├── Visualizations
│           │   ├── Chart Type Selector
│           │   ├── Column Selector
│           │   └── Recharts Chart
│           ├── Data Table
│           │   ├── Search Box
│           │   ├── Table with Sorting
│           │   └── Pagination
│           └── Chat Interface
│               ├── Message List
│               └── Input & Send
```

### Backend (API Routes)

#### `/api/analyze` (POST)
```
Entrada:
- data: DataRow[]
- columns: string[]

Proceso:
1. Valida entrada
2. Prepara resumen de datos
3. Envía a OpenRouter LLM
4. Parsea respuesta JSON
5. Retorna análisis estructurado

Salida:
{
  summary: string,
  insights: string[],
  recommendedCharts: string[]
}
```

#### `/api/chat` (POST)
```
Entrada:
- message: string
- data: DataRow[]
- columns: string[]
- history: ChatMessage[]

Proceso:
1. Valida entrada
2. Prepara contexto (datos + historial)
3. Construye prompt para LLM
4. Envía a OpenRouter
5. Retorna respuesta conversacional

Salida:
{
  content: string
}
```

## Estado y Hooks

### useDataAnalysis Hook
```typescript
estado:
- dataContext: DataContext | null
- isLoading: boolean
- error: string | null

funciones:
- uploadData(file): Promise<void>
- clearData(): void

flujo:
1. Usuario sube archivo
2. Parsea con Papa.parse
3. Convierte tipos de datos
4. Calcula análisis local
5. Actualiza estado
```

## Flujo de Carga de Archivo

```
usuario.clic("Seleccionar")
        │
        ▼
input.onChange captura archivo
        │
        ▼
uploadData(file)
        │
        ├─► file.text() → CSV string
        │
        ├─► Papa.parse(csv)
        │
        ├─► Conversión de tipos:
        │   - Strings numéricos → numbers
        │   - Valores vacíos → null
        │
        ├─► Análisis local:
        │   - calcularEstadísticas()
        │   - generarInsights()
        │   - recomendarGráficos()
        │
        └─► setDataContext(nueva data)
                │
                ▼
            Dashboard se renderiza
```

## Flujo de Análisis IA

```
usuario carga datos
        │
        ▼
useEffect detecta new dataContext
        │
        ├─► prepara muestra (primeras 50 filas)
        │
        ├─► POST /api/analyze
        │   {
        │     data: primeras 50 filas,
        │     columns: nombres columnas
        │   }
        │
        └─► en API:
            │
            ├─► OPENROUTER_API_KEY validation
            │
            ├─► construye prompt análisis
            │
            ├─► generateText() con Mistral 7B
            │
            ├─► parsea JSON de respuesta
            │
            └─► retorna { summary, insights, charts }
                │
                ▼
            componente muestra resultados
```

## Flujo de Chat

```
usuario escribe mensaje + envía
        │
        ▼
state.messages.push(userMessage)
        │
        ▼
POST /api/chat
{
  message: texto usuario,
  data: todos los datos cargados,
  columns: nombres columnas,
  history: últimos 4 mensajes
}
        │
        └─► en API:
            │
            ├─► construye prompt:
            │   - contexto dataset
            │   - últimos mensajes
            │   - pregunta actual
            │
            ├─► generateText() OpenRouter
            │
            ├─► retorna { content: respuesta }
            │
            └─► actualiza state.messages
                │
                ▼
            se renderiza respuesta animada
```

## Gestión de Estado

```
Nivel 1: useDataAnalysis Hook
├── dataContext (DataContext | null)
│   ├── filename: string
│   ├── rowCount: number
│   ├── columnCount: number
│   ├── columns: string[]
│   ├── data: DataRow[]
│   └── analysis: AnalysisResult
└── isLoading, error

Nivel 2: Componentes locales
├── ChatInterface
│   └── messages: ChatMessage[]
├── DataVisualizations
│   ├── chartType: 'line'|'bar'|'scatter'|'pie'
│   └── selectedColumns: string[]
├── DataTable
│   ├── searchTerm: string
│   ├── sortColumn: string | null
│   ├── sortDirection: 'asc'|'desc'|null
│   └── pageIndex: number
└── AppContainer (no local state, props)
```

## Tipos TypeScript

```typescript
// Core Data
interface DataRow {
  [key: string]: string | number | null;
}

interface DataContext {
  filename: string;
  rowCount: number;
  columnCount: number;
  columns: string[];
  data: DataRow[];
  analysis?: AnalysisResult;
}

// Análisis
interface AnalysisResult {
  summary: string;
  statistics: { [key: string]: StatValues };
  insights: string[];
  recommendedCharts: string[];
}

interface StatValues {
  mean?: number;
  median?: number;
  min?: number;
  max?: number;
  stdDev?: number;
}

// Chat
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
```

## Integraciones Externas

### OpenRouter LLM
```
┌─────────────────────────────────────┐
│       OpenRouter API                 │
│   https://openrouter.io/api/v1      │
│                                     │
│  Models:                            │
│  - mistral-7b-instruct (default)   │
│  - meta-llama/llama-2-7b-chat      │
│  - neural-chat-7b                  │
│  - mixtral-8x7b                    │
└─────────────────────────────────────┘
         ▲                    │
         │                    │
      AI SDK               respuesta
    generateText()          JSON
         │                    │
    ┌────┴─────────────────────┘
    │
    └──► /api/analyze
         /api/chat
```

### Librerías Externas
- **Papa Parse**: Parsing CSV → DataRow[]
- **simple-statistics**: Cálculos estadísticos
- **Recharts**: Renderizado de gráficos
- **Framer Motion**: Animaciones suaves
- **shadcn/ui**: Componentes UI

## Performance

### Optimizaciones

1. **Análisis incremental**: Primeras 50 filas para IA
2. **Lazy loading**: Componentes cargados bajo demanda
3. **Memoización**: useMemo en filtrados/ordenamientos
4. **Animaciones GPU**: Framer Motion con will-change
5. **Image optimization**: No hay imágenes grandes
6. **Bundle size**: Librerias pequeñas y essenciales

### Métricas

- CSR: ~2 segundos (primeras 50 filas)
- TTI: ~3 segundos
- Chat response: ~5-10 segundos (OpenRouter)
- Gráficos: Renderizado instant al cambiar tipo

## Seguridad

- ✅ Variables env sensibles en .env.local
- ✅ OpenRouter API key nunca se expone al cliente
- ✅ Validación en API routes
- ✅ Sin base de datos (datos en memoria)
- ✅ CORS no aplicable (mismo origen)
- ✅ Input sanitization en Chat

## Escalabilidad

### Limitaciones Actuales
- Max 50,000 filas recomendado
- Max 100 columnas
- Max archivo 50MB

### Mejoras Futuras
- Procesamiento en chunks para archivos grandes
- Caché de análisis (Redis)
- Persistencia en BD (Supabase/Postgres)
- WebSockets para chat en tiempo real
- Exportación a múltiples formatos
- Dashboards guardados

## Despliegue

### Vercel (Recomendado)
```
1. Push a GitHub
2. Conecta en Vercel
3. Configura env vars
4. Deploy automático
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN pnpm install
RUN pnpm build
CMD ["pnpm", "start"]
```

### Otros
- Netlify (solo frontend sin API)
- Railway
- Render
- DigitalOcean App Platform

---

**Última actualización**: Mayo 2026
