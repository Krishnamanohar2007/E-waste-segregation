import React from 'react';
import { NavLink } from 'react-router-dom';
import { Leaf, Search, History, PieChart, Activity, Menu } from 'lucide-react';
import './MainLayout.css';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar glass-panel">
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo-icon"><Leaf size={24} /></div>
            <h2>EcoSort AI</h2>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/predict" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Search size={20} />
            <span>Predict Analysis</span>
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <History size={20} />
            <span>History</span>
          </NavLink>
          <NavLink to="/analytics" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <PieChart size={20} />
            <span>Analytics</span>
          </NavLink>
          <NavLink to="/confusion" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Activity size={20} />
            <span>Confusion Insights</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="version-info">
            <p className="text-xs text-muted">EcoSort AI Dashboard</p>
            <p className="text-xs text-muted">v1.2.0 • System Online</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="top-navbar glass-panel">
          <button className="mobile-menu-btn">
            <Menu size={24} />
          </button>
          <div className="navbar-title">
            <h3>Environmental Intelligence System</h3>
          </div>
          <div className="navbar-actions">
            <div className="user-avatar">
              <span className="text-sm font-medium">Admin</span>
            </div>
          </div>
        </header>

        <section className="page-content">
          {children}
        </section>
      </main>
    </div>
  );
};

export default MainLayout;
