// ========================================
// 사용자 서비스
// Firestore에 사용자 정보를 저장하고 조회합니다
// ========================================

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { db } from '../lib/firebase';

/**
 * 신규 사용자 정보를 Firestore에 저장합니다
 * 최초 로그인 또는 회원가입 시 호출됩니다
 */
export async function createUserDocument(
  firebaseUser: FirebaseUser,
  displayName?: string
): Promise<void> {
  const userRef = doc(db, 'users', firebaseUser.uid);

  // 이미 존재하는 사용자면 업데이트하지 않음
  const existing = await getDoc(userRef);
  if (existing.exists()) return;

  await setDoc(userRef, {
    uid: firebaseUser.uid,
    name: displayName || firebaseUser.displayName || '여행자',
    email: firebaseUser.email,
    photoURL: firebaseUser.photoURL,
    createdAt: serverTimestamp(),
  });
}

/**
 * 사용자 정보를 Firestore에서 가져옵니다
 */
export async function getUserDocument(userId: string) {
  const userRef = doc(db, 'users', userId);
  const docSnap = await getDoc(userRef);

  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() };
}
