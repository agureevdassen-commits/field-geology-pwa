/**
 * IndexedDB модуль для геологических записей
 * Поддерживает 4 поля: barcode, well, block, rockCode
 */

class GeologyDatabase {
  constructor() {
    this.db = null
    this.dbName = 'FieldGeologyDB'
    this.storeName = 'geology_records'
    this.version = 2
  }

  /**
   * Инициализировать базу данных
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => {
        console.error('[DB] ❌ Ошибка открытия БД:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log('[DB] ✅ БД инициализирована (v' + this.version + ')')
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result
        console.log('[DB] Обновление схемы до версии', this.version)

        // Создать или обновить хранилище
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, {
            keyPath: 'id',
            autoIncrement: true
          })

          // Создать индексы
          store.createIndex('by_timestamp', 'timestamp', { unique: false })
          store.createIndex('by_barcode', 'barcode', { unique: false })
          store.createIndex('by_block', 'block', { unique: false })
          store.createIndex('by_well', 'well', { unique: false })

          console.log('[DB] Таблица и индексы созданы')
        }
      }
    })
  }

  /**
   * Добавить запись (ОБНОВЛЕНО V2.0)
   * @param {string} barcode - Штрихкод
   * @param {number} well - Номер скважины
   * @param {number} block - Номер блока (НОВОЕ В V2.0)
   * @param {string} rockCode - Код породы
   * @returns {Promise<number>} ID добавленной записи
   */
  async addRecord(barcode, well, block, rockCode) {
    if (!this.db) await this.init()

    // Форматировать время в формате БД
    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace('T', ' ')

    const record = {
      timestamp,
      barcode,
      well: parseInt(well, 10),
      block: parseInt(block, 10),  // V2.0: Добавлено
      rockCode,
      createdAt: now.toISOString()
    }

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([this.storeName], 'readwrite')
      const store = tx.objectStore(this.storeName)
      const request = store.add(record)

      request.onerror = () => {
        console.error('[DB] ❌ Ошибка добавления записи:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        const id = request.result
        console.log('[DB] ✅ Запись добавлена (ID=' + id + '):', record)
        resolve(id)
      }

      tx.onerror = () => {
        console.error('[DB] ❌ Ошибка транзакции:', tx.error)
        reject(tx.error)
      }
    })
  }

  /**
   * Получить все записи
   */
  async getAllRecords() {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([this.storeName], 'readonly')
      const store = tx.objectStore(this.storeName)
      const request = store.getAll()

      request.onerror = () => {
        console.error('[DB] ❌ Ошибка получения записей:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        const records = request.result
        console.log('[DB] Всего записей:', records.length)
        resolve(records)
      }
    })
  }

  /**
   * Получить записи по индексу
   */
  async getRecordsByIndex(indexName, value) {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([this.storeName], 'readonly')
      const store = tx.objectStore(this.storeName)
      const index = store.index(indexName)
      const request = index.getAll(value)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  /**
   * Экспортировать в CSV (ОБНОВЛЕНО V2.0)
   * @returns {Promise<string>} CSV строка
   */
  async exportToCSV() {
    const records = await this.getAllRecords()

    // CSV заголовок с полем block (V2.0)
    let csv = 'timestamp;barcode;well;block;rock_code\n'

    // Добавить записи
    for (const record of records) {
      csv += `${record.timestamp};${record.barcode};${record.well};${record.block};${record.rockCode}\n`
    }

    console.log('[DB] CSV подготовлен для экспорта (' + records.length + ' записей)')

    return csv
  }

  /**
   * Скачать CSV файл
   */
  async downloadCSV() {
    const csv = await this.exportToCSV()
    const now = new Date()
    const timestamp = now.toISOString()
      .slice(0, 19)
      .replace(/[-:]/g, '')

    const filename = `geology_export_${timestamp}.csv`

    // Создать Blob
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })

    // Создать ссылку для скачивания
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.style.display = 'none'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    console.log('[EXPORT] ✅ CSV скачан:', filename)
    return filename
  }

  /**
   * Очистить БД
   */
  async clearDatabase() {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([this.storeName], 'readwrite')
      const store = tx.objectStore(this.storeName)
      const request = store.clear()

      request.onerror = () => {
        console.error('[DB] ❌ Ошибка очистки:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        console.log('[DB] ✅ База данных очищена')
        resolve()
      }
    })
  }

  /**
   * Получить статистику
   */
  async getStats() {
    const records = await this.getAllRecords()
    const blocks = new Set(records.map(r => r.block)).size
    const wells = new Set(records.map(r => r.well)).size

    return {
      totalRecords: records.length,
      uniqueBlocks: blocks,
      uniqueWells: wells,
      lastRecord: records[records.length - 1] || null
    }
  }
}

// Экспортировать singleton
export default new GeologyDatabase()
