import React, { useState, useRef, useEffect } from 'react'
import './styles/global.css'
import './styles/form.css'
import './styles/dialog.css'
import './styles/mobile.css'
import './styles/camera.css'


import database from './modules/database'
import scanner from './modules/camera'
import { exportToCSV, shareCSV } from './modules/export'
import { validateForm, isCameraAvailable } from './modules/utils'

import Toast from './components/Toast'
import ConfirmDialog from './components/ConfirmDialog'

function App() {
  // СОСТОЯНИЕ ФОРМЫ (4 ПОЛЯ V2.0)
  const [barcode, setBarcode] = useState('')
  const [well, setWell] = useState('')
  const [block, setBlock] = useState('')  // НОВОЕ В V2.0
  const [rock, setRock] = useState('520')

  // СОСТОЯНИЕ ДИАЛОГА (НОВОЕ В V2.0)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  // СОСТОЯНИЕ UI
  const [recordCount, setRecordCount] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [cameraAvailable, setCameraAvailable] = useState(false)

  // REFS
  const videoRef = useRef(null)
  const barcodeInputRef = useRef(null)
  const wellInputRef = useRef(null)
  const blockInputRef = useRef(null)

  // ИНИЦИАЛИЗАЦИЯ
  useEffect(() => {
    initApp()
  }, [])

  async function initApp() {
    try {
      console.log('[APP] 🚀 Инициализация приложения...')

      // Инициализировать БД
      await database.init()

      // Загрузить блок из localStorage (V2.0)
      const savedBlock = localStorage.getItem('lastBlock')
      if (savedBlock) {
        setBlock(savedBlock)
        console.log('[APP] Блок загружен из localStorage:', savedBlock)
      }

      // Загрузить счетчик записей
      const records = await database.getAllRecords()
      setRecordCount(records.length)

      // Проверить камеру
      const hasCamera = await isCameraAvailable()
      setCameraAvailable(hasCamera)
      console.log('[APP] Камера доступна:', hasCamera)

      // Инициализировать камеру
      if (videoRef.current && hasCamera) {
        try {
          await scanner.startScanning(videoRef.current, handleBarcodeDetected)
        } catch (error) {
          console.warn('[APP] ⚠️ Не удалось инициализировать камеру:', error)
          setError('⚠️ Камера недоступна. Используйте ручной ввод.')
        }
      }

      console.log('[APP] ✅ Приложение инициализировано')
    } catch (error) {
      console.error('[APP] ❌ Ошибка инициализации:', error)
      setError('❌ Ошибка инициализации приложения')
    }
  }

  // СОХРАНИТЬ БЛОК В LOCALSTORAGE (V2.0)
  useEffect(() => {
    if (block) {
      localStorage.setItem('lastBlock', block)
    }
  }, [block])

  // ОЧИСТИТЬ ФОРМУ (БЕЗ БЛОКА!)
  function clearForm() {
    setBarcode('')
    setWell('')
    // НЕ ОЧИЩАЕМ БЛОК - это персистентно (V2.0)
    // setBlock('')
    setRock('520')
  }

  // ПОКАЗАТЬ ДИАЛОГ ПОДТВЕРЖДЕНИЯ (V2.0)
  function handleClearClick() {
    setShowConfirmDialog(true)
  }

  // ПОДТВЕРДИТЬ ОЧИСТКУ (V2.0)
  async function confirmClear() {
    clearForm()
    setShowConfirmDialog(false)
    setError('')
    setSuccess('')

    // Перезагрузить камеру
    if (videoRef.current && cameraAvailable) {
      try {
        await scanner.restartScanning(videoRef.current, handleBarcodeDetected)
        console.log('[APP] Камера перезагружена после очистки')
      } catch (error) {
        console.warn('[APP] Ошибка перезагрузки камеры:', error)
      }
    }

    // Фокус на скважину
    setTimeout(() => {
      wellInputRef.current?.focus()
    }, 100)
  }

  // ОБРАБОТАТЬ ОБНАРУЖЕННЫЙ ШТРИХКОД
  function handleBarcodeDetected(barcodeText) {
    console.log('[APP] Штрихкод обнаружен:', barcodeText)
    setBarcode(barcodeText)

    // Фокус на скважину
    setTimeout(() => {
      wellInputRef.current?.focus()
    }, 100)
  }

  // СОХРАНИТЬ ЗАПИСЬ
  async function saveRecord(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      // Валидировать форму
      const validation = validateForm(barcode, well, block, rock)
      if (!validation.isValid) {
        setError(validation.errors.join('\n'))
        setLoading(false)
        return
      }

      // Добавить в БД
      const recordId = await database.addRecord(barcode, well, block, rock)

      // Обновить счетчик
      const records = await database.getAllRecords()
      setRecordCount(records.length)

      // Показать успех
      setSuccess(
        `✅ Запись сохранена!\n` +
        `📍 Скважина: ${well}\n` +
        `📦 Блок: ${block}\n` +
        `🔢 Штрихкод: ${barcode}`
      )

      console.log('[APP] ✅ Запись успешно сохранена (ID=' + recordId + ')')

      // Очистить форму (блок не очищается!)
      clearForm()

      // Перезагрузить камеру
      if (videoRef.current && cameraAvailable) {
        try {
          await scanner.restartScanning(videoRef.current, handleBarcodeDetected)
        } catch (error) {
          console.warn('[APP] Ошибка перезагрузки камеры:', error)
        }
      }

      // Фокус на скважину
      setTimeout(() => {
        wellInputRef.current?.focus()
      }, 100)

    } catch (error) {
      console.error('[APP] ❌ Ошибка сохранения:', error)
      setError('❌ Ошибка сохранения записи: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // ЭКСПОРТИРОВАТЬ CSV
  async function handleExport() {
    setLoading(true)
    const result = await exportToCSV()
    if (result.success) {
      setSuccess(`✅ CSV экспортирован!\nФайл: ${result.filename}`)
    } else {
      setError('❌ Ошибка экспорта: ' + result.error)
    }
    setLoading(false)
  }

  // ПОДЕЛИТЬСЯ CSV
  async function handleShare() {
    setLoading(true)
    const result = await shareCSV()
    if (result.success) {
      setSuccess(result.message || '✅ Данные поделены!')
    } else if (!result.cancelled) {
      setError('❌ Ошибка обмена: ' + result.error)
    }
    setLoading(false)
  }

  // ОБРАБОТАТЬ НАВИГАЦИЮ ENTER/TAB
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()

        if (document.activeElement === wellInputRef.current) {
          blockInputRef.current?.focus()
        } else if (document.activeElement === blockInputRef.current) {
          document.getElementById('rock-select')?.focus()
        }
      }
    }

    wellInputRef.current?.addEventListener('keydown', handleKeyDown)
    blockInputRef.current?.addEventListener('keydown', handleKeyDown)

    return () => {
      wellInputRef.current?.removeEventListener('keydown', handleKeyDown)
      blockInputRef.current?.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // JSX
  return (
    <div className="app-container">
      {/* ШАПКА */}
      <header className="app-header">
        <h1>🔬 Сбор геологических данных</h1>
        <p className="version">v2.0 | Без интернета ✅</p>
      </header>

      {/* ОСНОВНОЕ СОДЕРЖИМОЕ */}
      <main className="app-main">
        {/* ВИДЕОПОТОК КАМЕРЫ */}
        <div className="camera-container">
          {cameraAvailable ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="camera-stream"
            />
          ) : (
            <div className="camera-placeholder">
              📷 Камера недоступна\nИспользуйте ручной ввод
            </div>
          )}
        </div>

        {/* ФОРМА (4 ПОЛЯ V2.0) */}
        <form className="data-form" onSubmit={saveRecord}>
          {/* ШТРИХКОД */}
          <div className="form-group">
            <label htmlFor="barcode-input">Штрихкод:</label>
            <input
              id="barcode-input"
              ref={barcodeInputRef}
              type="text"
              value={barcode}
              readOnly
              placeholder="Сканируйте штрихкод..."
              className="form-input barcode-input"
            />
          </div>

          {/* СКВАЖИНА */}
          <div className="form-group">
            <label htmlFor="well-input">Скважина:</label>
            <input
              id="well-input"
              ref={wellInputRef}
              type="tel"
              value={well}
              onChange={(e) => setWell(e.target.value)}
              placeholder="№ скважины"
              className="form-input"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength="6"
            />
          </div>

          {/* БЛОК (НОВОЕ В V2.0) */}
          <div className="form-group">
            <label htmlFor="block-input">Блок:</label>
            <input
              id="block-input"
              ref={blockInputRef}
              type="tel"
              value={block}
              onChange={(e) => setBlock(e.target.value)}
              placeholder="№ блока"
              className="form-input"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength="6"
            />
          </div>

          {/* ПОРОДА */}
          <div className="form-group">
            <label htmlFor="rock-select">Порода:</label>
            <select
              id="rock-select"
              value={rock}
              onChange={(e) => setRock(e.target.value)}
              className="form-select"
            >
              <option value="520">520</option>
              <option value="360">360</option>
              <option value="100">100</option>
              <option value="200">200</option>
              <option value="300">300</option>
              <option value="400">400</option>
              <option value="500">500</option>
              <option value="600">600</option>
              <option value="700">700</option>
              <option value="800">800</option>
            </select>
          </div>

          {/* СЧЕТЧИК ЗАПИСЕЙ */}
          <div className="record-counter">
            📊 Записей в БД: <strong>{recordCount}</strong>
          </div>

          {/* КНОПКИ ДЕЙСТВИЯ */}
          <div className="buttons-group">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              title="Сохранить запись в БД (Enter)"
            >
              {loading ? '⏳...' : '💾 Сохранить'}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleExport}
              disabled={loading || recordCount === 0}
              title="Скачать CSV файл"
            >
              📥 Экспорт
            </button>

            <button
              type="button"
              className="btn btn-warning"
              onClick={handleShare}
              disabled={loading || recordCount === 0}
              title="Поделиться файлом"
            >
              📤 Поделиться
            </button>

            <button
              type="button"
              className="btn btn-danger"
              onClick={handleClearClick}
              disabled={loading}
              title="Очистить форму (кроме блока)"
            >
              🗑️ Очистить
            </button>
          </div>
        </form>

        {/* УВЕДОМЛЕНИЯ */}
        {error && <Toast type="error" message={error} />}
        {success && <Toast type="success" message={success} />}
      </main>

      {/* ДИАЛОГ ПОДТВЕРЖДЕНИЯ (НОВЫЙ В V2.0) */}
      {showConfirmDialog && (
        <ConfirmDialog
          title="Очистить поля?"
          message="Штрихкод и скважина будут удалены (блок сохранится)"
          onConfirm={confirmClear}
          onCancel={() => setShowConfirmDialog(false)}
        />
      )}

      {/* ПОДВАЛ */}
      <footer className="app-footer">
        <p>Field Geology Data Collector v2.0</p>
        <p>Progressive Web App | Работает без интернета</p>
      </footer>
    </div>
  )
}

export default App

