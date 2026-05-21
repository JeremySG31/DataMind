import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { verifyFirebaseIdToken } from '@/lib/auth-server';
import { z } from 'zod';
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter';

const loadAnalysesQuerySchema = z.object({
  userId: z.string().min(1, 'userId es requerido'),
  analysisId: z.string().nullable().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Rate limiting: máximo 60 consultas por minuto por IP
    const ip = getClientIp(request);
    const rateLimitResult = checkRateLimit(ip, { limit: 60, windowMs: 60 * 1000 });
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

    if (!db) {
      return NextResponse.json(
        { error: 'Firebase no está configurado' },
        { status: 500 }
      );
    }

    const userIdParam = request.nextUrl.searchParams.get('userId');
    const analysisIdParam = request.nextUrl.searchParams.get('analysisId');

    const parseResult = loadAnalysesQuerySchema.safeParse({
      userId: userIdParam,
      analysisId: analysisIdParam,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Parámetros de consulta inválidos', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { userId, analysisId } = parseResult.data;

    // Prevenir Broken Object Level Authorization (BOLA)
    // El usuario solo puede consultar sus propios análisis
    if (decodedToken.uid !== userId) {
      return NextResponse.json(
        { error: 'Acceso denegado: No puedes consultar datos de otro usuario' },
        { status: 403 }
      );
    }

    // Cargar análisis específico
    if (analysisId) {
      const analysisRef = doc(db, 'analyses', userId, 'user_analyses', analysisId);
      const analysisSnap = await getDoc(analysisRef);

      if (!analysisSnap.exists()) {
        return NextResponse.json(
          { error: 'Análisis no encontrado' },
          { status: 404 }
        );
      }

      const analysis = analysisSnap.data();

      return NextResponse.json(
        {
          success: true,
          analysis: {
            id: analysisId,
            ...analysis,
            createdAt: analysis.createdAt?.toDate?.() || new Date(),
            updatedAt: analysis.updatedAt?.toDate?.() || new Date(),
          },
        },
        { status: 200 }
      );
    }

    // Cargar todos los análisis del usuario
    const q = collection(db, 'analyses', userId, 'user_analyses');
    const querySnapshot = await getDocs(q);

    const analyses = querySnapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt?.toDate?.() || new Date(),
      updatedAt: docSnap.data().updatedAt?.toDate?.() || new Date(),
    }));

    return NextResponse.json(
      {
        success: true,
        analyses,
        count: analyses.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error cargando análisis:', error);
    return NextResponse.json(
      { error: error.message || 'Error cargando análisis' },
      { status: 500 }
    );
  }
}

