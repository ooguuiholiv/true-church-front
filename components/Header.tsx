
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';

const Header: React.FC<{ user: any; onLogout: () => void }> = ({ user, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard': return 'Visão Geral';
      case '/finance': return 'Fluxo de Caixa';
      case '/kids': return 'Check-in Kids';
      case '/events': return 'Eventos';
      case '/ministries': return 'Ministérios';
      case '/people': return 'Membros e Visitantes';
      case '/secretary': return 'Secretaria';
      default: return 'True Church';
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Pulse every minute
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await api.secretary.getNotifications();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 2) {
        const data = await api.secretary.search(searchQuery);
        setSearchResults(data.results || []);
        setShowSearch(true);
      } else {
        setSearchResults([]);
        setShowSearch(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Close search on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearch(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-20 w-full flex items-center justify-between px-6 md:px-10 border-b border-slate-800/60 bg-surface-darker/80 backdrop-blur-xl sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-4 text-white md:hidden">
        <span className="material-symbols-outlined cursor-pointer text-slate-300 hover:text-primary transition-colors">menu</span>
      </div>

      <div className="hidden md:flex flex-col justify-center">
        <h2 className="text-white text-xl font-bold tracking-tight">{getPageTitle()}</h2>
        <p className="text-slate-400 text-xs text-left">Olá, {user?.name.split(' ')[0] || 'Pastor'}. Tenha um dia abençoado.</p>
      </div>

      <div className="flex-1 max-w-xl mx-10 hidden md:block relative" ref={searchRef}>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-slate-500 group-focus-within:text-primary transition-colors text-[20px]">search</span>
          </div>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.length > 2 && setShowSearch(true)}
            className="block w-full pl-12 pr-4 py-2.5 border border-slate-700/50 rounded-full bg-slate-800/50 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 focus:bg-slate-800 transition-all text-sm"
            placeholder="Pesquisar membros, eventos, finanças..."
            type="text"
          />
        </div>

        {/* Search Results Dropdown */}
        {showSearch && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
            <div className="p-2">
              {searchResults.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => {
                    navigate(result.path);
                    setShowSearch(false);
                    setSearchQuery('');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-xl transition-colors group text-left"
                >
                  <div className="bg-slate-800 size-8 rounded-lg flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-slate-900 transition-all">
                    <span className="material-symbols-outlined text-lg">
                      {result.type === 'Membro' ? 'person' : result.type === 'Evento' ? 'calendar_today' : 'payments'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white leading-tight">{result.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{result.type}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              {notifications.length > 0 && (
                <span className="absolute top-2.5 right-2.5 size-2.5 bg-rose-500 rounded-full ring-2 ring-surface-darker animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.5)]"></span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                <div className="p-4 border-b border-slate-800 bg-slate-800/20 flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Notificações Inteligentes</h4>
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] rounded-full font-bold">{notifications.length}</span>
                </div>
                <div className="max-h-96 overflow-y-auto p-2">
                  {notifications.length > 0 ? notifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => {
                        navigate(notif.path);
                        setShowNotifications(false);
                      }}
                      className="w-full p-3 hover:bg-slate-800 rounded-xl transition-colors text-left flex gap-3 group"
                    >
                      <div className={`size-10 rounded-full flex-shrink-0 flex items-center justify-center ${notif.type === 'birthday' ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'}`}>
                        <span className="material-symbols-outlined">{notif.type === 'birthday' ? 'cake' : 'event'}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{notif.title}</p>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{notif.message}</p>
                      </div>
                    </button>
                  )) : (
                    <div className="py-10 text-center text-slate-600">
                      <span className="material-symbols-outlined text-4xl mb-2 opacity-20">notifications_off</span>
                      <p className="text-sm italic">Nenhuma notificação por enquanto.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="h-10 w-px bg-gradient-to-b from-transparent via-slate-700 to-transparent mx-1"></div>

        <div className="flex items-center gap-3.5 pl-2 group">
          <div className="relative">
            <div
              className="bg-center bg-no-repeat bg-cover rounded-full size-11 border-2 border-slate-700 group-hover:border-primary transition-colors shadow-lg"
              style={{ backgroundImage: `url('${user?.photo || `https://i.pravatar.cc/100?u=${user?.id}`}')` }}
            ></div>
            <div className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full border-2 border-surface-darker"></div>
          </div>
          <div className="hidden lg:flex flex-col items-end">
            <span className="text-sm font-bold text-white leading-tight group-hover:text-primary transition-colors">{user?.name || 'Admin'}</span>
            <span className="text-[11px] text-slate-400 font-medium tracking-wide">{user?.role === 'admin' ? 'Administrador' : 'Membro'}</span>
          </div>
          <div onClick={(e) => { e.stopPropagation(); onLogout(); }} className="hidden lg:block ml-2 p-1 text-slate-500 hover:text-red-400 transition-colors cursor-pointer" title="Sair do Sistema">
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
