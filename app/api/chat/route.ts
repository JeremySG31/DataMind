import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter';

const chatInputSchema = z.object({
  message: z.string().min(1, 'La pregunta no puede estar vacía').max(2000, 'Mensaje demasiado largo (máximo 2000 caracteres)'),
  // data is now a SAMPLE (max 50 rows) sent by the client — never the full dataset
  data: z.array(z.record(z.any())).min(1, 'El dataset debe tener al menos una fila').max(100),
  columns: z.array(z.string()).min(1, 'El dataset debe tener al menos una columna'),
  // Optional: pre-computed stats sent by the client (avoids server-side recomputation)
  totalRows: z.number().optional(),
  columnStats: z.record(z.any()).optional(),
  history: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string().max(4000),
    })
  ).optional(),
});

// Usar OpenRouter como proveedor OpenAI compatible
const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: máximo 20 peticiones por minuto por IP
    const ip = getClientIp(request);
    const rateLimitResult = checkRateLimit(ip, { limit: 20, windowMs: 60 * 1000 });
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Demasiadas peticiones. Por favor espera un momento antes de continuar.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '20',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.floor(rateLimitResult.resetAt / 1000)),
            'Retry-After': String(Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)),
          },
        }
      );
    }

    // Validar tamaño de la petición (máximo 512KB — payload debería ser < 50KB con la muestra)
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 512 * 1024) {
      return NextResponse.json(
        { error: 'Petición demasiado grande. El cliente está enviando demasiados datos.' },
        { status: 413 }
      );
    }

    const body = await request.json();
    const parseResult = chatInputSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Parámetros inválidos', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { message, data, columns, history, totalRows, columnStats } = parseResult.data;

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'OPENROUTER_API_KEY no está configurada' },
        { status: 500 }
      );
    }

    // Use client-provided stats if available, otherwise compute from sample
    const statsContext = columnStats
      ? JSON.stringify(columnStats)
      : JSON.stringify(calculateBasicStats(data, columns));

    // Build a compact data preview (max 5 rows shown to AI)
    const dataPreview = JSON.stringify(data.slice(0, 5), null, 2);
    const rowCount = totalRows ?? data.length;

    // Build conversation history context
    const chatHistory = (history || [])
      .slice(-4) // last 4 messages max
      .map((msg: any) => `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}`)
      .join('\n');

    const prompt = `Eres un experto analista de datos financiero y de negocios que ayuda a usuarios a entender sus datasets de manera profunda.

INFORMACIÓN DEL DATASET:
- Columnas: ${columns.join(', ')}
- Total de filas: ${rowCount}
- Estadísticas por columna: ${statsContext}

MUESTRA DE DATOS (primeras 5 filas del total de ${rowCount}):
${dataPreview}

HISTORIAL DE CONVERSACIÓN:
${chatHistory || 'Sin historial previo'}

PREGUNTA DEL USUARIO:
${message}

Instrucciones de Respuesta:
1. Proporciona una respuesta clara, extremadamente concisa y útil basada en el análisis. Sé directo y ve al grano (máximo 2 párrafos cortos o 1 párrafo y una lista de viñetas breves). Evita rodeos, saludos o introducciones innecesarias.
2. Responde en español.
3. SI consideras que la respuesta o los datos discutidos se verían mejor representados visualmente, incluye al final de tu respuesta (en una línea nueva y separada) un bloque JSON exacto con la configuración del gráfico recomendado. Este bloque JSON debe ser de la siguiente manera:
\`\`\`json
{
  "type": "chart",
  "chartType": "bar" | "line" | "scatter" | "pie",
  "x": "NombreExactoDeColumnaParaEjeX",
  "y": "NombreExactoDeColumnaParaEjeY",
  "title": "Título corto y descriptivo del gráfico"
}
\`\`\`
Nota: Asegúrate de que las claves de las columnas "x" e "y" coincidan con los nombres de las columnas provistas arriba. Si el gráfico es de barra o línea, la columna "y" debe ser numérica. No inventes nombres de columnas.`;

    const response = await generateText({
      model: openrouter('openai/gpt-oss-120b:free'),
      prompt: prompt,
      maxOutputTokens: 800, // Reducido para acelerar tiempos de respuesta
    });

    return NextResponse.json({
      content: response.text,
    });
  } catch (error) {
    console.error('Error en chat:', error);
    return NextResponse.json(
      { error: 'Error al procesar la pregunta' },
      { status: 500 }
    );
  }
}

function calculateBasicStats(data: any[], columns: string[]): Record<string, any> {
  const stats: Record<string, any> = {};
  const numericColumns = columns.filter(col =>
    data.some(row => typeof row[col] === 'number')
  );

  numericColumns.forEach(col => {
    let minVal = Infinity;
    let maxVal = -Infinity;
    let sum = 0;
    let count = 0;

    for (let i = 0; i < data.length; i++) {
      const val = data[i][col];
      if (typeof val === 'number' && !isNaN(val)) {
        if (val < minVal) minVal = val;
        if (val > maxVal) maxVal = val;
        sum += val;
        count++;
      }
    }

    if (count > 0) {
      stats[col] = {
        min: minVal,
        max: maxVal,
        avg: (sum / count).toFixed(2),
      };
    }
  });

  return stats;
}
