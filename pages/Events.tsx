
import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { ChurchEvent } from '../types';
import { showNotification } from '../components/Notification';
import ConfirmModal from '../components/ConfirmModal';

const Events: React.FC = () => {
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    endDate: '',
    time: '',
    location: '',
    price: '',
    description: '',
    image: '',
    registrationDeadline: ''
  });
  const [showRegModal, setShowRegModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => { }
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const data = await api.events.getAll();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrations = async (event: any) => {
    try {
      setSelectedEvent(event);
      const data = await api.events.getRegistrations(event.id);
      setRegistrations(data);
      setShowRegModal(true);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    }
  };

  const copyLink = (id: string) => {
    const link = `${window.location.host}/#/public/event/${id}`;
    navigator.clipboard.writeText(link);
    showNotification("Link da página de inscrição copiado!", "success");
  };

  const handleTogglePayment = async (reg: any) => {
    try {
      const newStatus = reg.paymentStatus === 'paid' ? 'pending' : 'paid';
      await (api.events as any).updateRegistration(reg.id, { paymentStatus: newStatus });
      setRegistrations(registrations.map(r => r.id === reg.id ? { ...r, paymentStatus: newStatus } : r));
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  };

  const handleCloseEvent = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Encerrar Inscrições?',
      message: 'Novas inscrições serão bloqueadas na página pública. Esta ação pode ser revertida editando o status do evento.',
      type: 'warning',
      onConfirm: async () => {
        try {
          await api.events.update(id, { status: 'closed' });
          setEvents(events.map(e => e.id === id ? { ...e, status: 'closed' } : e));
          showNotification("Evento encerrado com sucesso", "success");
        } catch (error) {
          showNotification("Erro ao encerrar evento", "error");
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDeleteEvent = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Evento Permanentemente?',
      message: 'Esta ação não pode ser desfeita. Todos os dados das inscrições também serão perdidos.',
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.events.delete(id);
          setEvents(events.filter(e => e.id !== id));
          showNotification("Evento excluído com sucesso", "success");
        } catch (error: any) {
          showNotification(error.message || "Erro ao excluir evento.", "error");
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const downloadCSV = () => {
    if (!registrations.length) return;

    const headers = ['Nome', 'Email', 'Telefone', 'CPF', 'Status Pagamento', 'Data Inscrição'];
    const rows = registrations.map(reg => [
      reg.name,
      reg.email,
      reg.phone,
      reg.cpf,
      reg.paymentStatus === 'paid' ? 'Pago' : 'Pendente',
      new Date(reg.createdAt).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inscritos-${selectedEvent.title}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const eventToSave = {
        ...formData,
        image: formData.image || `https://picsum.photos/seed/${Math.random()}/600/400`,
        status: 'open',
        registrationProgress: 0
      };
      const newEvent = await api.events.create(eventToSave);
      setEvents([newEvent, ...events]);
      setShowModal(false);
      setFormData({
        title: '',
        date: '',
        endDate: '',
        time: '',
        location: '',
        price: '',
        description: '',
        image: '',
        registrationDeadline: ''
      });
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  return (
    <div className="p-8 space-y-8 bg-background-dark min-h-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800 pb-8">
        <div>
          <h2 className="text-4xl font-bold text-white font-serif tracking-tight">Programação Oficial</h2>
          <p className="text-slate-400 mt-2">Monitore inscrições e controle lotes de venda.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-[#0B1120] px-8 py-3 rounded-xl shadow-glow transition-all font-bold"
        >
          <span className="material-symbols-outlined">add</span> NOVO EVENTO
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500">Carregando eventos...</div>
      ) : events.length === 0 ? (
        <div className="py-20 text-center text-slate-500">Nenhum evento programado.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {events.map(event => (
            <EventCard
              key={event.id}
              event={event}
              onViewRegistrations={() => fetchRegistrations(event)}
              onCopyLink={() => copyLink(event.id)}
              onCloseEvent={() => handleCloseEvent(event.id)}
              onDeleteEvent={() => handleDeleteEvent(event.id)}
            />
          ))}
        </div>
      )}

      {/* Modal de Lista de Inscritos */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-surface-dark w-full max-w-4xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/30">
              <div>
                <h3 className="text-xl font-bold text-white font-serif italic">Inscritos: {selectedEvent?.title}</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Total: {registrations.length} pessoas</p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={downloadCSV}
                  className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-500/20 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">download</span> BAIXAR CSV
                </button>
                <button onClick={() => setShowRegModal(false)} className="text-slate-400 hover:text-white transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-500 text-[10px] uppercase tracking-widest border-b border-slate-800 font-bold">
                    <th className="pb-4">Participante</th>
                    <th className="pb-4">Contato</th>
                    <th className="pb-4">Documentos (CPF)</th>
                    <th className="pb-4">Status Pago</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {registrations.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-600 italic">Nenhuma inscrição realizada ainda.</td>
                    </tr>
                  ) : registrations.map((reg: any) => (
                    <tr key={reg.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="py-4">
                        <div className="text-white font-bold">{reg.name}</div>
                        <div className="text-[9px] text-slate-500 italic">Inscrito em: {new Date(reg.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="py-4">
                        <div className="text-slate-300 text-sm">{reg.email}</div>
                        <div className="text-slate-500 text-xs">{reg.phone}</div>
                      </td>
                      <td className="py-4 font-mono text-xs text-slate-400">{reg.cpf}</td>
                      <td className="py-4">
                        <button
                          onClick={() => handleTogglePayment(reg)}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all flex items-center gap-2 ${reg.paymentStatus === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20'
                            }`}
                        >
                          <span className="material-symbols-outlined text-xs">
                            {reg.paymentStatus === 'paid' ? 'check_circle' : 'pending'}
                          </span>
                          {reg.paymentStatus === 'paid' ? 'Pago' : 'Pendente'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Evento */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-surface-dark w-full max-w-xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/30">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">event_available</span> Novo Evento
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-widest">Título do Evento</label>
                  <input
                    required
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Retiro de Jovens"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-widest">Data Início</label>
                  <input
                    required
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-widest">Data Término</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-widest">Encerramento Inscrições</label>
                  <input
                    type="date"
                    value={formData.registrationDeadline}
                    onChange={e => setFormData({ ...formData, registrationDeadline: e.target.value })}
                    className="w-full bg-slate-800 border border-emerald-500/20 rounded-xl py-3 px-4 text-white focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-widest">Horário</label>
                  <input
                    type="text"
                    value={formData.time}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                    placeholder="Ex: 19:00"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-widest">Investimento / Preço</label>
                  <input
                    type="text"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    placeholder="Ex: R$ 50,00 ou Gratuito"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-widest">Localização</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Ex: Auditório Principal ou Link do Zoom"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-widest">URL da Imagem de Capa</label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={e => setFormData({ ...formData, image: e.target.value })}
                    placeholder="Ex: https://images.unsplash.com/photo-..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-primary focus:border-primary outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-2 italic">Deixe em branco para usar uma imagem aleatória de alta qualidade.</p>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-widest">Descrição curta</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-primary focus:border-primary outline-none resize-none"
                  ></textarea>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 px-6 rounded-xl font-bold text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all uppercase tracking-widest">Cancelar</button>
                <button type="submit" className="flex-1 py-3 px-6 rounded-xl font-bold bg-primary text-slate-900 hover:bg-primary-dark transition-all uppercase tracking-widest shadow-glow">Publicar Evento</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        confirmLabel={confirmModal.type === 'danger' ? 'Excluir Permanentemente' : 'Confirmar'}
      />
    </div>
  );
};

interface EventCardProps {
  event: ChurchEvent;
  onViewRegistrations: () => void;
  onCopyLink: () => void;
  onCloseEvent: () => void;
  onDeleteEvent: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onViewRegistrations, onCopyLink, onCloseEvent, onDeleteEvent }) => {
  const statusLabels: Record<string, string> = {
    'open': 'Inscrições Abertas',
    'closed': 'Encerramos',
    'confirmed': 'Confirmado',
    'last_spots': 'Últimas Vagas',
    'draft': 'Rascunho'
  };

  return (
    <div className={`group flex flex-col rounded-2xl bg-surface-dark border border-slate-700 overflow-hidden hover:border-primary/60 transition-all duration-500 hover:shadow-glow ${event.status === 'closed' ? 'opacity-60 grayscale-[0.8]' : ''}`}>
      <div className="relative h-48 bg-cover bg-center" style={{ backgroundImage: `url('${event.image}')` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-surface-dark/40 to-transparent"></div>
        <div className="absolute top-4 left-4 flex gap-2">
          {event.status === 'open' ? (
            <button
              onClick={onCloseEvent}
              title="Encerrar Inscrições"
              className="size-8 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-orange-500 hover:border-orange-400 transition-all opacity-0 group-hover:opacity-100"
            >
              <span className="material-symbols-outlined text-[18px]">block</span>
            </button>
          ) : (
            <button
              onClick={onDeleteEvent}
              title="Excluir Evento"
              className="size-8 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-red-500 hover:border-red-400 transition-all opacity-0 group-hover:opacity-100"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          )}
        </div>
        <div className="absolute top-4 right-4">
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border ${event.status === 'open' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
            event.status === 'closed' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
              event.status === 'last_spots' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-slate-700/50 text-slate-400 border-slate-600/50'
            }`}>
            {statusLabels[event.status] || event.status}
          </span>
        </div>

        {/* Hover Actions */}
        <div className="absolute inset-x-0 bottom-4 px-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
          <button
            onClick={onCopyLink}
            disabled={event.status === 'closed'}
            className={`flex-1 backdrop-blur-md text-white text-[9px] font-bold py-2 rounded-lg border uppercase tracking-widest flex items-center justify-center gap-1 ${event.status === 'closed' ? 'bg-slate-800/50 border-slate-700 text-slate-500 cursor-not-allowed' : 'bg-white/10 hover:bg-white/20 border-white/20'}`}
          >
            <span className="material-symbols-outlined text-xs">link</span> {event.status === 'closed' ? 'Encerrado' : 'Copiar Link'}
          </button>
          <button
            onClick={onViewRegistrations}
            className="flex-1 bg-primary text-black text-[9px] font-bold py-2 rounded-lg uppercase tracking-widest flex items-center justify-center gap-1 shadow-glow"
          >
            <span className="material-symbols-outlined text-xs">group</span> Ver Inscritos
          </button>
        </div>
      </div>
      <div className="p-6 flex flex-col gap-5 -mt-2 relative z-10 bg-surface-dark">
        <div>
          <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors font-serif leading-tight line-clamp-1">{event.title}</h3>
          <p className="text-slate-400 text-sm mt-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">calendar_month</span> {new Date(event.date).toLocaleDateString()}
          </p>
        </div>
        <div className="h-px bg-slate-700 w-full"></div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Investimento</span>
          <span className="text-white font-bold text-lg font-serif">
            {(!event.price || event.price === '0' || event.price.toLowerCase().includes('gratuito')) ? 'Gratuito' : event.price}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-end text-xs">
            <span className="text-slate-400 font-medium uppercase tracking-wide">Preenchimento</span>
            <span className="font-bold text-primary">{event.registrationProgress}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-primary shadow-glow transition-all duration-1000" style={{ width: `${event.registrationProgress}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Events;
