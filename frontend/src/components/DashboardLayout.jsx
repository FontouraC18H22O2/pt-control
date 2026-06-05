import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex">
      {/* Barra Lateral Estática à Esquerda */}
      <Sidebar />

      {/* Zona de Conteúdo Dinâmico à Direita */}
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        <div className="max-w-7xl mx-auto">
          <Outlet /> {/* É aqui que as páginas internas vão aparecer! */}
        </div>
      </main>
    </div>
  );
}