import { NextRequest, NextResponse } from 'next/server';
import { generateText, openai } from 'ai';

// Usar OpenRouter como proveedor OpenAI compatible
const openAiCompatible = openai.chat('mistral-7b-instruct', {
  baseURL: 'https://openrouter.io/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { data, columns } = await request.json();

    if (!data || !columns) {
      return NextResponse.json(
        { error: 'Datos inválidos' },
        { status: 400 }
      );
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'OPENROUTER_API_KEY no está configurada' },
        { status: 500 }
      );
    }

    // Preparar un resumen de los datos para el prompt
    const sampleData = data.slice(0, 5);
    const dataPreview = JSON.stringify(sampleData, null, 2);

    const prompt = `Analiza el siguiente dataset y proporciona insights valiosos:

Columnas: ${columns.join(', ')}
Total de filas: ${data.length}

Primeras 5 filas de ejemplo:
${dataPreview}

Por favor proporciona:
1. Un resumen del dataset en máximo 2 oraciones
2. 3-4 insights principales que puedas deducir
3. Recomendaciones de visualizaciones que serían útiles (lista separada por comas)

Responde en formato JSON con las claves: summary, insights (array), recommendedCharts (array)`;

    const response = await generateText({
      model: openAiCompatible,
      prompt: analysisPrompt,
      maxTokens: 2000,
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
