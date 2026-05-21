// ========================================
// 여행 로그 생성 페이지
// 1. 사진 업로드 → EXIF 추출
// 2. 시작/끝 사진 선택
// 3. 지도 미리보기
// 4. 저장
// ========================================

import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TravelPhoto } from '../types';
import { extractTravelPhotoMetadata } from '../utils/exifReader';
import {
  sortPhotosByTime,
  filterPhotosByRange,
  buildRouteFromPhotos,
  filterOutlierPoints,
} from '../utils/routeUtils';
import {
  saveTravelLog,
  uploadTravelPhoto,
} from '../services/travelLogService';
import PhotoGallery from '../components/travellog/PhotoGallery';
import TravelLogMap from '../components/travellog/TravelLogMap';
import LoadingSpinner from '../components/ui/LoadingSpinner';

type SelectionMode = 'start' | 'end' | null;

export default function CreateTravelLogPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [photos, setPhotos] = useState<TravelPhoto[]>([]);
  const [startPhotoId, setStartPhotoId] = useState<string | null>(null);
  const [endPhotoId, setEndPhotoId] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState('');
  const [rangeError, setRangeError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileMapRef = useRef<Map<string, File>>(new Map());

  // 범위 안에 있는 사진들 (지도/저장에 사용)
  const rangePhotos = startPhotoId && endPhotoId
    ? filterPhotosByRange(photos, startPhotoId, endPhotoId)
    : photos;

  const routePoints = filterOutlierPoints(buildRouteFromPhotos(rangePhotos));
  const locationCount = rangePhotos.filter(p => p.hasLocation).length;

  // ─── 사진 업로드 처리 ──────────────────────────────────────────────────────

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const newPhotos = await Promise.all(
        files.map(async (file, i) => {
          const id = `photo_${Date.now()}_${i}`;
          fileMapRef.current.set(id, file);
          return extractTravelPhotoMetadata(file, id);
        })
      );
      setPhotos(prev => sortPhotosByTime([...prev, ...newPhotos]));
    } finally {
      setUploading(false);
      // 같은 파일 재업로드 가능하도록 초기화
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, []);

  // ─── 사진 카드 클릭 처리 ───────────────────────────────────────────────────

  const handlePhotoClick = useCallback((photo: TravelPhoto) => {
    if (!selectionMode) return;
    setRangeError('');

    if (selectionMode === 'start') {
      // 시작이 끝보다 늦으면 경고
      if (endPhotoId) {
        const endPhoto = photos.find(p => p.id === endPhotoId);
        if (photo.takenAt && endPhoto?.takenAt && photo.takenAt > endPhoto.takenAt) {
          setRangeError('시작 사진이 끝 사진보다 늦습니다. 다시 선택해주세요.');
          setSelectionMode(null);
          return;
        }
      }
      setStartPhotoId(photo.id);
    } else {
      // 끝이 시작보다 빠르면 경고
      if (startPhotoId) {
        const startPhoto = photos.find(p => p.id === startPhotoId);
        if (photo.takenAt && startPhoto?.takenAt && photo.takenAt < startPhoto.takenAt) {
          setRangeError('끝 사진이 시작 사진보다 빠릅니다. 다시 선택해주세요.');
          setSelectionMode(null);
          return;
        }
      }
      setEndPhotoId(photo.id);
    }
    setSelectionMode(null);
  }, [selectionMode, startPhotoId, endPhotoId, photos]);

  // ─── 저장 처리 ─────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!currentUser || !title.trim() || rangePhotos.length === 0) return;

    setSaving(true);
    try {
      // Firestore 문서 ID를 미리 생성해서 Storage 경로에 사용
      const logRef = doc(collection(db, 'travelLogs'));
      const logId = logRef.id;

      // 사진을 Firebase Storage에 업로드하고 Storage URL로 교체
      setSaveProgress(`사진 업로드 중... (0 / ${rangePhotos.length})`);
      let uploaded = 0;
      const uploadedPhotos = await Promise.all(
        rangePhotos.map(async (photo) => {
          const file = fileMapRef.current.get(photo.id);
          if (file) {
            const storageUrl = await uploadTravelPhoto(currentUser.uid, logId, photo.id, file);
            uploaded++;
            setSaveProgress(`사진 업로드 중... (${uploaded} / ${rangePhotos.length})`);
            return { ...photo, imageUrl: storageUrl };
          }
          return photo;
        })
      );

      setSaveProgress('여행 로그 저장 중...');
      await saveTravelLog(currentUser.uid, {
        userId: currentUser.uid,
        title: title.trim(),
        startPhotoId: startPhotoId ?? rangePhotos[0].id,
        endPhotoId: endPhotoId ?? rangePhotos[rangePhotos.length - 1].id,
        photos: uploadedPhotos,
        route: routePoints,
        coverImageUrl: uploadedPhotos[0]?.imageUrl,
        photoCount: uploadedPhotos.length,
        locationCount,
      }, logId);

      navigate(`/travel-logs/${logId}`);
    } catch (err) {
      console.error('저장 실패:', err);
      alert('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
      setSaveProgress('');
    }
  };

  // ─── 렌더링 ────────────────────────────────────────────────────────────────

  const canSave = title.trim() && rangePhotos.length > 0 && !saving;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 헤더 */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate('/trips')}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="font-bold text-gray-800 flex-1">새 여행 로그 만들기</h1>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="btn-primary text-sm"
          >
            {saving ? (saveProgress || '저장 중...') : '여행 로그 저장'}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
        {/* 여행 제목 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">여행 제목</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="input-field"
            placeholder="예: 제주도 3박 4일, 서울 봄 나들이..."
            maxLength={60}
          />
        </div>

        {/* 사진 업로드 버튼 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">사진 업로드</h2>
            {photos.length > 0 && (
              <span className="text-xs text-gray-400">{photos.length}장 업로드됨</span>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full border-2 border-dashed border-gray-300 hover:border-sky-400 rounded-xl py-6 text-center transition-colors group"
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2 text-sky-500">
                <LoadingSpinner size="sm" />
                <span className="text-sm">EXIF 메타데이터 읽는 중...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-sky-500 transition-colors">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-medium">사진 선택하기</span>
                <span className="text-xs">아이폰 원본 사진의 GPS 정보를 자동으로 읽습니다</span>
              </div>
            )}
          </button>
        </div>

        {/* 범위 오류 */}
        {rangeError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            ⚠️ {rangeError}
          </div>
        )}

        {/* 메인 콘텐츠: 갤러리 + 지도 */}
        {photos.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 왼쪽: 갤러리 + 선택 컨트롤 */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              {/* 시작/끝 선택 컨트롤 */}
              <div className="mb-4">
                <h2 className="font-semibold text-gray-800 mb-2">여행 범위 선택</h2>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectionMode(selectionMode === 'start' ? null : 'start')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      selectionMode === 'start'
                        ? 'bg-blue-500 text-white border-blue-500'
                        : startPhotoId
                          ? 'bg-blue-50 text-blue-700 border-blue-300'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-blue-400 flex-shrink-0" />
                    {startPhotoId
                      ? photos.find(p => p.id === startPhotoId)?.takenAt
                        ? `시작: ${photos.find(p => p.id === startPhotoId)!.takenAt!.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`
                        : '시작 선택됨'
                      : '시작 사진 선택'}
                  </button>

                  <button
                    onClick={() => setSelectionMode(selectionMode === 'end' ? null : 'end')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      selectionMode === 'end'
                        ? 'bg-red-500 text-white border-red-500'
                        : endPhotoId
                          ? 'bg-red-50 text-red-700 border-red-300'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-red-50 hover:border-red-300 hover:text-red-700'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-red-400 flex-shrink-0" />
                    {endPhotoId
                      ? photos.find(p => p.id === endPhotoId)?.takenAt
                        ? `끝: ${photos.find(p => p.id === endPhotoId)!.takenAt!.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`
                        : '끝 선택됨'
                      : '끝 사진 선택'}
                  </button>
                </div>

                {startPhotoId && endPhotoId && (
                  <div className="mt-2 px-3 py-1.5 bg-sky-50 rounded-lg text-xs text-sky-700">
                    ✅ {rangePhotos.length}장이 이 여행 로그에 포함됩니다
                    {locationCount < 2 && (
                      <span className="block mt-0.5 text-amber-600">
                        ⚠️ 경로를 만들기에는 위치 정보가 부족합니다 (GPS: {locationCount}장)
                      </span>
                    )}
                  </div>
                )}

                {(startPhotoId || endPhotoId) && (
                  <button
                    onClick={() => { setStartPhotoId(null); setEndPhotoId(null); setRangeError(''); }}
                    className="mt-2 text-xs text-gray-400 hover:text-gray-600 underline"
                  >
                    선택 초기화
                  </button>
                )}
              </div>

              {/* 갤러리 */}
              <div className="overflow-y-auto" style={{ maxHeight: '60vh' }}>
                <PhotoGallery
                  photos={photos}
                  startPhotoId={startPhotoId}
                  endPhotoId={endPhotoId}
                  selectionMode={selectionMode}
                  onPhotoClick={handlePhotoClick}
                />
              </div>
            </div>

            {/* 오른쪽: 지도 */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h2 className="font-semibold text-gray-800 mb-3">경로 미리보기</h2>
              <TravelLogMap
                photos={rangePhotos}
                route={routePoints}
                height="500px"
              />
            </div>
          </div>
        )}

        {/* 저장 버튼 (하단) */}
        {photos.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {rangePhotos.length}장 · GPS {locationCount}장
              {routePoints.length >= 2 && ` · 경로 ${routePoints.length}점`}
            </div>
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="btn-primary"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  {saveProgress || '저장 중...'}
                </span>
              ) : '여행 로그 저장'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
