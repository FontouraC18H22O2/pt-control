import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function DashboardLayout() {
  const [sidebarAberta, setSidebarAberta] = useState(false);

  return (
    // h-screen + overflow-hidden no contentor raiz — isola o scroll
    <div className="h-screen overflow-hidden bg-neutral-950 bg-gradient-to-br from-neutral-950 via-red-950/10 to-neutral-950 text-white flex relative before:absolute before:inset-0 before:bg-[linear-gradient(45deg,transparent_45%,rgba(220,38,38,0.04)_48%,rgba(220,38,38,0.08)_50%,rgba(220,38,38,0.04)_52%,transparent_55%)] before:pointer-events-none">

      {/* MOBILE: Overlay escuro quando a sidebar está aberta */}
      {sidebarAberta && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarAberta(false)}
        />
      )}

      {/* Sidebar — fixed no mobile, estática no desktop */}
      <div className={`
        fixed inset-y-0 left-0 z-30 transition-transform duration-300 ease-in-out
        md:static md:translate-x-0 md:z-auto md:transition-none
        ${sidebarAberta ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onFechar={() => setSidebarAberta(false)} />
      </div>

      {/* Conteúdo principal — scroll isolado aqui, não no body */}
      <main className="flex-1 h-full overflow-y-auto" id="main-scroll">

        {/* MOBILE: Barra de topo com botão hambúrguer */}
        <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b md:hidden bg-neutral-900/95 backdrop-blur border-neutral-800">
          <button
            onClick={() => setSidebarAberta(true)}
            className="p-2 transition-colors rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
            aria-label="Abrir menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-bold text-white">PT <span className="text-red-500">Control</span></span>
        </div>

        <div className="p-4 mx-auto md:p-8 max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}