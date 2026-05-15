import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: 'Firebase no está configurado' },
        { status: 500 }
      );
    }

    const userId = request.nextUrl.searchParams.get('userId');
    const analysisId = request.nextUrl.searchParams.get('analysisId');

    // Cargar análisis específico
    if (analysisId) {
      const analysisRef = doc(db, 'analyses', analysisId);
      const analysisSnap = await getDoc(analysisRef);

      if (!analysisSnap.exists()) {
        return NextResponse.json(
          { error: 'Análisis no encontrado' },
          { status: 404 }
        );
      }

      const analysis = analysisSnap.data();

      // Verificar permisos
      if (!analysis.isPublic && analysis.userId !== userId) {
        return NextResponse.json(
          { error: 'No tienes permiso para acceder a este análisis' },
          { status: 403 }
        );
      }

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
    if (userId) {
      const q = query(
        collection(db, 'analyses'),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);

      const analyses = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      }));

      return NextResponse.json(
        {
          success: true,
          analyses,
          count: analyses.length,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: 'userId o analysisId requerido' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error cargando análisis:', error);
    return NextResponse.json(
      { error: error.message || 'Error cargando análisis' },
      { status: 500 }
    );
  }
}
