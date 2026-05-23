import { useNavigate } from 'react-router-dom';
import { TravelPhoto } from '../../types';
import { formatDate, formatTime } from '../../utils/formatters';

export interface FeedItem {
  key: string;
  logId: string;
  logTitle: string;
  logColor: string;
  photo: TravelPhoto;
  sortTime: number;
}

export default function FeedCard({ item }: { item: FeedItem }) {
  const navigate = useNavigate();
  const { photo, logTitle, logColor, logId } = item;

  return (
    <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      {/* 사진 */}
      <div
        className="relative bg-gray-100 overflow-hidden cursor-pointer"
        style={{ aspectRatio: '4/3' }}
        onClick={() => navigate(`/travel-logs/${logId}`)}
      >
        {photo.imageUrl ? (
          <img
            src={photo.imageUrl}
            alt={photo.name || photo.fileName}
            className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <span className="text-5xl">📷</span>
          </div>
        )}
        {photo.hasLocation && (
          <span className="absolute top-2 left-2 bg-emerald-500/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
            GPS
          </span>
        )}
      </div>

      {/* 콘텐츠 */}
      <div className="px-4 pt-3 pb-4 space-y-2">
        {/* 여행 이름 배지 + 시간 */}
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <span
            className="text-[11px] font-bold px-2.5 py-1 rounded-full text-white leading-none flex-shrink-0"
            style={{ backgroundColor: logColor }}
          >
            {logTitle}
          </span>
          {photo.takenAt && (
            <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatDate(photo.takenAt)} {formatTime(photo.takenAt)}
            </div>
          )}
        </div>

        {/* 사진 이름 */}
        {photo.name && (
          <p className="text-sm font-semibold text-gray-800 leading-snug">{photo.name}</p>
        )}

        {/* GPS 위치 */}
        {photo.hasLocation && photo.latitude != null && photo.longitude != null && (
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs text-gray-400 flex-1 truncate font-mono">
              {photo.latitude.toFixed(4)}, {photo.longitude.toFixed(4)}
            </span>
            <a
              href={`https://maps.google.com/maps?q=${photo.latitude},${photo.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-sky-500 hover:text-sky-600 font-semibold whitespace-nowrap"
              onClick={e => e.stopPropagation()}
            >
              지도 보기
            </a>
          </div>
        )}

        {/* 메모 */}
        {photo.comment && (
          <div className="flex items-start gap-1.5 pt-0.5">
            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{photo.comment}</p>
          </div>
        )}
      </div>
    </article>
  );
}
