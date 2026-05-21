// ========================================
// App.tsx - 앱의 루트 컴포넌트
// 라우팅과 전체 레이아웃을 담당합니다
// ========================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TripProvider } from './contexts/TripContext';
import Navbar from './components/ui/Navbar';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import MapPage from './pages/MapPage';
import TripsPage from './pages/TripsPage';
import TripDetailPage from './pages/TripDetailPage';
import CreateTravelLogPage from './pages/CreateTravelLogPage';
import TravelLogDetailPage from './pages/TravelLogDetailPage';
import LoadingSpinner from './components/ui/LoadingSpinner';

// ─── 보호된 라우트 컴포넌트 ──────────────────────────────────────────────────────
// 로그인하지 않은 사용자는 /auth 페이지로 리다이렉트합니다

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();

  // 인증 상태 확인 중
  if (loading) {
    return <LoadingSpinner fullScreen message="로딩 중..." />;
  }

  // 로그인하지 않으면 로그인 페이지로
  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

// ─── 앱 레이아웃 ────────────────────────────────────────────────────────────────
// 로그인한 사용자에게는 Navbar를 보여줍니다

function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50">
      {currentUser && <Navbar />}
      {children}
    </div>
  );
}

// ─── 라우터 설정 ────────────────────────────────────────────────────────────────

function AppRoutes() {
  const { currentUser } = useAuth();

  return (
    <AppLayout>
      <Routes>
        {/* 공개 페이지 */}
        <Route
          path="/"
          element={currentUser ? <Navigate to="/dashboard" replace /> : <LandingPage />}
        />
        <Route path="/auth" element={<AuthPage />} />

        {/* 보호된 페이지 (로그인 필요) */}
        <Route path="/dashboard" element={
          <ProtectedRoute><DashboardPage /></ProtectedRoute>
        } />
        <Route path="/map" element={
          <ProtectedRoute><MapPage /></ProtectedRoute>
        } />
        <Route path="/trips" element={
          <ProtectedRoute><TripsPage /></ProtectedRoute>
        } />
        <Route path="/trips/:tripId" element={
          <ProtectedRoute><TripDetailPage /></ProtectedRoute>
        } />
        <Route path="/travel-logs/new" element={
          <ProtectedRoute><CreateTravelLogPage /></ProtectedRoute>
        } />
        <Route path="/travel-logs/:logId" element={
          <ProtectedRoute><TravelLogDetailPage /></ProtectedRoute>
        } />

        {/* 없는 페이지는 홈으로 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}

// ─── 루트 앱 컴포넌트 ───────────────────────────────────────────────────────────

export default function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';
  return (
    <BrowserRouter basename={basename}>
      <AuthProvider>
        <TripProvider>
          <AppRoutes />
        </TripProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
