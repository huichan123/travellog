import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages에 배포할 때 리포지토리 이름을 base로 설정해야 합니다.
// 예: https://username.github.io/travellog/ → base: '/travellog/'
// 로컬 개발 시에는 '/'로 동작합니다.
const base = process.env.GITHUB_ACTIONS ? '/travellog/' : '/'

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    // 큰 라이브러리들을 별도 청크로 분리해 로딩 성능 개선
    rollupOptions: {
      output: {
        manualChunks: {
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          'maps': ['@googlemaps/js-api-loader'],
          'vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
