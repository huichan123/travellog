// ========================================
// 랜딩 페이지
// 로그인하지 않은 사용자에게 보여주는 메인 페이지입니다
// 서비스 소개와 로그인 버튼을 표시합니다
// ========================================

import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      {/* 헤더 */}
      <header className="px-6 py-5 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">TL</span>
          </div>
          <span className="text-lg font-bold text-gray-800">TravelLog</span>
        </div>
        <Link to="/auth" className="btn-primary text-sm">
          시작하기
        </Link>
      </header>

      {/* 히어로 섹션 */}
      <main className="max-w-4xl mx-auto px-6 pt-16 pb-24 text-center">
        {/* 메인 슬로건 */}
        <div className="inline-flex items-center gap-2 bg-sky-100 text-sky-700 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
          <span className="w-2 h-2 bg-sky-500 rounded-full"></span>
          GPS 기반 여행 기록 서비스
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
          Your journey,{' '}
          <span className="text-sky-500">mapped</span>
          <br />
          with memories.
        </h1>

        <p className="text-lg text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          여행하면서 찍은 사진들을 지도 위에 기록하세요.
          <br />
          당신의 발자취와 소중한 순간들이 하나의 아름다운 이야기가 됩니다.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/auth" className="btn-primary px-8 py-3 text-base">
            무료로 시작하기
          </Link>
          <a
            href="#features"
            className="btn-secondary px-8 py-3 text-base"
          >
            더 알아보기
          </a>
        </div>

        {/* 지도 미리보기 이미지 영역 */}
        <div className="mt-16 relative">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-50 h-64 sm:h-80 flex items-center justify-center relative">
              {/* 가짜 지도 UI */}
              <div className="text-center">
                <div className="text-6xl mb-4">🗺️</div>
                <p className="text-sky-600 font-semibold text-lg">실시간 여행 경로 지도</p>
                <p className="text-gray-400 text-sm mt-1">GPS 위치 + 사진이 지도 위에 표시됩니다</p>
              </div>
              {/* 가짜 마커들 */}
              <div className="absolute top-8 left-16 w-10 h-10 bg-white rounded-full shadow-lg overflow-hidden border-2 border-sky-400">
                <div className="w-full h-full bg-gradient-to-br from-orange-200 to-pink-200 flex items-center justify-center text-lg">📸</div>
              </div>
              <div className="absolute top-20 right-20 w-10 h-10 bg-white rounded-full shadow-lg overflow-hidden border-2 border-sky-400">
                <div className="w-full h-full bg-gradient-to-br from-green-200 to-teal-200 flex items-center justify-center text-lg">📸</div>
              </div>
              <div className="absolute bottom-12 left-1/3 w-10 h-10 bg-white rounded-full shadow-lg overflow-hidden border-2 border-sky-400">
                <div className="w-full h-full bg-gradient-to-br from-purple-200 to-blue-200 flex items-center justify-center text-lg">📸</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 기능 소개 섹션 */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
          어떻게 작동하나요?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: '📍',
              title: 'GPS 위치 추적',
              description: '여행 시작 버튼을 누르면 자동으로 이동 경로를 기록합니다. 실시간으로 지도에 표시됩니다.',
            },
            {
              icon: '📸',
              title: '사진 업로드',
              description: '여행 중 찍은 사진을 업로드하면 GPS 위치와 함께 지도 위에 마커로 표시됩니다.',
            },
            {
              icon: '🗺️',
              title: '여행 경로 저장',
              description: '여행이 끝나면 이동 경로와 사진들이 하나의 Trip Log로 저장되어 언제든 다시 볼 수 있습니다.',
            },
          ].map((feature) => (
            <div key={feature.title} className="text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="bg-sky-500 py-16 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          지금 바로 여행을 기록하세요
        </h2>
        <p className="text-sky-100 mb-8">무료로 시작할 수 있습니다</p>
        <Link to="/auth" className="inline-block bg-white text-sky-600 font-semibold px-8 py-3 rounded-xl hover:bg-sky-50 transition-colors">
          무료로 시작하기
        </Link>
      </section>

      {/* 푸터 */}
      <footer className="text-center py-8 text-gray-400 text-sm">
        © 2024 TravelLog. All rights reserved.
      </footer>
    </div>
  );
}
