// ========================================
// 네비게이션 바 컴포넌트
// 앱 상단에 표시되는 헤더입니다
// 로고, 메뉴, 사용자 정보를 표시합니다
// ========================================

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTrip } from '../../contexts/TripContext';

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const { isTracking } = useTrip();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // 현재 페이지에 따라 활성 링크 스타일 적용
  const isActive = (path: string) =>
    location.pathname === path
      ? 'text-sky-600 font-semibold'
      : 'text-gray-600 hover:text-sky-500';

  return (
    <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 로고 */}
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center group-hover:bg-sky-600 transition-colors">
              <span className="text-white text-sm font-bold">ST</span>
            </div>
            <span className="text-lg font-bold text-navy-800">SketchTrip</span>
            {/* 여행 중일 때 표시되는 빨간 점 */}
            {isTracking && (
              <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse inline-block"></span>
                기록 중
              </span>
            )}
          </Link>

          {/* 데스크탑 메뉴 */}
          {currentUser && (
            <div className="hidden md:flex items-center gap-6">
              <Link to="/map" className={`text-sm transition-colors ${isActive('/map')}`}>
                지도
              </Link>
              <Link to="/trips" className={`text-sm transition-colors ${isActive('/trips')}`}>
                여행 기록
              </Link>
              <Link to="/dashboard" className={`text-sm transition-colors ${isActive('/dashboard')}`}>
                대시보드
              </Link>
              <Link
                to="/travel-logs/new"
                className="text-sm px-3 py-1.5 bg-sky-500 text-white rounded-lg font-medium hover:bg-sky-600 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                사진 로그
              </Link>
            </div>
          )}

          {/* 사용자 메뉴 */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                {/* 프로필 사진 또는 이니셜 */}
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt="프로필"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center">
                    <span className="text-sky-600 text-sm font-semibold">
                      {(currentUser.displayName || currentUser.email || '?')[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="hidden md:block text-sm text-gray-700 max-w-[120px] truncate">
                  {currentUser.displayName || currentUser.email}
                </span>
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* 드롭다운 메뉴 */}
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 animate-fade-in">
                  {/* 모바일에서만 보이는 메뉴 링크 */}
                  <div className="md:hidden border-b border-gray-100 pb-1 mb-1">
                    <Link to="/map" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                      지도
                    </Link>
                    <Link to="/travel-logs/new" className="block px-4 py-2 text-sm text-sky-600 font-medium hover:bg-sky-50" onClick={() => setMenuOpen(false)}>
                      📷 사진 로그 만들기
                    </Link>
                    <Link to="/trips" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                      여행 기록
                    </Link>
                    <Link to="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                      대시보드
                    </Link>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/auth" className="btn-primary text-sm">
              로그인
            </Link>
          )}
        </div>
      </div>

      {/* 클릭하면 드롭다운 닫기 */}
      {menuOpen && (
        <div className="fixed inset-0 z-[-1]" onClick={() => setMenuOpen(false)} />
      )}
    </nav>
  );
}
