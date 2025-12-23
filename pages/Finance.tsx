
import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Transaction } from '../types';
import { showNotification } from '../components/Notification';
import ConfirmModal from '../components/ConfirmModal';

const Finance: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'income',
    category: '',
    subCategory: '',
    method: 'Pix',
    date: new Date().toISOString().split('T')[0]
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { }
  });

  const financeCategories = {
    income: {
      'Dízimos': ['Dízimo Geral', 'Dízimo Cartão', 'Dízimo Pix', 'Dízimo Espécie'],
      'Ofertas': ['Oferta Alçapão', 'Oferta Especial', 'Oferta Missões', 'Oferta Construção'],
      'Eventos': ['Inscrições de Evento', 'Venda Cantina', 'Bazar da Igreja'],
      'Outros': ['Aluguéis Recebidos', 'Doações de Terceiros']
    },
    expense: {
      'Custos Fixos': ['Aluguel do Templo', 'Conta de Água', 'Conta de Luz', 'Internet / WI-FI', 'IPTU'],
      'Pessoal': ['Preletor / Oferta no Altar', 'Salário Pastoral', 'Salário CLT', 'Encargos Sociais'],
      'Ministérios': ['Louvor e Adoração', 'Ministério Kids', 'Rede de Jovens', 'Equipe de Mídia'],
      'Missões': ['Apoio Regional', 'Missão Transcultural', 'Ação Social / Cestas'],
      'Manuntenção': ['Serviço de Limpeza', 'Manutenção Elétrica', 'Reparo de Ar-condicionado'],
      'Administrativo': ['Plataformas Digitais', 'Papelaria / Gráfica', 'Taxas Bancárias']
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const data = await api.transactions.getAll();
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        description: formData.description,
        amount: parseFloat(formData.amount.replace(',', '.')),
        type: formData.type as 'income' | 'expense',
        category: formData.category,
        subCategory: formData.subCategory,
        date: new Date(formData.date).toISOString(),
        method: formData.method
      };

      if (editingId) {
        const updated = await api.transactions.update(editingId, payload);
        setTransactions(transactions.map(t => t.id === editingId ? updated : t));
        showNotification('Lançamento atualizado com sucesso!', 'success');
      } else {
        const newTransaction = await api.transactions.create(payload);
        setTransactions([newTransaction, ...transactions]);
        showNotification('Lançamento registrado com sucesso!', 'success');
      }

      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving transaction:', error);
      showNotification('Erro ao salvar lançamento.', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      type: 'income',
      category: '',
      subCategory: '',
      method: 'Pix',
      date: new Date().toISOString().split('T')[0]
    });
    setEditingId(null);
  };

  const handleEdit = (t: Transaction) => {
    setFormData({
      description: t.description,
      amount: t.amount.toString().replace('.', ','),
      type: t.type,
      category: t.category,
      subCategory: t.subCategory || '',
      method: t.method || 'Pix',
      date: new Date(t.date).toISOString().split('T')[0]
    });
    setEditingId(t.id);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Lançamento',
      message: 'Tem certeza que deseja excluir este registro financeiro? Esta ação não pode ser desfeita.',
      onConfirm: async () => {
        try {
          await api.transactions.delete(id);
          setTransactions(transactions.filter(t => t.id !== id));
          showNotification('Lançamento excluído com sucesso!', 'success');
        } catch (error) {
          console.error('Error deleting transaction:', error);
          showNotification('Erro ao excluir lançamento.', 'error');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const balance = totalIncome - totalExpense;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const currentCategories = formData.type === 'income' ? financeCategories.income : financeCategories.expense;

  return (
    <div className="p-6 md:p-10 space-y-8 bg-background-dark min-h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white font-serif">Fluxo de Caixa</h2>
          <p className="text-slate-400 text-sm mt-1">Gestão financeira centralizada da congregação.</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-primary hover:bg-primary-dark text-slate-900 px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined">add_circle</span> NOVO LANÇAMENTO
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatBox
          title="Entradas"
          amount={formatCurrency(totalIncome)}
          trend=""
          type="income"
          icon="payments"
        />
        <StatBox
          title="Saídas"
          amount={formatCurrency(totalExpense)}
          trend=""
          type="expense"
          icon="money_off"
        />
        <StatBox
          title="Saldo Atual"
          amount={formatCurrency(balance)}
          trend=""
          type="balance"
          icon="account_balance"
          isDark
        />
      </div>

      <div className="bg-surface-dark border border-slate-700/60 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700/60 flex items-center justify-between bg-slate-800/20">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">history</span> Últimas Movimentações
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-800/40 border-b border-slate-700/60 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Descrição</th>
                <th className="px-6 py-4">Categoria / Sub.</th>
                <th className="px-6 py-4 text-right">Valor</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-500">
                    Carregando transações...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-500">
                    Nenhuma movimentação encontrada.
                  </td>
                </tr>
              ) : (
                transactions.map(t => (
                  <TransactionRow
                    key={t.id}
                    transaction={t}
                    onEdit={() => handleEdit(t)}
                    onDelete={() => handleDelete(t.id)}
                    formatCurrency={formatCurrency}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Transação */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-surface-dark w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/20">
              <h3 className="text-xl font-bold text-white italic">{editingId ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-4 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50 mb-2">
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'income', category: '', subCategory: '' })}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${formData.type === 'income' ? 'bg-emerald-500 text-slate-900' : 'bg-slate-800 text-slate-500'}`}
                    >
                      Entrada
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'expense', category: '', subCategory: '' })}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${formData.type === 'expense' ? 'bg-red-500 text-slate-900' : 'bg-slate-800 text-slate-500'}`}
                    >
                      Saída
                    </button>
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Data do Lançamento</label>
                  <input
                    required
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-3 text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none mb-4"
                  />
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Descrição do Lançamento</label>
                  <input
                    required
                    type="text"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-3 text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    placeholder="Ex: Oferta de Altar, Reparo Elétrico..."
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Valor (R$)</label>
                  <input
                    required
                    type="text"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-3 text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    placeholder="0,00"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Forma de Pagto.</label>
                  <select
                    value={formData.method}
                    onChange={e => setFormData({ ...formData, method: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-3 text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  >
                    <option>Pix</option>
                    <option>Dinheiro</option>
                    <option>Cartão Crédito</option>
                    <option>Cartão Débito</option>
                    <option>Transferência</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Categoria</label>
                  <select
                    required
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value, subCategory: '' })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-3 text-white focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="">Selecione...</option>
                    {Object.keys(currentCategories).map(cat => (
                      <option key={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Subcategoria</label>
                  <select
                    required
                    disabled={!formData.category}
                    value={formData.subCategory}
                    onChange={e => setFormData({ ...formData, subCategory: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-3 text-white focus:ring-1 focus:ring-primary outline-none disabled:opacity-50"
                  >
                    <option value="">Selecione...</option>
                    {formData.category && (currentCategories as any)[formData.category].map((sub: string) => (
                      <option key={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full bg-primary text-slate-900 font-bold py-3 rounded-xl hover:bg-primary-dark transition-all mt-6 shadow-glow uppercase tracking-widest text-xs">
                {editingId ? 'SALVAR ALTERAÇÕES' : 'Finalizar Lançamento'}
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        type="danger"
      />
    </div>
  );
};

const StatBox: React.FC<{ title: string; amount: string; trend: string; type: 'income' | 'expense' | 'balance'; icon: string; isDark?: boolean }> = ({ title, amount, trend, type, icon, isDark }) => (
  <div className={`rounded-2xl p-6 border shadow-lg relative overflow-hidden group transition-all duration-300 bg-surface-dark border-slate-700/60 hover:border-primary/40`}>
    <div className="flex justify-between items-start z-10 relative">
      <div className={`p-3 rounded-xl border bg-slate-800/50 text-primary border-slate-700/50 group-hover:bg-primary group-hover:text-slate-900 transition-colors`}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      {trend && (
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-widest ${type === 'income' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
          type === 'expense' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-primary/10 text-primary border-primary/20'
          }`}>
          {trend}
        </span>
      )}
    </div>
    <div className="mt-6 relative z-10">
      <p className={`text-slate-400 text-xs font-bold uppercase tracking-widest mb-1`}>{title}</p>
      <h3 className="text-3xl font-bold text-white">{amount}</h3>
    </div>
    <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-10 transition-all duration-700 rotate-12 group-hover:rotate-0">
      <span className="material-symbols-outlined text-[140px]">{icon}</span>
    </div>
  </div>
);

const TransactionRow: React.FC<{
  transaction: Transaction;
  onEdit: () => void;
  onDelete: () => void;
  formatCurrency: (val: number) => string;
}> = ({ transaction, onEdit, onDelete, formatCurrency }) => {
  const { date, description: desc, category: cat, subCategory: subCat, amount, type } = transaction;

  return (
    <tr className="hover:bg-white/[0.02] transition-colors group">
      <td className="px-6 py-5 text-xs text-slate-500 font-mono italic">{new Date(date).toLocaleDateString()}</td>
      <td className="px-6 py-5">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-200 group-hover:text-primary transition-colors">{desc}</span>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
            <span className="material-symbols-outlined text-[10px]">label</span> {cat}
          </span>
        </div>
      </td>
      <td className="px-6 py-5">
        <span className="inline-flex px-2 py-1 rounded-md text-[9px] font-bold bg-slate-900 text-slate-400 border border-slate-700 group-hover:border-primary/30 transition-all">
          {subCat || cat}
        </span>
      </td>
      <td className={`px-6 py-5 text-sm font-bold font-mono text-right ${type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
        {(type === 'income' ? '+ ' : '- ') + formatCurrency(amount)}
      </td>
      <td className="px-6 py-5">
        <div className="flex justify-center gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
            title="Editar"
          >
            <span className="material-symbols-outlined text-lg">edit</span>
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
            title="Excluir"
          >
            <span className="material-symbols-outlined text-lg">delete</span>
          </button>
        </div>
      </td>
    </tr>
  );
};

export default Finance;
