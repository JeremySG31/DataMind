# 🔧 Tips Avanzados - DataMind

Consejos y trucos para aprovechar al máximo DataMind.

## 1. Cambiar el Modelo IA

### Opción 1: Cambiar a Claude (más potente)

**En `/app/api/analyze/route.ts` (línea ~45):**
```typescript
// Cambiar de:
model: openrouter('mistral-7b-instruct'),

// A:
model: openrouter('anthropic/claude-opus-4'),
```

**En `/app/api/chat/route.ts` (línea ~26):**
```typescript
// Cambiar de:
model: openrouter('mistral-7b-instruct'),

// A:
model: openrouter('anthropic/claude-opus-4'),
```

### Opción 2: Cambiar a Llama 2 (balance speed/quality)

```typescript
model: openrouter('meta-llama/llama-2-7b-chat'),
```

### Opción 3: Cambiar a Mixtral (muy potente)

```typescript
model: openrouter('mistral-large'),
```

### Modelos Recomendados

| Modelo | Velocidad | Calidad | Recomendado Para |
|--------|-----------|---------|------------------|
| Mistral 7B | ⚡⚡⚡ | ⭐⭐⭐ | Demostración, pruebas |
| Llama 2 7B | ⚡⚡⚡ | ⭐⭐⭐ | Producción general |
| Neural Chat | ⚡⚡⚡ | ⭐⭐⭐ | Conversación natural |
| Mixtral 8x7B | ⚡⚡ | ⭐⭐⭐⭐ | Análisis complejos |
| Claude Opus | ⚡ | ⭐⭐⭐⭐⭐ | Máxima calidad |
| GPT-4 | ⚡⚡ | ⭐⭐⭐⭐⭐ | Mejor rendimiento |

Lista completa en: https://openrouter.io/models

## 2. Personalizar Prompts

### Cambiar prompt de análisis

En `/app/api/analyze/route.ts`:

```typescript
const prompt = `Analiza este dataset COMO UN EXPERTO EN NEGOCIOS:

Datos:
${dataPreview}

Por favor:
1. Identifica oportunidades de crecimiento
2. Señala problemas potenciales
3. Da 3 recomendaciones accionables
4. Calcula ROI potencial

Responde en JSON: {summary, insights, recommendedCharts}`;
```

### Cambiar prompt de chat

En `/app/api/chat/route.ts`:

```typescript
const prompt = `Eres un CONSULTOR DE DATOS experto en ${INDUSTRIA}.

${dataContext}

Responde preguntas sobre estos datos como experto.
Proporciona números específicos y recomendaciones.`;
```

## 3. Mejorar Performance

### 3.1 Limitar datos para análisis más rápido

En `/app/api/analyze/route.ts`:

```typescript
// Usar menos filas para IA (más rápido)
const dataPreview = JSON.stringify(sampleData.slice(0, 20), null, 2);
```

### 3.2 Caché de análisis

Agregar en `/app/api/analyze/route.ts`:

```typescript
// Al inicio
const crypto = require('crypto');

// En la función
const dataHash = crypto
  .createHash('md5')
  .update(JSON.stringify(data))
  .digest('hex');

// Guardar en memoria (simple)
const analysisCache = new Map();
if (analysisCache.has(dataHash)) {
  return analysisCache.get(dataHash);
}

// Al final, guardar:
analysisCache.set(dataHash, analysisData);
```

### 3.3 Aumentar timeout para análisis complejos

En `/app/api/analyze/route.ts`:

```typescript
const response = await generateText({
  model: openrouter('...'),
  prompt,
  temperature: 0.7,
  maxTokens: 1000,  // Aumentar si necesita más texto
  timeout: 60000,   // 60 segundos en lugar de 30
});
```

## 4. Agregar Validación Personalizada

### Validar CSV antes de procesar

En `/hooks/useDataAnalysis.ts`:

```typescript
function validateData(data: DataRow[], columns: string[]) {
  // Mínimo de filas
  if (data.length < 2) {
    throw new Error('Se necesitan al menos 2 filas de datos');
  }

  // Mínimo de columnas
  if (columns.length < 1) {
    throw new Error('Se necesita al menos 1 columna');
  }

  // Validar tipos
  const numericCols = columns.filter(col =>
    data.some(row => typeof row[col] === 'number')
  );

  if (numericCols.length === 0) {
    console.warn('Advertencia: No hay columnas numéricas');
  }

  return true;
}
```

## 5. Exportar Datos

### Exportar a CSV

Agregar función en `/lib/analysis-utils.ts`:

```typescript
export function exportToCSV(data: DataRow[], columns: string[], filename: string) {
  const headers = columns.join(',');
  const rows = data.map(row =>
    columns.map(col => {
      const val = row[col];
      return typeof val === 'string' && val.includes(',') 
        ? `"${val}"` 
        : val;
    }).join(',')
  );

  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}
```

