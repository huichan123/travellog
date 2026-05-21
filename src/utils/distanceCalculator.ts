// ========================================
// 거리 계산 유틸리티
// GPS 좌표 사이의 거리를 계산합니다
// ========================================

import { LocationRecord } from '../types';

/**
 * Haversine 공식으로 두 GPS 좌표 사이의 거리(km)를 계산합니다
 * 지구가 구형이라는 것을 고려한 공식입니다
 */
export function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // 지구 반지름 (km)
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 도(degree)를 라디안(radian)으로 변환
function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * 위치 기록 배열을 받아 전체 이동 거리를 계산합니다
 */
export function calculateTotalDistance(locations: LocationRecord[]): number {
  if (locations.length < 2) return 0;

  let total = 0;
  for (let i = 1; i < locations.length; i++) {
    total += calculateDistance(
      locations[i - 1].lat, locations[i - 1].lng,
      locations[i].lat, locations[i].lng
    );
  }
  return Math.round(total * 100) / 100; // 소수점 2자리까지
}
