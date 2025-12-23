import React, { useState, useEffect, useRef } from 'react';
import { api, BASE_URL } from '../api';
import { showNotification } from '../components/Notification';
import { Member } from '../types';

interface Document {
  id: string;
  name: string;
  size: string;
  category: string;
  uploadDate: string;
  status: string;
  filename: string;
}

const Secretary: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'docs' | 'certificados' | 'cartas'>('docs');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadData, setUploadData] = useState({ name: '', category: 'Institucional' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Certificate state
  const [showCertModal, setShowCertModal] = useState(false);
  const [certForm, setCertForm] = useState({ memberId: '', type: 'Batismo', date: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [docs, folks] = await Promise.all([
        api.secretary.getDocuments(),
        api.members.getAll()
      ]);
      setDocuments(docs);
      setMembers(folks);
    } catch (err) {
      showNotification("Erro ao carregar dados da secretaria", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      // Auto-fill name if empty
      if (!uploadData.name) {
        setUploadData(prev => ({ ...prev, name: file.name }));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showNotification("Selecione um arquivo para subir", "error");
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('name', uploadData.name || selectedFile.name);
    formData.append('category', uploadData.category);

    try {
      await api.secretary.createDocument(formData);
      showNotification("Documento enviado com sucesso!", "success");
      setShowUpload(false);
      setUploadData({ name: '', category: 'Institucional' });
      setSelectedFile(null);
      fetchData();
    } catch (err) {
      showNotification("Erro ao subir arquivo", "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.secretary.deleteDocument(id);
      showNotification("Documento removido", "success");
      fetchData();
    } catch (err) {
      showNotification("Erro ao excluir", "error");
    }
  };

  const handleEmitCertificate = () => {
    if (!certForm.memberId) {
      showNotification("Selecione um membro", "error");
      return;
    }
    const member = members.find(m => m.id === certForm.memberId);
    showNotification(`Certificado de ${certForm.type} gerado para ${member?.name}!`, "success");
    setShowCertModal(false);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen text-slate-400">
        <span className="material-symbols-outlined animate-spin mr-3">progress_activity</span>
        Carregando Secretaria...
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-8 bg-background-dark min-h-full">
      {/* Header Stat Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DocumentStat title="Arquivos no Cluster" value={documents.length.toString()} icon="cloud_done" color="text-primary" />
        <DocumentStat title="Membros Ativos" value={members.filter(m => m.status === 'active' || m.status === 'leader').length.toString()} icon="group" color="text-emerald-500" />
        <DocumentStat title="Documentos Oficiais" value={documents.filter(d => d.category === 'Institucional' || d.category === 'Atas de Reunião').length.toString()} icon="verified_user" color="text-blue-400" />
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 gap-8">
        <TabButton active={activeTab === 'docs'} onClick={() => setActiveTab('docs')} label="Arquivos Digitais" />
        <TabButton active={activeTab === 'certificados'} onClick={() => setActiveTab('certificados')} label="Certificados" />
      </div>

      {activeTab === 'docs' && (
        <div className="space-y-6">
          <div
            onClick={() => setShowUpload(true)}
            className="group flex items-center justify-between p-8 bg-slate-800/20 border-2 border-dashed border-slate-700 rounded-2xl hover:border-primary/50 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-6">
              <div className="size-16 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-slate-900 transition-all">
                <span className="material-symbols-outlined text-3xl">add_a_photo</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white uppercase tracking-wider">Novo Upload</h3>
                <p className="text-slate-500 text-sm italic">Suporta PDF, JPG, DOCX e Imagens.</p>
              </div>
            </div>
            <button className="px-6 py-2 bg-primary text-slate-900 font-bold rounded-lg text-xs uppercase tracking-widest hidden md:block">Adicionar Arquivo</button>
          </div>

          <div className="bg-surface-dark border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-700/60 bg-slate-800/30 flex justify-between items-center">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest">Listagem de Documentos</h2>
              <span className="text-[10px] text-slate-500 font-bold">{documents.length} ARQUIVOS</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-800/40 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-700/60">
                    <th className="py-4 px-6">Identificação</th>
                    <th className="py-4 px-6">Categoria</th>
                    <th className="py-4 px-6">Data / Tamanho</th>
                    <th className="py-4 px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/40">
                  {documents.map(doc => (
                    <tr key={doc.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-slate-500 group-hover:text-primary transition-colors">
                            {doc.name.toLowerCase().endsWith('.pdf') ? 'picture_as_pdf' : 'description'}
                          </span>
                          <span className="text-sm font-bold text-slate-200">{doc.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-[10px] font-bold bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700 uppercase">{doc.category}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-400 font-mono">{new Date(doc.uploadDate).toLocaleDateString()}</span>
                          <span className="text-[9px] text-slate-600 font-bold">{doc.size}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          <a
                            href={`${BASE_URL}/uploads/documents/${doc.filename}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 text-slate-500 hover:text-primary transition-colors hover:bg-slate-800 rounded-lg"
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </a>
                          <button onClick={() => handleDelete(doc.id)} className="p-2 text-slate-500 hover:text-red-500 transition-colors hover:bg-slate-800 rounded-lg">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {documents.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-slate-600 italic text-sm">Nenhum documento arquivado. Clique em "Novo Upload" para começar.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'certificados' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CertificateCard
            title="Certificado de Batismo"
            desc="Emitir para novos convertidos batizados."
            icon="water_drop"
            color="bg-blue-500"
            onClick={() => { setCertForm({ ...certForm, type: 'Batismo' }); setShowCertModal(true); }}
          />
          <CertificateCard
            title="Apresentação de Crianças"
            desc="Dedicando bebês ao Senhor."
            icon="child_care"
            color="bg-primary"
            onClick={() => { setCertForm({ ...certForm, type: 'Apresentação' }); setShowCertModal(true); }}
          />
        </div>
      )}

      {/* UPLOAD MODAL */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-surface-dark w-full max-w-md rounded-2xl border border-slate-700 p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-widest text-center italic">Novo Arquivo Digital</h3>

            <div className="space-y-6">
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`p-10 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer ${selectedFile ? 'border-primary/50 bg-primary/5' : 'border-slate-700 hover:border-slate-500'}`}
              >
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                <span className="material-symbols-outlined text-4xl text-slate-500">{selectedFile ? 'check_circle' : 'cloud_upload'}</span>
                <p className="text-xs font-bold text-slate-400 text-center">
                  {selectedFile ? selectedFile.name : 'Clique para selecionar o arquivo físico'}
                </p>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Título Amigável</label>
                <input
                  type="text"
                  value={uploadData.name}
                  onChange={e => setUploadData({ ...uploadData, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-primary transition-colors text-sm"
                  placeholder="Ex: Ata de Reunião Direitoria"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Categoria</label>
                <select
                  value={uploadData.category}
                  onChange={e => setUploadData({ ...uploadData, category: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-primary transition-colors text-sm"
                >
                  <option>Institucional</option>
                  <option>Atas de Reunião</option>
                  <option>Relatórios</option>
                  <option>Finanças</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => { setShowUpload(false); setSelectedFile(null); }} className="flex-1 py-3 text-xs font-bold text-slate-500 hover:text-white uppercase tracking-widest">Cancelar</button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile}
                className={`flex-1 py-3 font-bold rounded-xl text-xs uppercase tracking-widest border transition-all ${selectedFile ? 'bg-primary border-primary text-slate-900' : 'bg-slate-800 border-slate-700 text-slate-600 grayscale pointer-events-none'}`}
              >
                Subir Agora
              </button>
            </div>
          </div>
        </div>
      )}

      {showCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-surface-dark w-full max-w-lg rounded-2xl border border-slate-700 p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-widest italic">Emitir Certificado</h3>
            <p className="text-slate-500 text-xs mb-8">Tipo: {certForm.type}</p>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Selecione o Membro</label>
                <select
                  value={certForm.memberId}
                  onChange={e => setCertForm({ ...certForm, memberId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-primary transition-colors"
                >
                  <option value="">Escolha um nome...</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Data do Evento</label>
                  <input
                    type="date"
                    value={certForm.date}
                    onChange={e => setCertForm({ ...certForm, date: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-10">
              <button onClick={() => setShowCertModal(false)} className="flex-1 py-4 text-xs font-bold text-slate-500 hover:text-white uppercase tracking-widest">Fechar</button>
              <button onClick={handleEmitCertificate} className="flex-1 py-4 bg-primary text-slate-900 font-bold rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-lg">print</span> GERAR PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DocumentStat: React.FC<{ title: string; value: string; icon: string; color: string }> = ({ title, value, icon, color }) => (
  <div className={`bg-surface-dark p-6 rounded-2xl border border-slate-700/60 shadow-lg flex items-center gap-5 hover:border-primary/20 transition-all group`}>
    <div className={`size-14 rounded-2xl bg-slate-800 flex items-center justify-center ${color} border border-slate-700 group-hover:scale-110 transition-transform shadow-glow-subtle`}>
      <span className="material-symbols-outlined text-2xl">{icon}</span>
    </div>
    <div>
      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
    </div>
  </div>
);

const TabButton: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({ active, onClick, label }) => (
  <button
    onClick={onClick}
    className={`pb-4 text-[10px] font-bold uppercase tracking-[2px] transition-all relative ${active ? 'text-primary' : 'text-slate-500 hover:text-slate-300'}`}
  >
    {label}
    {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"></div>}
  </button>
);

const CertificateCard: React.FC<{ title: string; desc: string; icon: string; color: string; onClick: () => void }> = ({ title, desc, icon, color, onClick }) => (
  <div onClick={onClick} className="bg-surface-dark border border-slate-700 rounded-2xl p-6 hover:border-primary/40 transition-all group cursor-pointer overflow-hidden relative">
    <div className={`absolute -right-4 -top-4 size-24 ${color} opacity-5 blur-2xl group-hover:opacity-10 transition-opacity`}></div>
    <div className={`size-12 rounded-xl ${color} bg-opacity-10 flex items-center justify-center ${color.replace('bg-', 'text-')} mb-4 border border-current border-opacity-20`}>
      <span className="material-symbols-outlined text-2xl">{icon}</span>
    </div>
    <h4 className="text-base font-bold text-white mb-2">{title}</h4>
    <p className="text-slate-500 text-xs leading-relaxed mb-6">{desc}</p>
    <div className="flex items-center text-[10px] font-bold text-primary uppercase tracking-widest group-hover:gap-2 transition-all">
      Emitir Agora <span className="material-symbols-outlined text-sm">arrow_forward</span>
    </div>
  </div>
);

export default Secretary;
