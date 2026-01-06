import { BrowserMultiFormatReader, NotFoundException } from '@zxing/browser'

class BarcodeScanner {
  constructor() {
    this.codeReader = new BrowserMultiFormatReader()
    this.isScanning = false
    this.scanningInterval = null
  }

  // Запросить разрешение на доступ к камере
  async requestCameraPermission() {
    try {
      console.log('[CAMERA] 📷 Запрашиваю разрешение на камеру...')
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Задняя камера на телефоне
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      })

      console.log('[CAMERA] ✅ Разрешение на камеру получено!')
      
      // Закрыть поток (нужен только для проверки разрешения)
      stream.getTracks().forEach(track => track.stop())
      
      return true
    } catch (error) {
      console.error('[CAMERA] ❌ Ошибка разрешения:', error.message)
      
      if (error.name === 'NotAllowedError') {
        console.warn('[CAMERA] ⚠️ Пользователь запретил доступ к камере')
      } else if (error.name === 'NotFoundError') {
        console.warn('[CAMERA] ⚠️ Камера не найдена')
      }
      
      return false
    }
  }

  // Начать сканирование
  async startScanning(videoElement, onBarcodeDetected) {
    try {
      if (!videoElement) {
        console.error('[CAMERA] ❌ Видео элемент не найден!')
        return false
      }

      // Проверить разрешение
      const hasPermission = await this.requestCameraPermission()
      if (!hasPermission) {
        console.error('[CAMERA] ❌ Нет разрешения на камеру')
        return false
      }

      console.log('[CAMERA] 🎬 Начинаю сканирование...')

      // Декодировать поток
      this.codeReader.decodeFromVideoDevice(
        null, // Выбрать устройство по умолчанию
        videoElement,
        (result, error) => {
          if (result) {
            const barcode = result.getText()
            console.log('[CAMERA] ✅ Найден штрихкод:', barcode)
            
            if (onBarcodeDetected) {
              onBarcodeDetected(barcode)
            }
            
            // Остановить и перезагрузить для следующего сканирования
            this.restartScanning(videoElement, onBarcodeDetected)
          }

          if (error && !(error instanceof NotFoundException)) {
            console.warn('[CAMERA] ⚠️ Ошибка декодирования:', error.message)
          }
        }
      )

      this.isScanning = true
      console.log('[CAMERA] ✅ Сканирование активно')
      return true
    } catch (error) {
      console.error('[CAMERA] ❌ Ошибка при запуске сканирования:', error)
      return false
    }
  }

  // Перезагрузить сканирование
  async restartScanning(videoElement, onBarcodeDetected) {
    try {
      this.stopScanning()
      
      // Подождать 500ms перед перезагрузкой
      await new Promise(resolve => setTimeout(resolve, 500))
      
      await this.startScanning(videoElement, onBarcodeDetected)
    } catch (error) {
      console.error('[CAMERA] ❌ Ошибка при перезагрузке:', error)
    }
  }

  // Остановить сканирование
  stopScanning() {
    try {
      if (this.codeReader) {
        this.codeReader.reset()
      }
      this.isScanning = false
      console.log('[CAMERA] ⏹️ Сканирование остановлено')
    } catch (error) {
      console.error('[CAMERA] ❌ Ошибка при остановке:', error)
    }
  }

  // Получить список доступных устройств
  async getDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      console.log('[CAMERA] 📹 Доступные камеры:', videoDevices)
      return videoDevices
    } catch (error) {
      console.error('[CAMERA] ❌ Ошибка при получении устройств:', error)
      return []
    }
  }

  // Проверить доступность камеры
  async isCameraAvailable() {
    try {
      const devices = await this.getDevices()
      return devices.length > 0
    } catch (error) {
      console.error('[CAMERA] ❌ Ошибка при проверке камеры:', error)
      return false
    }
  }
}

// Экспортировать синглтон
const BarcodeScanner_instance = new BarcodeScanner()

export default BarcodeScanner_instance
