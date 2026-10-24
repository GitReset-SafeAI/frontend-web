import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/figtree'
import '@fontsource-variable/fraunces/soft.css'
import '@fontsource-variable/noto-sans-sinhala'
import '@fontsource-variable/noto-sans-tamil'
import '@fontsource-variable/noto-serif-sinhala'
import '@fontsource-variable/noto-serif-tamil'
import App from './app/App'
import './styles/index.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('The application root element was not found.')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
