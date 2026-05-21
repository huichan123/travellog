// ========================================
// 지도 페이지
// 핵심 기능 페이지입니다.
// - 지도 표시 (전체 화면)
// - Start Log / End Log 버튼
// - 사진 업로드 버튼
// - 사진 타임라인 (하단)
// - GPS 위치 추적
// ========================================

import { useState } from 'react';
import { useTrip } from '../contexts/TripContext';
import MapView from '../components/map/MapView';
import TripTimeline from '../components/trips/TripTimeline';
import PhotoUpload from '../components/photos/PhotoUpload';
import PhotoDetail from '../components/photos/PhotoDetail';
import { Photo } from '../types';

export default function MapPage() {
  const {
    activeTrip,
    isTracking,
    currentLocation,
    gpsError,
    startTrip,
    stopTrip,
  } = useTrip();

  const [showStartModal, setShowStartModal] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [tripTitle, setTripTitle] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [startLoading, setStartLoading] = useState(false);
  const [stopLoading, setStopLoading] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // 여행 시작 처리
  const handleStartTrip = async () => {
    if (!tripTitle.trim()) return;
    setStartLoading(true);
    try {
      await startTrip(tripTitle.trim());
      setShowStartModal(false);
      setTripTitle('');
    } catch (error) {
      console.error('여행 시작 실패:', error);
    } finally {
      setStartLoading(false);
    }
  };

  // 여행 종료 처리
  const handleStopTrip = async () => {
    setStopLoading(true);
    try {
      await stopTrip();
      setShowEndConfirm(false);
    } catch (error) {
      console.error('여행 종료 실패:', error);
    } finally {
      setStopLoading(false);
    }
  };

  // 표시할 사진과 위치 데이터
  const photos = activeTrip?.photos || [];
  const locations = activeTrip?.locations || [];

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* GPS 오류 배너 */}
      {gpsError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex items-center gap-2 text-sm text-red-700">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {gpsError}
        </div>
      )}

      {/* 지도 영역 (메인) */}
      <div className="flex-1 relative p-3 pb-0">
        <MapView
          photos={photos}
          locations={locations}
          currentLocation={currentLocation}
          centerOnUser={isTracking}
        />

        {/* 지도 위에 떠있는 컨트롤 패널 */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10">
          {/* 사진 추가 버튼 (여행 중일 때만) */}
          {isTracking && (
            <button
              onClick={() => setShowPhotoUpload(true)}
              className="bg-white rounded-full shadow-lg p-3 hover:shadow-xl transition-all hover:scale-105 active:scale-95"
              title="사진 추가"
            >
              <svg className="w-6 h-6 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}

          {/* Start / End Log 버튼 */}
          {!isTracking ? (
            <button
              onClick={() => setShowStartModal(true)}
              className="bg-sky-500 text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:bg-sky-600 transition-all hover:shadow-xl active:scale-95 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Start Log
            </button>
          ) : (
            <button
              onClick={() => setShowEndConfirm(true)}
              className="bg-red-500 text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:bg-red-600 transition-all hover:shadow-xl active:scale-95 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              End Log
            </button>
          )}

          {/* 현재 위치 버튼 */}
          {currentLocation && (
            <button
              onClick={() => {/* MapView에서 처리 */}}
              className="bg-white rounded-full shadow-lg p-3 hover:shadow-xl transition-all"
              title="현재 위치로 이동"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}
        </div>

        {/* 여행 중 상태 표시 */}
        {isTracking && activeTrip && (
          <div className="absolute top-4 left-4 right-4 z-10 pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-sm inline-flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                {activeTrip.title}
              </span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-500">{photos.length}장</span>
            </div>
          </div>
        )}
      </div>

      {/* 하단 타임라인 (사진이 있을 때만 표시) */}
      {photos.length > 0 && (
        <div className="h-24 bg-white border-t border-gray-100 px-3">
          <TripTimeline
            photos={photos}
            onPhotoClick={setSelectedPhoto}
            selectedPhoto={selectedPhoto}
          />
        </div>
      )}

      {/* ─── 모달들 ─────────────────────────────────────────────────────── */}

      {/* 여행 시작 모달 */}
      {showStartModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 animate-slide-up">
            <h3 className="text-lg font-bold text-gray-800 mb-4">새 여행 시작</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">여행 제목</label>
              <input
                type="text"
                value={tripTitle}
                onChange={e => setTripTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleStartTrip()}
                className="input-field"
                placeholder="예: 제주도 여행, 서울 나들이..."
                autoFocus
                maxLength={50}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowStartModal(false)}
                className="btn-secondary flex-1"
              >
                취소
              </button>
              <button
                onClick={handleStartTrip}
                disabled={!tripTitle.trim() || startLoading}
                className="btn-primary flex-1"
              >
                {startLoading ? '시작 중...' : 'Start Log'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 여행 종료 확인 모달 */}
      {showEndConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 animate-fade-in">
            <h3 className="text-lg font-bold text-gray-800 mb-2">여행을 종료할까요?</h3>
            <p className="text-gray-500 text-sm mb-6">
              지금까지 기록된 경로와 사진이 저장됩니다.
              {activeTrip && (
                <span className="block mt-1 text-gray-700 font-medium">
                  📸 {photos.length}장 · 📍 {locations.length}개 위치
                </span>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="btn-secondary flex-1"
              >
                계속하기
              </button>
              <button
                onClick={handleStopTrip}
                disabled={stopLoading}
                className="btn-danger flex-1"
              >
                {stopLoading ? '저장 중...' : 'End Log'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 사진 업로드 모달 */}
      {showPhotoUpload && (
        <PhotoUpload onClose={() => setShowPhotoUpload(false)} />
      )}

      {/* 사진 상세 모달 */}
      {selectedPhoto && (
        <PhotoDetail
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </div>
  );
}
