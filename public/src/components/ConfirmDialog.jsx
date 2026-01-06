import React, { useEffect } from 'react'

function ConfirmDialog({ title, message, onConfirm, onCancel }) {
  useEffect(() => {
    // Обработка Escape
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onCancel()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onCancel])

  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>{title}</h2>
        </div>

        <div className="dialog-body">
          <p>{message}</p>
        </div>

        <div className="dialog-footer">
          <button
            className="btn btn-secondary"
            onClick={onCancel}
            autoFocus
          >
            Отмена
          </button>
          <button
            className="btn btn-danger"
            onClick={onConfirm}
          >
            Очистить
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
