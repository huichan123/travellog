import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { TravelPhoto, RoutePoint } from '../../types';
import { formatDateTime } from '../../utils/formatters';

interface TravelLogMapProps {
  photos: TravelPhoto[];
  route: RoutePoint[];
  height?: string;
}

interface HasSetMap {
  setMap(map: google.maps.Map | null): void;
}

let googleMapsLoader: Loader | null = null;

export default function TravelLogMap({ photos, route, height = '100%' }: TravelLogMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const routeSegmentsRef = useRef<HasSetMap[]>([]);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState('');
  const [routeLoading, setRouteLoading] = useState(false);

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
        await googleMapsLoader.importLibrary('routes');

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

  // ─── 도로 경로 렌더링 ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;

    // 기존 경로 제거
    routeSegmentsRef.current.forEach(s => s.setMap(null));
    routeSegmentsRef.current = [];

    if (route.length < 2) return;

    setRouteLoading(true);

    // 직선 폴백 (Directions API 실패 시 또는 동일 위치)
    const drawFallbackPolyline = (points: RoutePoint[]) => {
      const polyline = new google.maps.Polyline({
        path: points.map(p => ({ lat: p.lat, lng: p.lng })),
        geodesic: true,
        strokeColor: '#0ea5e9',
        strokeWeight: 3,
        strokeOpacity: 0.6,
        map: mapInstanceRef.current!,
      });
      routeSegmentsRef.current.push(polyline);
    };

    // Directions API는 요청당 최대 25개 지점 (시작+끝+23개 경유지)
    // 경로 포인트를 24개씩 겹쳐서 청크로 분할
    const MAX_POINTS_PER_CHUNK = 25;
    const chunks: RoutePoint[][] = [];
    let idx = 0;
    while (idx < route.length - 1) {
      const end = Math.min(idx + MAX_POINTS_PER_CHUNK, route.length);
      chunks.push(route.slice(idx, end));
      idx = end - 1; // 마지막 점을 다음 청크의 시작점으로 겹침
    }

    let completed = 0;
    const total = chunks.length;

    const directionsService = new google.maps.DirectionsService();

    chunks.forEach(chunk => {
      if (chunk.length < 2) {
        completed++;
        if (completed === total) setRouteLoading(false);
        return;
      }

      const origin = { lat: chunk[0].lat, lng: chunk[0].lng };
      const destination = { lat: chunk[chunk.length - 1].lat, lng: chunk[chunk.length - 1].lng };
      const waypoints = chunk.slice(1, -1).map(p => ({
        location: new google.maps.LatLng(p.lat, p.lng),
        stopover: false,
      }));

      directionsService.route(
        {
          origin,
          destination,
          waypoints,
          travelMode: google.maps.TravelMode.DRIVING,
          optimizeWaypoints: false,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            const renderer = new google.maps.DirectionsRenderer({
              map: mapInstanceRef.current!,
              directions: result,
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: '#0ea5e9',
                strokeWeight: 4,
                strokeOpacity: 0.85,
              },
            });
            routeSegmentsRef.current.push(renderer);
          } else {
            // API 미활성, 할당량 초과, 경로 없음 등 → 직선 폴백
            drawFallbackPolyline(chunk);
          }

          completed++;
          if (completed === total) setRouteLoading(false);
        }
      );
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

      {/* 경로 계산 중 오버레이 */}
      {routeLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow text-xs font-medium text-gray-600 flex items-center gap-2">
            <svg className="w-3.5 h-3.5 animate-spin text-sky-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            도로 경로 계산 중...
          </div>
        </div>
      )}

      {/* GPS 있는 사진 수 표시 */}
      {locationPhotos.length > 0 && !routeLoading && (
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 shadow text-xs font-medium text-gray-600 pointer-events-none">
          📍 {locationPhotos.length}개 위치
          {route.length >= 2 && ' · 경로 표시 중'}
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
