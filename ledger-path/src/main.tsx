import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add error handling and console logs
console.log('Starting React app...');

const rootElement = document.getElementById("root");
console.log('Root element:', rootElement);

if (!rootElement) {
  console.error('Root element not found!');
} else {
  console.log('Root element found, rendering app...');
  createRoot(rootElement).render(<App />);
}
