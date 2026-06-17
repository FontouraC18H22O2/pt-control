import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, role, user } = useAuth();
  const location = useLocation();

  // 1. Validação de Autenticação Básica
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Salvaguarda caso o estado do role ainda esteja a carregar do localStorage
  if (isAuthenticated && !role) {
    return null;
  }

  // 2. Bloqueio e Redirecionamento se for um PT com palavra-passe temporária ativa
  const temQueMudarPassword = user?.mustChangePassword === true || user?.mustChangePassword === 1;

  if (temQueMudarPassword && role === 'PT' && location.pathname !== '/dashboard/perfil') {
    console.log("⚠️ Redirecionamento forçado para o Perfil: Palavra-passe temporária ativa.");
    return <Navigate to="/dashboard/perfil" replace />;
  }

  // 3. Validação do Nível de Acesso (RBAC)
  if (allowedRoles && !allowedRoles.includes(role)) {
    if (role === 'GUEST') {
      return <Navigate to="/dashboard/galeria" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}