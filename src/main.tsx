import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { brandMark } from './brand'

const favicon = document.createElement('link')
favicon.rel = 'icon'
favicon.type = 'image/png'
favicon.href = brandMark
document.head.appendChild(favicon)

document.title = 'Maison Buffet — Eventos & Contratos'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
