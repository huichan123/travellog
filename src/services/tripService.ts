// ========================================
// 여행 기록 서비스
// Firestore에서 여행 데이터를 읽고 쓰는 함수들을 모아놓은 파일입니다
// ========================================

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Trip, LocationRecord } from '../types';
import { toDate } from '../utils/formatters';
import { calculateTotalDistance } from '../utils/distanceCalculator';

// ─── 여행 생성 ─────────────────────────────────────────────────────────────────

/**
 * 새 여행을 Firestore에 생성합니다
 * "Start Log" 버튼을 눌렀을 때 호출됩니다
 */
export async function createTrip(userId: string, title: string): Promise<string> {
  const tripData = {
    userId,
    title,
    startTime: serverTimestamp(), // 서버 시간 사용 (정확성 보장)
    endTime: null,
    createdAt: serverTimestamp(),
    coverImageUrl: null,
    totalDistance: 0,
    photoCount: 0,
    isActive: true,
  };

  const docRef = await addDoc(collection(db, 'trips'), tripData);
  return docRef.id;
}

// ─── 여행 종료 ─────────────────────────────────────────────────────────────────

/**
 * 여행을 종료하고 최종 통계를 저장합니다
 * "End Log" 버튼을 눌렀을 때 호출됩니다
 */
export async function endTrip(
  tripId: string,
  locations: LocationRecord[],
  photoCount: number,
  coverImageUrl?: string
): Promise<void> {
  const totalDistance = calculateTotalDistance(locations);

  await updateDoc(doc(db, 'trips', tripId), {
    endTime: serverTimestamp(),
    isActive: false,
    totalDistance,
    photoCount,
    ...(coverImageUrl && { coverImageUrl }),
  });
}

// ─── 위치 기록 저장 ────────────────────────────────────────────────────────────

/**
 * 위치 기록을 Firestore에 저장합니다
 * watchPosition 콜백에서 일정 간격으로 호출됩니다
 */
export async function saveLocation(
  tripId: string,
  lat: number,
  lng: number
): Promise<void> {
  await addDoc(collection(db, 'trips', tripId, 'locations'), {
    lat,
    lng,
    timestamp: serverTimestamp(),
  });
}

// ─── 여행 조회 ─────────────────────────────────────────────────────────────────

/**
 * 사용자의 모든 여행 기록을 가져옵니다 (최신순)
 */
export async function getUserTrips(userId: string): Promise<Trip[]> {
  // orderBy를 제거해 복합 인덱스 없이도 동작하게 하고, 클라이언트에서 정렬
  const q = query(
    collection(db, 'trips'),
    where('userId', '==', userId)
  );

  const snapshot = await getDocs(q);
  const trips = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    startTime: toDate(doc.data().startTime),
    endTime: doc.data().endTime ? toDate(doc.data().endTime) : undefined,
    createdAt: toDate(doc.data().createdAt),
  } as Trip));

  return trips.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * 특정 여행의 상세 정보를 가져옵니다
 */
export async function getTrip(tripId: string): Promise<Trip | null> {
  const docSnap = await getDoc(doc(db, 'trips', tripId));
  if (!docSnap.exists()) return null;

  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    startTime: toDate(data.startTime),
    endTime: data.endTime ? toDate(data.endTime) : undefined,
    createdAt: toDate(data.createdAt),
  } as Trip;
}

/**
 * 특정 여행의 이동 경로 기록을 가져옵니다
 */
export async function getTripLocations(tripId: string): Promise<LocationRecord[]> {
  const snapshot = await getDocs(collection(db, 'trips', tripId, 'locations'));
  const locations = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    timestamp: toDate((doc.data().timestamp as Timestamp)),
  } as LocationRecord));
  return locations.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

/**
 * 여행 제목을 업데이트합니다
 */
export async function updateTripTitle(tripId: string, title: string): Promise<void> {
  await updateDoc(doc(db, 'trips', tripId), { title });
}