### Exportar a JSON

```typescript
export function exportToJSON(data: DataRow[], filename: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}
```

### Usar en componente

```tsx
import { exportToCSV, exportToJSON } from '@/lib/analysis-utils';

// En tu componente:
<Button onClick={() => exportToCSV(data, columns, 'datos.csv')}>
  Exportar CSV
</Button>
```

## 6. Agregar Temas Personalizados

### Crear tema personalizado

En `/app/globals.css`:

```css
:root.theme-ocean {
  --primary: oklch(0.488 0.243 264.376);  /* Azul océano */
  --secondary: oklch(0.696 0.17 162.48);  /* Cian */
  --accent: oklch(0.769 0.188 70.08);     /* Amarillo */
}

:root.theme-forest {
  --primary: oklch(0.4 0.2 140);          /* Verde bosque */
  --secondary: oklch(0.6 0.18 90);        /* Verde claro */
  --accent: oklch(0.8 0.15 70);           /* Dorado */
}
```

### Selector de tema

```tsx
export function ThemeSelector() {
  const [theme, setTheme] = useState('dark');

  const handleTheme = (newTheme: string) => {
    document.documentElement.className = `dark theme-${newTheme}`;
    setTheme(newTheme);
  };

  return (
    <div className="flex gap-2">
      <button onClick={() => handleTheme('ocean')}>Océano</button>
      <button onClick={() => handleTheme('forest')}>Bosque</button>
    </div>
  );
}
```

## 7. Integrar Base de Datos

### Con Supabase

```bash
pnpm add @supabase/supabase-js
```

```typescript
// En /lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default supabase;
```

### Guardar análisis en BD

```typescript
// En /hooks/useDataAnalysis.ts
async function saveAnalysis(analysis: AnalysisResult) {
  const { data, error } = await supabase
    .from('analyses')
    .insert({
      filename: dataContext.filename,
      analysis: analysis,
      created_at: new Date(),
    });

  if (error) console.error(error);
  return data;
}
```

## 8. Agregar Historial de Análisis

### Componente de historial

```tsx
// /components/analysis-history.tsx
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

export function AnalysisHistory() {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    async function loadHistory() {
      const { data } = await supabase
        .from('analyses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      setHistory(data || []);
    }

    loadHistory();
  }, []);

  return (
    <div className="space-y-2">
      {history.map((item) => (
        <div key={item.id} className="p-3 rounded border">
          {item.filename} - {new Date(item.created_at).toLocaleDateString()}
        </div>
      ))}
    </div>
  );
}
```

## 9. Debugging Avanzado

### Logging detallado

```typescript
// Agregar en /lib/analysis-utils.ts
export function enableDebugMode() {
  console.log('[v0] Debug mode enabled');
  
  window.__debug = {
    lastData: null,
    lastAnalysis: null,
    lastError: null,
  };
}

// En componentes:
console.log('[v0] Data loaded:', dataContext);
window.__debug.lastData = dataContext;
```

### Ver en consola

```javascript
// En Browser console (F12):
window.__debug.lastData
window.__debug.lastAnalysis
window.__debug.lastError
```

## 10. Testing

### Test básico con Jest

```bash
pnpm add -D jest @testing-library/react @testing-library/jest-dom
```

```typescript
// /lib/__tests__/analysis-utils.test.ts
import { analyzeData } from '@/lib/analysis-utils';

describe('analyzeData', () => {
  it('should calculate mean correctly', () => {
    const data = [
      { value: 10 },
      { value: 20 },
      { value: 30 },
    ];

    const result = analyzeData(data, ['value']);
    expect(result.statistics.value.mean).toBe(20);
  });
});
```

## 11. Optimizaciones SEO

### Mejorar metadatos

En `/app/layout.tsx`:

```typescript
export const metadata: Metadata = {
  title: 'DataMind - Análisis de Datos con IA',
  description: 'Analiza datos CSV con inteligencia artificial. Visualizaciones automáticas, chat inteligente y más.',
  keywords: ['análisis datos', 'IA', 'CSV', 'visualización', 'OpenRouter'],
  openGraph: {
    title: 'DataMind',
    description: 'Análisis de datos con IA',
    url: 'https://datamind.app',
  },
};
```

## 12. Monitorización

### Agregar Sentry para error tracking

```bash
pnpm add @sentry/nextjs
```

```typescript
// /app/layout.tsx
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

## Checklist de Optimizaciones

- [ ] Modelo IA personalizado
- [ ] Prompts optimizados
- [ ] Cache implementado
- [ ] Validación mejorada
- [ ] Exportación agregada
- [ ] Tema personalizado
- [ ] Base de datos integrada
- [ ] Historial implementado
- [ ] Debug habilitado
- [ ] Tests escritos
- [ ] SEO optimizado
- [ ] Monitorización activa

---

**¿Necesitas más ayuda?** Abre un issue o revisa la documentación completa en README.md
