import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './app/store.js'
import App from './app/App.jsx'
import ClickSpark from '@/components/animations/ClickSpark.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <ClickSpark
      sparkColor = '#3b82f6'
      sparkSize = {15}
      sparkRadius = {35}
      sparkCount = {8}
      duration = {400}
      extraScale = {1.0}
      >
        <App />
      </ClickSpark>
    </Provider>
  </StrictMode>,
)
