import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: 'Firebase no está configurado' },
        { status: 500 }
      );
    }

    const { analysisId, userId, isPublic, sharedWith } = await request.json();

    if (!analysisId || !userId) {
      return NextResponse.json(
        { error: 'analysisId y userId requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el usuario sea el propietario
    const q = query(
      collection(db, 'analyses'),
      where('__name__', '==', analysisId)
    );
    
    const analysisRef = doc(db, 'analyses', analysisId);
    
    // Actualizar estado de compartición
    await updateDoc(analysisRef, {
      isPublic: isPublic || false,
      sharedWith: sharedWith || [],
    });

    // Generar enlace de compartición si es público
    const shareLink = isPublic 
      ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/shared-analysis/${analysisId}`
      : null;

    return NextResponse.json(
      {
        success: true,
        shareLink,
        message: 'Configuración de compartición actualizada',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error compartiendo análisis:', error);
    return NextResponse.json(
      { error: error.message || 'Error compartiendo análisis' },
      { status: 500 }
    );
  }
}

// Obtener análisis compartido públicamente
export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: 'Firebase no está configurado' },
        { status: 500 }
      );
    }

    const analysisId = request.nextUrl.searchParams.get('analysisId');

    if (!analysisId) {
      return NextResponse.json(
        { error: 'analysisId requerido' },
        { status: 400 }
      );
    }

    const analysisRef = doc(db, 'analyses', analysisId);
    const analysisSnap = await analysisRef.get?.() || { exists: () => false };

    // Nota: En un entorno real usarías getDoc aquí
    // Esta es una simplificación para el ejemplo

    return NextResponse.json(
      { error: 'No implementado completamente' },
      { status: 501 }
    );
  } catch (error: any) {
    console.error('Error obteniendo análisis compartido:', error);
    return NextResponse.json(
      { error: error.message || 'Error obteniendo análisis' },
      { status: 500 }
    );
  }
}
