/**
 * Утилиты валидации и форматирования
 */

/**
 * Валидировать форму (4 поля)
 */
export function validateForm(barcode, well, block, rock) {
  const errors = []

  // Проверка штрихкода
  if (!barcode || !barcode.trim()) {
    errors.push('❌ Пожалуйста, отсканируйте штрихкод')
  }

  // Проверка скважины
  if (!well || !well.trim()) {
    errors.push('❌ Пожалуйста, введите номер скважины')
  } else {
    const wellNum = parseInt(well, 10)
    if (isNaN(wellNum) || wellNum < 1 || wellNum > 999999) {
      errors.push('❌ Скважина должна быть от 1 до 999999')
    }
  }

  // Проверка блока (V2.0)
  if (!block || !block.trim()) {
    errors.push('❌ Пожалуйста, введите номер блока')
  } else {
    const blockNum = parseInt(block, 10)
    if (isNaN(blockNum) || blockNum < 1 || blockNum > 999999) {
      errors.push('❌ Блок должен быть от 1 до 999999')
    }
  }

  // Проверка породы
  if (!rock) {
    errors.push('❌ Пожалуйста, выберите породу')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Форматировать число с разделителями
 */
export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

/**
 * Получить текущую дату/время в формате БД
 */
export function getCurrentTimestamp() {
  const now = new Date()
  return now
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ')
}

/**
 * Проверить если устройство поддерживает PWA
 */
export function isPWACapable() {
  return (
    'serviceWorker' in navigator &&
    'caches' in window &&
    'indexedDB' in window
  )
}

/**
 * Проверить если камера доступна
 */
export async function isCameraAvailable() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.some(device => device.kind === 'videoinput')
  } catch (error) {
    console.warn('[UTILS] Ошибка проверки камеры:', error)
    return false
  }
}

/**
 * Чистить строку от спец символов
 */
export function cleanString(str) {
  return str
    .trim()
    .replace(/[^\w\s\-]/g, '')
    .substring(0, 100)
}

/**
 * Поддерживает ли браузер Web Share API
 */
export function supportsWebShare() {
  return navigator.share !== undefined
}

/**
 * Форматировать время в читаемый вид
 */
export function formatTime(timestamp) {
  // Входящий формат: "2024-01-04 10:15:30"
  try {
    const [date, time] = timestamp.split(' ')
    const [year, month, day] = date.split('-')
    return `${day}.${month}.${year} ${time}`
  } catch {
    return timestamp
  }
}
