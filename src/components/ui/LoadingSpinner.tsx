// ========================================
// 로딩 스피너 컴포넌트
// 데이터를 불러오는 동안 표시되는 로딩 애니메이션입니다
// ========================================

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  fullScreen?: boolean; // 전체 화면 중앙에 표시할지 여부
}

export default function LoadingSpinner({
  size = 'md',
  message,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`${sizeClasses[size]} border-sky-200 border-t-sky-500 rounded-full animate-spin`}
      />
      {message && (
        <p className="text-sm text-gray-500">{message}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}
