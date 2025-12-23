
import React, { useState, useEffect } from 'react';
import { api, getFullUrl } from '../api';
import { Member, Transaction, ChurchEvent, Ministry } from '../types';
import { GoogleGenAI } from '@google/genai';

const Dashboard: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiReport, setAiReport] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);

  const fetchData = async () => {
    try {
      const [membersData, transactionsData, eventsData, ministriesData] = await Promise.all([
        api.members.getAll(),
        api.transactions.getAll(),
        api.events.getAll(),
        api.ministries.getAll()
      ]);
      setMembers(membersData);
      setTransactions(transactionsData);
      setEvents(eventsData);
      setMinistries(ministriesData);

      // Generate AI insight after data is loaded
      generateAiInsight(membersData, transactionsData, eventsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAiInsight = async (membersList: Member[], transactionsList: Transaction[], eventsList: ChurchEvent[]) => {
    setLoadingAi(true);
    try {
      const activeMembers = membersList.filter(m => m.status === 'active').length;
      const totalIncome = transactionsList.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      const upcomingEvents = eventsList.filter(e => e.status === 'open').length;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Você é um assistente pastoral de alto nível. Com base no dashboard da igreja: Membros ativos: ${activeMembers}, Arrecadação total: R$ ${totalIncome.toLocaleString('pt-BR')}, Eventos abertos: ${upcomingEvents}. Forneça um breve insight pastoral (máximo 3 frases) em tom inspirador e analítico em português.`,
      });
      setAiReport(response.text || 'O crescimento da congregação reflete a fidelidade dos membros e a graça de Deus sobre nossos projetos.');
    } catch (error) {
      console.error(error);
      setAiReport('O crescimento da congregação reflete a fidelidade dos membros e a graça de Deus sobre nossos projetos.');
    } finally {
      setLoadingAi(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.status === 'active').length;
  const currentMonthIncome = transactions
    .filter(t => {
      if (t.type !== 'income') return false;
      const transDate = new Date(t.date);
      const today = new Date();
      return transDate.getMonth() === today.getMonth() && transDate.getFullYear() === today.getFullYear();
    })
    .reduce((acc, curr) => acc + curr.amount, 0);

  const upcomingEvents = events
    .filter(e => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 2);

  const birthdaysToday = members.filter(m => {
    if (!m.birthDate) return false;
    const today = new Date();
    // Use local date parts to avoid UTC shift issues
    const todayDay = today.getDate().toString().padStart(2, '0');
    const todayMonth = (today.getMonth() + 1).toString().padStart(2, '0');
    const [bYear, bMonth, bDay] = m.birthDate.split('-');
    return bDay === todayDay && bMonth === todayMonth;
  });

  const getAge = (dateString: string) => {
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const monthlyGoal = 6500;
  const goalPercent = Math.min(Math.round((currentMonthIncome / monthlyGoal) * 100), 100);
  const goalRemaining = Math.max(monthlyGoal - currentMonthIncome, 0);

  return (
    <div className="p-6 md:p-10 scroll-smooth bg-gradient-to-b from-background-dark to-[#050a14]">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard title="Membros Ativos" value={activeMembers.toString()} trend={`${Math.round((activeMembers / (totalMembers || 1)) * 100)}%`} icon="person_add" trendType="up" />
          <StatCard title="Arrecadação (Mês)" value={formatCurrency(currentMonthIncome)} trend="" icon="attach_money" trendType="up" isProgress progress={goalPercent} />
          <div className="bg-surface-dark rounded-2xl p-6 border border-slate-700/60 shadow-lg group">
            <div className="flex justify-between items-start mb-5">
              <div className="bg-slate-800/80 p-3 rounded-xl text-primary border border-slate-700/50 group-hover:bg-primary/10 transition-colors">
                <span className="material-symbols-outlined">event_available</span>
              </div>
              <span className="text-white font-bold text-2xl">{events.filter(e => e.status === 'open').length}</span>
            </div>
            <p className="text-slate-400 text-sm font-medium mb-3">Eventos Abertos</p>
            <div className="flex flex-col gap-2.5">
              {upcomingEvents.length > 0 ? upcomingEvents.map(event => (
                <div key={event.id} className="flex items-center gap-3 text-xs text-slate-300 border-l-2 border-primary pl-2 bg-slate-800/30 py-1.5 pr-2 rounded-r-lg">
                  <span className="font-semibold truncate max-w-[120px]">{event.title}</span>
                  <span className="ml-auto opacity-70">{new Date(event.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                </div>
              )) : (
                <p className="text-[10px] text-slate-500 italic">Sem eventos próximos</p>
              )}
            </div>
          </div>
          <StatCard title="Ministérios" value={ministries.length.toString()} badge="Em Atividade" icon="volunteer_activism" />
        </div>

        {/* AI Insight Box */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-6 shadow-glow">
          <div className="flex items-center gap-3 mb-3">
            <span className="material-symbols-outlined text-primary animate-pulse">auto_awesome</span>
            <h4 className="font-bold text-primary-light">Assistente Pastoral IA</h4>
          </div>
          {loadingAi ? (
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-4 py-1">
                <div className="h-2 bg-slate-700 rounded"></div>
                <div className="h-2 bg-slate-700 rounded w-5/6"></div>
              </div>
            </div>
          ) : (
            <p className="text-slate-300 italic text-sm leading-relaxed">
              "{aiReport}"
            </p>
          )}
        </div>

        <div className="flex flex-col xl:flex-row gap-8">
          {/* Birthdays Table */}
          <div className="flex-1 bg-surface-dark rounded-2xl border border-slate-700/60 shadow-lg overflow-hidden flex flex-col">
            <div className="p-6 md:px-8 border-b border-slate-700/60 flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-slate-800/20">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">cake</span> Aniversariantes do Dia
                </h3>
                <p className="text-slate-400 text-sm mt-1">Celebre a vida dos membros da congregação</p>
              </div>
              <button className="group flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-primary transition-colors">
                Ver calendário <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-800/50 text-slate-400 text-[11px] uppercase tracking-widest font-bold">
                  <tr>
                    <th className="px-8 py-5">Membro</th>
                    <th className="px-6 py-5">Cargo / Função</th>
                    <th className="px-6 py-5">Idade</th>
                    <th className="px-8 py-5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {birthdaysToday.length > 0 ? birthdaysToday.map(member => (
                    <BirthdayRow
                      key={member.id}
                      name={member.name}
                      role={member.role}
                      age={getAge(member.birthDate).toString()}
                      photo={member.photo || `https://picsum.photos/seed/${member.id}/100/100`}
                      phone={member.phone}
                    />
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-8 py-10 text-center text-slate-500 italic text-sm">Nenhum aniversariante hoje.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sidebar Widgets */}
          <div className="w-full xl:w-80 flex flex-col gap-6">
            <div className="rounded-2xl p-6 bg-gradient-to-br from-[#d4af37] to-[#8a6e12] text-white shadow-xl relative overflow-hidden group">
              <div className="absolute -right-8 -bottom-8 opacity-20 transform rotate-12 group-hover:scale-110 transition-transform duration-700">
                <span className="material-symbols-outlined text-[160px]">church</span>
              </div>
              <h4 className="font-bold text-xl mb-1 relative z-10">Meta Mensal {new Date().toLocaleDateString('pt-BR', { month: 'short' })}</h4>
              <p className="text-sm font-medium text-white/90 mb-6 max-w-[85%] relative leading-relaxed">
                {goalRemaining > 0
                  ? <>Faltam apenas <span className="font-bold">{formatCurrency(goalRemaining)}</span> para a meta.</>
                  : <span className="font-bold text-emerald-300 flex items-center gap-1"><span className="material-symbols-outlined">stars</span> META ALCANÇADA!</span>
                }
              </p>
              <div className="w-full bg-black/20 rounded-full h-2.5 mb-2 relative backdrop-blur-sm">
                <div className="bg-white h-2.5 rounded-full shadow-sm transition-all duration-1000" style={{ width: `${goalPercent}%` }}></div>
              </div>
              <div className="flex justify-between text-xs font-bold relative tracking-wide">
                <span>{goalPercent}% Arrecadado</span>
                <span>{formatCurrency(monthlyGoal)}</span>
              </div>
            </div>

            <div className="bg-surface-dark rounded-2xl border border-slate-700/60 p-6 shadow-lg">
              <h4 className="text-white font-bold mb-6 flex items-center justify-between">
                Membros por Ministério
                <span className="material-symbols-outlined text-slate-500 cursor-help text-lg">info</span>
              </h4>
              <div className="space-y-5">
                {ministries.slice(0, 4).map((m, idx) => {
                  const count = members.filter(member => member.ministries?.includes(m.name)).length;
                  const percent = totalMembers > 0 ? Math.round((count / totalMembers) * 100) : 0;
                  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-primary', 'bg-emerald-500'];
                  return (
                    <MinistryProgress
                      key={m.id}
                      label={m.name}
                      value={count}
                      color={colors[idx % colors.length]}
                      percent={percent}
                      icon={m.icon || 'groups'}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  title: string;
  value: string;
  trend?: string;
  icon: string;
  trendType?: 'up' | 'down';
  isProgress?: boolean;
  progress?: number;
  badge?: string;
}> = ({ title, value, trend, icon, trendType, isProgress, progress, badge }) => (
  <div className="bg-surface-dark rounded-2xl p-6 border border-slate-700/60 shadow-lg shadow-black/20 hover:border-primary/40 transition-all duration-300 group">
    <div className="flex justify-between items-start mb-5">
      <div className="bg-slate-800/80 p-3 rounded-xl text-primary border border-slate-700/50 group-hover:bg-primary/10 transition-colors">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      {trend && (
        <span className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${trendType === 'up' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
          }`}>
          <span className="material-symbols-outlined text-[14px]">{trendType === 'up' ? 'trending_up' : 'trending_down'}</span> {trend}
        </span>
      )}
      {badge && (
        <span className="bg-amber-500/10 text-primary text-[11px] font-bold px-2.5 py-1 rounded-full border border-primary/20 animate-pulse">
          {badge}
        </span>
      )}
    </div>
    <p className="text-slate-400 text-sm font-medium tracking-wide">{title}</p>
    <h3 className="text-3xl font-bold text-white mt-1">{value}</h3>
    {isProgress && progress !== undefined && (
      <>
        <div className="w-full bg-slate-700/50 rounded-full h-1 mt-3">
          <div className="bg-primary h-1 rounded-full shadow-glow" style={{ width: `${progress}%` }}></div>
        </div>
        <p className="text-slate-500 text-xs mt-1.5 flex justify-between"><span>Progresso</span> <span>{progress}%</span></p>
      </>
    )}
  </div>
);

const BirthdayRow: React.FC<{ name: string; role: string; age: string; photo: string; phone?: string }> = ({ name, role, age, photo, phone }) => {
  const handleCongratulate = () => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const message = encodeURIComponent(`Olá ${name}! Feliz aniversário! Que Deus continue te abençoando grandemente em mais este ano de vida! 🎉🙏`);
    window.open(`https://wa.me/${finalPhone}?text=${message}`, '_blank');
  };

  return (
    <tr className="hover:bg-slate-800/40 transition-colors group">
      <td className="px-8 py-5">
        <div className="flex items-center gap-4">
          <div className="bg-center bg-no-repeat bg-cover rounded-full size-12 border-2 border-slate-600 group-hover:border-primary transition-colors" style={{ backgroundImage: `url('${getFullUrl(photo)}')` }}></div>
          <div>
            <p className="text-white font-bold text-sm group-hover:text-primary transition-colors">{name}</p>
            <p className="text-slate-500 text-xs mt-0.5">Membro Ativo</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-5">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
          {role}
        </span>
      </td>
      <td className="px-6 py-5">
        <span className="text-slate-200 text-sm font-medium">{age} Anos</span>
      </td>
      <td className="px-8 py-5 text-right">
        <button
          onClick={handleCongratulate}
          className="text-slate-300 hover:text-primary transition-colors text-xs font-bold uppercase tracking-wider"
        >
          Parabenizar
        </button>
      </td>
    </tr>
  );
};

const MinistryProgress: React.FC<{ label: string; value: number; color: string; percent: number; icon: string }> = ({ label, value, color, percent, icon }) => (
  <div className="group">
    <div className="flex justify-between text-xs mb-2">
      <div className="flex items-center gap-2">
        <span className={`material-symbols-outlined text-sm ${color.replace('bg-', 'text-')}`}>{icon}</span>
        <span className="text-slate-300 font-medium">{label}</span>
      </div>
      <span className="text-white font-bold bg-slate-800 px-1.5 rounded">{value}</span>
    </div>
    <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
      <div className={`${color} h-1.5 rounded-full group-hover:scale-x-105 origin-left transition-transform duration-500`} style={{ width: `${percent}%` }}></div>
    </div>
  </div>
);

export default Dashboard;
