// ========================================
// 사진 서비스
// Firebase Storage에 사진을 올리고
// Firestore에 사진 메타데이터를 저장하는 함수들입니다
// ========================================

import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { Photo, Coordinates } from '../types';
import { toDate } from '../utils/formatters';

// ─── 사진 업로드 ───────────────────────────────────────────────────────────────

/**
 * 사진 파일을 Firebase Storage에 업로드하고
 * Firestore에 메타데이터를 저장합니다
 *
 * @param tripId - 현재 진행 중인 여행 ID
 * @param userId - 업로드하는 사용자 ID
 * @param file - 업로드할 이미지 파일
 * @param coordinates - GPS 좌표 (EXIF 또는 현재 위치)
 * @param memo - 사용자가 작성한 메모
 * @param exifUsed - EXIF GPS 정보 사용 여부
 * @param onProgress - 업로드 진행률 콜백 (0~100)
 * @returns 저장된 Photo 객체
 */
export async function uploadPhoto(
  tripId: string,
  userId: string,
  file: File,
  coordinates: Coordinates,
  memo: string,
  exifUsed: boolean,
  onProgress?: (progress: number) => void
): Promise<Photo> {
  // 고유한 파일 경로 생성: trips/{tripId}/photos/{userId}_{타임스탬프}_{파일명}
  const timestamp = Date.now();
  const storagePath = `trips/${tripId}/photos/${userId}_${timestamp}_${file.name}`;
  const storageRef = ref(storage, storagePath);

  // Storage에 파일 업로드 (진행률 추적 포함)
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      // 진행률 업데이트
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(Math.round(progress));
      },
      // 업로드 에러
      (error) => {
        console.error('사진 업로드 실패:', error);
        reject(error);
      },
      // 업로드 완료
      async () => {
        // Storage에서 다운로드 URL 가져오기
        const imageUrl = await getDownloadURL(uploadTask.snapshot.ref);

        // Firestore에 사진 메타데이터 저장
        const photoData = {
          imageUrl,
          lat: coordinates.lat,
          lng: coordinates.lng,
          timestamp: serverTimestamp(),
          memo,
          exifUsed,
          tripId,
          userId,
        };

        const docRef = await addDoc(
          collection(db, 'trips', tripId, 'photos'),
          photoData
        );

        resolve({
          id: docRef.id,
          imageUrl,
          lat: coordinates.lat,
          lng: coordinates.lng,
          timestamp: new Date(),
          memo,
          exifUsed,
          tripId,
        });
      }
    );
  });
}

// ─── 사진 조회 ─────────────────────────────────────────────────────────────────

/**
 * 특정 여행의 모든 사진을 시간순으로 가져옵니다
 */
export async function getTripPhotos(tripId: string): Promise<Photo[]> {
  const q = query(
    collection(db, 'trips', tripId, 'photos'),
    orderBy('timestamp', 'asc') // 시간순 정렬
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    timestamp: toDate(doc.data().timestamp as Timestamp),
  } as Photo));
}

// ─── 대표 사진 설정 ────────────────────────────────────────────────────────────

/**
 * 여행의 대표 사진 URL을 업데이트합니다
 * 첫 번째 사진이 업로드될 때 자동으로 대표 사진으로 설정됩니다
 */
export async function updateCoverImage(tripId: string, imageUrl: string): Promise<void> {
  await updateDoc(doc(db, 'trips', tripId), {
    coverImageUrl: imageUrl,
  });
}
