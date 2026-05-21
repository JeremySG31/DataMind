import { initializeApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Tu configuración de Firebase
// Obtén estos valores de tu proyecto en https://console.firebase.google.com
const getAuthDomain = () => {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'datamind-app-31';
  const defaultDomain = `${projectId}.firebaseapp.com`;

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // En desarrollo local (localhost), usamos el dominio seguro de Firebase por defecto
    // para evitar el error ERR_SSL_PROTOCOL_ERROR ya que tu entorno local corre bajo HTTP (sin SSL).
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return defaultDomain;
    }
    // En producción (Vercel), usamos el host de tu aplicación que ya cuenta con SSL activo.
    return window.location.host;
  }
  return defaultDomain;
};

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: getAuthDomain(),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

// Verificar si Firebase está configurado
const isFirebaseConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
};

let app: any = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured()) {
  try {
    // Inicializar Firebase
    app = initializeApp(firebaseConfig);
    // Inicializar servicios
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.error('Error inicializando Firebase:', error);
  }
}

export { auth, db };
export { isFirebaseConfigured };
export default app;
