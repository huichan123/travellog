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
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState('');
  const [routeLoading, setRouteLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const locationPhotos = photos.filter(p => p.hasLocation);

  // ESC 키로 전체화면 종료
  useEffect(() => {
    if (!isFullscreen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isFullscreen]);

  // 전체화면 전환 시 Google Maps resize 트리거
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    const t = setTimeout(() => {
      google.maps.event.trigger(mapInstanceRef.current!, 'resize');
    }, 60);
    return () => clearTimeout(t);
  }, [isFullscreen, mapLoaded]);

  // ─── Google Maps 초기화 ─────────────────────────────────────────────────────

  useEffect(() => {
    const initMap = async () => {
      try {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey) { setMapError('Google Maps API 키가 설정되지 않았습니다.'); return; }

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
          zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_CENTER },
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

  // ─── 경로 렌더링 ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;

    routeSegmentsRef.current.forEach(s => s.setMap(null));
    routeSegmentsRef.current = [];

    if (route.length < 2) return;

    setRouteLoading(true);

    // ① 항상 연결되는 회색 기본선 (도로 경로 실패 시 대비)
    const baseline = new google.maps.Polyline({
      path: route.map(r => ({ lat: r.lat, lng: r.lng })),
      geodesic: true,
      strokeColor: '#94a3b8',
      strokeWeight: 2,
      strokeOpacity: 0.5,
      map: mapInstanceRef.current,
    });
    routeSegmentsRef.current.push(baseline);

    // ② Directions API로 도로 경로 덮어씌우기 (최대 25포인트씩 청크)
    const chunks: RoutePoint[][] = [];
    let idx = 0;
    while (idx < route.length - 1) {
      const end = Math.min(idx + 25, route.length);
      chunks.push(route.slice(idx, end));
      idx = end - 1;
    }

    let done = 0;
    const total = chunks.length;
    const svc = new google.maps.DirectionsService();

    chunks.forEach(chunk => {
      if (chunk.length < 2) { done++; if (done === total) setRouteLoading(false); return; }

      svc.route(
        {
          origin: { lat: chunk[0].lat, lng: chunk[0].lng },
          destination: { lat: chunk[chunk.length - 1].lat, lng: chunk[chunk.length - 1].lng },
          waypoints: chunk.slice(1, -1).map(p => ({
            location: new google.maps.LatLng(p.lat, p.lng),
            stopover: false,
          })),
          travelMode: google.maps.TravelMode.DRIVING,
          optimizeWaypoints: false,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            const renderer = new google.maps.DirectionsRenderer({
              map: mapInstanceRef.current!,
              directions: result,
              suppressMarkers: true,
              polylineOptions: { strokeColor: '#0ea5e9', strokeWeight: 4, strokeOpacity: 0.9 },
            });
            routeSegmentsRef.current.push(renderer);
          }
          done++;
          if (done === total) setRouteLoading(false);
        }
      );
    });
  }, [route, mapLoaded]);

  // ─── 사진 마커 (AdvancedMarkerElement) ─────────────────────────────────────

  const updateMarkers = useCallback(() => {
    if (!mapLoaded || !mapInstanceRef.current || !infoWindowRef.current) return;

    markersRef.current.forEach(m => { m.map = null; });
    markersRef.current = [];

    locationPhotos.forEach((photo, idx) => {
      const isFirst = idx === 0;
      const isLast = idx === locationPhotos.length - 1;
      const size = isFirst || isLast ? 54 : 44;
      const borderColor = isFirst ? '#3b82f6' : isLast ? '#ef4444' : '#ffffff';

      const el = document.createElement('div');
      el.style.cssText = [
        `width:${size}px`,
        `height:${size}px`,
        'border-radius:50%',
        `border:3px solid ${borderColor}`,
        'box-shadow:0 2px 10px rgba(0,0,0,0.45)',
        'overflow:hidden',
        'cursor:pointer',
        'background:#e5e7eb',
        'flex-shrink:0',
      ].join(';');

      const img = document.createElement('img');
      img.src = photo.imageUrl;
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;pointer-events:none;';
      img.alt = photo.fileName;
      el.appendChild(img);

      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: { lat: photo.latitude!, lng: photo.longitude! },
        map: mapInstanceRef.current!,
        content: el,
        zIndex: isFirst || isLast ? 100 : 50,
      });

      el.addEventListener('click', () => {
        infoWindowRef.current!.setContent(`
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
        `);
        infoWindowRef.current!.open({ map: mapInstanceRef.current!, anchor: marker });
      });

      markersRef.current.push(marker);
    });
  }, [locationPhotos, mapLoaded]);

  useEffect(() => { updateMarkers(); }, [updateMarkers]);

  // ─── bounds 자동 조절 ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || locationPhotos.length === 0) return;

    if (locationPhotos.length === 1) {
      mapInstanceRef.current.setCenter({ lat: locationPhotos[0].latitude!, lng: locationPhotos[0].longitude! });
      mapInstanceRef.current.setZoom(15);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    locationPhotos.forEach(p => bounds.extend({ lat: p.latitude!, lng: p.longitude! }));
    mapInstanceRef.current.fitBounds(bounds, 60);
  }, [locationPhotos, mapLoaded]);

  // ─── GPS 없는 경우 ─────────────────────────────────────────────────────────

  if (!mapError && locationPhotos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200" style={{ height }}>
        <div className="text-4xl mb-2">📍</div>
        <p className="text-sm font-medium text-gray-500">GPS 정보가 있는 사진이 없습니다</p>
        <p className="text-xs text-gray-400 mt-1">원본 아이폰 사진을 업로드하면 경로가 표시됩니다</p>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="flex flex-col items-center justify-center bg-gray-50 rounded-xl" style={{ height }}>
        <div className="text-4xl mb-2">🗺️</div>
        <p className="text-sm text-gray-500">{mapError}</p>
      </div>
    );
  }

  // ─── 렌더링 ────────────────────────────────────────────────────────────────

  const containerStyle = isFullscreen
    ? { position: 'fixed' as const, inset: 0 as unknown as string, zIndex: 9999 }
    : { height, position: 'relative' as const };

  return (
    <div style={containerStyle}>
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: isFullscreen ? 0 : '0.75rem',
        }}
      />

      {/* 경로 계산 중 오버레이 */}
      {routeLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow text-xs font-medium text-gray-600 flex items-center gap-2">
            <svg className="w-3.5 h-3.5 animate-spin text-sky-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            도로 경로 계산 중...
          </div>
        </div>
      )}

      {/* 전체화면 버튼 */}
      <button
        onClick={() => setIsFullscreen(f => !f)}
        className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow hover:bg-white transition-colors z-10"
        title={isFullscreen ? '전체화면 종료 (ESC)' : '전체화면으로 보기'}
      >
        {isFullscreen ? (
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25M9 15H4.5M9 15v4.5M9 15l-5.25 5.25" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        )}
      </button>

      {/* GPS 수 표시 */}
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
