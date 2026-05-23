import { useMemo } from 'react';
import { TravelLog } from '../../types';
import FeedCard, { FeedItem } from './FeedCard';

type FeedEntry =
  | { type: 'date'; key: string; label: string }
  | { type: 'photo'; item: FeedItem };

interface Props {
  logs: TravelLog[];
  activeLogId: string | null;
  onFilterChange: (id: string | null) => void;
}

export default function TravelFeed({ logs, activeLogId, onFilterChange }: Props) {
  const entries = useMemo((): FeedEntry[] => {
    const filtered = activeLogId ? logs.filter(l => l.id === activeLogId) : logs;

    const items: FeedItem[] = filtered.flatMap(log =>
      log.photos.map(photo => ({
        key: `${log.id}_${photo.id}`,
        logId: log.id!,
        logTitle: log.title,
        logColor: log.routeColor ?? '#0ea5e9',
        photo,
        sortTime: photo.takenAt?.getTime() ?? log.createdAt.getTime(),
      }))
    );
    items.sort((a, b) => b.sortTime - a.sortTime);

    const result: FeedEntry[] = [];
    let lastDate = '';
    for (const item of items) {
      const dateLabel = item.photo.takenAt
        ? item.photo.takenAt.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'short',
          })
        : '날짜 없음';
      if (dateLabel !== lastDate) {
        result.push({ type: 'date', key: `date_${dateLabel}_${item.logId}`, label: dateLabel });
        lastDate = dateLabel;
      }
      result.push({ type: 'photo', item });
    }
    return result;
  }, [logs, activeLogId]);

  const photoCount = entries.filter(e => e.type === 'photo').length;

  return (
    <section>
      {/* 피드 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-gray-800">
          여행 피드
        </h2>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          {photoCount}장
        </span>
      </div>

      {/* 필터 칩 */}
      <div
        className="flex gap-1.5 mb-4 overflow-x-auto pb-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
      >
        <button
          onClick={() => onFilterChange(null)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            activeLogId === null
              ? 'bg-sky-500 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          전체
        </button>
        {logs.map(log => (
          <button
            key={log.id}
            onClick={() => onFilterChange(activeLogId === log.id ? null : log.id!)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              activeLogId === log.id
                ? 'text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            style={
              activeLogId === log.id
                ? { backgroundColor: log.routeColor ?? '#0ea5e9' }
                : {}
            }
          >
            {log.title}
          </button>
        ))}
      </div>

      {/* 피드 목록 */}
      {photoCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-gray-100">
          <span className="text-5xl mb-3">📸</span>
          <p className="text-sm font-semibold text-gray-500 mb-1">
            아직 기록된 사진 피드가 없습니다
          </p>
          <p className="text-xs text-gray-400">여행 로그를 추가하면 피드가 나타납니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map(entry => {
            if (entry.type === 'date') {
              return (
                <div key={entry.key} className="flex items-center gap-3 py-1.5">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-[11px] font-semibold text-gray-400 whitespace-nowrap">
                    {entry.label}
                  </span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
              );
            }
            return <FeedCard key={entry.item.key} item={entry.item} />;
          })}
          <div className="h-4" />
        </div>
      )}
    </section>
  );
}
