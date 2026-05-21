import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter';

const prepSuggestInputSchema = z.object({
  data: z.array(z.record(z.any())).min(1, 'El dataset debe tener al menos una fila'),
  columns: z.array(z.string()).min(1, 'El dataset debe tener al menos una columna'),
});

// Usar OpenRouter como proveedor OpenAI compatible
const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: máximo 15 peticiones por minuto por IP
    const ip = getClientIp(request);
    const rateLimitResult = checkRateLimit(ip, { limit: 15, windowMs: 60 * 1000 });
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Demasiadas peticiones. Por favor espera un momento.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)) } }
      );
    }

    // Validar tamaño de la petición (máximo 512KB — el cliente envía un sample de 50 filas)
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 512 * 1024) {
      return NextResponse.json(
        { error: 'Petición demasiado grande. El cliente está enviando demasiados datos.' },
        { status: 413 }
      );
    }

    const body = await request.json();
    const parseResult = prepSuggestInputSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Datos o columnas inválidos', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { data, columns } = parseResult.data;

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'OPENROUTER_API_KEY no está configurada en las variables de entorno' },
        { status: 500 }
      );
    }

    // Tomar una muestra del dataset para enviar al modelo
    const sampleData = data.slice(0, 15);
    const dataPreview = JSON.stringify(sampleData, null, 2);

    const prompt = `Analiza las columnas y la muestra del siguiente dataset para sugerir la mejor preparación de datos y ordenamiento lógico:

Columnas disponibles: ${columns.join(', ')}
Total de filas en el dataset: ${data.length}

Muestra de datos (primeras 15 filas):
${dataPreview}

Por favor, determina la configuración óptima para limpiar y ordenar este dataset:
1. Cuál es la columna más lógica por la que se debería ordenar el dataset para evitar el caos (por ejemplo: columnas de fecha/timestamp, IDs numéricos autoincrementales, nombres o categorías principales, montos o importes).
2. Cuál es el orden recomendado ("asc" para ascendente, o "desc" para descendente).
3. Qué columnas se deben seleccionar/mantener (lista de nombres de columnas exactos). Excluye columnas que parezcan completamente vacías o redundantes, pero mantén la gran mayoría que tengan valor analítico.
4. Cuál es la mejor acción para tratar valores vacíos o nulos ("fill_mean_na" para rellenar con la media/NA, "drop_rows" para eliminar filas con nulos, o "keep" para mantenerlos).
5. Una explicación muy breve (1 sola frase de menos de 15 palabras) en español de por qué recomiendas este orden y limpieza.

Responde ÚNICAMENTE en formato JSON plano con la siguiente estructura (no agregues texto fuera del JSON):
{
  "sortByColumn": "NombreExactoDeLaColumna" o null si no se recomienda ordenar,
  "sortOrder": "asc" | "desc",
  "selectedColumns": ["Columna1", "Columna2", ...],
  "nullAction": "fill_mean_na" | "drop_rows" | "keep",
  "explanation": "Breve explicación en español"
}`;

    const response = await generateText({
      model: openrouter('openai/gpt-oss-120b:free'),
      prompt: prompt,
      maxOutputTokens: 1000,
    });

    let suggestion;
    try {
      const text = response.text.trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      suggestion = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) {
      console.error('Error parseando JSON de respuesta de IA:', e);
      suggestion = null;
    }

    // Fallback seguro si la IA no devuelve el formato esperado
    if (!suggestion) {
      suggestion = {
        sortByColumn: columns[0] || null,
        sortOrder: 'asc',
        selectedColumns: columns,
        nullAction: 'fill_mean_na',
        explanation: 'Se seleccionaron opciones seguras por defecto.'
      };
    }

    return NextResponse.json(suggestion);
  } catch (error) {
    console.error('Error en sugerencia de preparación:', error);
    return NextResponse.json(
      { error: 'Error al procesar sugerencia de IA' },
      { status: 500 }
    );
  }
}
