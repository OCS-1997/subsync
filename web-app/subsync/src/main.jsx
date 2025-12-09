import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './app/store.js'
import App from './app/App.jsx'
import ClickSpark from '@/components/animations/ClickSpark.jsx'
import './index.css'

// Initialize theme before React render to prevent flash
(function initializeTheme() {
  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = savedTheme === "dark" || savedTheme === "light" 
    ? savedTheme 
    : (prefersDark ? "dark" : "light");
  
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
})();

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
  </StrictMode>
)
