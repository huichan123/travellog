// ========================================
// 여행 카드 컴포넌트
// 여행 목록 페이지에서 각 여행을 카드 형태로 표시합니다
// ========================================

import { Trip } from '../../types';
import { formatDate, formatDistance } from '../../utils/formatters';

interface TripCardProps {
  trip: Trip;
  onClick: () => void;
}

export default function TripCard({ trip, onClick }: TripCardProps) {
  return (
    <button
      onClick={onClick}
      className="card w-full text-left hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 group"
    >
      {/* 대표 사진 */}
      <div className="relative h-40 bg-gradient-to-br from-sky-100 to-navy-100 overflow-hidden">
        {trip.coverImageUrl ? (
          <img
            src={trip.coverImageUrl}
            alt={trip.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-sky-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        )}

        {/* 진행 중 배지 */}
        {trip.isActive && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse inline-block"></span>
            기록 중
          </div>
        )}
      </div>

      {/* 여행 정보 */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 truncate">{trip.title}</h3>
        <p className="text-sm text-gray-400 mt-0.5">{formatDate(trip.startTime)}</p>

        {/* 통계 */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <svg className="w-3.5 h-3.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            </svg>
            <span>{trip.photoCount}장</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <svg className="w-3.5 h-3.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span>{formatDistance(trip.totalDistance)}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
