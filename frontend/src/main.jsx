import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/siemreap/400.css'
import './styles/globals.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
