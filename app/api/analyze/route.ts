import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter';

// Schema de validación Zod
const analyzeInputSchema = z.object({
  data: z.array(z.record(z.any())).min(1, 'El dataset debe tener al menos una fila').max(100),
  columns: z.array(z.string()).min(1, 'El dataset debe tener al menos una columna'),
  totalRows: z.number().optional(),
  columnStats: z.record(z.any()).optional(),
});

// Usar OpenRouter como proveedor OpenAI compatible
const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: máximo 30 peticiones por minuto por IP
    const ip = getClientIp(request);
    const rateLimitResult = checkRateLimit(ip, { limit: 30, windowMs: 60 * 1000 });
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Demasiadas peticiones. Por favor espera un momento.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)) } }
      );
    }

    // Validar tamaño del cuerpo de la petición (máximo 512KB — el cliente envía un sample de 50 filas)
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 512 * 1024) {
      return NextResponse.json(
        { error: 'Petición demasiado grande. El cliente está enviando demasiados datos.' },
        { status: 413 }
      );
    }

    const body = await request.json();
    const parseResult = analyzeInputSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { data, columns, totalRows, columnStats } = parseResult.data;

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'OPENROUTER_API_KEY no está configurada' },
        { status: 500 }
      );
    }

    // Usar stats del cliente si están disponibles, si no calcular del sample
    const statsContext = columnStats
      ? JSON.stringify(columnStats)
      : JSON.stringify(calculateBasicStats(data, columns));

    const dataPreview = JSON.stringify(data.slice(0, 5), null, 2);
    const rowCount = totalRows ?? data.length;

    const prompt = `Analiza el siguiente dataset y proporciona insights valiosos:

Columnas: ${columns.join(', ')}
Total de filas: ${rowCount}
Estadísticas por columna: ${statsContext}

Muestra de datos (primeras 5 filas del total de ${rowCount}):
${dataPreview}

Por favor proporciona:
1. Un resumen del dataset en máximo 2 oraciones
2. 3-4 insights principales que puedas deducir
3. Recomendaciones de visualizaciones que serían útiles (lista separada por comas)

Responde en formato JSON con las claves: summary, insights (array), recommendedCharts (array)`;

    const response = await generateText({
      model: openrouter('openai/gpt-oss-120b:free'),
      prompt: prompt,
      maxOutputTokens: 2000,
    });

    // Parsear respuesta JSON
    let analysisData;
    try {
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      analysisData = jsonMatch ? JSON.parse(jsonMatch[0]) : {
        summary: response.text,
        insights: [],
        recommendedCharts: [],
      };
    } catch {
      analysisData = {
        summary: response.text,
        insights: [],
        recommendedCharts: [],
      };
    }

    return NextResponse.json(analysisData);
  } catch (error) {
    console.error('Error en análisis:', error);
    return NextResponse.json(
      { error: 'Error al procesar el análisis' },
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
