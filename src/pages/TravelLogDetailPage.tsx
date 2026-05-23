// ========================================
// 여행 로그 상세 페이지
// 저장된 여행 로그의 지도, 사진 갤러리를 표시합니다.
// ========================================

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TravelLog, TravelPhoto, RoutePoint } from '../types';
import { getTravelLog, getUserTravelLogs, deleteTravelLog, updateTravelLogRouteColor, updateTravelLogPhoto } from '../services/travelLogService';
import { useAuth } from '../contexts/AuthContext';
import TravelLogMap from '../components/travellog/TravelLogMap';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { formatDate, formatDateTime } from '../utils/formatters';
import { buildRouteFromPhotos } from '../utils/routeUtils';

export default function TravelLogDetailPage() {
  const { logId } = useParams<{ logId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [log, setLog] = useState<TravelLog | null>(null);
  const [otherLogs, setOtherLogs] = useState<{ route: RoutePoint[]; color: string; photos: TravelPhoto[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lightboxPhoto, setLightboxPhoto] = useState<TravelPhoto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [routeColor, setRouteColor] = useState('#0ea5e9');
  const [colorSaved, setColorSaved] = useState(false);
  const [detailPhoto, setDetailPhoto] = useState<TravelPhoto | null>(null);
  const [editName, setEditName] = useState('');
  const [editComment, setEditComment] = useState('');
  const [savingDetail, setSavingDetail] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);

  const ROUTE_COLORS = [
    { value: '#0ea5e9', label: '하늘' },
    { value: '#3b82f6', label: '파랑' },
    { value: '#8b5cf6', label: '보라' },
    { value: '#ec4899', label: '핑크' },
    { value: '#ef4444', label: '빨강' },
    { value: '#f97316', label: '주황' },
    { value: '#22c55e', label: '초록' },
    { value: '#14b8a6', label: '청록' },
  ];

  useEffect(() => {
    const fetchLog = async () => {
      if (!logId) return;
      try {
        const uid = currentUser?.uid;
        const [data, allLogs] = await Promise.all([
          getTravelLog(logId),
          uid ? getUserTravelLogs(uid) : Promise.resolve([]),
        ]);
        if (!data) { setError('여행 로그를 찾을 수 없습니다.'); return; }
        setLog(data);
        if (data.routeColor) setRouteColor(data.routeColor);
        setOtherLogs(
          allLogs
            .filter(l => l.id !== logId)
            .map(l => ({
              route: buildRouteFromPhotos(l.photos),
              color: l.routeColor ?? '#94a3b8',
              photos: l.photos,
            }))
        );
      } catch {
        setError('여행 로그를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchLog();
  }, [logId, currentUser]);

  const handleOpenDetail = (photo: TravelPhoto) => {
    setDetailPhoto(photo);
    setEditName(photo.name ?? '');
    setEditComment(photo.comment ?? '');
  };

  const handleSaveDetail = async () => {
    if (!log || !detailPhoto) return;
    setSavingDetail(true);
    try {
      const updatedPhoto = { ...detailPhoto, name: editName.trim() || undefined, comment: editComment.trim() || undefined };
      const updatedPhotos = log.photos.map(p => p.id === detailPhoto.id ? updatedPhoto : p);
      await updateTravelLogPhoto(log.id!, updatedPhotos);
      setLog({ ...log, photos: updatedPhotos });
      setDetailPhoto(updatedPhoto);
    } catch {
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSavingDetail(false);
    }
  };

  const handleColorChange = async (color: string) => {
    if (!log) return;
    setRouteColor(color);
    setColorSaved(false);
    try {
      await updateTravelLogRouteColor(log.id!, color);
      setColorSaved(true);
      setTimeout(() => setColorSaved(false), 2000);
    } catch {
      // 실패해도 UI에는 반영
    }
  };

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
  // 저장된 route 대신 photos에서 재계산 → 필터링으로 누락된 포인트 복원
  const route = buildRouteFromPhotos(log.photos);

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
            onClick={() => setShowTimeline(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-600 text-xs font-semibold rounded-lg transition-colors"
            title="여행 로그 추출"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h8M4 18h8" />
            </svg>
            로그 추출
          </button>
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
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">이동 경로</h2>
            {/* 경로 색상 선택 */}
            <div className="flex items-center gap-1.5">
              {colorSaved && (
                <span className="text-xs text-emerald-500 font-medium">✓ 저장됨</span>
              )}
              <span className="text-xs text-gray-400 mr-1">경로 색상</span>
              {ROUTE_COLORS.map(c => (
                <button
                  key={c.value}
                  onClick={() => handleColorChange(c.value)}
                  title={c.label}
                  className="w-5 h-5 rounded-full transition-transform hover:scale-110 focus:outline-none"
                  style={{
                    backgroundColor: c.value,
                    boxShadow: routeColor === c.value
                      ? `0 0 0 2px white, 0 0 0 4px ${c.value}`
                      : '0 1px 3px rgba(0,0,0,0.2)',
                  }}
                />
              ))}
            </div>
          </div>
          <TravelLogMap
            photos={log.photos}
            route={route}
            height="400px"
            strokeColor={routeColor}
            onPhotoDetail={handleOpenDetail}
            otherLogs={otherLogs}
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
            <p className="text-2xl font-bold text-gray-700">{route.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">경로 포인트</p>
          </div>
        </div>

        {/* 사진 갤러리 (시간순) */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-3">사진 타임라인</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {log.photos.map((photo, i) => (
              <div key={photo.id} className="flex flex-col gap-1">
                <div
                  className="relative cursor-pointer group rounded-xl overflow-hidden aspect-square bg-gray-100 hover:scale-[1.02] transition-transform shadow-sm"
                  onClick={() => setLightboxPhoto(photo)}
                >
                  <img
                    src={photo.imageUrl}
                    alt={photo.name || photo.fileName}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  <div className="absolute top-1.5 right-1.5 bg-black/50 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                    {i + 1}
                  </div>
                  {photo.hasLocation && (
                    <div className="absolute bottom-1.5 left-1.5 bg-emerald-500/90 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                      GPS
                    </div>
                  )}
                  {/* 편집 버튼 */}
                  <button
                    onClick={e => { e.stopPropagation(); handleOpenDetail(photo); }}
                    className="absolute bottom-1.5 right-1.5 bg-white/80 hover:bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                    title="이름·코멘트 편집"
                  >
                    <svg className="w-3 h-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
                {/* 사진 이름 */}
                <p
                  className="text-[11px] text-center text-gray-500 truncate px-1 cursor-pointer hover:text-sky-500 transition-colors"
                  title={photo.name || photo.fileName}
                  onClick={() => handleOpenDetail(photo)}
                >
                  {photo.name || photo.fileName}
                </p>
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

      {/* 사진 상세 편집 패널 */}
      {detailPhoto && (
        <>
          {/* 반투명 배경 */}
          <div
            className="fixed inset-0 bg-black/20 z-[55]"
            onClick={() => setDetailPhoto(null)}
          />
          {/* 오른쪽 슬라이드 패널 */}
          <div className="fixed top-0 right-0 bottom-0 w-full sm:w-[360px] bg-white shadow-2xl z-[60] flex flex-col">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">사진 편집</h3>
              <button
                onClick={() => setDetailPhoto(null)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 사진 */}
            <div className="w-full aspect-video bg-black flex-shrink-0">
              <img
                src={detailPhoto.imageUrl}
                alt={detailPhoto.name || detailPhoto.fileName}
                className="w-full h-full object-contain"
              />
            </div>

            {/* 폼 영역 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* 사진 이름 */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">사진 이름</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder={detailPhoto.fileName}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveDetail(); }}
                />
              </div>

              {/* 코멘트 */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">코멘트</label>
                <textarea
                  value={editComment}
                  onChange={e => setEditComment(e.target.value)}
                  placeholder="이 사진에 대한 메모를 입력하세요..."
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent resize-none"
                />
              </div>

              {/* 메타데이터 */}
              <div className="space-y-1.5 pt-1">
                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                  <span>📅</span>
                  {detailPhoto.takenAt ? formatDateTime(detailPhoto.takenAt) : '촬영 시간 없음'}
                </p>
                {detailPhoto.hasLocation && (
                  <p className="text-xs text-gray-400 flex items-center gap-1.5">
                    <span>📍</span>
                    {detailPhoto.latitude?.toFixed(5)}, {detailPhoto.longitude?.toFixed(5)}
                  </p>
                )}
                <p className="text-xs text-gray-300 truncate">{detailPhoto.fileName}</p>
              </div>
            </div>

            {/* 저장 버튼 */}
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={handleSaveDetail}
                disabled={savingDetail}
                className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-medium text-sm rounded-xl transition-colors"
              >
                {savingDetail ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* 여행 로그 타임라인 패널 */}
      {showTimeline && (() => {
        const sorted = [...log.photos].sort((a, b) => {
          if (!a.takenAt && !b.takenAt) return 0;
          if (!a.takenAt) return 1;
          if (!b.takenAt) return -1;
          return a.takenAt.getTime() - b.takenAt.getTime();
        });
        let lastDateStr = '';
        return (
          <>
            <div className="fixed inset-0 bg-black/30 z-[55]" onClick={() => setShowTimeline(false)} />
            <div className="fixed top-0 right-0 bottom-0 w-full sm:w-[400px] bg-gray-50 shadow-2xl z-[60] flex flex-col">
              {/* 헤더 */}
              <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0">
                <div>
                  <h3 className="font-bold text-gray-800">{log.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(log.createdAt)} · {sorted.length}장</p>
                </div>
                <button
                  onClick={() => setShowTimeline(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 피드 */}
              <div className="flex-1 overflow-y-auto">
                {sorted.map((photo) => {
                  const dateStr = photo.takenAt
                    ? photo.takenAt.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })
                    : '';
                  const showDateSep = dateStr && dateStr !== lastDateStr;
                  if (showDateSep) lastDateStr = dateStr;

                  return (
                    <div key={photo.id}>
                      {showDateSep && (
                        <div className="flex items-center gap-3 px-4 py-3 mt-2">
                          <div className="flex-1 h-px bg-gray-200" />
                          <span className="text-xs font-semibold text-gray-400 whitespace-nowrap">{dateStr}</span>
                          <div className="flex-1 h-px bg-gray-200" />
                        </div>
                      )}

                      {/* 카드 */}
                      <div className="mx-3 mb-3 bg-white rounded-2xl overflow-hidden shadow-sm">
                        {/* 사진 */}
                        <div
                          className="w-full aspect-square bg-gray-100 cursor-pointer"
                          onClick={() => setLightboxPhoto(photo)}
                        >
                          <img
                            src={photo.imageUrl}
                            alt={photo.name || photo.fileName}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>

                        {/* 정보 영역 */}
                        <div className="px-3.5 py-3 space-y-1.5">
                          {/* 시간 */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">
                              {photo.takenAt
                                ? photo.takenAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
                                : '시간 없음'}
                            </span>
                            {photo.hasLocation && (
                              <span className="text-[10px] bg-emerald-50 text-emerald-600 font-medium px-1.5 py-0.5 rounded-full">
                                📍 GPS
                              </span>
                            )}
                          </div>

                          {/* 이름 */}
                          {photo.name && (
                            <p className="text-sm font-semibold text-gray-800">{photo.name}</p>
                          )}

                          {/* 코멘트/메모 */}
                          {photo.comment ? (
                            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{photo.comment}</p>
                          ) : (
                            <p className="text-xs text-gray-300 italic">메모 없음</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="h-8" />
              </div>
            </div>
          </>
        );
      })()}

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
