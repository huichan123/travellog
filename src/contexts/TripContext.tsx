// ========================================
// 여행 컨텍스트
// 현재 진행 중인 여행의 상태(위치 추적, 사진 등)를
// 앱 전체에서 공유합니다
// ========================================

import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { ActiveTrip, LocationRecord, Photo, Coordinates } from '../types';
import { createTrip, endTrip, saveLocation } from '../services/tripService';
import { uploadPhoto, updateCoverImage } from '../services/photoService';
import { useAuth } from './AuthContext';

interface TripContextType {
  activeTrip: ActiveTrip | null;             // 현재 진행 중인 여행
  isTracking: boolean;                        // GPS 추적 중 여부
  currentLocation: Coordinates | null;        // 현재 GPS 위치
  gpsError: string | null;                    // GPS 오류 메시지
  uploadProgress: number;                     // 사진 업로드 진행률 (0~100)
  startTrip: (title: string) => Promise<void>;
  stopTrip: () => Promise<void>;
  addPhoto: (
    file: File,
    memo: string,
    coordinates: Coordinates,
    exifUsed: boolean
  ) => Promise<Photo>;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export function TripProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const [activeTrip, setActiveTrip] = useState<ActiveTrip | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // watchPosition의 ID를 저장 (나중에 clearWatch로 종료할 때 필요)
  const watchIdRef = useRef<number | null>(null);

  // 마지막 위치 저장 시간 (너무 자주 저장하지 않도록 제한)
  const lastSaveTimeRef = useRef<number>(0);
  const SAVE_INTERVAL = 10000; // 10초마다 저장

  // ─── 여행 시작 ──────────────────────────────────────────────────────────────

  const startTrip = useCallback(async (title: string) => {
    if (!currentUser) throw new Error('로그인이 필요합니다');
    if (!navigator.geolocation) {
      setGpsError('이 브라우저는 GPS를 지원하지 않습니다');
      throw new Error('GPS 미지원');
    }

    // Firestore에 새 여행 생성
    const tripId = await createTrip(currentUser.uid, title);

    // 초기 ActiveTrip 상태 설정
    const newTrip: ActiveTrip = {
      id: tripId,
      userId: currentUser.uid,
      title,
      startTime: new Date(),
      createdAt: new Date(),
      totalDistance: 0,
      photoCount: 0,
      isActive: true,
      locations: [],
      photos: [],
    };

    setActiveTrip(newTrip);
    setIsTracking(true);
    setGpsError(null);

    // GPS 위치 추적 시작
    // watchPosition: 위치가 변할 때마다 콜백 함수를 호출합니다
    const watchId = navigator.geolocation.watchPosition(
      // 위치 업데이트 성공 콜백
      async (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation: Coordinates = { lat: latitude, lng: longitude };

        setCurrentLocation(newLocation);

        // 10초마다 Firestore에 위치 저장 (비용 절감)
        const now = Date.now();
        if (now - lastSaveTimeRef.current >= SAVE_INTERVAL) {
          lastSaveTimeRef.current = now;

          const locationRecord: LocationRecord = {
            lat: latitude,
            lng: longitude,
            timestamp: new Date(),
          };

          // ActiveTrip의 locations 배열에 추가
          setActiveTrip(prev => {
            if (!prev) return null;
            return {
              ...prev,
              locations: [...prev.locations, locationRecord],
            };
          });

          // Firestore에 위치 저장 (비동기, 에러 무시)
          saveLocation(tripId, latitude, longitude).catch(console.error);
        }
      },
      // GPS 오류 콜백
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGpsError('GPS 권한이 거부되었습니다. 브라우저 설정에서 위치 접근을 허용해주세요.');
            break;
          case error.POSITION_UNAVAILABLE:
            setGpsError('현재 위치를 가져올 수 없습니다. GPS 신호를 확인해주세요.');
            break;
          case error.TIMEOUT:
            setGpsError('위치 정보 요청 시간이 초과되었습니다.');
            break;
          default:
            setGpsError('위치 정보를 가져오는 중 오류가 발생했습니다.');
        }
      },
      // GPS 옵션
      {
        enableHighAccuracy: true,  // 높은 정확도 (배터리 소모 증가)
        timeout: 10000,            // 10초 타임아웃
        maximumAge: 5000,          // 5초 이내 캐시 허용
      }
    );

    watchIdRef.current = watchId;
  }, [currentUser]);

  // ─── 여행 종료 ──────────────────────────────────────────────────────────────

  const stopTrip = useCallback(async () => {
    if (!activeTrip?.id) return;

    // GPS 추적 중지
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    // Firestore에 여행 종료 정보 저장
    const coverImageUrl = activeTrip.photos[0]?.imageUrl;
    await endTrip(
      activeTrip.id,
      activeTrip.locations,
      activeTrip.photos.length,
      coverImageUrl
    );

    setIsTracking(false);
    setActiveTrip(null);
    setCurrentLocation(null);
  }, [activeTrip]);

  // ─── 사진 추가 ──────────────────────────────────────────────────────────────

  const addPhoto = useCallback(async (
    file: File,
    memo: string,
    coordinates: Coordinates,
    exifUsed: boolean
  ): Promise<Photo> => {
    if (!activeTrip?.id || !currentUser) {
      throw new Error('진행 중인 여행이 없습니다');
    }

    setUploadProgress(0);

    const photo = await uploadPhoto(
      activeTrip.id,
      currentUser.uid,
      file,
      coordinates,
      memo,
      exifUsed,
      (progress) => setUploadProgress(progress)
    );

    // 첫 번째 사진이면 대표 사진으로 설정
    if (activeTrip.photos.length === 0) {
      await updateCoverImage(activeTrip.id, photo.imageUrl);
    }

    // ActiveTrip의 photos 배열에 추가
    setActiveTrip(prev => {
      if (!prev) return null;
      return {
        ...prev,
        photos: [...prev.photos, photo],
        photoCount: prev.photos.length + 1,
      };
    });

    setUploadProgress(100);
    return photo;
  }, [activeTrip, currentUser]);

  const value: TripContextType = {
    activeTrip,
    isTracking,
    currentLocation,
    gpsError,
    uploadProgress,
    startTrip,
    stopTrip,
    addPhoto,
  };

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrip(): TripContextType {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTrip은 TripProvider 내부에서만 사용할 수 있습니다');
  }
  return context;
}
