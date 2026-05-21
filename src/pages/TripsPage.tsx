// ========================================
// 여행 기록 목록 페이지
// 사용자가 저장한 모든 여행 기록을 표시합니다
// ========================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserTrips } from '../services/tripService';
import { getUserTravelLogs } from '../services/travelLogService';
import { Trip, TravelLog } from '../types';
import TripCard from '../components/trips/TripCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { formatDate } from '../utils/formatters';

export default function TripsPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [travelLogs, setTravelLogs] = useState<TravelLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'realtime' | 'photo'>('realtime');

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      try {
        const [tripsData, logsData] = await Promise.all([
          getUserTrips(currentUser.uid),
          getUserTravelLogs(currentUser.uid),
        ]);
        setTrips(tripsData);
        setTravelLogs(logsData);
      } catch {
        setError('기록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser]);

  const isEmpty = activeTab === 'realtime' ? trips.length === 0 : travelLogs.length === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">여행 기록</h1>
          </div>
          <div className="flex gap-2">
            {activeTab === 'realtime' ? (
              <button onClick={() => navigate('/map')} className="btn-primary text-sm">
                새 여행 시작
              </button>
            ) : (
              <button onClick={() => navigate('/travel-logs/new')} className="btn-primary text-sm flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                새 여행 로그 만들기
              </button>
            )}
          </div>
        </div>

        {/* 탭 */}
        <div className="flex bg-white rounded-xl shadow-sm p-1 mb-5 border border-gray-100">
          <button
            onClick={() => setActiveTab('photo')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'photo'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📷 사진 여행 로그
            {travelLogs.length > 0 && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === 'photo' ? 'bg-white/20' : 'bg-gray-100 text-gray-500'
              }`}>
                {travelLogs.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('realtime')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'realtime'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📍 실시간 기록
            {trips.length > 0 && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === 'realtime' ? 'bg-white/20' : 'bg-gray-100 text-gray-500'
              }`}>
                {trips.length}
              </span>
            )}
          </button>
        </div>

        {/* 로딩 */}
        {loading && (
          <div className="flex justify-center py-16">
            <LoadingSpinner message="기록을 불러오는 중..." />
          </div>
        )}

        {/* 에러 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* 빈 상태 */}
        {!loading && !error && isEmpty && (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
            {activeTab === 'photo' ? (
              <>
                <div className="text-6xl mb-4">📷</div>
                <p className="text-gray-700 font-semibold text-lg mb-2">사진 여행 로그가 없습니다</p>
                <p className="text-gray-400 text-sm mb-6">
                  아이폰 사진을 업로드하면 GPS 정보로 자동 경로를 만들어드려요
                </p>
                <button onClick={() => navigate('/travel-logs/new')} className="btn-primary">
                  새 여행 로그 만들기
                </button>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">🌏</div>
                <p className="text-gray-700 font-semibold text-lg mb-2">실시간 여행 기록이 없습니다</p>
                <p className="text-gray-400 text-sm mb-6">
                  GPS로 이동 경로를 실시간으로 기록하고 사진을 추가해보세요
                </p>
                <button onClick={() => navigate('/map')} className="btn-primary">
                  여행 시작하기
                </button>
              </>
            )}
          </div>
        )}

        {/* 사진 여행 로그 그리드 */}
        {!loading && activeTab === 'photo' && travelLogs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {travelLogs.map(log => (
              <div
                key={log.id}
                className="bg-white rounded-2xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow border border-gray-100"
                onClick={() => navigate(`/travel-logs/${log.id}`)}
              >
                {/* 커버 이미지 */}
                <div className="aspect-video bg-gray-100 overflow-hidden">
                  {log.coverImageUrl ? (
                    <img
                      src={log.coverImageUrl}
                      alt={log.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">📷</div>
                  )}
                </div>
                {/* 정보 */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 truncate">{log.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(log.createdAt)}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span>📷 {log.photoCount}장</span>
                    <span>·</span>
                    <span className="text-emerald-600">📍 {log.locationCount}장 GPS</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 실시간 여행 카드 그리드 */}
        {!loading && activeTab === 'realtime' && trips.length > 0 && (
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
