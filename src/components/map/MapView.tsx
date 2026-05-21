// ========================================
// 지도 컴포넌트
// Google Maps를 렌더링하고
// 현재 위치, 이동 경로, 사진 마커를 표시합니다
// ========================================

import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Photo, LocationRecord, Coordinates } from '../../types';
import PhotoDetail from '../photos/PhotoDetail';

interface MapViewProps {
  photos: Photo[];                     // 지도에 표시할 사진들
  locations: LocationRecord[];         // 이동 경로 좌표들
  currentLocation: Coordinates | null; // 현재 위치
  centerOnUser?: boolean;              // 현재 위치로 지도 중심 이동
}

// Google Maps API를 한 번만 로드하기 위한 전역 변수
let googleMapsLoader: Loader | null = null;

export default function MapView({
  photos,
  locations,
  currentLocation,
  centerOnUser = false,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const currentMarkerRef = useRef<google.maps.Marker | null>(null);
  const photoMarkersRef = useRef<google.maps.Marker[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState('');

  // ─── Google Maps 초기화 ─────────────────────────────────────────────────────

  useEffect(() => {
    const initMap = async () => {
      try {
        // API 키 확인
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          setMapError('Google Maps API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.');
          return;
        }

        // Loader 싱글톤: 여러 번 로드되지 않도록
        if (!googleMapsLoader) {
          googleMapsLoader = new Loader({
            apiKey,
            version: 'weekly',
            libraries: ['places'],
          });
        }

        await googleMapsLoader.load();

        if (!mapRef.current) return;

        // 지도 초기 중심: 현재 위치 또는 서울
        const center = currentLocation || { lat: 37.5665, lng: 126.9780 };

        // Google Maps 인스턴스 생성
        const map = new google.maps.Map(mapRef.current, {
          center,
          zoom: 14,
          mapTypeControl: false,        // 지도 유형 버튼 숨기기
          streetViewControl: false,     // 스트리트뷰 버튼 숨기기
          fullscreenControl: true,
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER,
          },
          styles: [
            // 지도 스타일 커스텀 (여행 앱 느낌)
            { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
            { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#bae6fd' }] },
            { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
            { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#e8e8e8' }] },
          ],
        });

        mapInstanceRef.current = map;
        setMapLoaded(true);
      } catch {
        setMapError('지도를 불러오는 중 오류가 발생했습니다.');
      }
    };

    initMap();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── 현재 위치 마커 업데이트 ────────────────────────────────────────────────

  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !currentLocation) return;

    // 기존 마커 제거
    if (currentMarkerRef.current) {
      currentMarkerRef.current.setMap(null);
    }

    // 현재 위치 마커 (파란 원형)
    currentMarkerRef.current = new google.maps.Marker({
      position: currentLocation,
      map: mapInstanceRef.current,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#0ea5e9',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
      },
      title: '현재 위치',
      zIndex: 100,
    });

    // 현재 위치로 지도 중심 이동
    if (centerOnUser) {
      mapInstanceRef.current.panTo(currentLocation);
    }
  }, [currentLocation, mapLoaded, centerOnUser]);

  // ─── 이동 경로 Polyline 업데이트 ────────────────────────────────────────────

  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || locations.length < 2) return;

    // 기존 polyline 제거
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    // 새 polyline 생성
    polylineRef.current = new google.maps.Polyline({
      path: locations.map(loc => ({ lat: loc.lat, lng: loc.lng })),
      geodesic: true,             // 지구 곡률 고려
      strokeColor: '#0ea5e9',     // 하늘색
      strokeOpacity: 0.8,
      strokeWeight: 4,
      map: mapInstanceRef.current,
    });
  }, [locations, mapLoaded]);

  // ─── 사진 마커 업데이트 ─────────────────────────────────────────────────────

  const updatePhotoMarkers = useCallback(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;

    // 기존 마커 모두 제거
    photoMarkersRef.current.forEach(marker => marker.setMap(null));
    photoMarkersRef.current = [];

    photos.forEach(photo => {
      // 마커 아이콘 - 사진 썸네일을 원형으로 표시
      const marker = new google.maps.Marker({
        position: { lat: photo.lat, lng: photo.lng },
        map: mapInstanceRef.current!,
        icon: {
          url: photo.imageUrl,
          scaledSize: new google.maps.Size(52, 52),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(26, 26),
        },
        title: photo.memo || '사진',
        zIndex: 50,
      });

      // 마커 클릭 시 사진 상세 표시
      marker.addListener('click', () => {
        setSelectedPhoto(photo);
      });

      photoMarkersRef.current.push(marker);
    });
  }, [photos, mapLoaded]);

  useEffect(() => {
    updatePhotoMarkers();
  }, [updatePhotoMarkers]);

  // ─── 경로에 맞게 지도 범위 조절 ────────────────────────────────────────────

  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    const allPoints = [
      ...locations.map(l => ({ lat: l.lat, lng: l.lng })),
      ...photos.map(p => ({ lat: p.lat, lng: p.lng })),
    ];
    if (allPoints.length < 2) return;

    const bounds = new google.maps.LatLngBounds();
    allPoints.forEach(pt => bounds.extend(pt));
    mapInstanceRef.current.fitBounds(bounds, 60);
  }, [mapLoaded, locations, photos]);

  // ─── 렌더링 ────────────────────────────────────────────────────────────────

  if (mapError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-xl">
        <div className="text-center p-6">
          <div className="text-4xl mb-3">🗺️</div>
          <p className="text-gray-600 font-medium mb-1">지도를 불러올 수 없습니다</p>
          <p className="text-sm text-gray-400">{mapError}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 지도 컨테이너 */}
      <div ref={mapRef} className="w-full h-full rounded-xl" />

      {/* 사진 상세 팝업 */}
      {selectedPhoto && (
        <PhotoDetail
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </>
  );
}
