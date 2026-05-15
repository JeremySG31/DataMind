import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { userId, analysisData, datasetName, analysisType, isPublic } = await request.json();

    if (!db) {
      return NextResponse.json(
        { error: 'Firebase no está configurado' },
        { status: 500 }
      );
    }

    if (!userId || !analysisData) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      );
    }

    // Guardar en Firestore
    const analysisRef = await addDoc(collection(db, 'analyses'), {
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
    const { analysisId, userId, analysisData, isPublic } = await request.json();

    if (!db) {
      return NextResponse.json(
        { error: 'Firebase no está configurado' },
        { status: 500 }
      );
    }

    if (!analysisId || !userId) {
      return NextResponse.json(
        { error: 'ID de análisis e ID de usuario requeridos' },
        { status: 400 }
      );
    }

    const analysisRef = doc(db, 'analyses', analysisId);
    await updateDoc(analysisRef, {
      data: analysisData,
      isPublic,
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
