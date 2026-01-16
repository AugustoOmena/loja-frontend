import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'

// Configuração Global do Cache
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5 Minutos de Stale Time (Cache "fresco")
      staleTime: 1000 * 60 * 5, 
      
      refetchOnWindowFocus: false, 
      
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)