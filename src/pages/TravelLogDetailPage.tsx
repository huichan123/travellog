// ========================================
// 여행 로그 상세 페이지
// 저장된 여행 로그의 지도, 사진 갤러리를 표시합니다.
// ========================================

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TravelLog, TravelPhoto } from '../types';
import { getTravelLog, deleteTravelLog } from '../services/travelLogService';
import { useAuth } from '../contexts/AuthContext';
import TravelLogMap from '../components/travellog/TravelLogMap';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { formatDate, formatDateTime } from '../utils/formatters';

export default function TravelLogDetailPage() {
  const { logId } = useParams<{ logId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [log, setLog] = useState<TravelLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lightboxPhoto, setLightboxPhoto] = useState<TravelPhoto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchLog = async () => {
      if (!logId) return;
      try {
        const data = await getTravelLog(logId);
        if (!data) { setError('여행 로그를 찾을 수 없습니다.'); return; }
        setLog(data);
      } catch {
        setError('여행 로그를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchLog();
  }, [logId]);

  const handleDelete = async () => {
    if (!log || !currentUser) return;
    setDeleting(true);
    try {
      await deleteTravelLog(currentUser.uid, log.id!, log.photos);
      navigate('/trips');
    } catch {
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <LoadingSpinner message="여행 로그를 불러오는 중..." size="lg" />
      </div>
    );
  }

  if (error || !log) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] gap-4">
        <p className="text-gray-600">{error || '로그를 찾을 수 없습니다'}</p>
        <button onClick={() => navigate('/trips')} className="btn-secondary">목록으로</button>
      </div>
    );
  }

  const locationCount = log.photos.filter(p => p.hasLocation).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 헤더 */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate('/trips')}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-800 truncate">{log.title}</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {formatDate(log.createdAt)} · {log.photoCount}장 · GPS {locationCount}장
            </p>
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-gray-400 hover:text-red-500"
            title="삭제"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4 space-y-4">
        {/* 지도 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-3">이동 경로</h2>
          <TravelLogMap
            photos={log.photos}
            route={log.route}
            height="400px"
          />
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <p className="text-2xl font-bold text-sky-500">{log.photoCount}</p>
            <p className="text-xs text-gray-400 mt-0.5">전체 사진</p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <p className="text-2xl font-bold text-emerald-500">{locationCount}</p>
            <p className="text-xs text-gray-400 mt-0.5">GPS 사진</p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <p className="text-2xl font-bold text-gray-700">{log.route.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">경로 포인트</p>
          </div>
        </div>

        {/* 사진 갤러리 (시간순) */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-3">사진 타임라인</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {log.photos.map((photo, i) => (
              <div
                key={photo.id}
                className="relative cursor-pointer group rounded-xl overflow-hidden aspect-square bg-gray-100 hover:scale-[1.02] transition-transform shadow-sm"
                onClick={() => setLightboxPhoto(photo)}
              >
                <img
                  src={photo.imageUrl}
                  alt={photo.fileName}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* 호버 오버레이 */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

                {/* 순서 번호 */}
                <div className="absolute top-1.5 right-1.5 bg-black/50 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                  {i + 1}
                </div>

                {/* GPS 배지 */}
                {photo.hasLocation && (
                  <div className="absolute bottom-1.5 left-1.5 bg-emerald-500/90 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    GPS
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 사진 라이트박스 */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="bg-white rounded-2xl overflow-hidden max-w-lg w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={lightboxPhoto.imageUrl}
              alt={lightboxPhoto.fileName}
              className="w-full max-h-[60vh] object-contain bg-black"
            />
            <div className="p-4">
              <p className="text-sm font-medium text-gray-800">
                {lightboxPhoto.takenAt ? formatDateTime(lightboxPhoto.takenAt) : '촬영 시간 없음'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{lightboxPhoto.fileName}</p>
              {lightboxPhoto.hasLocation && (
                <p className="text-xs text-emerald-600 mt-1">
                  📍 {lightboxPhoto.latitude?.toFixed(5)}, {lightboxPhoto.longitude?.toFixed(5)}
                </p>
              )}
            </div>
            <div className="px-4 pb-4">
              <button onClick={() => setLightboxPhoto(null)} className="btn-secondary w-full">닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-gray-800 mb-2">여행 로그 삭제</h3>
            <p className="text-sm text-gray-500 mb-6">
              <span className="font-medium text-gray-700">"{log.title}"</span>을 삭제하시겠습니까?<br />
              이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary flex-1">취소</button>
              <button onClick={handleDelete} disabled={deleting} className="btn-danger flex-1">
                {deleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
