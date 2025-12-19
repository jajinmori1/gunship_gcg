import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase 설정 - 실제 프로젝트에서는 환경변수로 관리하세요
// Firebase 콘솔에서 프로젝트 생성 후 설정값을 입력하세요
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Auth 인스턴스
export const auth = getAuth(app);

// Google 로그인 프로바이더
export const googleProvider = new GoogleAuthProvider();

// Firestore 인스턴스
export const db = getFirestore(app);

export default app;

