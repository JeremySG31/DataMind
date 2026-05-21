import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

// Usar OpenRouter como proveedor OpenAI compatible
const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
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

    const prompt = `Eres un experto analista de datos financiero y de negocios que ayuda a usuarios a entender sus datasets de manera profunda.

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

Instrucciones de Respuesta:
1. Proporciona una respuesta clara, concisa y útil basada en el análisis del dataset. Intenta proporcionar información cuantitativa y valiosa para el negocio.
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
Nota: Asegúrate de que las claves de las columnas "x" e "y" coincidan EXACTAMENTE con los nombres de las columnas provistas arriba. Si el gráfico es de dispersión o barra, asegúrate de que al menos la columna "y" sea numérica. No inventes nombres de columnas.`;

    const response = await generateText({
      model: openrouter('google/gemini-2.5-flash'),
      prompt: prompt,
      maxOutputTokens: 2000,
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
