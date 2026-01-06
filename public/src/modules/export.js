/**
 * Модуль экспорта и обмена данными
 */

import database from './database'

/**
 * Экспортировать в CSV (скачать)
 */
export async function exportToCSV() {
  try {
    console.log('[EXPORT] 📥 Начинаю экспорт CSV...')
    const filename = await database.downloadCSV()
    return { success: true, filename }
  } catch (error) {
    console.error('[EXPORT] ❌ Ошибка экспорта:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Поделиться CSV через Web Share API (или скачать)
 */
export async function shareCSV() {
  try {
    console.log('[SHARE] 📤 Начинаю обмен данными...')

    const csv = await database.exportToCSV()
    const timestamp = new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[-:]/g, '')

    const filename = `geology_export_${timestamp}.csv`

    // Проверить Web Share API
    if (navigator.share) {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const file = new File([blob], filename, { type: 'text/csv' })

      await navigator.share({
        title: 'Геологические данные',
        text: 'Экспорт записей',
        files: [file]
      })

      console.log('[SHARE] ✅ Данные поделены')
      return { success: true, message: 'Данные поделены' }
    } else {
      // Fallback: скачать как CSV
      console.warn('[SHARE] Web Share API недоступна, скачиваю вместо этого')
      await database.downloadCSV()
      return {
        success: true,
        message: 'Файл скачан (Web Share API недоступна)'
      }
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('[SHARE] Пользователь отменил обмен')
      return { success: false, cancelled: true }
    }
    console.error('[SHARE] ❌ Ошибка обмена:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Скопировать CSV в буфер обмена
 */
export async function copyToClipboard() {
  try {
    const csv = await database.exportToCSV()
    await navigator.clipboard.writeText(csv)
    console.log('[CLIPBOARD] ✅ CSV скопирован в буфер')
    return { success: true }
  } catch (error) {
    console.error('[CLIPBOARD] ❌ Ошибка копирования:', error)
    return { success: false, error: error.message }
  }
}
