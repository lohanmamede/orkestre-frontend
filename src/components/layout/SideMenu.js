import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Ícones SVG para os itens do menu (strokeWidth mais fino)
const icons = {
  agenda: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  reports: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  clients: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  marketing: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  ),
  settings: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

// Itens de menu principais
const mainMenuItems = [
  { id: 'agenda', label: 'Agenda', icon: icons.agenda, path: '/dashboard' },
  { id: 'reports', label: 'Relatórios', icon: icons.reports, path: '/reports' },
  { id: 'clients', label: 'Clientes', icon: icons.clients, path: '/clients' },
  { id: 'marketing', label: 'Marketing', icon: icons.marketing, path: '/marketing' },
  { id: 'config', label: 'Ajustes', icon: icons.settings, path: '/config' },
];

const SideMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Função para navegar para uma página
  const handleMenuItemClick = (path) => {
    navigate(path);
  };

  // Verifica se um item de menu deve estar ativo
  const isActive = (path) => {
    // Se o path é /dashboard, estamos na página de agenda
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    // Para outras páginas
    return location.pathname === path;
  };

  return (
    <div className="bg-gradient-to-b from-gray-800 to-gray-900 w-full h-full shadow-lg flex flex-col items-center border-r border-gray-700" style={{ height: '100vh' }}>
      {/* Logo ou ícone da aplicação no topo */}
      <div className="w-full py-4 flex justify-center border-b border-gray-700">
        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md">
          <span className="text-gray-800 font-bold text-lg">O</span>
        </div>
      </div>
      
      <nav className="w-full flex-1 flex flex-col items-center py-6">
        <div className="flex flex-col items-center w-full px-2">
          {mainMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenuItemClick(item.path)}
              className={`flex flex-col items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-lg mb-3 transition-all duration-200
                ${isActive(item.path) 
                  ? 'bg-white text-gray-800 font-medium shadow-md scale-105' 
                  : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'}
              `}
            >
              <span className="mb-1">
                {React.cloneElement(item.icon, { 
                  className: 'w-5 h-5 md:w-6 md:h-6', 
                  stroke: isActive(item.path) ? '#1f2937' : '#d1d5db' 
                })}
              </span>
              <span className="text-[10px] md:text-[11px] text-center font-medium leading-tight">
                {item.label}
              </span>
            </button>
          ))}
        </div>
        
        {/* Footer with subtle branding at bottom */}
        <div style={{ marginTop: 'auto', width: '100%', textAlign: 'center', padding: '10px 0' }}>
          <div style={{ width: '100%', height: '1px', background: '#3a3a3a', marginBottom: '10px' }} />
          <div style={{ fontSize: '10px', color: '#666', letterSpacing: '1px', fontWeight: '300' }}>
            ORKESTRE
          </div>
        </div>
      </nav>
    </div>
  );
};

export default SideMenu;
