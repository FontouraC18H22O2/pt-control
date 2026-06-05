import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Componente de Alta Ordem (HOC) para trancar ecrãs privados.
 * Se o utilizador não estiver autenticado, é redirecionado para a raiz (Login).
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    // Redireciona para o login e substitui o histórico para o utilizador não conseguir voltar atrás com a seta do browser
    return <Navigate to="/" replace />;
  }

  // Se estiver autenticado, renderiza a página privada (ex: Dashboard)
  return children;
}