// ========================================
// TravelLogMap 컴포넌트
// EXIF 기반 여행 로그의 지도를 표시합니다.
// - GPS 있는 사진의 마커 표시
// - 시간순으로 연결한 Polyline 경로
// - 마커 클릭 시 사진 팝업
// - 전체 마커가 한 화면에 보이도록 bounds 자동 조절
// ========================================

import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { TravelPhoto, RoutePoint } from '../../types';
import { formatDateTime } from '../../utils/formatters';

interface TravelLogMapProps {
  photos: TravelPhoto[];    // GPS 있는 사진들 (지도에 표시될 것들)
  route: RoutePoint[];      // 경로 포인트 (시간순)
  height?: string;          // CSS 높이 (기본 100%)
}

// Google Maps API를 한 번만 로드하기 위한 전역 Loader (MapView와 공유)
let googleMapsLoader: Loader | null = null;

export default function TravelLogMap({ photos, route, height = '100%' }: TravelLogMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState('');

  const locationPhotos = photos.filter(p => p.hasLocation);

  // ─── Google Maps 초기화 ─────────────────────────────────────────────────────

  useEffect(() => {
    const initMap = async () => {
      try {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          setMapError('Google Maps API 키가 설정되지 않았습니다.');
          return;
        }

        if (!googleMapsLoader) {
          googleMapsLoader = new Loader({ apiKey, version: 'weekly' });
        }

        await googleMapsLoader.importLibrary('maps');
        await googleMapsLoader.importLibrary('marker');

        if (!mapRef.current) return;

        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 37.5665, lng: 126.9780 },
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER,
          },
          styles: [
            { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
            { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#bae6fd' }] },
            { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
            { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#e8e8e8' }] },
          ],
        });

        mapInstanceRef.current = map;
        infoWindowRef.current = new google.maps.InfoWindow();
        setMapLoaded(true);
      } catch (err) {
        console.error('Google Maps 로드 실패:', err);
        setMapError('지도를 불러오는 중 오류가 발생했습니다.');
      }
    };

    initMap();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Polyline 경로 업데이트 ─────────────────────────────────────────────────

  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;

    if (polylineRef.current) polylineRef.current.setMap(null);

    if (route.length < 2) return;

    polylineRef.current = new google.maps.Polyline({
      path: route.map(r => ({ lat: r.lat, lng: r.lng })),
      geodesic: true,
      strokeColor: '#0ea5e9',
      strokeOpacity: 0.85,
      strokeWeight: 3,
      map: mapInstanceRef.current,
    });
  }, [route, mapLoaded]);

  // ─── 사진 마커 업데이트 ─────────────────────────────────────────────────────

  const updateMarkers = useCallback(() => {
    if (!mapLoaded || !mapInstanceRef.current || !infoWindowRef.current) return;

    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    locationPhotos.forEach((photo, idx) => {
      const isFirst = idx === 0;
      const isLast = idx === locationPhotos.length - 1;

      const marker = new google.maps.Marker({
        position: { lat: photo.latitude!, lng: photo.longitude! },
        map: mapInstanceRef.current!,
        icon: {
          url: photo.imageUrl,
          scaledSize: new google.maps.Size(isFirst || isLast ? 60 : 48, isFirst || isLast ? 60 : 48),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(isFirst || isLast ? 30 : 24, isFirst || isLast ? 30 : 24),
        },
        title: photo.fileName,
        zIndex: isFirst || isLast ? 100 : 50,
      });

      marker.addListener('click', () => {
        const content = `
          <div style="padding:8px;max-width:200px;">
            <img src="${photo.imageUrl}" alt="${photo.fileName}"
              style="width:100%;height:120px;object-fit:cover;border-radius:8px;margin-bottom:6px;" />
            <p style="font-size:12px;color:#374151;font-weight:500;margin:0 0 2px;">
              ${photo.takenAt ? formatDateTime(photo.takenAt) : '촬영 시간 없음'}
            </p>
            <p style="font-size:11px;color:#9ca3af;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
              ${photo.fileName}
            </p>
          </div>
        `;
        infoWindowRef.current!.setContent(content);
        infoWindowRef.current!.open(mapInstanceRef.current!, marker);
      });

      markersRef.current.push(marker);
    });
  }, [locationPhotos, mapLoaded]);

  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  // ─── bounds 자동 조절 ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || locationPhotos.length === 0) return;

    if (locationPhotos.length === 1) {
      mapInstanceRef.current.setCenter({
        lat: locationPhotos[0].latitude!,
        lng: locationPhotos[0].longitude!,
      });
      mapInstanceRef.current.setZoom(15);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    locationPhotos.forEach(p => bounds.extend({ lat: p.latitude!, lng: p.longitude! }));
    mapInstanceRef.current.fitBounds(bounds, 60);
  }, [locationPhotos, mapLoaded]);

  // ─── GPS 없는 경우 안내 ────────────────────────────────────────────────────

  if (!mapError && locationPhotos.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200"
        style={{ height }}
      >
        <div className="text-4xl mb-2">📍</div>
        <p className="text-sm font-medium text-gray-500">GPS 정보가 있는 사진이 없습니다</p>
        <p className="text-xs text-gray-400 mt-1">원본 아이폰 사진을 업로드하면 경로가 표시됩니다</p>
      </div>
    );
  }

  if (mapError) {
    return (
      <div
        className="flex flex-col items-center justify-center bg-gray-50 rounded-xl"
        style={{ height }}
      >
        <div className="text-4xl mb-2">🗺️</div>
        <p className="text-sm text-gray-500">{mapError}</p>
      </div>
    );
  }

  return (
    <div style={{ height, position: 'relative' }}>
      <div ref={mapRef} className="w-full h-full rounded-xl" />

      {/* GPS 있는 사진 수 표시 */}
      {locationPhotos.length > 0 && (
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 shadow text-xs font-medium text-gray-600 pointer-events-none">
          📍 {locationPhotos.length}개 위치
          {route.length >= 2 && ` · 경로 표시 중`}
        </div>
      )}

      {route.length < 2 && locationPhotos.length > 0 && (
        <div className="absolute bottom-3 left-3 right-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700 pointer-events-none">
          경로를 만들기에는 위치 정보가 부족합니다 (GPS 사진 2장 이상 필요)
        </div>
      )}
    </div>
  );
}
