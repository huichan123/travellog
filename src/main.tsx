// ========================================
// main.tsx - 앱의 진입점
// React 앱을 DOM에 마운트합니다
// ========================================

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css' // Tailwind CSS 글로벌 스타일

// React 앱을 index.html의 <div id="root"> 안에 렌더링합니다
ReactDOM.createRoot(document.getElementById('root')!).render(
  // StrictMode: 개발 중 잠재적 문제를 조기에 발견하는 모드
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
