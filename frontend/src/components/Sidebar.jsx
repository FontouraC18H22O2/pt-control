import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
  const { logout, user, role } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group ${
      isActive
        ? "bg-fitnessGym text-white shadow-lg shadow-red-500/20 font-bold"
        : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
    }`;

  const isGuest = role === "GUEST";
  const isAdmin = role === "ADMIN";

  return (
    <aside className="sticky top-0 flex flex-col justify-between w-64 h-screen p-4 border-r bg-neutral-900 border-neutral-800 shrink-0">
      <div className="space-y-8">
        {/* Bloco Superior: Logo e Identificação */}
        <div className="px-2 py-4 space-y-2 text-center border-b border-neutral-800">
          <h1 className="text-xl font-bold tracking-tight text-white">
            PT <span className="text-fitnessGym">Control</span>
          </h1>
          {user && user.nome && (
            <div className="text-xs text-neutral-400 font-medium bg-neutral-950/50 py-1.5 px-2 rounded-lg border border-neutral-800/40 space-y-0.5">
              <p className="truncate text-neutral-500">
                Acesso:{" "}
                <span className="font-bold text-fitnessGym">{role}</span>
              </p>
              <p className="font-semibold text-white truncate">{user.nome}</p>
            </div>
          )}
        </div>

        {/* Menu de Links Condicional */}
        <nav className="space-y-2">
          {/* 1. Visão Geral (Dashboard) - Visível para ADMIN e PT */}
          {!isGuest && (
            <NavLink to="/dashboard" end className={linkClass}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>Visão Geral</span>
            </NavLink>
          )}

          {/* 2. Gestão de Personal Trainers - Exclusivo para ADMIN */}
          {isAdmin && (
            <>
              <NavLink to="/dashboard/personal-trainers" className={linkClass}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span>Personal Trainers</span>
              </NavLink>

              {/* Link para Pedidos de Acesso Pendentes */}
              <NavLink to="/dashboard/pedidos-acesso" className={linkClass}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
                <span>Pedidos de Acesso</span>
              </NavLink>
            </>
          )}

          {/* 3. Gerir Alunos - Apenas para PT */}
          {!isGuest && !isAdmin && (
            <NavLink to="/dashboard/alunos" className={linkClass}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <span>Gerir Alunos</span>
            </NavLink>
          )}

          {/* 4. Planos de Treino - Apenas para PT */}
          {!isGuest && !isAdmin && (
            <NavLink to="/dashboard/treinos" className={linkClass}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
              <span>Planos de Treino</span>
            </NavLink>
          )}

          {/* 5. Galeria de Exercícios - PT e GUEST */}
          {!isAdmin && (
            <NavLink to="/dashboard/galeria" className={linkClass}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z"
                />
              </svg>
              <span>Galeria de Exercícios</span>
            </NavLink>
          )}

          {/* 🔥 NOVO: O meu Perfil - Visível para TODOS os utilizadores ligados */}
          <NavLink to="/dashboard/perfil" className={linkClass}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span>O meu Perfil</span>
          </NavLink>
        </nav>
      </div>

      {/* Botão de Logout */}
      <div className="pt-4 border-t border-neutral-800">
        <button
          onClick={handleLogout}
          className="flex items-center w-full gap-3 px-4 py-3 font-medium text-red-400 transition-colors duration-200 cursor-pointer rounded-xl hover:bg-red-500/10"
        >
          <svg
            xmlns="http://www.w3.org/2000/xl"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span>Terminar Sessão</span>
        </button>
      </div>
    </aside>
  );
}