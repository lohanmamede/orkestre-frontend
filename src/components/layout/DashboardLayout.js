import React from 'react';
import { Outlet } from 'react-router-dom';
import SideMenu from './SideMenu';

const DashboardLayout = () => {
  return (
    <div className="dashboard-layout" style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative' }}>
      {/* Menu Lateral - largura ainda mais compacta */}
      <div className="w-14 md:w-24 flex-shrink-0" style={{ height: '100vh', overflow: 'hidden' }}>
        <SideMenu />
      </div>
      
      {/* Conteúdo Principal */}
      <div className="flex-1" style={{ height: '100vh', overflow: 'auto' }}>
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;
