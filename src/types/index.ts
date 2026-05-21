// ========================================
// TravelLog 타입 정의 파일
// 앱 전체에서 사용하는 데이터 구조를 정의합니다
// ========================================

// 사용자 정보 타입
export interface User {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  createdAt: Date;
}

// GPS 좌표 타입
export interface Coordinates {
  lat: number;
  lng: number;
}

// 위치 기록 타입 (이동 경로를 구성하는 각 점)
export interface LocationRecord {
  id?: string;
  lat: number;
  lng: number;
  timestamp: Date;
}

// 사진 타입
export interface Photo {
  id?: string;
  imageUrl: string;       // Firebase Storage에 저장된 이미지 URL
  lat: number;            // 사진 촬영 위치 위도
  lng: number;            // 사진 촬영 위치 경도
  timestamp: Date;        // 촬영/업로드 시간
  memo: string;           // 사용자가 작성한 메모
  exifUsed: boolean;      // EXIF GPS 정보 사용 여부
  tripId?: string;        // 속한 여행 ID
}

// 여행 기록 타입
export interface Trip {
  id?: string;
  userId: string;          // 여행을 기록한 사용자 ID
  title: string;           // 여행 제목
  startTime: Date;         // 여행 시작 시간
  endTime?: Date;          // 여행 종료 시간 (진행 중이면 undefined)
  createdAt: Date;         // 기록 생성 시간
  coverImageUrl?: string;  // 대표 사진 URL
  totalDistance: number;   // 총 이동거리 (km)
  photoCount: number;      // 사진 개수
  isActive: boolean;       // 현재 진행 중인 여행인지
}

// 진행 중인 여행 상태 타입 (메모리에서 관리)
export interface ActiveTrip extends Trip {
  locations: LocationRecord[];  // 수집된 위치 기록
  photos: Photo[];              // 업로드된 사진들
  watchId?: number;             // geolocation watchPosition ID
}

// 지도 마커 타입
export interface MapMarker {
  position: Coordinates;
  photo: Photo;
}

// 인증 폼 타입
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// 에러 상태 타입
export interface AppError {
  code: string;
  message: string;
}

// 사진 업로드 폼 타입
export interface PhotoUploadData {
  file: File;
  memo: string;
  coordinates?: Coordinates;  // EXIF에서 추출된 좌표 (있을 경우)
}

// ─── 여행 로그 (EXIF 기반) 타입 ───────────────────────────────────────────────

// EXIF에서 추출한 사진 메타데이터
export interface TravelPhoto {
  id: string;
  fileName: string;
  imageUrl: string;           // Object URL (로컬 미리보기) 또는 Storage URL
  takenAt: Date | null;       // 촬영 시간 (EXIF 없으면 null)
  latitude: number | null;    // GPS 위도 (없으면 null)
  longitude: number | null;   // GPS 경도 (없으면 null)
  hasLocation: boolean;
}

// 경로를 구성하는 각 점
export interface RoutePoint {
  lat: number;
  lng: number;
  photoId: string;
  takenAt: Date;
}

// 저장된 여행 로그
export interface TravelLog {
  id?: string;
  userId: string;
  title: string;
  createdAt: Date;
  startPhotoId: string;
  endPhotoId: string;
  photos: TravelPhoto[];
  route: RoutePoint[];
  coverImageUrl?: string;
  photoCount: number;
  locationCount: number;
}
