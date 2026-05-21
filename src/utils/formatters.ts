// ========================================
// 포맷 변환 유틸리티
// 날짜, 거리 등을 사람이 읽기 쉬운 형태로 변환합니다
// ========================================

/**
 * Date 객체를 한국어 날짜 문자열로 변환합니다
 * 예: "2024년 1월 15일"
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Date 객체를 시간 문자열로 변환합니다
 * 예: "오후 3:30"
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Date 객체를 날짜+시간 문자열로 변환합니다
 * 예: "2024년 1월 15일 오후 3:30"
 */
export function formatDateTime(date: Date): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

/**
 * 거리(km)를 사람이 읽기 쉬운 형태로 변환합니다
 * 1km 미만이면 m 단위로 표시
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

/**
 * Firestore Timestamp 또는 Date를 Date 객체로 변환합니다
 * Firestore에서 데이터를 읽으면 Timestamp 형태로 오기 때문에 변환이 필요합니다
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toDate(value: any): Date {
  if (value instanceof Date) return value;
  if (value?.toDate) return value.toDate(); // Firestore Timestamp
  if (value?.seconds) return new Date(value.seconds * 1000); // Firestore Timestamp 객체
  return new Date(value);
}
