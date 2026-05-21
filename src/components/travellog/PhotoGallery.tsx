// ========================================
// PhotoGallery 컴포넌트
// 업로드된 사진들을 시간순 그리드로 표시하고
// 시작/끝 사진 선택을 관리합니다.
// ========================================

import { useCallback } from 'react';
import { TravelPhoto } from '../../types';
import PhotoCard from './PhotoCard';

interface PhotoGalleryProps {
  photos: TravelPhoto[];          // 시간순 정렬된 사진 배열
  startPhotoId: string | null;
  endPhotoId: string | null;
  selectionMode: 'start' | 'end' | null;
  onPhotoClick: (photo: TravelPhoto) => void;
}

export default function PhotoGallery({
  photos,
  startPhotoId,
  endPhotoId,
  selectionMode,
  onPhotoClick,
}: PhotoGalleryProps) {
  const getRole = useCallback((photo: TravelPhoto) => {
    if (photo.id === startPhotoId) return 'start' as const;
    if (photo.id === endPhotoId) return 'end' as const;

    // 시작/끝이 모두 선택된 경우 범위 내/외 표시
    if (startPhotoId && endPhotoId) {
      const startPhoto = photos.find(p => p.id === startPhotoId);
      const endPhoto = photos.find(p => p.id === endPhotoId);
      if (startPhoto?.takenAt && endPhoto?.takenAt && photo.takenAt) {
        const t = photo.takenAt.getTime();
        const start = startPhoto.takenAt.getTime();
        const end = endPhoto.takenAt.getTime();
        if (t >= start && t <= end) return 'in-range' as const;
        return 'none' as const;
      }
    }

    return 'in-range' as const;
  }, [photos, startPhotoId, endPhotoId]);

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <div className="text-5xl mb-3">📷</div>
        <p className="text-sm">사진을 업로드해주세요</p>
      </div>
    );
  }

  const locationCount = photos.filter(p => p.hasLocation).length;

  return (
    <div>
      {/* 요약 정보 */}
      <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
        <span>{photos.length}장</span>
        <span>·</span>
        <span className="text-emerald-600">{locationCount}장 GPS 있음</span>
        <span>·</span>
        <span className="text-gray-400">{photos.length - locationCount}장 GPS 없음</span>
      </div>

      {/* 선택 안내 */}
      {selectionMode && (
        <div className={`mb-3 px-3 py-2 rounded-lg text-xs font-medium ${
          selectionMode === 'start'
            ? 'bg-blue-50 text-blue-700 border border-blue-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {selectionMode === 'start'
            ? '📍 여행 시작 사진을 선택해주세요'
            : '🏁 여행 끝 사진을 선택해주세요'}
        </div>
      )}

      {/* 사진 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {photos.map((photo, i) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            role={getRole(photo)}
            onClick={onPhotoClick}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
