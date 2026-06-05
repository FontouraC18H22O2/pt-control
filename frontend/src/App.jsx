import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Alunos from './pages/Alunos'; // Importar nova página
import Treinos from './pages/Treinos'; // Importar nova página
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout'; // Importar o Layout Mestre

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rota Pública */}
          <Route path="/" element={<Login />} />

          {/* Grupo de Rotas Privadas e Aninhadas */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* O URL "/dashboard" renderiza a Visão Geral (index) */}
            <Route index element={<Dashboard />} />
            
            {/* O URL "/dashboard/alunos" renderiza a Gestão de Alunos */}
            <Route path="alunos" element={<Alunos />} />
            
            {/* O URL "/dashboard/treinos" renderiza os Planos de Treino */}
            <Route path="treinos" element={<Treinos />} />
          </Route>

          {/* Fallback Global */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;