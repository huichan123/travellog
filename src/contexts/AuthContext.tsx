// ========================================
// 인증 컨텍스트
// 앱 전체에서 로그인 상태와 사용자 정보를 공유합니다
// React Context API를 사용합니다
// ========================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { createUserDocument } from '../services/userService';

// 컨텍스트에서 제공할 값들의 타입 정의
interface AuthContextType {
  currentUser: User | null;       // 현재 로그인한 사용자 (없으면 null)
  loading: boolean;               // 인증 상태 로딩 중 여부
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Context 객체 생성 (기본값은 undefined)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── AuthProvider 컴포넌트 ──────────────────────────────────────────────────────

/**
 * 앱 전체를 감싸는 Provider 컴포넌트
 * 로그인 상태를 자동으로 감지하고 하위 컴포넌트에 공유합니다
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // 초기 인증 확인 중

  // Firebase 인증 상태 변화 감지
  useEffect(() => {
    // onAuthStateChanged: 로그인/로그아웃 시 자동으로 호출됩니다
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    // 컴포넌트 언마운트 시 리스너 해제
    return unsubscribe;
  }, []);

  // 이메일/비밀번호로 로그인
  const loginWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  // Google 계정으로 로그인
  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    // 처음 Google 로그인하는 사용자라면 Firestore에 저장
    await createUserDocument(result.user);
  };

  // 이메일/비밀번호로 회원가입
  const register = async (name: string, email: string, password: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    // 프로필에 이름 설정
    await updateProfile(result.user, { displayName: name });
    // Firestore에 사용자 정보 저장
    await createUserDocument(result.user, name);
  };

  // 로그아웃
  const logout = async () => {
    await signOut(auth);
  };

  const value: AuthContextType = {
    currentUser,
    loading,
    loginWithEmail,
    loginWithGoogle,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {/* 인증 상태 확인 중에는 앱을 렌더링하지 않음 */}
      {!loading && children}
    </AuthContext.Provider>
  );
}

// ─── useAuth 훅 ────────────────────────────────────────────────────────────────

/**
 * 인증 컨텍스트를 쉽게 사용하기 위한 커스텀 훅
 * AuthProvider 내부에서만 사용 가능합니다
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth는 AuthProvider 내부에서만 사용할 수 있습니다');
  }
  return context;
}
