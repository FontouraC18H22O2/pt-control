import React, { createContext, useState, useEffect, useContext } from 'react';

// Criar o Contexto de Autenticação
const AuthContext = createContext(null);

// Provedor do Contexto (Wrapper global)
export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Efeito executado ao iniciar a aplicação para recuperar o token guardado
  useEffect(() => {
    const storedToken = localStorage.getItem('pt_api_token');
    if (storedToken) {
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  // Função para registar o login com sucesso
  const login = (newToken) => {
    localStorage.setItem('pt_api_token', newToken);
    setToken(newToken);
  };

  // Função para fazer logout e limpar o sistema
  const logout = () => {
    localStorage.removeItem('pt_api_token');
    setToken(null);
  };

  // Enquanto verifica o localStorage, evita renderizar caminhos errados
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fitnessGym"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!token, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para consumir a autenticação de forma simples e limpa nos componentes
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado obrigatoriamente dentro de um AuthProvider');
  }
  return context;
}