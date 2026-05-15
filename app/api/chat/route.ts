import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

// Usar OpenRouter como proveedor OpenAI compatible
const openrouter = createOpenAI({
  baseURL: 'https://openrouter.io/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message, data, columns, history } = await request.json();

    if (!message || !data || !columns) {
      return NextResponse.json(
        { error: 'Parámetros inválidos' },
        { status: 400 }
      );
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'OPENROUTER_API_KEY no está configurada' },
        { status: 500 }
      );
    }

    // Preparar contexto del dataset
    const sampleData = data.slice(0, 10);
    const dataPreview = JSON.stringify(sampleData, null, 2);
    const stats = calculateBasicStats(data, columns);

    // Construir historial para contexto
    const chatHistory = (history || [])
      .slice(-4) // Últimos 4 mensajes para contexto
      .map((msg: any) => `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}`)
      .join('\n');

    const prompt = `Eres un experto analista de datos que ayuda a usuarios a entender sus datasets.

INFORMACIÓN DEL DATASET:
- Columnas: ${columns.join(', ')}
- Total de filas: ${data.length}
- Estadísticas básicas: ${JSON.stringify(stats)}

MUESTRA DE DATOS (primeras 10 filas):
${dataPreview}

HISTORIAL DE CONVERSACIÓN:
${chatHistory || 'Sin historial previo'}

PREGUNTA DEL USUARIO:
${message}

Proporciona una respuesta clara, concisa y útil basada en el análisis del dataset. Si la pregunta requiere números específicos, intenta proporcionar información cuantitativa. Responde en español.`;

    const response = await generateText({
      model: openrouter('mistral-7b-instruct'),
      prompt: prompt,
      maxTokens: 2000,
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
    const values = data
      .map(row => row[col])
      .filter((val): val is number => typeof val === 'number');

    if (values.length > 0) {
      stats[col] = {
        min: Math.min(...values),
        max: Math.max(...values),
        avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2),
      };
    }
  });

  return stats;
}
