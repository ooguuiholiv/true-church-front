import React, { useState, useEffect } from 'react';
import { api, getFullUrl } from '../api';
import { QRCodeCanvas } from 'qrcode.react';
import { showNotification } from '../components/Notification';

interface Kid {
  id: string;
  name: string;
  age: string;
  room: string;
  parent: string;
  allergy?: string;
  isVisitor?: boolean;
  photo: string;
  status?: 'present' | 'checked_out';
}

const KidsCheckin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'present' | 'database'>('present');
  const [isScanning, setIsScanning] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [baseKids, setBaseKids] = useState<Kid[]>([]);
  const [presentKids, setPresentKids] = useState<Kid[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', age: '', parent: '', room: 'Maternal', allergy: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [base, present] = await Promise.all([
        api.kids.getBase(),
        api.kids.getPresent()
      ]);
      setBaseKids(base);
      setPresentKids(present);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const updatedKid = await api.kids.update(editingId, formData);
        setBaseKids(baseKids.map(k => k.id === editingId ? updatedKid : k));
        showNotification("Cadastro atualizado com sucesso", "success");
      } else {
        const newKid = await api.kids.register({
          ...formData,
          photo: `https://picsum.photos/seed/${Math.random()}/100/100`
        });
        setBaseKids([...baseKids, newKid]);
        showNotification("Criança cadastrada com sucesso", "success");
      }
      setShowRegisterModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving kid:', error);
      showNotification("Erro ao salvar cadastro", "error");
    }
  };

  const resetForm = () => {
    setFormData({ name: '', age: '', parent: '', room: 'Maternal', allergy: '' });
    setEditingId(null);
  };

  const handleEdit = (kid: Kid) => {
    setFormData({
      name: kid.name,
      age: kid.age,
      parent: kid.parent,
      room: kid.room || 'Maternal',
      allergy: kid.allergy || ''
    });
    setEditingId(kid.id);
    setShowRegisterModal(true);
  };

  const handleCheckin = async (kidId: string) => {
    try {
      const checkinRes = await api.kids.checkin(kidId, "Maternal B");
      setPresentKids([...presentKids, checkinRes]);
      showNotification(`${checkinRes.name} entrou na sala`, "success");
      setIsScanning(false);
      setActiveTab('present');
    } catch (error) {
      showNotification("Erro no check-in. Verifique se a criança já está presente.", "error");
      setIsScanning(false);
    }
  };

  const handleCheckout = async (id: string) => {
    try {
      await api.kids.checkout(id);
      setPresentKids(presentKids.filter(k => k.id !== id));
    } catch (error) {
      console.error('Error checking out:', error);
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-8 bg-background-dark min-h-full">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-surface-dark p-8 rounded-2xl shadow-xl border border-slate-700/60 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-1 bg-primary/20 rounded-bl-xl text-[9px] font-bold text-primary uppercase tracking-widest border-l border-b border-primary/30">Módulo Kids Segure</div>
        <div className="flex flex-col gap-1 relative z-10">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            Kids: Check-in & Segurança
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase tracking-widest animate-pulse">Online</span>
          </h2>
          <p className="text-slate-400 text-sm">Controle biométrico e por QR Code de entrada e saída das salas.</p>
        </div>
        <div className="flex gap-4 relative z-10">
          <button
            onClick={() => { resetForm(); setShowRegisterModal(true); }}
            className="flex items-center gap-2 bg-slate-800 text-slate-300 hover:text-white px-6 py-3 rounded-xl font-bold text-sm border border-slate-700 transition-all font-display"
          >
            <span className="material-symbols-outlined">person_add</span> CADASTRAR CRIANÇA
          </button>
          <button
            onClick={() => setIsScanning(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-slate-900 px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/10 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined">qr_code_scanner</span> ESCANEAR QR CODE
          </button>
        </div>
      </div>

      <div className="flex gap-4 p-1 bg-surface-dark w-fit rounded-xl border border-slate-700/60">
        <button
          onClick={() => setActiveTab('present')}
          className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'present' ? 'bg-primary text-slate-900 shadow-glow' : 'text-slate-500 hover:text-slate-300'}`}
        >
          No Prédio ({presentKids.length})
        </button>
        <button
          onClick={() => setActiveTab('database')}
          className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'database' ? 'bg-primary text-slate-900 shadow-glow' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Base de Dados ({baseKids.length})
        </button>
      </div>

      {activeTab === 'present' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-full py-20 text-center text-slate-500">Carregando dados...</div>
          ) : presentKids.length === 0 ? (
            <div className="col-span-full py-20 text-center text-slate-500 bg-surface-dark/30 rounded-3xl border border-dashed border-slate-700">
              <div className="py-12 flex flex-col items-center">
                <span className="material-symbols-outlined text-6xl text-slate-700 mb-4 font-thin">meeting_room</span>
                <p>Nenhuma criança na sala no momento.</p>
                <button onClick={() => setIsScanning(true)} className="mt-4 text-primary text-sm font-bold underline">Realizar Check-in agora</button>
              </div>
            </div>
          ) : (
            presentKids.map(kid => (
              <KidCard
                key={kid.id}
                kid={kid}
                onAction={() => handleCheckout(kid.id)}
                actionLabel="Checkout"
              />
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {baseKids.map(kid => (
            <KidCard
              key={kid.id}
              kid={kid}
              onAction={() => { }}
              onEdit={() => handleEdit(kid)}
              actionLabel="Ver Tag"
              showQR
            />
          ))}
        </div>
      )}

      {/* Modal de Scanner */}
      {isScanning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
          <div className="bg-surface-darker w-full max-w-lg aspect-square rounded-3xl border border-primary/30 relative overflow-hidden flex flex-col items-center justify-center p-12">
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="w-full h-1 bg-primary absolute top-0 shadow-glow animate-scan"></div>
            </div>
            <div className="size-64 border-2 border-primary/40 rounded-3xl flex flex-wrap items-center justify-center p-4 gap-2 overflow-y-auto bg-slate-900/50">
              {baseKids.length === 0 ? (
                <p className="text-slate-500 text-center text-xs">Nenhuma criança cadastrada para simular escaneamento.</p>
              ) : (
                baseKids.map(kid => (
                  <button
                    key={kid.id}
                    onClick={() => handleCheckin(kid.id)}
                    className="p-3 bg-primary/10 border border-primary/20 rounded-xl hover:bg-primary hover:text-slate-900 transition-all text-[10px] font-bold text-primary w-full"
                  >
                    ESCANEAR: {kid.name.split(' ')[0]}
                  </button>
                ))
              )}
            </div>
            <h3 className="text-xl font-bold text-white mt-8 mb-2">Simulador de Scanner</h3>
            <p className="text-slate-500 text-center text-sm mb-8">Em um terminal real, basta aproximar o QR Code. Aqui, selecione a criança para simular o escaneamento.</p>
            <button
              onClick={() => setIsScanning(false)}
              className="bg-slate-800 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest border border-slate-700 hover:bg-slate-700 transition-all"
            >
              FECHAR CÂMERA
            </button>
          </div>
        </div>
      )}

      {/* Modal de Cadastro */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-surface-dark w-full max-w-xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/30">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">{editingId ? 'edit' : 'person_add_alt'}</span> {editingId ? 'Editar Cadastro' : 'Novo Cadastro Kids'}
              </h3>
              <button onClick={() => setShowRegisterModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-widest">Nome da Criança</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-primary focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-widest">Idade</label>
                  <input required type="number" value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-primary focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-widest">Responsável</label>
                  <input required type="text" value={formData.parent} onChange={e => setFormData({ ...formData, parent: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-primary focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-widest">Sala / Turma</label>
                  <select
                    value={formData.room}
                    onChange={e => setFormData({ ...formData, room: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-primary focus:border-primary outline-none appearance-none"
                  >
                    <option>Maternal</option>
                    <option>Kids 1 (3-5 anos)</option>
                    <option>Kids 2 (6-9 anos)</option>
                    <option>Juniores (10-12 anos)</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-widest">Alergias / Observações</label>
                  <input type="text" value={formData.allergy} onChange={e => setFormData({ ...formData, allergy: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-primary focus:border-primary outline-none" placeholder="Nenhuma" />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowRegisterModal(false)} className="flex-1 py-3 px-6 rounded-xl font-bold text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all uppercase tracking-widest text-xs">Cancelar</button>
                <button type="submit" className="flex-1 py-3 px-6 rounded-xl font-bold bg-primary text-slate-900 hover:bg-primary-dark transition-all uppercase tracking-widest text-xs">
                  {editingId ? 'Salvar Alterações' : 'Finalizar Cadastro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const KidCard: React.FC<{ kid: Kid; onAction: () => void; onEdit?: () => void; actionLabel: string; showQR?: boolean }> = ({ kid, onAction, onEdit, actionLabel, showQR }) => {
  const [isQRVisible, setIsQRVisible] = useState(false);

  return (
    <div className="bg-surface-dark rounded-2xl p-6 border border-slate-700/60 shadow-lg hover:border-primary/40 transition-all group animate-in fade-in zoom-in duration-300 relative overflow-hidden">
      <div className="flex gap-4">
        <div className="relative shrink-0">
          <div className="size-16 rounded-2xl bg-cover bg-center border-2 border-slate-700 group-hover:border-primary transition-all duration-500" style={{ backgroundImage: `url('${getFullUrl(kid.photo)}')` }}></div>
          {kid.status === 'present' && (
            <div className="absolute -bottom-1 -right-1 size-4 bg-emerald-500 border-2 border-surface-dark rounded-full"></div>
          )}
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <h4 className="font-bold text-white truncate group-hover:text-primary transition-colors">{kid.name}</h4>
          <p className="text-xs text-slate-400 font-medium">{kid.age} anos • <span className="font-bold text-primary-light uppercase tracking-wider">{kid.room}</span></p>
          <div className="mt-3 flex flex-wrap gap-2 text-[9px] font-bold uppercase">
            {kid.allergy && (
              <span className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">warning</span> {kid.allergy}
              </span>
            )}
            {kid.isVisitor && (
              <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 tracking-widest">Visitante</span>
            )}
          </div>
        </div>
      </div>
      <div className="mt-6 pt-5 border-t border-slate-700/60 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Responsável</span>
          <span className="text-xs font-bold text-slate-200">{kid.parent}</span>
        </div>
        <div className="flex gap-2">
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-2 border border-slate-700 text-slate-400 rounded-xl hover:text-primary hover:border-primary/50 transition-all"
              title="Editar"
            >
              <span className="material-symbols-outlined text-lg">edit</span>
            </button>
          )}
          <button
            onClick={showQR ? () => setIsQRVisible(true) : onAction}
            className={`text-[10px] font-bold border rounded-xl px-4 py-2 transition-all uppercase tracking-widest flex items-center gap-2 ${actionLabel === 'Checkout' ? 'text-slate-400 border-slate-700 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400' : 'text-primary border-primary/30 hover:bg-primary hover:text-black'
              }`}
          >
            {actionLabel}
          </button>
        </div>
      </div>

      {isQRVisible && (
        <div className="absolute inset-0 bg-surface-darker z-20 flex flex-col items-center justify-center p-4 animate-in slide-in-from-top duration-300">
          <button onClick={() => setIsQRVisible(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><span className="material-symbols-outlined">close</span></button>
          <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-4">Tag de Identificação</p>
          <div className="bg-white p-3 rounded-xl shadow-glow">
            <QRCodeCanvas
              value={kid.id}
              size={140}
              bgColor={"#ffffff"}
              fgColor={"#000000"}
              level={"L"}
              includeMargin={false}
            />
          </div>
          <p className="text-white font-bold mt-4 text-sm">{kid.name}</p>
          <p className="text-slate-500 text-[10px] mt-1 font-mono">{kid.id.substring(0, 8)}</p>
        </div>
      )}
    </div>
  );
};

export default KidsCheckin;
