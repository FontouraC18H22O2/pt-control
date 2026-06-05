import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/'); // Expulsa o utilizador para o ecrã de login
  };

  // Classes de estilo para os links (destaca o link ativo com a cor do teu ginásio)
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group ${
      isActive
        ? 'bg-fitnessGym text-neutral-950 shadow-lg shadow-emerald-500/10'
        : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
    }`;

  return (
    <aside className="w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col justify-between h-screen sticky top-0 p-4 shrink-0">
      
      {/* Bloco Superior: Logo e Navegação */}
      <div className="space-y-8">
        {/* Logo Brand */}
        <div className="px-2 py-4 text-center border-b border-neutral-800">
          <h1 className="text-xl font-bold tracking-tight text-white">
            PT <span className="text-fitnessGym">Management</span>
          </h1>
        </div>

        {/* Menu de Links */}
        <nav className="space-y-2">
          <NavLink to="/dashboard" end className={linkClass}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Visão Geral</span>
          </NavLink>

          <NavLink to="/dashboard/alunos" className={linkClass}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>Gerir Alunos</span>
          </NavLink>

          <NavLink to="/dashboard/treinos" className={linkClass}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span>Planos de Treino</span>
          </NavLink>
        </nav>
      </div>

      {/* Bloco Inferior: Botão de Logout */}
      <div className="border-t border-neutral-800 pt-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-400 hover:bg-red-500/10 transition-colors duration-200 cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Terminar Sessão</span>
        </button>
      </div>

    </aside>
  );
}