// ========================================
// 여행 기록 목록 페이지
// 사용자가 저장한 모든 여행 기록을 표시합니다
// ========================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserTrips } from '../services/tripService';
import { Trip } from '../types';
import TripCard from '../components/trips/TripCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function TripsPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTrips = async () => {
      if (!currentUser) return;
      try {
        const data = await getUserTrips(currentUser.uid);
        setTrips(data);
      } catch {
        setError('여행 기록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">여행 기록</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {loading ? '' : `총 ${trips.length}개의 여행 기록`}
            </p>
          </div>
          <button
            onClick={() => navigate('/map')}
            className="btn-primary text-sm"
          >
            새 여행 시작
          </button>
        </div>

        {/* 로딩 */}
        {loading && (
          <div className="flex justify-center py-16">
            <LoadingSpinner message="여행 기록을 불러오는 중..." />
          </div>
        )}

        {/* 에러 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* 빈 상태 */}
        {!loading && !error && trips.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="text-6xl mb-4">🌏</div>
            <p className="text-gray-700 font-semibold text-lg mb-2">아직 여행 기록이 없습니다</p>
            <p className="text-gray-400 text-sm mb-6">
              첫 번째 여행을 기록하고 아름다운 지도를 만들어보세요
            </p>
            <button
              onClick={() => navigate('/map')}
              className="btn-primary"
            >
              여행 시작하기
            </button>
          </div>
        )}

        {/* 여행 카드 그리드 */}
        {!loading && trips.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trips.map(trip => (
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
  );
}
