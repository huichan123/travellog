// ========================================
// PhotoCard 컴포넌트
// 업로드된 사진 한 장을 카드 형태로 표시합니다.
// 시작/끝 선택 상태에 따라 테두리 색상이 변합니다.
// ========================================

import { TravelPhoto } from '../../types';
import { formatDateTime } from '../../utils/formatters';

type SelectionRole = 'start' | 'end' | 'in-range' | 'none';

interface PhotoCardProps {
  photo: TravelPhoto;
  role: SelectionRole;
  onClick: (photo: TravelPhoto) => void;
  index: number;
}

export default function PhotoCard({ photo, role, onClick, index }: PhotoCardProps) {
  const borderClass =
    role === 'start' ? 'ring-4 ring-blue-500 ring-offset-2' :
    role === 'end'   ? 'ring-4 ring-red-500 ring-offset-2' :
    role === 'in-range' ? 'ring-2 ring-sky-300' :
    'ring-1 ring-gray-200';

  const overlayLabel =
    role === 'start' ? { text: '시작', bg: 'bg-blue-500' } :
    role === 'end'   ? { text: '끝', bg: 'bg-red-500' } :
    null;

  return (
    <div
      className={`relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md bg-white ${borderClass}`}
      onClick={() => onClick(photo)}
    >
      {/* 사진 미리보기 */}
      <div className="relative aspect-square bg-gray-100">
        <img
          src={photo.imageUrl}
          alt={photo.fileName}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* 시작/끝 레이블 배지 */}
        {overlayLabel && (
          <div className={`absolute top-2 left-2 ${overlayLabel.bg} text-white text-xs font-bold px-2 py-0.5 rounded-full`}>
            {overlayLabel.text}
          </div>
        )}

        {/* 순서 번호 */}
        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs font-medium px-1.5 py-0.5 rounded-full">
          {index + 1}
        </div>

        {/* 범위 밖 사진 어둡게 */}
        {role === 'none' && (
          <div className="absolute inset-0 bg-black/30" />
        )}
      </div>

      {/* 메타데이터 */}
      <div className="p-2.5">
        {/* 촬영 시간 */}
        <p className="text-xs font-medium text-gray-700 truncate">
          {photo.takenAt ? formatDateTime(photo.takenAt) : '촬영 시간 없음'}
        </p>

        {/* 위치 정보 배지 */}
        <div className="flex items-center gap-1 mt-1">
          {photo.hasLocation ? (
            <span className="inline-flex items-center gap-0.5 text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
              </svg>
              GPS
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-full">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              위치 없음
            </span>
          )}
          <span className="text-xs text-gray-400 truncate max-w-[80px]" title={photo.fileName}>
            {photo.fileName}
          </span>
        </div>
      </div>
    </div>
  );
}
