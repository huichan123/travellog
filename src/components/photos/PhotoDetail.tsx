// ========================================
// 사진 상세 팝업 컴포넌트
// 사진 마커를 클릭했을 때 표시되는 팝업입니다
// 큰 사진, 촬영 시간, 위치 정보, 메모를 보여줍니다
// ========================================

import { Photo } from '../../types';
import { formatDateTime } from '../../utils/formatters';

interface PhotoDetailProps {
  photo: Photo;
  onClose: () => void;
}

export default function PhotoDetail({ photo, onClose }: PhotoDetailProps) {
  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose} // 배경 클릭 시 닫기
    >
      <div
        className="bg-white rounded-2xl overflow-hidden max-w-sm w-full max-h-[90vh] flex flex-col animate-fade-in"
        onClick={e => e.stopPropagation()} // 카드 내부 클릭은 닫히지 않음
      >
        {/* 사진 */}
        <div className="relative">
          <img
            src={photo.imageUrl}
            alt="여행 사진"
            className="w-full object-cover max-h-64"
          />
          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm rounded-full p-1.5 hover:bg-black/60 transition-colors"
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 사진 정보 */}
        <div className="p-4 overflow-y-auto">
          {/* 촬영 시간 */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <svg className="w-4 h-4 text-sky-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{formatDateTime(photo.timestamp)}</span>
          </div>

          {/* 위치 정보 */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
            <svg className="w-4 h-4 text-sky-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>
              {photo.lat.toFixed(5)}, {photo.lng.toFixed(5)}
              {photo.exifUsed && (
                <span className="ml-1 text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full">
                  EXIF
                </span>
              )}
            </span>
          </div>

          {/* 메모 */}
          {photo.memo && (
            <div className="mt-2 p-3 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-700 leading-relaxed">{photo.memo}</p>
            </div>
          )}

          {/* 지도에서 보기 링크 (Google Maps 외부 링크) */}
          <a
            href={`https://maps.google.com/?q=${photo.lat},${photo.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center gap-1 text-xs text-sky-500 hover:text-sky-600"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Google Maps에서 보기
          </a>
        </div>
      </div>
    </div>
  );
}
