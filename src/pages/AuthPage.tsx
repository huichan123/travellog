// ========================================
// 로그인/회원가입 페이지
// 로그인 폼과 회원가입 폼을 탭으로 전환합니다
// 로그인 상태면 대시보드로 리다이렉트합니다
// ========================================

import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';

export default function AuthPage() {
  const { currentUser } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // 이미 로그인한 사용자는 대시보드로 이동
  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 flex">
      {/* 왼쪽 배경 패널 (데스크탑만) */}
      <div className="hidden lg:flex lg:w-1/2 bg-sky-500 items-center justify-center p-12 relative overflow-hidden">
        {/* 배경 원들 */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-sky-400 rounded-full opacity-40" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-sky-600 rounded-full opacity-40" />

        <div className="relative text-white text-center z-10">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl font-bold">ST</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">SketchTrip</h1>
          <p className="text-xl text-sky-100 mb-8">Your journey, mapped with memories.</p>
          <div className="space-y-3 text-sm text-sky-100">
            <div className="flex items-center gap-2 justify-center">
              <span>📍</span><span>GPS 기반 실시간 위치 추적</span>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <span>📸</span><span>사진과 함께 여행 경로 기록</span>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <span>🗺️</span><span>지도 위에 아름다운 여행 스토리</span>
            </div>
          </div>
        </div>
      </div>

      {/* 오른쪽 폼 패널 */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* 모바일 로고 */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
              <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" className="h-8 w-8 object-contain" />
              <img src={`${import.meta.env.BASE_URL}sketchtrip-logo.png`} alt="SketchTrip" className="h-7 w-auto" />
            </Link>
          </div>

          {/* 폼 카드 */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {mode === 'login' ? (
              <LoginForm onSwitchToRegister={() => setMode('register')} />
            ) : (
              <RegisterForm onSwitchToLogin={() => setMode('login')} />
            )}
          </div>

          {/* 홈으로 링크 */}
          <p className="text-center text-sm text-gray-400 mt-4">
            <Link to="/" className="hover:text-gray-600 transition-colors">
              ← 홈으로 돌아가기
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
