import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes/router.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastContainer } from 'react-toastify'
import { GameHubProvider } from './context/GameHubContext.tsx'
import Background from './components/Background.tsx'

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <GameHubProvider>
        <Background>
          <RouterProvider router={router} />
          <ToastContainer />
        </Background>
      </GameHubProvider>
    </QueryClientProvider>
  </StrictMode>,
)
