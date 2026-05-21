// ========================================
// 사진 업로드 컴포넌트
// 여행 중 사진을 선택하고 업로드합니다
// EXIF GPS 정보 추출도 여기서 처리됩니다
// ========================================

import { useState, useRef } from 'react';
import { useTrip } from '../../contexts/TripContext';
import { extractGPSFromImage } from '../../utils/exifReader';

interface PhotoUploadProps {
  onClose: () => void;
}

export default function PhotoUpload({ onClose }: PhotoUploadProps) {
  const { activeTrip, currentLocation, addPhoto, uploadProgress } = useTrip();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exifInfo, setExifInfo] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 파일 선택 처리
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 이미지 파일만 허용
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('파일 크기는 10MB 이하여야 합니다.');
      return;
    }

    setSelectedFile(file);
    setError('');

    // 미리보기 이미지 생성
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // EXIF GPS 정보 확인
    const gps = await extractGPSFromImage(file);
    if (gps) {
      setExifInfo(`📍 사진 GPS: ${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}`);
    } else if (currentLocation) {
      setExifInfo(`📍 현재 위치 사용: ${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`);
    } else {
      setExifInfo('📍 GPS 정보 없음');
    }
  };

  // 업로드 처리
  const handleUpload = async () => {
    if (!selectedFile) return;
    if (!activeTrip) {
      setError('먼저 여행을 시작해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // EXIF GPS 시도, 없으면 현재 위치 사용
      const exifGps = await extractGPSFromImage(selectedFile);
      const coordinates = exifGps || currentLocation || { lat: 0, lng: 0 };
      const exifUsed = !!exifGps;

      await addPhoto(selectedFile, memo, coordinates, exifUsed);
      onClose(); // 업로드 성공 시 모달 닫기
    } catch (err) {
      const code = (err as { code?: string }).code ?? '';
      if (code === 'storage/unauthorized') {
        setError('Firebase Storage 권한이 없습니다. Firebase 콘솔 → Storage → Rules에서 인증된 사용자의 업로드를 허용해주세요.');
      } else if (code === 'storage/quota-exceeded') {
        setError('Storage 용량이 초과되었습니다.');
      } else if (code === 'storage/canceled') {
        setError('업로드가 취소되었습니다.');
      } else if (code) {
        setError(`업로드 실패 (${code})`);
      } else {
        setError('사진 업로드에 실패했습니다. 네트워크를 확인하고 다시 시도해주세요.');
      }
      console.error('사진 업로드 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">사진 추가</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 진행 중인 여행이 없으면 경고 */}
        {!activeTrip && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
            ⚠️ 여행을 시작해야 사진을 업로드할 수 있습니다.
          </div>
        )}

        {/* 사진 선택 영역 */}
        {!selectedFile ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center gap-3 hover:border-sky-400 hover:bg-sky-50 transition-all"
          >
            <div className="w-14 h-14 bg-sky-100 rounded-full flex items-center justify-center">
              <svg className="w-7 h-7 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">사진을 선택하세요</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, HEIC (최대 10MB)</p>
            </div>
          </button>
        ) : (
          /* 선택된 사진 미리보기 */
          <div className="relative">
            <img
              src={preview!}
              alt="미리보기"
              className="w-full h-48 object-cover rounded-xl"
            />
            <button
              onClick={() => { setSelectedFile(null); setPreview(null); setExifInfo(''); }}
              className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm rounded-full p-1 hover:bg-white transition-colors"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* 숨겨진 파일 입력 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* GPS 정보 표시 */}
        {exifInfo && (
          <p className="text-xs text-gray-500 mt-2">{exifInfo}</p>
        )}

        {/* 메모 입력 */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">메모 (선택)</label>
          <textarea
            value={memo}
            onChange={e => setMemo(e.target.value)}
            className="input-field resize-none"
            placeholder="이 순간을 기억하는 한 마디..."
            rows={3}
            maxLength={200}
          />
          <p className="text-xs text-gray-400 text-right mt-1">{memo.length}/200</p>
        </div>

        {/* 업로드 진행률 */}
        {loading && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>업로드 중...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-sky-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <p className="text-sm text-red-500 mt-2">{error}</p>
        )}

        {/* 업로드 버튼 */}
        <button
          onClick={handleUpload}
          disabled={!selectedFile || !activeTrip || loading}
          className="btn-primary w-full mt-4 py-3"
        >
          {loading ? '업로드 중...' : '사진 저장'}
        </button>
      </div>
    </div>
  );
}
