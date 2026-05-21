// ========================================
// 여행 상세 페이지
// 저장된 여행의 지도와 사진 경로를 다시 볼 수 있습니다
// ========================================

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTrip, getTripLocations } from '../services/tripService';
import { getTripPhotos } from '../services/photoService';
import { Trip, Photo, LocationRecord } from '../types';
import MapView from '../components/map/MapView';
import TripTimeline from '../components/trips/TripTimeline';
import PhotoDetail from '../components/photos/PhotoDetail';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { formatDate, formatDateTime, formatDistance } from '../utils/formatters';

export default function TripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!tripId) return;
      try {
        // 여행 정보, 위치 기록, 사진을 병렬로 불러오기
        const [tripData, locationsData, photosData] = await Promise.all([
          getTrip(tripId),
          getTripLocations(tripId),
          getTripPhotos(tripId),
        ]);

        if (!tripData) {
          setError('여행 기록을 찾을 수 없습니다.');
          return;
        }

        setTrip(tripData);
        setLocations(locationsData);
        setPhotos(photosData);
      } catch {
        setError('여행 기록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tripId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <LoadingSpinner message="여행 기록을 불러오는 중..." size="lg" />
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] gap-4">
        <p className="text-gray-600">{error || '여행을 찾을 수 없습니다'}</p>
        <button onClick={() => navigate('/trips')} className="btn-secondary">
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* 상단 정보 바 */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/trips')}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-gray-800 truncate">{trip.title}</h1>
          <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
            <span>{formatDate(trip.startTime)}</span>
            <span>·</span>
            <span>{photos.length}장</span>
            <span>·</span>
            <span>{formatDistance(trip.totalDistance)}</span>
          </div>
        </div>
      </div>

      {/* 지도 */}
      <div className="flex-1 p-3 pb-0">
        <MapView
          photos={photos}
          locations={locations}
          currentLocation={null}
        />
      </div>

      {/* 하단 타임라인 */}
      {photos.length > 0 && (
        <div className="h-24 bg-white border-t border-gray-100 px-3">
          <TripTimeline
            photos={photos}
            onPhotoClick={setSelectedPhoto}
            selectedPhoto={selectedPhoto}
          />
        </div>
      )}

      {/* 여행 요약 정보 */}
      <div className="bg-white border-t border-gray-100 px-4 py-3">
        <div className="flex items-center justify-around text-center">
          <div>
            <p className="text-sm font-bold text-gray-800">{photos.length}</p>
            <p className="text-xs text-gray-400">사진</p>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800">{formatDistance(trip.totalDistance)}</p>
            <p className="text-xs text-gray-400">이동거리</p>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800">{formatDateTime(trip.startTime)}</p>
            <p className="text-xs text-gray-400">시작</p>
          </div>
          {trip.endTime && (
            <div>
              <p className="text-sm font-bold text-gray-800">{formatDateTime(trip.endTime)}</p>
              <p className="text-xs text-gray-400">종료</p>
            </div>
          )}
        </div>
      </div>

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
