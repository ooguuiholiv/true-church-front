import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Ministry, Schedule, Member } from '../types';
import { showNotification } from '../components/Notification';

const Ministries: React.FC = () => {
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showMinistryModal, setShowMinistryModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'escalas' | 'ministerios' | 'voluntarios'>('escalas');

  const [ministryForm, setMinistryForm] = useState({
    name: '',
    leader: '',
    description: '',
    color: '#6366f1',
    members: [] as string[]
  });

  const [scheduleForm, setScheduleForm] = useState({
    date: '',
    time: '',
    title: '',
    assignments: [] as { ministryId: string; members: string[] }[]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [m, s, folks] = await Promise.all([
        api.ministries.getAll(),
        api.schedules.getAll(),
        api.members.getAll()
      ]);
      setMinistries(m);
      setSchedules(s);
      setMembers(folks);
    } catch (err) {
      showNotification('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMinistry = async () => {
    if (!ministryForm.name) {
      showNotification('O nome do ministério é obrigatório', 'error');
      return;
    }
    try {
      await api.ministries.create(ministryForm);
      showNotification('Ministério criado!', 'success');
      setShowMinistryModal(false);
      setMinistryForm({ name: '', leader: '', description: '', color: '#6366f1', members: [] });
      loadData();
    } catch (err) {
      showNotification('Erro ao salvar ministério', 'error');
    }
  };

  const handleSaveSchedule = async () => {
    if (!scheduleForm.title || !scheduleForm.date) {
      showNotification('Título e data são obrigatórios', 'error');
      return;
    }
    try {
      await api.schedules.create(scheduleForm);
      showNotification('Escala criada!', 'success');
      setShowScheduleModal(false);
      setScheduleForm({ date: '', time: '', title: '', assignments: [] });
      loadData();
    } catch (err) {
      showNotification('Erro ao salvar escala', 'error');
    }
  };

  const handleAutoGenerate = () => {
    const assignments = ministries.map(min => {
      // Filter members that belong to this ministry
      const volunteers = members.filter(m => m.ministries?.includes(min.name));
      // Randomly pick 1 or 2 (for demo purposes)
      const count = Math.min(2, volunteers.length);
      const selected = volunteers.sort(() => 0.5 - Math.random()).slice(0, count).map(m => m.id);
      return { ministryId: min.name, members: selected }; // Forcing name as ID for consistency with member data
    });
    setScheduleForm({ ...scheduleForm, assignments });
    showNotification('Sugestão de voluntários gerada!', 'info');
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen text-slate-400">
        <span className="material-symbols-outlined animate-spin mr-3">progress_activity</span>
        Carregando informações...
      </div>
    );
  }

  const volunteers = members.filter(m => m.ministries && m.ministries.length > 0);

  return (
    <div className="p-8 space-y-8 bg-[#0F141E]">
      <div className="relative w-full rounded-2xl overflow-hidden min-h-[200px] shadow-2xl group border border-slate-700/30">
        <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1510070612115-162159518027?auto=format&fit=crop&q=80&w=1200')` }}></div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-transparent"></div>
        <div className="relative z-10 p-8 h-full flex flex-col justify-end">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-primary/20 text-primary border border-primary/20 backdrop-blur-sm self-start mb-2">Módulo Administrativo</span>
          <h1 className="text-4xl font-bold text-white mb-2 font-display">Gestão de Ministérios</h1>
          <p className="text-slate-300 max-w-2xl text-sm font-light">
            Organize equipes, voluntários e escalas de forma centralizada.
          </p>
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setShowMinistryModal(true)}
              className="px-4 py-2 rounded-lg bg-slate-800 text-white text-xs font-bold border border-slate-700 hover:bg-slate-700 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">church</span>
              NOVO MINISTÉRIO
            </button>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="px-4 py-2 rounded-lg bg-primary text-[#0B1120] text-xs font-bold hover:bg-primary-hover transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">event</span>
              NOVA ESCALA
            </button>
          </div>
        </div>
      </div>

      <div className="flex border-b border-slate-800 gap-8">
        <button
          onClick={() => setActiveTab('escalas')}
          className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all relative ${activeTab === 'escalas' ? 'text-primary' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Escalas de Culto
          {activeTab === 'escalas' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"></div>}
        </button>
        <button
          onClick={() => setActiveTab('ministerios')}
          className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all relative ${activeTab === 'ministerios' ? 'text-primary' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Equipes / Ministérios
          {activeTab === 'ministerios' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"></div>}
        </button>
        <button
          onClick={() => setActiveTab('voluntarios')}
          className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all relative ${activeTab === 'voluntarios' ? 'text-primary' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Voluntários ({volunteers.length})
          {activeTab === 'voluntarios' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"></div>}
        </button>
      </div>

      {activeTab === 'escalas' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCardSimple title="Ministérios Ativos" value={ministries.length.toString()} sub="Equipes registradas" icon="account_tree" />
            <StatCardSimple title="Escalas Pendentes" value={schedules.filter(s => s.status === 'Pendente').length.toString()} sub="Aguardando confirmação" icon="pending_actions" isWarning={schedules.filter(s => s.status === 'Pendente').length > 0} />
            <StatCardSimple title="Voluntários Totais" value={volunteers.length.toString()} sub="Participantes ativos" icon="groups" />
          </div>

          <div className="bg-surface-dark border border-slate-700 rounded-2xl overflow-hidden shadow-card">
            <div className="p-5 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
              <h3 className="font-bold text-white">Escalas Programadas</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-800/30 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-700">
                    <th className="p-5">Data / Hora</th>
                    <th className="p-5">Culto/Evento</th>
                    <th className="p-5">Equipes & Voluntários</th>
                    <th className="p-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {schedules.length > 0 ? (
                    schedules.map(s => (
                      <ScheduleRow
                        key={s.id}
                        schedule={s}
                        ministries={ministries}
                        members={members}
                        onUpdate={loadData}
                      />
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-10 text-center text-slate-500 text-sm">
                        Nenhuma escala registrada para os próximos dias.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ministerios' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ministries.map(min => (
            <div key={min.id} className="bg-surface-dark border border-slate-700 rounded-2xl p-6 hover:border-primary/40 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 -mr-8 -mt-8 rounded-full blur-2xl group-hover:bg-primary/10 transition-all"></div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-slate-800 rounded-xl text-primary ring-1 ring-slate-700">
                  <span className="material-symbols-outlined">church</span>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">{min.name}</h4>
                  <p className="text-slate-500 text-xs font-medium italic">Líder: {min.leader || 'Não definido'}</p>
                </div>
              </div>
              <p className="text-slate-400 text-sm mb-6 line-clamp-2 h-10">{min.description || 'Nenhuma descrição fornecida.'}</p>
              <div className="flex justify-between items-center text-xs font-bold pt-4 border-t border-slate-800/50">
                <span className="text-slate-500 uppercase tracking-widest">Voluntários</span>
                <span className="text-white bg-slate-800 px-2 py-1 rounded-full">{members.filter(m => m.ministries?.includes(min.name)).length}</span>
              </div>
            </div>
          ))}
          <button
            onClick={() => setShowMinistryModal(true)}
            className="bg-slate-900/50 border border-dashed border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-slate-500 hover:text-primary hover:border-primary transition-all group"
          >
            <span className="material-symbols-outlined text-4xl group-hover:scale-110 transition-transform">add_circle</span>
            <span className="text-xs font-bold uppercase tracking-widest">Novo Ministério</span>
          </button>
        </div>
      )}

      {activeTab === 'voluntarios' && (
        <div className="bg-surface-dark border border-slate-700 rounded-2xl overflow-hidden shadow-card">
          <div className="p-5 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
            <h3 className="font-bold text-white">Base de Voluntários</h3>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Total: {volunteers.length} Pessoas</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-800/30 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-700">
                  <th className="p-5">Nome</th>
                  <th className="p-5">Ministérios</th>
                  <th className="p-5">Célula</th>
                  <th className="p-5">Contato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {volunteers.map(v => (
                  <tr key={v.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                          <img src={v.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${v.name}`} alt="" />
                        </div>
                        <span className="text-white font-bold text-sm">{v.name}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex flex-wrap gap-1.5">
                        {v.ministries?.map(m => (
                          <span key={m} className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {m}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-5 text-sm text-slate-400">{v.cellGroup || '-'}</td>
                    <td className="p-5 text-sm text-slate-500 font-mono">{v.phone || '-'}</td>
                  </tr>
                ))}
                {volunteers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-10 text-center text-slate-500 text-sm italic">
                      Nenhum voluntário encontrado na base. Certifique-se de preencher os ministérios no perfil das pessoas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MINISTRY MODAL */}
      {showMinistryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-[#1A1F2B] border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Novo Ministério</h3>
              <button onClick={() => setShowMinistryModal(false)} className="text-slate-400 hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nome do Ministério</label>
                <input
                  type="text"
                  value={ministryForm.name}
                  onChange={e => setMinistryForm({ ...ministryForm, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Ex: Louvor, Mídia, Kids..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Líder</label>
                <input
                  type="text"
                  value={ministryForm.leader}
                  onChange={e => setMinistryForm({ ...ministryForm, leader: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Nome do líder"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Descrição</label>
                <textarea
                  value={ministryForm.description}
                  onChange={e => setMinistryForm({ ...ministryForm, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none min-h-[80px]"
                ></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowMinistryModal(false)} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors">CANCELAR</button>
                <button onClick={handleSaveMinistry} className="px-6 py-2 bg-primary text-[#0B1120] rounded-lg text-xs font-bold hover:bg-primary-hover transition-all">SALVAR MINISTÉRIO</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE MODAL */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-[#1A1F2B] border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
              <div>
                <h3 className="text-xl font-bold text-white">Montar Escala de Culto</h3>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Defina quem servirá no dia</p>
              </div>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Título do Evento/Culto</label>
                <input
                  type="text"
                  value={scheduleForm.title}
                  onChange={e => setScheduleForm({ ...scheduleForm, title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Ex: Culto de Celebração"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Data</label>
                <input
                  type="date"
                  value={scheduleForm.date}
                  onChange={e => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Horário</label>
                <input
                  type="time"
                  value={scheduleForm.time}
                  onChange={e => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div className="col-span-2 mt-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-primary/30 pb-2">Distribuição por Equipes</h4>
                  <button
                    onClick={handleAutoGenerate}
                    className="text-[10px] font-bold text-primary border border-primary/30 px-3 py-1 rounded-full hover:bg-primary/10 transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">auto_awesome</span>
                    SUGERIR VOLUNTÁRIOS
                  </button>
                </div>
                <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                  {ministries.map(min => (
                    <div key={min.id} className="p-3 bg-slate-900/50 rounded-xl border border-slate-700/50 flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-white text-sm font-bold">{min.name}</p>
                          <p className="text-slate-500 text-[9px] uppercase tracking-wider">{min.leader && `Líder: ${min.leader}`}</p>
                        </div>
                        <span className="text-[10px] text-slate-500 italic">
                          {(scheduleForm.assignments.find(a => a.ministryId === (min.id || min.name))?.members.length || 0)} selecionados
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {members.filter(m => m.ministries?.includes(min.name)).map(mem => {
                          const isSelected = scheduleForm.assignments.find(a => a.ministryId === (min.id || min.name))?.members.includes(mem.id);
                          return (
                            <button
                              key={mem.id}
                              onClick={() => {
                                const assignments = [...scheduleForm.assignments];
                                const minKey = min.id || min.name;
                                const idx = assignments.findIndex(a => a.ministryId === minKey);

                                if (idx > -1) {
                                  const mIdx = assignments[idx].members.indexOf(mem.id);
                                  if (mIdx > -1) {
                                    assignments[idx].members.splice(mIdx, 1);
                                  } else {
                                    assignments[idx].members.push(mem.id);
                                  }
                                } else {
                                  assignments.push({ ministryId: minKey, members: [mem.id] });
                                }
                                setScheduleForm({ ...scheduleForm, assignments });
                              }}
                              className={`text-[11px] p-2 rounded-lg border transition-all text-left flex items-center justify-between ${isSelected ? 'bg-primary/20 border-primary text-white font-bold' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                            >
                              {mem.name.split(' ')[0]}
                              {isSelected && <span className="material-symbols-outlined text-[14px]">check_circle</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {ministries.length === 0 && <p className="text-slate-500 text-xs italic p-4 text-center">Nenhum ministério cadastrado para escala.</p>}
                </div>
              </div>

              <div className="col-span-2 flex justify-end gap-3 pt-6 border-t border-slate-800 mt-4">
                <button onClick={() => setShowScheduleModal(false)} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors">CANCELAR</button>
                <button onClick={handleSaveSchedule} className="px-6 py-2 bg-primary text-[#0B1120] rounded-lg text-xs font-bold hover:bg-primary-hover transition-all">SALVAR ESCALA FINAL</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCardSimple: React.FC<{ title: string; value: string; sub: string; icon: string; status?: string; progress?: number; isWarning?: boolean }> = ({ title, value, sub, icon, status, progress, isWarning }) => (
  <div className="bg-surface-dark border border-slate-700 rounded-2xl p-6 shadow-card hover:border-primary/40 transition-all duration-300 group">
    <div className="flex justify-between items-start mb-5">
      <div className="p-3 bg-slate-800 rounded-xl text-slate-400 group-hover:bg-primary group-hover:text-slate-900 transition-colors">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      {status && <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold rounded-full uppercase">{status}</span>}
    </div>
    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
    <h3 className="text-white text-2xl font-bold mb-2">{value}</h3>
    <div className="flex items-center text-xs text-slate-400">
      {isWarning && <span className="material-symbols-outlined text-sm mr-1 text-amber-500">warning</span>}
      {sub}
    </div>
    {progress && (
      <div className="w-full bg-slate-800 h-1 rounded-full mt-3 overflow-hidden">
        <div className="bg-primary h-full transition-all" style={{ width: `${progress}%` }}></div>
      </div>
    )}
  </div>
);

const ScheduleRow: React.FC<{ schedule: Schedule; ministries: Ministry[]; members: Member[]; onUpdate?: () => void }> = ({ schedule, ministries, members, onUpdate }) => {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Data N/D';
    try {
      const [year, month, day] = dateStr.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
    } catch (e) {
      return dateStr;
    }
  };

  const handleConfirm = async () => {
    try {
      await api.schedules.update(schedule.id, { status: 'Confirmado' });
      showNotification('Escala confirmada!', 'success');
      onUpdate?.();
    } catch (err) {
      showNotification('Erro ao confirmar escala', 'error');
    }
  };

  return (
    <tr className="hover:bg-white/[0.02] transition-colors group">
      <td className="p-5">
        <div className="flex flex-col">
          <span className="text-white font-bold text-sm uppercase">{formatDate(schedule.date)}</span>
          <span className="text-slate-500 text-xs">{schedule.time}h</span>
        </div>
      </td>
      <td className="p-5 text-sm text-slate-300 font-medium">{schedule.title}</td>
      <td className="p-5">
        <div className="flex flex-col gap-2">
          {schedule.assignments && schedule.assignments.map(asg => {
            const min = ministries.find(m => m.id === asg.ministryId || m.name === asg.ministryId);
            const volunteers = asg.members.map(mid => members.find(m => m.id === mid)?.name || mid);
            return (
              <div key={asg.ministryId} className="flex items-center gap-2">
                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 min-w-[70px] text-center" title={min?.description}>
                  {min?.name || asg.ministryId}
                </span>
                <span className="text-[11px] text-slate-500">
                  {volunteers.join(', ')}
                </span>
              </div>
            );
          })}
        </div>
      </td>
      <td className="p-5">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${schedule.status === 'Confirmado' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
            schedule.status === 'Pendente' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-slate-700/50 text-slate-400 border-slate-600'
            }`}>
            {schedule.status}
          </span>
          {schedule.status === 'Pendente' && (
            <button
              onClick={handleConfirm}
              className="opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-500 text-[#0B1120] p-1 rounded-md flex items-center justify-center hover:bg-emerald-400"
              title="Confirmar Escala"
            >
              <span className="material-symbols-outlined text-sm">done</span>
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

export default Ministries;
