import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { error: 'Servicio no disponible: la compartición pública ha sido desactivada por razones de seguridad y privacidad.' },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: 'Servicio no disponible: la compartición pública ha sido desactivada por razones de seguridad y privacidad.' },
    { status: 410 }
  );
}
