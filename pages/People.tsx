
import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Member } from '../types';
import { showNotification } from '../components/Notification';

const People: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    birthDate: '',
    status: 'active',
    role: 'Membro',
    gender: 'M',
    maritalStatus: 'Solteiro(a)',
    address: '',
    cellGroup: '',
    ministries: [] as string[],
    isSystemUser: false,
    password: '',
    photoFile: null as File | null,
    photoUrl: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const availableMinistries = ['Louvor', 'Kids', 'Jovens', 'Recepção', 'Intercessão', 'Mídia', 'Ação Social', 'Ensino'];

  const statusOptions = [
    { value: 'active', label: 'Membro Ativo' },
    { value: 'visitor', label: 'Visitante' },
    { value: 'leader', label: 'Líder' },
    { value: 'candidate', label: 'Candidato' },
    { value: 'inactive', label: 'Inativo' }
  ];

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const data = await api.members.getAll();
      setMembers(data);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (key !== 'photoFile' && key !== 'photoUrl' && key !== 'ministries') {
          dataToSend.append(key, (formData as any)[key]);
        }
      });
      dataToSend.append('ministries', JSON.stringify(formData.ministries));
      if (formData.photoFile) {
        dataToSend.append('photoFile', formData.photoFile);
      }

      if (editingId) {
        const updatedMember = await api.members.update(editingId, dataToSend);

        if (formData.isSystemUser) {
          try {
            await api.auth.register({
              email: formData.email,
              password: formData.password || undefined,
              name: formData.name,
              memberId: editingId,
              photo: updatedMember.photo
            });
          } catch (authErr) {
            console.error('Error updating user account:', authErr);
          }
        }

        setMembers(members.map(m => m.id === editingId ? updatedMember : m));
        showNotification("Cadastro atualizado com sucesso", "success");
      } else {
        const newMember = await api.members.create(dataToSend);

        if (formData.isSystemUser && formData.password) {
          try {
            await api.auth.register({
              email: formData.email,
              password: formData.password,
              name: formData.name,
              memberId: newMember.id,
              photo: newMember.photo
            });
          } catch (authErr) {
            console.error('Error creating user account:', authErr);
            showNotification("Membro salvo, mas erro ao criar conta de acesso", "warning");
          }
        }

        setMembers([...members, newMember]);
        showNotification("Cadastro realizado com sucesso", "success");
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({
        name: '', email: '', phone: '', birthDate: '', status: 'active', role: 'Membro',
        gender: 'M', maritalStatus: 'Solteiro(a)', address: '', cellGroup: '', ministries: [],
        isSystemUser: false, password: '', photoFile: null, photoUrl: ''
      });
    } catch (error) {
      console.error('Error saving member:', error);
      showNotification("Erro ao salvar cadastro", "error");
    }
  };

  const handleEdit = (member: Member) => {
    setEditingId(member.id);
    setFormData({
      name: member.name,
      email: member.email,
      phone: member.phone,
      birthDate: member.birthDate,
      status: member.status,
      role: member.role,
      gender: (member as any).gender || 'M',
      maritalStatus: (member as any).maritalStatus || 'Solteiro(a)',
      address: (member as any).address || '',
      cellGroup: member.cellGroup || '',
      ministries: member.ministries || [],
      isSystemUser: false,
      password: '',
      photoFile: null,
      photoUrl: member.photo
    });
    setShowModal(true);
  };

  return (
    <div className="p-6 md:p-10 space-y-8 bg-background-dark min-h-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800 pb-8">
        <div>
          <h2 className="text-3xl font-bold text-white font-serif tracking-tight">Membros e Visitantes</h2>
          <p className="text-slate-400 mt-1">Gerencie o banco de dados da congregação.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-slate-900 px-6 py-2.5 rounded-xl shadow-lg shadow-primary/20 transition-all font-bold"
        >
          <span className="material-symbols-outlined">person_add</span> NOVO REGISTRO
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard label="Total Membros" value={members.length.toString()} icon="diversity_3" color="text-primary" />
        <MetricCard label="Visitantes" value={members.filter(m => m.status === 'visitor').length.toString()} icon="person_add" color="text-amber-500" />
        <MetricCard label="Líderes" value={members.filter(m => m.status === 'leader').length.toString()} icon="grade" color="text-indigo-400" />
        <MetricCard label="Ativos" value={members.filter(m => m.status === 'active').length.toString()} icon="task_alt" color="text-rose-400" />
      </div>

      <div className="bg-surface-dark rounded-2xl border border-slate-700/60 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700/60 flex items-center justify-between bg-slate-800/20">
          <div className="flex-1 max-w-sm relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">search</span>
            <input
              type="text"
              placeholder="Pesquisar por nome ou cargo..."
              className="w-full bg-slate-800 border border-slate-700/60 rounded-full py-2 pl-10 pr-4 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-800/40 border-b border-slate-700/60 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                <th className="py-4 px-6">Nome / Contato</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Célula / Grupo</th>
                <th className="py-4 px-6">Data Ingresso</th>
                <th className="py-4 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-500">
                    Carregando membros...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-500">
                    Nenhum membro encontrado.
                  </td>
                </tr>
              ) : (
                members.map(member => (
                  <MemberRow
                    key={member.id}
                    member={member}
                    onEdit={() => handleEdit(member)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Membro */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-surface-dark w-full max-w-2xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/30">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">{editingId ? 'edit' : 'person_add'}</span> {editingId ? 'Editar Pessoa' : 'Adicionar Pessoa'}
              </h3>
              <button onClick={() => { setShowModal(false); setEditingId(null); }} className="text-slate-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2 flex flex-col items-center gap-4 py-4 bg-slate-800/40 rounded-2xl border border-dashed border-slate-700">
                  <div className="relative group">
                    <div
                      className="size-24 rounded-2xl bg-cover bg-center border-2 border-slate-700 overflow-hidden"
                      style={{ backgroundImage: `url('${formData.photoUrl || (formData.gender === 'F' ? 'https://i.pravatar.cc/150?img=5' : 'https://i.pravatar.cc/150?img=11')}')` }}
                    >
                      {formData.photoFile && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="material-symbols-outlined text-white">check</span>
                        </div>
                      )}
                    </div>
                    <label className="absolute -bottom-2 -right-2 size-8 bg-primary text-slate-900 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-all">
                      <span className="material-symbols-outlined text-sm">photo_camera</span>
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setFormData({ ...formData, photoFile: file, photoUrl: URL.createObjectURL(file) });
                          }
                        }}
                      />
                    </label>
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Foto de Perfil</p>
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-widest">Nome Completo</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-primary focus:border-primary outline-none transition-all" />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-widest">E-mail</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-primary focus:border-primary outline-none" />
                </div>

                <div>
                  <label className="text-[10px] font-bold text text-slate-500 uppercase mb-2 block tracking-widest">WhatsApp / Telefone</label>
                  <input required type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-primary focus:border-primary outline-none" placeholder="(00) 00000-0000" />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-widest">Data de Nascimento</label>
                  <input required type="date" value={formData.birthDate} onChange={e => setFormData({ ...formData, birthDate: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-primary focus:border-primary outline-none" />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-widest">Gênero</label>
                  <div className="flex gap-4">
                    {['M', 'F'].map(g => (
                      <button key={g} type="button" onClick={() => setFormData({ ...formData, gender: g as any })} className={`flex-1 py-3 rounded-xl border font-bold transition-all ${formData.gender === g ? 'bg-primary text-black border-primary' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                        {g === 'M' ? 'Masculino' : 'Feminino'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-widest">Estado Civil</label>
                  <select value={formData.maritalStatus} onChange={e => setFormData({ ...formData, maritalStatus: e.target.value as any })} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-primary focus:border-primary outline-none">
                    {['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-widest">Status Eclesiástico</label>
                  <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-primary focus:border-primary outline-none">
                    {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-widest">Endereço Residencial</label>
                  <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-primary focus:border-primary outline-none" placeholder="Rua, número, bairro..." />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-4 block tracking-widest border-b border-slate-700 pb-2">Ministérios que faz parte</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {availableMinistries.map(min => (
                      <label key={min} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${formData.ministries.includes(min) ? 'bg-primary/10 border-primary text-primary' : 'bg-slate-800/50 border-slate-700 text-slate-500'}`}>
                        <input
                          type="checkbox"
                          hidden
                          checked={formData.ministries.includes(min)}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...formData.ministries, min]
                              : formData.ministries.filter(m => m !== min);
                            setFormData({ ...formData, ministries: next });
                          }}
                        />
                        <span className="material-symbols-outlined text-sm">{formData.ministries.includes(min) ? 'check_box' : 'check_box_outline_blank'}</span>
                        <span className="text-[10px] font-bold uppercase">{min}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="col-span-2 space-y-4 pt-4 border-t border-slate-700">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isSystemUser"
                      checked={formData.isSystemUser}
                      onChange={e => setFormData({ ...formData, isSystemUser: e.target.checked })}
                      className="size-4 rounded accent-primary bg-slate-800 border-slate-700"
                    />
                    <label htmlFor="isSystemUser" className="text-sm font-bold text-slate-300 cursor-pointer">Permitir acesso ao sistema</label>
                  </div>

                  {formData.isSystemUser && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-200">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-widest">Senha de Acesso</label>
                        <input
                          type="password"
                          required={formData.isSystemUser}
                          value={formData.password}
                          onChange={e => setFormData({ ...formData, password: e.target.value })}
                          placeholder="Mínimo 6 caracteres"
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white focus:ring-primary focus:border-primary outline-none"
                        />
                      </div>
                      <div className="flex items-end">
                        <p className="text-[10px] text-slate-500 italic mb-3">O e-mail cadastrado acima será o usuário de login.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-4 pt-6 border-t border-slate-700">
                <button type="button" onClick={() => { setShowModal(false); setEditingId(null); }} className="flex-1 py-4 px-6 rounded-xl font-bold text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all uppercase tracking-widest text-xs">CANCELAR</button>
                <button type="submit" className="flex-1 py-4 px-6 rounded-xl font-bold bg-primary text-slate-900 hover:bg-primary-dark transition-all uppercase tracking-widest text-xs shadow-glow">{editingId ? 'SALVAR ALTERAÇÕES' : 'FINALIZAR REGISTRO'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: string; icon: string; color: string }> = ({ label, value, icon, color }) => (
  <div className="bg-surface-dark p-6 rounded-2xl border border-slate-700/60 shadow-lg group hover:border-primary/30 transition-all">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 bg-slate-800/80 rounded-xl ${color} border border-slate-700/50 group-hover:bg-primary group-hover:text-slate-900 transition-all`}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
    </div>
    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
    <h3 className="text-3xl font-bold text-white font-serif">{value}</h3>
  </div>
);

const MemberRow: React.FC<{ member: Member; onEdit: () => void }> = ({ member, onEdit }) => {
  const statusLabels: any = {
    active: 'Membro Ativo',
    visitor: 'Visitante',
    leader: 'Líder',
    candidate: 'Candidato',
    inactive: 'Inativo'
  };

  return (
    <tr className="group hover:bg-slate-700/20 transition-colors border-b border-slate-800/50 last:border-0">
      <td className="py-5 px-6">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-cover bg-center border border-slate-700 group-hover:border-primary transition-all duration-500" style={{ backgroundImage: `url('${member.photo}')` }}></div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-100 group-hover:text-primary transition-colors">{member.name}</span>
            <span className="text-[10px] text-slate-500 font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-[12px]">mail</span> {member.email}
            </span>
          </div>
        </div>
      </td>
      <td className="py-5 px-6">
        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[9px] font-bold border uppercase tracking-widest ${member.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
          member.status === 'visitor' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
            member.status === 'leader' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
              'bg-slate-700/50 text-slate-400 border-slate-600/50'
          }`}>
          {statusLabels[member.status]}
        </span>
      </td>
      <td className="py-5 px-6">
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {member.ministries && member.ministries.length > 0 ? (
            member.ministries.map(m => (
              <span key={m} className="px-2 py-0.5 bg-slate-800 rounded text-[9px] text-slate-400 border border-slate-700 uppercase font-bold">{m}</span>
            ))
          ) : (
            <span className="text-[10px] text-slate-600 italic">Nenhum ministério</span>
          )}
        </div>
      </td>
      <td className="py-5 px-6">
        <div className="flex flex-col">
          <span className="text-xs text-slate-400">{new Date(member.joinDate).toLocaleDateString()}</span>
          <span className="text-[9px] text-slate-600 uppercase font-bold tracking-tighter">no sistema</span>
        </div>
      </td>
      <td className="py-5 px-6 text-right">
        <div className="flex justify-end gap-2">
          <button onClick={onEdit} className="text-primary hover:bg-primary/10 transition-colors p-2 rounded-lg">
            <span className="material-symbols-outlined text-[20px]">edit</span>
          </button>
          <button className="text-slate-500 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-800">
            <span className="material-symbols-outlined text-[20px]">more_vert</span>
          </button>
        </div>
      </td>
    </tr>
  );
};

export default People;
