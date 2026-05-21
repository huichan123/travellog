// ========================================
// EXIF 데이터 읽기 유틸리티
// 사진 파일에서 GPS 좌표를 추출합니다
// exifr 라이브러리를 사용합니다
// ========================================

import exifr from 'exifr';
import { Coordinates, TravelPhoto } from '../types';

/**
 * 이미지 파일에서 GPS 좌표를 추출합니다
 * EXIF 정보가 없거나 GPS 데이터가 없으면 null을 반환합니다
 */
export async function extractGPSFromImage(file: File): Promise<Coordinates | null> {
  try {
    // exifr로 GPS 데이터만 추출 (성능 최적화)
    const gps = await exifr.gps(file);

    if (gps && gps.latitude && gps.longitude) {
      return {
        lat: gps.latitude,
        lng: gps.longitude,
      };
    }
    return null;
  } catch (error) {
    // EXIF 데이터가 없거나 파싱 실패 시 null 반환 (에러가 아님)
    console.log('EXIF GPS 데이터 없음:', error);
    return null;
  }
}

/**
 * 이미지 파일에서 촬영 시간을 추출합니다
 * EXIF 정보가 없으면 현재 시간을 반환합니다
 */
export async function extractDateFromImage(file: File): Promise<Date> {
  try {
    const data = await exifr.parse(file, ['DateTimeOriginal', 'DateTime']);
    if (data?.DateTimeOriginal) {
      return new Date(data.DateTimeOriginal);
    }
    if (data?.DateTime) {
      return new Date(data.DateTime);
    }
  } catch {
    // EXIF 없음 - 현재 시간 사용
  }
  return new Date();
}

/**
 * 이미지 파일에서 모든 여행 로그용 메타데이터를 한 번에 추출합니다.
 * takenAt: EXIF에 날짜 없으면 null
 * latitude/longitude: GPS 없으면 null
 */
export async function extractTravelPhotoMetadata(
  file: File,
  id: string
): Promise<TravelPhoto> {
  const imageUrl = URL.createObjectURL(file);
  let takenAt: Date | null = null;
  let latitude: number | null = null;
  let longitude: number | null = null;

  try {
    // GPS + 날짜를 한 번의 파싱으로 추출
    const data = await exifr.parse(file, {
      pick: ['DateTimeOriginal', 'DateTime', 'GPSLatitude', 'GPSLongitude',
             'GPSLatitudeRef', 'GPSLongitudeRef'],
      translateValues: true,
    });

    if (data) {
      if (data.DateTimeOriginal) takenAt = new Date(data.DateTimeOriginal);
      else if (data.DateTime) takenAt = new Date(data.DateTime);
    }

    // GPS 좌표는 exifr.gps()가 가장 정확하게 처리함 (부호 변환 포함)
    const gps = await exifr.gps(file);
    if (gps?.latitude != null && gps?.longitude != null) {
      latitude = gps.latitude;
      longitude = gps.longitude;
    }
  } catch {
    // EXIF 파싱 실패 - 기본값 유지
  }

  return {
    id,
    fileName: file.name,
    imageUrl,
    takenAt,
    latitude,
    longitude,
    hasLocation: latitude !== null && longitude !== null,
  };
}
