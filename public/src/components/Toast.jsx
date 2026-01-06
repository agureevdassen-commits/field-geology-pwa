import React, { useEffect, useState } from 'react'

function Toast({ type, message }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
    }, 5000) // 5 сек

    return () => clearTimeout(timer)
  }, [message])

  if (!visible) return null

  const className = `toast toast-${type}`

  return (
    <div className={className}>
      <div className="toast-content">
        {message.split('\n').map((line, idx) => (
          <p key={idx}>{line}</p>
        ))}
      </div>
      <button
        className="toast-close"
        onClick={() => setVisible(false)}
        aria-label="Закрыть"
      >
        ✕
      </button>
    </div>
  )
}

export default Toast
