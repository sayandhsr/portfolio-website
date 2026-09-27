import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'
import App from './App.jsx'

const Root = () => (
  <StrictMode>
    <App />
  </StrictMode>
)

createRoot(document.getElementById('root')).render(<Root />)
