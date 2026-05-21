// ========================================
// 사진 타임라인 컴포넌트
// 여행 중 찍은 사진들을 시간 순서대로 가로로 나열합니다
// 지도 하단에 표시됩니다
// ========================================

import { Photo } from '../../types';
import { formatTime } from '../../utils/formatters';

interface TripTimelineProps {
  photos: Photo[];
  onPhotoClick: (photo: Photo) => void;
  selectedPhoto?: Photo | null;
}

export default function TripTimeline({
  photos,
  onPhotoClick,
  selectedPhoto,
}: TripTimelineProps) {
  if (photos.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        사진을 추가하면 타임라인에 표시됩니다
      </div>
    );
  }

  // 시간순 정렬
  const sortedPhotos = [...photos].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  return (
    <div className="flex gap-3 overflow-x-auto h-full items-center px-2 pb-1">
      {sortedPhotos.map((photo, index) => (
        <div key={photo.id || index} className="flex-shrink-0 text-center">
          {/* 사진 썸네일 */}
          <button
            onClick={() => onPhotoClick(photo)}
            className={`relative block rounded-xl overflow-hidden transition-all duration-200
              ${selectedPhoto?.id === photo.id
                ? 'ring-2 ring-sky-500 ring-offset-2 scale-105'
                : 'hover:scale-105 hover:shadow-lg'
              }`}
          >
            <img
              src={photo.imageUrl}
              alt={`사진 ${index + 1}`}
              className="w-16 h-16 object-cover"
            />
            {/* 사진 번호 배지 */}
            <div className="absolute top-1 left-1 bg-black/50 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {index + 1}
            </div>
          </button>
          {/* 촬영 시간 */}
          <p className="text-xs text-gray-400 mt-1">
            {formatTime(photo.timestamp)}
          </p>
        </div>
      ))}
    </div>
  );
}
