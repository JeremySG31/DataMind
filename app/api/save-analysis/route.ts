import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { verifyFirebaseIdToken } from '@/lib/auth-server';
import { z } from 'zod';
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter';

const saveAnalysisPostSchema = z.object({
  userId: z.string().min(1, 'userId es requerido'),
  analysisData: z.object({
    data: z.array(z.record(z.any())).min(1, 'Los datos no pueden estar vacíos'),
    statistics: z.record(z.any()).optional().nullable(),
    insights: z.array(z.string()).optional().nullable(),
  }),
  datasetName: z.string().min(1, 'Nombre del dataset es requerido'),
  analysisType: z.string().min(1, 'Tipo de análisis es requerido'),
  isPublic: z.boolean().optional(),
});

const saveAnalysisPutSchema = z.object({
  analysisId: z.string().min(1, 'analysisId es requerido'),
  userId: z.string().min(1, 'userId es requerido'),
  analysisData: z.object({
    data: z.array(z.record(z.any())).min(1, 'Los datos no pueden estar vacíos'),
    statistics: z.record(z.any()).optional().nullable(),
    insights: z.array(z.string()).optional().nullable(),
  }),
  isPublic: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: máximo 30 guardados por minuto por IP
    const ip = getClientIp(request);
    const rateLimitResult = checkRateLimit(ip, { limit: 30, windowMs: 60 * 1000 });
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Demasiadas peticiones. Por favor espera un momento.' },
        { status: 429 }
      );
    }

    const authHeader = request.headers.get('Authorization');
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const decodedToken = await verifyFirebaseIdToken(token);

    if (!decodedToken) {
      return NextResponse.json(
        { error: 'No autorizado: Token de sesión inválido o expirado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parseResult = saveAnalysisPostSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Datos de petición inválidos', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { userId, analysisData, datasetName, analysisType, isPublic } = parseResult.data;

    if (!db) {
      return NextResponse.json(
        { error: 'Firebase no está configurado' },
        { status: 500 }
      );
    }

    // Prevenir Broken Object Level Authorization (BOLA)
    if (decodedToken.uid !== userId) {
      return NextResponse.json(
        { error: 'Acceso denegado: No puedes guardar datos para otro usuario' },
        { status: 403 }
      );
    }

    // Guardar en Firestore siguiendo las reglas de seguridad: /analyses/{userId}/user_analyses
    const analysisRef = await addDoc(collection(db, 'analyses', userId, 'user_analyses'), {
      userId,
      datasetName,
      analysisType,
      data: analysisData,
      isPublic: isPublic || false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json(
      {
        success: true,
        analysisId: analysisRef.id,
        message: 'Análisis guardado exitosamente',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error guardando análisis:', error);
    return NextResponse.json(
      { error: error.message || 'Error guardando análisis' },
      { status: 500 }
    );
  }
}

// Actualizar análisis existente
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const decodedToken = await verifyFirebaseIdToken(token);

    if (!decodedToken) {
      return NextResponse.json(
        { error: 'No autorizado: Token de sesión inválido o expirado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parseResult = saveAnalysisPutSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Datos de petición inválidos', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { analysisId, userId, analysisData, isPublic } = parseResult.data;

    if (!db) {
      return NextResponse.json(
        { error: 'Firebase no está configurado' },
        { status: 500 }
      );
    }

    // Prevenir Broken Object Level Authorization (BOLA)
    if (decodedToken.uid !== userId) {
      return NextResponse.json(
        { error: 'Acceso denegado: No puedes actualizar datos para otro usuario' },
        { status: 403 }
      );
    }

    const analysisRef = doc(db, 'analyses', userId, 'user_analyses', analysisId);
    await updateDoc(analysisRef, {
      data: analysisData,
      isPublic: isPublic || false,
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Análisis actualizado exitosamente',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error actualizando análisis:', error);
    return NextResponse.json(
      { error: error.message || 'Error actualizando análisis' },
      { status: 500 }
    );
  }
}

