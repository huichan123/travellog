// ========================================
// 여행 로그 서비스 (EXIF 기반)
// Firestore에서 TravelLog 데이터를 읽고 씁니다.
// 사진 파일은 Firebase Storage에 저장합니다.
// ========================================

import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { TravelLog, TravelPhoto, RoutePoint } from '../types';
import { toDate } from '../utils/formatters';

// ─── 사진 업로드 (Storage) ─────────────────────────────────────────────────────

/**
 * 사진 파일을 Firebase Storage에 업로드하고 다운로드 URL을 반환합니다.
 * 로컬 Object URL을 실제 Storage URL로 교체할 때 사용합니다.
 */
export async function uploadTravelPhoto(
  userId: string,
  logId: string,
  photoId: string,
  file: File
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `travel-logs/${userId}/${logId}/${photoId}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

// ─── 여행 로그 저장 ────────────────────────────────────────────────────────────

/**
 * 여행 로그를 Firestore에 저장합니다.
 * photos 배열의 imageUrl은 이미 Storage URL이어야 합니다.
 */
export async function saveTravelLog(
  userId: string,
  log: Omit<TravelLog, 'id' | 'createdAt'>
): Promise<string> {
  const data = {
    ...log,
    userId,
    createdAt: serverTimestamp(),
    photos: log.photos.map(serializePhoto),
    route: log.route.map(serializeRoutePoint),
  };

  const docRef = await addDoc(collection(db, 'travelLogs'), data);
  return docRef.id;
}

// ─── 여행 로그 조회 ────────────────────────────────────────────────────────────

export async function getUserTravelLogs(userId: string): Promise<TravelLog[]> {
  const q = query(
    collection(db, 'travelLogs'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => deserializeTravelLog(d.id, d.data()));
}

export async function getTravelLog(logId: string): Promise<TravelLog | null> {
  const docSnap = await getDoc(doc(db, 'travelLogs', logId));
  if (!docSnap.exists()) return null;
  return deserializeTravelLog(docSnap.id, docSnap.data());
}

// ─── 여행 로그 삭제 ────────────────────────────────────────────────────────────

export async function deleteTravelLog(
  userId: string,
  logId: string,
  photos: TravelPhoto[]
): Promise<void> {
  // Storage에서 사진 파일 삭제
  await Promise.allSettled(
    photos.map(p => {
      if (!p.imageUrl.startsWith('blob:')) {
        const storageRef = ref(storage, `travel-logs/${userId}/${logId}`);
        return deleteObject(storageRef).catch(() => null);
      }
      return Promise.resolve();
    })
  );
  await deleteDoc(doc(db, 'travelLogs', logId));
}

// ─── 직렬화 / 역직렬화 헬퍼 ───────────────────────────────────────────────────

function serializePhoto(p: TravelPhoto) {
  return {
    ...p,
    takenAt: p.takenAt ? Timestamp.fromDate(p.takenAt) : null,
  };
}

function serializeRoutePoint(r: RoutePoint) {
  return {
    ...r,
    takenAt: Timestamp.fromDate(r.takenAt),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deserializeTravelLog(id: string, data: any): TravelLog {
  return {
    id,
    userId: data.userId,
    title: data.title,
    createdAt: toDate(data.createdAt),
    startPhotoId: data.startPhotoId,
    endPhotoId: data.endPhotoId,
    coverImageUrl: data.coverImageUrl ?? undefined,
    photoCount: data.photoCount ?? 0,
    locationCount: data.locationCount ?? 0,
    photos: (data.photos ?? []).map(deserializePhoto),
    route: (data.route ?? []).map(deserializeRoutePoint),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deserializePhoto(p: any): TravelPhoto {
  return {
    ...p,
    takenAt: p.takenAt ? toDate(p.takenAt) : null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deserializeRoutePoint(r: any): RoutePoint {
  return {
    ...r,
    takenAt: toDate(r.takenAt),
  };
}
