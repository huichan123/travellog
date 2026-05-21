// ========================================
// 로그인 폼 컴포넌트
// 이메일/비밀번호 로그인과 Google 로그인을 처리합니다
// ========================================

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface LoginFormProps {
  onSwitchToRegister: () => void; // 회원가입 폼으로 전환
}

export default function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const { loginWithEmail, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 이메일/비밀번호 로그인 처리
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginWithEmail(email, password);
      // 로그인 성공 시 AuthContext에서 상태가 자동으로 업데이트됩니다
    } catch (err: unknown) {
      // Firebase 에러 코드에 따라 한국어 메시지 표시
      const firebaseError = err as { code?: string };
      switch (firebaseError.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError('이메일 또는 비밀번호가 올바르지 않습니다.');
          break;
        case 'auth/invalid-email':
          setError('올바른 이메일 형식을 입력해주세요.');
          break;
        case 'auth/too-many-requests':
          setError('로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.');
          break;
        default:
          setError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Google 로그인 처리
  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch {
      setError('Google 로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">로그인</h2>
      <p className="text-gray-500 text-sm mb-6">여행 기록을 시작해보세요</p>

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Google 로그인 버튼 */}
      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors mb-4 disabled:opacity-50"
      >
        {/* Google 아이콘 (SVG) */}
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <span className="text-sm font-medium text-gray-700">Google로 계속하기</span>
      </button>

      {/* 구분선 */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">또는</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* 이메일 로그인 폼 */}
      <form onSubmit={handleEmailLogin} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="input-field"
            placeholder="이메일을 입력하세요"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="input-field"
            placeholder="비밀번호를 입력하세요"
            required
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3"
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>

      {/* 회원가입 링크 */}
      <p className="text-center text-sm text-gray-500 mt-4">
        계정이 없으신가요?{' '}
        <button
          onClick={onSwitchToRegister}
          className="text-sky-500 font-medium hover:text-sky-600"
        >
          회원가입
        </button>
      </p>
    </div>
  );
}
