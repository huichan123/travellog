import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserTrips, deleteTrip, updateTripTitle } from '../services/tripService';
import { getUserTravelLogs, deleteTravelLog, updateTravelLogTitle } from '../services/travelLogService';
import { Trip, TravelLog } from '../types';
import TripCard from '../components/trips/TripCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { formatDate } from '../utils/formatters';

export default function TripsPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [travelLogs, setTravelLogs] = useState<TravelLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'realtime' | 'photo'>('realtime');

  // 편집 모드
  const [editMode, setEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 이름 변경 모달
  const [renameTarget, setRenameTarget] = useState<{ id: string; title: string; type: 'trip' | 'log' } | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameLoading, setRenameLoading] = useState(false);

  // 삭제 확인 모달
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      try {
        const [tripsData, logsData] = await Promise.all([
          getUserTrips(currentUser.uid),
          getUserTravelLogs(currentUser.uid),
        ]);
        setTrips(tripsData);
        setTravelLogs(logsData);
      } catch {
        setError('기록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser]);

  // 탭 변경 시 선택 초기화
  const handleTabChange = (tab: 'realtime' | 'photo') => {
    setActiveTab(tab);
    setSelectedIds(new Set());
    setEditMode(false);
  };

  // 편집 모드 종료 시 선택 초기화
  const exitEditMode = () => {
    setEditMode(false);
    setSelectedIds(new Set());
  };

  // 체크박스 토글
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    const currentList = activeTab === 'realtime' ? trips : travelLogs;
    const allIds = new Set(currentList.map(item => item.id!));
    if (selectedIds.size === allIds.size) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(allIds);
    }
  };

  // 삭제 실행
  const handleDelete = async () => {
    if (!currentUser || selectedIds.size === 0) return;
    setDeleteLoading(true);
    try {
      if (activeTab === 'realtime') {
        await Promise.all([...selectedIds].map(id => deleteTrip(id)));
        setTrips(prev => prev.filter(t => !selectedIds.has(t.id!)));
      } else {
        const logsToDelete = travelLogs.filter(l => selectedIds.has(l.id!));
        await Promise.all(
          logsToDelete.map(l => deleteTravelLog(currentUser.uid, l.id!, l.photos))
        );
        setTravelLogs(prev => prev.filter(l => !selectedIds.has(l.id!)));
      }
      setShowDeleteConfirm(false);
      exitEditMode();
    } catch {
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // 이름 변경 모달 열기 (선택된 1개)
  const openRename = () => {
    const [id] = [...selectedIds];
    if (activeTab === 'realtime') {
      const trip = trips.find(t => t.id === id);
      if (trip) { setRenameTarget({ id, title: trip.title, type: 'trip' }); setRenameValue(trip.title); }
    } else {
      const log = travelLogs.find(l => l.id === id);
      if (log) { setRenameTarget({ id, title: log.title, type: 'log' }); setRenameValue(log.title); }
    }
  };

  // 이름 변경 저장
  const handleRename = async () => {
    if (!renameTarget || !renameValue.trim()) return;
    setRenameLoading(true);
    try {
      if (renameTarget.type === 'trip') {
        await updateTripTitle(renameTarget.id, renameValue.trim());
        setTrips(prev => prev.map(t => t.id === renameTarget.id ? { ...t, title: renameValue.trim() } : t));
      } else {
        await updateTravelLogTitle(renameTarget.id, renameValue.trim());
        setTravelLogs(prev => prev.map(l => l.id === renameTarget.id ? { ...l, title: renameValue.trim() } : l));
      }
      setRenameTarget(null);
      exitEditMode();
    } catch {
      alert('이름 변경 중 오류가 발생했습니다.');
    } finally {
      setRenameLoading(false);
    }
  };

  const currentList = activeTab === 'realtime' ? trips : travelLogs;
  const isEmpty = currentList.length === 0;
  const allSelected = selectedIds.size === currentList.length && currentList.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">여행 기록</h1>
          <div className="flex gap-2">
            {!editMode ? (
              <>
                {!isEmpty && (
                  <button
                    onClick={() => setEditMode(true)}
                    className="btn-secondary text-sm"
                  >
                    편집
                  </button>
                )}
                {activeTab === 'realtime' ? (
                  <button onClick={() => navigate('/map')} className="btn-primary text-sm">
                    새 여행 시작
                  </button>
                ) : (
                  <button onClick={() => navigate('/travel-logs/new')} className="btn-primary text-sm flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    새 여행 로그
                  </button>
                )}
              </>
            ) : (
              <button onClick={exitEditMode} className="btn-secondary text-sm">
                취소
              </button>
            )}
          </div>
        </div>

        {/* 탭 */}
        <div className="flex bg-white rounded-xl shadow-sm p-1 mb-5 border border-gray-100">
          <button
            onClick={() => handleTabChange('photo')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'photo' ? 'bg-sky-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📷 사진 여행 로그
            {travelLogs.length > 0 && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === 'photo' ? 'bg-white/20' : 'bg-gray-100 text-gray-500'
              }`}>{travelLogs.length}</span>
            )}
          </button>
          <button
            onClick={() => handleTabChange('realtime')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'realtime' ? 'bg-sky-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📍 실시간 기록
            {trips.length > 0 && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === 'realtime' ? 'bg-white/20' : 'bg-gray-100 text-gray-500'
              }`}>{trips.length}</span>
            )}
          </button>
        </div>

        {/* 편집 모드 전체선택 바 */}
        {editMode && !isEmpty && (
          <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 mb-4 shadow-sm border border-gray-100">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-sm font-medium text-gray-700"
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                allSelected ? 'bg-sky-500 border-sky-500' : 'border-gray-300'
              }`}>
                {allSelected && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              전체 선택 ({selectedIds.size}/{currentList.length})
            </button>
          </div>
        )}

        {/* 로딩 */}
        {loading && (
          <div className="flex justify-center py-16">
            <LoadingSpinner message="기록을 불러오는 중..." />
          </div>
        )}

        {/* 에러 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">{error}</div>
        )}

        {/* 빈 상태 */}
        {!loading && !error && isEmpty && (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
            {activeTab === 'photo' ? (
              <>
                <div className="text-6xl mb-4">📷</div>
                <p className="text-gray-700 font-semibold text-lg mb-2">사진 여행 로그가 없습니다</p>
                <p className="text-gray-400 text-sm mb-6">아이폰 사진을 업로드하면 GPS 정보로 자동 경로를 만들어드려요</p>
                <button onClick={() => navigate('/travel-logs/new')} className="btn-primary">새 여행 로그 만들기</button>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">🌏</div>
                <p className="text-gray-700 font-semibold text-lg mb-2">실시간 여행 기록이 없습니다</p>
                <p className="text-gray-400 text-sm mb-6">GPS로 이동 경로를 실시간으로 기록하고 사진을 추가해보세요</p>
                <button onClick={() => navigate('/map')} className="btn-primary">여행 시작하기</button>
              </>
            )}
          </div>
        )}

        {/* 사진 여행 로그 그리드 */}
        {!loading && activeTab === 'photo' && travelLogs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {travelLogs.map(log => (
              <div key={log.id} className="relative group">
                {/* 체크박스 */}
                {editMode && (
                  <button
                    onClick={() => toggleSelect(log.id!)}
                    className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shadow-sm"
                    style={{
                      backgroundColor: selectedIds.has(log.id!) ? '#0ea5e9' : 'white',
                      borderColor: selectedIds.has(log.id!) ? '#0ea5e9' : '#d1d5db',
                    }}
                  >
                    {selectedIds.has(log.id!) && (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                )}

                <div
                  className={`bg-white rounded-2xl shadow-sm overflow-hidden border transition-all ${
                    editMode
                      ? selectedIds.has(log.id!)
                        ? 'border-sky-400 ring-2 ring-sky-200'
                        : 'border-gray-100 opacity-70'
                      : 'border-gray-100 cursor-pointer hover:shadow-md'
                  }`}
                  onClick={() => {
                    if (editMode) toggleSelect(log.id!);
                    else navigate(`/travel-logs/${log.id}`);
                  }}
                >
                  <div className="aspect-video bg-gray-100 overflow-hidden">
                    {log.coverImageUrl ? (
                      <img src={log.coverImageUrl} alt={log.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">📷</div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 truncate">{log.title}</h3>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(log.createdAt)}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span>📷 {log.photoCount}장</span>
                      <span>·</span>
                      <span className="text-emerald-600">📍 {log.locationCount}장 GPS</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 실시간 여행 카드 그리드 */}
        {!loading && activeTab === 'realtime' && trips.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trips.map(trip => (
              <div key={trip.id} className="relative group">
                {/* 체크박스 */}
                {editMode && (
                  <button
                    onClick={() => toggleSelect(trip.id!)}
                    className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shadow-sm"
                    style={{
                      backgroundColor: selectedIds.has(trip.id!) ? '#0ea5e9' : 'white',
                      borderColor: selectedIds.has(trip.id!) ? '#0ea5e9' : '#d1d5db',
                    }}
                  >
                    {selectedIds.has(trip.id!) && (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                )}

                <div className={editMode ? selectedIds.has(trip.id!) ? 'ring-2 ring-sky-200 rounded-2xl' : 'opacity-70' : ''}>
                  <TripCard
                    trip={trip}
                    onClick={() => {
                      if (editMode) toggleSelect(trip.id!);
                      else navigate(`/trips/${trip.id}`);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 편집 모드 하단 액션 바 */}
      {editMode && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
            <span className="text-sm text-gray-500 flex-1">
              {selectedIds.size > 0 ? `${selectedIds.size}개 선택됨` : '항목을 선택하세요'}
            </span>
            <button
              onClick={openRename}
              disabled={selectedIds.size !== 1}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              이름 변경
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={selectedIds.size === 0}
              className="px-4 py-2 text-sm font-medium rounded-xl bg-red-500 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-600 transition-colors"
            >
              삭제 ({selectedIds.size})
            </button>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">삭제하시겠어요?</h3>
            <p className="text-gray-500 text-sm mb-6">
              선택한 {selectedIds.size}개의 여행 기록이 영구적으로 삭제됩니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteLoading}
                className="btn-secondary flex-1"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleteLoading ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 이름 변경 모달 */}
      {renameTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">이름 변경</h3>
            <input
              type="text"
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRename()}
              className="input-field mb-4"
              placeholder="새 이름을 입력하세요"
              maxLength={60}
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setRenameTarget(null)}
                disabled={renameLoading}
                className="btn-secondary flex-1"
              >
                취소
              </button>
              <button
                onClick={handleRename}
                disabled={!renameValue.trim() || renameLoading}
                className="btn-primary flex-1"
              >
                {renameLoading ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
