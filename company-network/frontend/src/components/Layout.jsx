import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="layout-container">
      <Sidebar />
      <main className="layout-main">
        <div className="layout-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
