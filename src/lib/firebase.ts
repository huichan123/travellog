// ========================================
// Firebase 초기화 및 설정 파일
// Firebase의 각 서비스(Auth, Firestore, Storage)를
// 초기화하고 내보내는 역할을 합니다
// ========================================

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase 설정 - .env 파일에서 환경 변수를 읽어옵니다
// ⚠️ API 키는 반드시 .env 파일에서 관리하고 코드에 직접 입력하지 마세요!
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Firebase Authentication - 로그인/회원가입 처리
export const auth = getAuth(app);

// Google 로그인 Provider 설정
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Firestore Database - 여행 기록, 사용자 정보 저장
export const db = getFirestore(app);

// Firebase Storage - 사진 파일 저장
export const storage = getStorage(app);

export default app;
