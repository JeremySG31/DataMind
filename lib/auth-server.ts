import { isFirebaseConfigured } from './firebase';

interface JWK {
  kty: string;
  alg: string;
  use: string;
  kid: string;
  n: string;
  e: string;
  [key: string]: any;
}

interface JWKSResponse {
  keys: JWK[];
}

let cachedJwks: JWKSResponse | null = null;
let lastFetchTime = 0;
const JWKS_CACHE_TTL = 3600 * 1000; // 1 hora

async function fetchGoogleJwks(): Promise<JWKSResponse> {
  const now = Date.now();
  if (cachedJwks && now - lastFetchTime < JWKS_CACHE_TTL) {
    return cachedJwks;
  }

  try {
    const res = await fetch(
      'https://www.googleapis.com/serviceaccounts/jwk/securetoken@system.gserviceaccount.com',
      { next: { revalidate: 3600 } } as any // Cache opcional en Next.js
    );
    if (!res.ok) {
      throw new Error(`Failed to fetch JWKs: ${res.statusText}`);
    }
    const data = await res.json() as JWKSResponse;
    cachedJwks = data;
    lastFetchTime = now;
    return data;
  } catch (err) {
    console.error('Error al obtener JWKs de Google:', err);
    if (cachedJwks) {
      // Retornar caché expirada como contingencia
      return cachedJwks;
    }
    throw err;
  }
}

function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function parseJwt(token: string) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Token JWT mal formado: debe tener 3 partes.');
  }

  const decoder = new TextDecoder();
  const header = JSON.parse(decoder.decode(base64UrlDecode(parts[0])));
  const payload = JSON.parse(decoder.decode(base64UrlDecode(parts[1])));

  return {
    header,
    payload,
    signaturePart: parts[2],
    rawHeaderPayload: parts[0] + '.' + parts[1]
  };
}

/**
 * Verifica un Firebase ID Token y devuelve los claims del usuario si es válido.
 * Si Firebase no está configurado (modo local / demo), se asume que las peticiones
 * pueden proceder en modo invitado bajo ciertas condiciones para evitar romper el flujo.
 */
export async function verifyFirebaseIdToken(token: string | null): Promise<{ uid: string; email?: string } | null> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'datamind-app-31';

  // Si Firebase no está configurado, o si es un entorno local de prueba sin credenciales
  if (!isFirebaseConfigured()) {
    if (token === 'guest-token' || !token) {
      return { uid: 'guest-user-id', email: 'invitado@datamind.com' };
    }
  }

  if (!token) {
    return null;
  }

  // Manejo de token de invitado explícito - SOLO si Firebase NO está configurado
  if (token === 'guest-token') {
    if (!isFirebaseConfigured()) {
      return { uid: 'guest-user-id', email: 'invitado@datamind.com' };
    }
    console.warn('Advertencia: Intento de bypass con guest-token detectado con Firebase activo.');
    return null;
  }

  try {
    const { header, payload, signaturePart, rawHeaderPayload } = parseJwt(token);

    // 1. Verificar Algoritmo en Cabecera
    if (header.alg !== 'RS256') {
      throw new Error(`Algoritmo no soportado: ${header.alg}. Debe ser RS256.`);
    }

    // 2. Verificar claims básicos
    const now = Math.floor(Date.now() / 1000);

    // Expiración
    if (payload.exp < now) {
      throw new Error('El token ha expirado.');
    }

    // Emitido en el pasado
    if (payload.iat > now + 300) { // Tolerancia de 5 minutos para desfase de reloj
      throw new Error('El token fue emitido en el futuro.');
    }

    // Issuer (Emisor)
    const expectedIssuer = `https://securetoken.google.com/${projectId}`;
    if (payload.iss !== expectedIssuer) {
      throw new Error(`Emisor inválido: ${payload.iss}. Se esperaba ${expectedIssuer}`);
    }

    // Audience (Audiencia)
    if (payload.aud !== projectId) {
      throw new Error(`Audiencia inválida: ${payload.aud}. Se esperaba ${projectId}`);
    }

    // Subject (Usuario)
    if (!payload.sub || typeof payload.sub !== 'string') {
      throw new Error('El claim "sub" (UID) es inválido o no existe.');
    }

    // 3. Obtener JWKs y buscar la clave correspondiente al 'kid' del token
    const jwks = await fetchGoogleJwks();
    const jwk = jwks.keys.find(key => key.kid === header.kid);
    if (!jwk) {
      throw new Error(`No se encontró clave pública para el kid: ${header.kid}`);
    }

    // 4. Importar clave y verificar firma
    const publicKey = await crypto.subtle.importKey(
      'jwk',
      jwk as JsonWebKey,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: { name: 'SHA-256' }
      },
      false,
      ['verify']
    );

    const encoder = new TextEncoder();
    const dataToVerify = encoder.encode(rawHeaderPayload);
    const signature = base64UrlDecode(signaturePart);

    const isValid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      publicKey,
      signature as any,
      dataToVerify as any
    );

    if (!isValid) {
      throw new Error('Firma digital del token inválida.');
    }

    return {
      uid: payload.sub,
      email: payload.email
    };
  } catch (err: any) {
    console.error('Error verificando Firebase ID Token:', err.message);
    return null;
  }
}
