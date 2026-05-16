import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { ThemeContextProvider } from './context/ThemeContext.jsx'
import { SocketProvider } from './context/SocketContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeContextProvider>
        <SocketProvider>
          <App />
        </SocketProvider>
      </ThemeContextProvider>
    </BrowserRouter>
  </StrictMode>
)

