// ========================================
// 여행 경로 계산 유틸리티
// 사진 GPS 좌표를 시간순으로 연결해 경로를 만들고,
// 이상치 좌표를 필터링하는 함수들을 제공합니다.
// 추후 Google/Kakao/Naver Directions API 확장 가능한 구조입니다.
// ========================================

import { TravelPhoto, RoutePoint } from '../types';
import { calculateDistance } from './distanceCalculator';

// 연속된 두 점 사이의 최대 허용 거리 (km)
// 이 값을 초과하면 이상치로 판단 (예: 다른 날 찍은 사진이 섞인 경우)
const MAX_JUMP_KM = 50;

/**
 * GPS 정보가 있는 사진들로부터 경로 포인트 배열을 만들어 반환합니다.
 * 사진은 takenAt 기준으로 오름차순 정렬되어 있어야 합니다.
 */
export function buildRouteFromPhotos(photos: TravelPhoto[]): RoutePoint[] {
  return photos
    .filter(p => p.hasLocation && p.latitude !== null && p.longitude !== null && p.takenAt !== null)
    .map(p => ({
      lat: p.latitude!,
      lng: p.longitude!,
      photoId: p.id,
      takenAt: p.takenAt!,
    }));
}

/**
 * 연속된 포인트 간 거리가 MAX_JUMP_KM를 초과하는 이상치를 제거합니다.
 * 첫 번째 포인트는 항상 유지합니다.
 *
 * 추후 실제 경로 API(Directions API 등)를 쓸 때는 이 함수로 필터링된
 * 포인트 배열을 waypoint로 사용하면 됩니다.
 */
export function filterOutlierPoints(points: RoutePoint[]): RoutePoint[] {
  if (points.length <= 1) return points;

  const result: RoutePoint[] = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const prev = result[result.length - 1];
    const curr = points[i];
    const dist = calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng);
    if (dist <= MAX_JUMP_KM) {
      result.push(curr);
    }
  }
  return result;
}

/**
 * 사진 배열에서 시작/끝 photoId 범위 안의 사진만 필터링합니다.
 * takenAt 기준으로 시간 범위를 계산합니다.
 */
export function filterPhotosByRange(
  photos: TravelPhoto[],
  startPhotoId: string,
  endPhotoId: string
): TravelPhoto[] {
  const startPhoto = photos.find(p => p.id === startPhotoId);
  const endPhoto = photos.find(p => p.id === endPhotoId);

  if (!startPhoto?.takenAt || !endPhoto?.takenAt) return photos;

  const startTime = startPhoto.takenAt.getTime();
  const endTime = endPhoto.takenAt.getTime();

  return photos.filter(p => {
    if (!p.takenAt) return true; // 시간 없는 사진은 포함
    const t = p.takenAt.getTime();
    return t >= startTime && t <= endTime;
  });
}

/**
 * 사진 배열을 촬영 시간 기준 오름차순 정렬합니다.
 * takenAt이 null인 사진은 맨 뒤로 배치합니다.
 */
export function sortPhotosByTime(photos: TravelPhoto[]): TravelPhoto[] {
  return [...photos].sort((a, b) => {
    if (!a.takenAt && !b.takenAt) return 0;
    if (!a.takenAt) return 1;
    if (!b.takenAt) return -1;
    return a.takenAt.getTime() - b.takenAt.getTime();
  });
}
