
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const Sidebar: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard', section: 'Principal' },
    { path: '/people', label: 'Membros', icon: 'groups', section: 'Principal' },
    { path: '/events', label: 'Eventos', icon: 'calendar_month', section: 'Principal' },
    { path: '/finance', label: 'Financeiro', icon: 'payments', section: 'Gestão' },
    { path: '/ministries', label: 'Ministérios', icon: 'church', section: 'Gestão' },
    { path: '/secretary', label: 'Secretaria', icon: 'description', section: 'Gestão' },
    { path: '/kids', label: 'Check-in Kids', icon: 'child_care', section: 'Gestão' },
  ];

  const sections = ['Principal', 'Gestão'];

  return (
    <aside className="hidden md:flex flex-col w-72 h-full bg-surface-darker border-r border-slate-800/60 flex-shrink-0 shadow-2xl z-20">
      <div className="px-10 py-10 flex items-center justify-center border-b border-slate-800/60">
        <img
          src="https://media.discordapp.net/attachments/1194391051851534478/1452759170976841983/LOGO_TRUE_BRANCO.png?ex=694afae9&is=6949a969&hm=05b669a4d1375de873cbbfb6fd193bc32973c2994a8b7a215b454ba2b10bc98c&=&format=webp&quality=lossless&width=1768&height=648"
          alt="True Church Logo"
          className="w-full h-auto max-h-14 object-contain"
        />
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-1.5 scrollbar-hide">
        {sections.map(section => (
          <React.Fragment key={section}>
            <div className="px-4 pb-2 pt-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{section}</p>
            </div>
            {navItems.filter(item => item.section === section).map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group ${isActive
                    ? 'bg-gradient-to-r from-primary/20 to-transparent border-l-[3px] border-primary text-primary shadow-lg shadow-primary/5'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                  }`
                }
              >
                <span className={`material-symbols-outlined ${location.pathname === item.path ? 'filled text-primary' : 'group-hover:text-primary'} transition-colors`}>
                  {item.icon}
                </span>
                <span className={`text-sm ${location.pathname === item.path ? 'font-bold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </NavLink>
            ))}
          </React.Fragment>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800/60 bg-surface-darker/50">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all group"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="font-medium text-sm">Sair do Sistema</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
