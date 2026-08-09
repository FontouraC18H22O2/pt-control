import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios'; // 🔥 CORRIGIDO: O import correto da biblioteca do Axios!

// Criar o Contexto de Autenticação
const AuthContext = createContext(null);

// Provedor do Contexto (Wrapper global)
export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null); 
  const [role, setRole] = useState(null); 
  const [loading, setLoading] = useState(true);

  // Efeito executado ao iniciar a aplicação para recuperar o token e dados guardados
  useEffect(() => {
    const storedToken = localStorage.getItem('pt_api_token');
    const storedUser = localStorage.getItem('pt_api_user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        setRole(parsedUser.role);
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      } catch {
        localStorage.removeItem('pt_api_token');
        localStorage.removeItem('pt_api_user');
      }
    }
    setLoading(false);
  }, []);

  // 🔒 Interceptor global — logout automático quando token expira (401)
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          // Token expirado ou inválido — limpa tudo e vai para login
          localStorage.removeItem('pt_api_token');
          localStorage.removeItem('pt_api_user');
          delete axios.defaults.headers.common['Authorization'];
          setToken(null);
          setUser(null);
          setRole(null);
        }
        return Promise.reject(error);
      }
    );
    // Limpa o interceptor quando o componente desmonta
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  // Função para registar o login com sucesso recebendo os dados do backend
  const login = (newToken, userData) => {
    // 🔒 localStorage mínimo — só o token e dados não sensíveis
    localStorage.setItem('pt_api_token', newToken);
    localStorage.setItem('pt_api_user', JSON.stringify({
      id: userData.id,
      nome: userData.nome,
      role: userData.role,
      mustChangePassword: userData.mustChangePassword
      // 🔒 Sem email no localStorage
    }));
    
    
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    
    setToken(newToken);
    setUser(userData);
    setRole(userData.role); 
  };

  // 🔥 NOVO: Função para atualizar propriedades do utilizador dinamicamente (ex: mustChangePassword)
  const updateUserProps = (updatedFields) => {
    if (!user) return;
    
    const nuevoUsuario = { ...user, ...updatedFields };
    localStorage.setItem('pt_api_user', JSON.stringify(nuevoUsuario));
    setUser(nuevoUsuario);
  };

  // Função para comunicar com o endpoint de criar conta (registo)
  const register = async (nome, email, password) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/register`, {
        nome,
        email,
        password
      });
      return { success: true };
    } catch (error) {
      console.error('Erro ao registar Personal Trainer:', error);
      const mensagemErro = error.response?.data?.error || 'Erro ao criar conta.';
      throw new Error(mensagemErro);
    }
  };

  // Função para fazer logout e limpar todo o sistema
  const logout = () => {
    localStorage.removeItem('pt_api_token');
    localStorage.removeItem('pt_api_user'); 
     
    
    // Remove o cabeçalho de autorização do Axios
    delete axios.defaults.headers.common['Authorization'];
    
    setToken(null);
    setUser(null);
    setRole(null); 
  };

  // Enquanto verifica o localStorage, evita renderizar caminhos errados
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-neutral-950">
        <div className="w-8 h-8 border-b-2 rounded-full animate-spin border-fitnessGym"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated: !!token,
      authLoading: loading, 
      token, 
      user, 
      role, 
      login, 
      register, 
      logout,
      updateUserProps // 
    }}>
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