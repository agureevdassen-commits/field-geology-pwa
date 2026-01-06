/**
 * Модуль сканирования штрихкодов
 * Работает на 10 FPS для экономии батареи
 */

import { BrowserMultiFormatReader } from '@zxing/browser'

class BarcodeScanner {
  constructor() {
    this.codeReader = null
    this.scanning = false
    this.lastScannedBarcode = ''
    this.scanInterval = 100  // 10 FPS
    this.scanTimestamp = 0
    this.videoElement = null
    this.stream = null
    this.canvasElement = null
    this.animationFrameId = null
  }

  /**
   * Запустить сканирование
   */
  async startScanning(videoElement, onDetected) {
    try {
      console.log('[CAMERA] 📸 Инициализация камеры (10 FPS)...')

      // Запросить доступ к камере
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      })

      // Установить видеопоток
      videoElement.srcObject = stream
      this.videoElement = videoElement
      this.stream = stream
      this.scanning = true
      this.codeReader = new BrowserMultiFormatReader()

      console.log('[CAMERA] ✅ Камера инициализирована, начинаем сканирование')

      // Запустить цикл сканирования
      this.scanFrames(videoElement, onDetected)

    } catch (error) {
      console.error('[CAMERA] ❌ Ошибка доступа к камере:', error)
      throw error
    }
  }

  /**
   * Цикл сканирования (10 FPS)
   */
  async scanFrames(videoElement, onDetected) {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    const scan = async () => {
      // Если сканирование остановлено, не продолжать
      if (!this.scanning) {
        return
      }

      const now = Date.now()

      // КЛЮЧЕВАЯ ОПТИМИЗАЦИЯ: сканировать только каждые 100ms (10 FPS)
      if (now - this.scanTimestamp < this.scanInterval) {
        // Пропустить этот кадр
        this.animationFrameId = requestAnimationFrame(scan)
        return
      }

      // Обновить timestamp
      this.scanTimestamp = now

      try {
        // Получить размеры видео
        const videoWidth = videoElement.videoWidth
        const videoHeight = videoElement.videoHeight

        // Рисовать видео на canvas
        canvas.width = videoWidth
        canvas.height = videoHeight

        if (canvas.width > 0 && canvas.height > 0) {
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)

          try {
            // Попытаться декодировать штрихкод
            const result = await this.codeReader.decodeFromCanvas(canvas)

            if (result && result.text) {
              // Проверка на дубли (дебаунс)
              if (result.text !== this.lastScannedBarcode) {
                this.lastScannedBarcode = result.text

                console.log('[BARCODE] ✅ Распознан:', result.text)

                // КРИТИЧЕСКИ ВАЖНО: ОТКЛЮЧИТЬ КАМЕРУ СРАЗУ!
                this.stopScanning()

                // Вызвать callback
                if (onDetected) {
                  onDetected(result.text)
                }

                // Дебаунс
                setTimeout(() => {
                  this.lastScannedBarcode = ''
                }, 1000)
              }
            }
          } catch (error) {
            // Штрихкод не найден - это нормально
          }
        }

        // Продолжить сканирование
        this.animationFrameId = requestAnimationFrame(scan)

      } catch (error) {
        console.error('[SCAN] Ошибка:', error)
        this.animationFrameId = requestAnimationFrame(scan)
      }
    }

    // Запустить цикл
    scan()
  }

  /**
   * Остановить сканирование
   */
  stopScanning() {
    if (!this.scanning) return

    console.log('[CAMERA] 🛑 Остановка сканирования...')
    this.scanning = false

    // Отменить animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }

    // Остановить все видеотреки (экономит батарею!)
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        console.log('[CAMERA] Остановка трека:', track.kind)
        track.stop()
      })
      this.stream = null
    }

    // Очистить видеоэлемент
    if (this.videoElement) {
      this.videoElement.srcObject = null
    }

    console.log('[CAMERA] ✅ Камера отключена (батарея экономится)')
  }

  /**
   * Перезагрузить камеру
   */
  async restartScanning(videoElement, onDetected) {
    console.log('[CAMERA] 🔄 Перезагрузка камеры...')

    // Остановить текущее
    this.stopScanning()

    // Пауза перед перезагрузкой
    await new Promise(resolve => setTimeout(resolve, 500))

    // Запустить заново
    await this.startScanning(videoElement, onDetected)

    console.log('[CAMERA] ✅ Камера перезагружена')
  }

  /**
   * Ручной ввод штрихкода (для тестирования)
   */
  enableManualInput(inputElement, onDetected) {
    inputElement.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const barcode = e.target.value.trim()
        if (barcode) {
          console.log('[MANUAL] Введен штрихкод:', barcode)
          this.stopScanning()
          if (onDetected) {
            onDetected(barcode)
          }
          e.target.value = ''
        }
      }
    })
  }
}

// Экспортировать singleton
export default new BarcodeScanner()
