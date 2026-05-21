// ========================================
// 대시보드 페이지
// 로그인 후 처음 보이는 페이지입니다
// 최근 여행 기록과 빠른 시작 버튼을 제공합니다
// ========================================

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTrip } from '../contexts/TripContext';
import { getUserTrips } from '../services/tripService';
import { Trip } from '../types';
import TripCard from '../components/trips/TripCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { formatDate } from '../utils/formatters';

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const { isTracking, activeTrip } = useTrip();
  const navigate = useNavigate();
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  // 최근 여행 기록 불러오기
  useEffect(() => {
    const fetchTrips = async () => {
      if (!currentUser) return;
      try {
        const trips = await getUserTrips(currentUser.uid);
        setRecentTrips(trips.slice(0, 3)); // 최근 3개만 표시
      } catch (error) {
        console.error('여행 기록 불러오기 실패:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, [currentUser]);

  const displayName = currentUser?.displayName || '여행자';
  const today = formatDate(new Date());

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 인사말 */}
        <div className="mb-8">
          <p className="text-gray-400 text-sm">{today}</p>
          <h1 className="text-2xl font-bold text-gray-800 mt-1">
            안녕하세요, {displayName}님! 👋
          </h1>
          <p className="text-gray-500 mt-1">오늘도 아름다운 여행을 기록해보세요</p>
        </div>

        {/* 현재 진행 중인 여행 배너 */}
        {isTracking && activeTrip && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <div>
                <p className="font-semibold text-red-700">{activeTrip.title}</p>
                <p className="text-sm text-red-500">
                  사진 {activeTrip.photos.length}장 · 위치 {activeTrip.locations.length}개 기록됨
                </p>
              </div>
            </div>
            <Link to="/map" className="btn-danger text-sm px-3 py-1.5">
              계속하기
            </Link>
          </div>
        )}

        {/* 빠른 시작 카드들 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {/* 새 여행 시작 */}
          <Link
            to="/map"
            className="bg-sky-500 text-white rounded-2xl p-6 hover:bg-sky-600 transition-colors group"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold mb-1">
                  {isTracking ? '여행 계속하기' : '새 여행 시작'}
                </h2>
                <p className="text-sky-100 text-sm">
                  {isTracking
                    ? '현재 기록 중인 여행으로 이동'
                    : 'GPS로 경로를 기록하고 사진을 추가하세요'
                  }
                </p>
              </div>
              <svg className="w-8 h-8 text-sky-200 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
          </Link>

          {/* 여행 기록 보기 */}
          <Link
            to="/trips"
            className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-sky-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-1">여행 기록</h2>
                <p className="text-gray-500 text-sm">
                  저장된 여행 {recentTrips.length}개 · 모든 기록 보기
                </p>
              </div>
              <svg className="w-8 h-8 text-gray-300 group-hover:text-sky-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </Link>
        </div>

        {/* 최근 여행 기록 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">최근 여행</h2>
            <Link to="/trips" className="text-sm text-sky-500 hover:text-sky-600">
              전체 보기
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner message="여행 기록을 불러오는 중..." />
            </div>
          ) : recentTrips.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
              <div className="text-5xl mb-4">🌍</div>
              <p className="text-gray-600 font-medium">아직 여행 기록이 없습니다</p>
              <p className="text-gray-400 text-sm mt-1 mb-4">첫 번째 여행을 시작해보세요!</p>
              <Link to="/map" className="btn-primary text-sm">
                여행 시작하기
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {recentTrips.map(trip => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onClick={() => navigate(`/trips/${trip.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
