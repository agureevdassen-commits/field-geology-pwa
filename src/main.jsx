import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/global.css'

// Регистрация Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('[PWA] ✅ Service Worker зарегистрирован:', registration)
      })
      .catch((error) => {
        console.error('[PWA] ❌ Ошибка регистрации Service Worker:', error)
      })
  })
}

// Обработка обновлений (когда доступна новая версия)
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault()
  deferredPrompt = event
  console.log('[PWA] Приложение можно установить')
})

// Рендеринг приложения
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
