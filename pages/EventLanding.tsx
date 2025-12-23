
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import { ChurchEvent } from '../types';
import { QRCodeCanvas } from 'qrcode.react';
import { showNotification } from '../components/Notification';

const EventLanding: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [event, setEvent] = useState<ChurchEvent | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        cpf: '',
    });

    const formatCPF = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    };

    const formatPhone = (value: string) => {
        const r = value.replace(/\D/g, '');
        if (r.length > 10) {
            return r.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
        } else if (r.length > 2) {
            return r.replace(/^(\d{2})(\d{4,5})(\d{0,4}).*/, '($1) $2-$3');
        } else if (r.length > 0) {
            return r.replace(/^(\d*)/, '($1');
        }
        return r;
    };

    useEffect(() => {
        if (id) {
            fetchEvent();
        }
    }, [id]);

    const fetchEvent = async () => {
        try {
            const data = await api.events.getAll();
            const found = data.find((e: any) => e.id === id);
            setEvent(found);
        } catch (error) {
            console.error('Error fetching event:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const isFree = !event?.price ||
                event.price.toLowerCase().includes('gratuito') ||
                event.price.toLowerCase().includes('grátis') ||
                event.price === '0';

            await api.events.registerParticipant(id!, {
                ...formData,
                paymentStatus: isFree ? 'paid' : 'pending',
                registrationDate: new Date().toISOString()
            });
            setSubmitted(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            showNotification("Erro ao realizar inscrição.", "error");
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
        </div>
    );

    if (!event) return (
        <div className="min-h-screen bg-[#0B1120] flex items-center justify-center text-white">
            Evento não encontrado.
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0B1120] text-slate-200 selection:bg-primary selection:text-black">
            {/* Hero Section */}
            <div className="relative h-[40vh] md:h-[60vh] overflow-hidden">
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${event.image}')` }}></div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0B1120]/60 to-[#0B1120]"></div>

                <div className="absolute bottom-0 left-0 w-full p-6 md:p-20">
                    <div className="max-w-7xl mx-auto">
                        <span className="px-4 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-widest border border-primary/30 mb-4 inline-block">
                            Inscrições Abertas
                        </span>
                        <h1 className="text-4xl md:text-7xl font-bold text-white font-serif mb-4 leading-tight">{event.title}</h1>
                        <div className="flex flex-wrap gap-6 text-sm md:text-lg text-slate-300">
                            <span className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">calendar_month</span> {new Date(event.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                {event.endDate && ` - ${new Date(event.endDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`}
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">payments</span> {event.price || 'Gratuito'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 md:px-20 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Descrição */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="prose prose-invert max-w-none">
                        <h2 className="text-3xl font-bold text-white font-serif mb-6">Sobre o Evento</h2>
                        <p className="text-slate-400 text-lg leading-relaxed">
                            {event.description || "Junte-se a nós para um momento inesquecível de comunhão e aprendizado. Este evento foi preparado com muito carinho para edificar sua vida e fortalecer nossa comunidade."}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface-dark/40 p-8 rounded-3xl border border-slate-800">
                        <div className="flex gap-4">
                            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-primary">location_on</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-white mb-1">Localização</h4>
                                <p className="text-slate-500 text-sm">{event.location || 'Sede da Igreja True Church - Auditório Principal'}</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-primary">schedule</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-white mb-1">Horário</h4>
                                <p className="text-slate-500 text-sm">{event.time || 'A definir'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Formulário / Checkout */}
                <div className="lg:col-span-1">
                    {(() => {
                        const isDeadlinePassed = event.registrationDeadline && new Date() > new Date(event.registrationDeadline);
                        const isClosed = event.status === 'closed' || isDeadlinePassed;

                        if (isClosed) {
                            return (
                                <div className="bg-surface-dark border border-red-500/20 p-10 rounded-3xl text-center space-y-6">
                                    <div className="size-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                                        <span className="material-symbols-outlined text-red-500 text-4xl">event_busy</span>
                                    </div>
                                    <h3 className="text-2xl font-bold text-white uppercase tracking-tight">Inscrições Encerradas</h3>
                                    <p className="text-slate-400 text-sm">
                                        {isDeadlinePassed
                                            ? "O prazo para inscrições deste evento expirou."
                                            : "Este evento não está mais aceitando novas inscrições."}
                                        <br />Fique atento às nossas próximas programações!
                                    </p>
                                    <button
                                        onClick={() => window.location.href = '/'}
                                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all"
                                    >
                                        VOLTAR AO ERP
                                    </button>
                                </div>
                            );
                        }

                        return submitted ? (
                            <div className="bg-surface-dark border border-emerald-500/30 p-8 rounded-3xl text-center space-y-6 animate-in zoom-in duration-500">
                                <div className="size-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                                    <span className="material-symbols-outlined text-emerald-500 text-4xl">check_circle</span>
                                </div>
                                <h3 className="text-2xl font-bold text-white">Inscrição Confirmada!</h3>
                                <p className="text-slate-400">Parabéns! Sua vaga para o {event.title} foi reservada com sucesso. Em breve você receberá um e-mail com as instruções de entrada.</p>
                                <div className="pt-4">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-4">Seu Código de Entrada</p>
                                    <div className="bg-white p-3 rounded-2xl inline-block">
                                        <QRCodeCanvas value={`reg-${id}-${formData.email}`} size={160} />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-surface-dark border border-slate-700 p-8 rounded-3xl shadow-2xl relative">
                                <div className="absolute -top-4 -right-4 bg-primary text-black font-bold px-4 py-2 rounded-xl text-sm rotate-6 shadow-glow">
                                    {(!event.price || event.price === '0' || event.price.toLowerCase().includes('gratuito')) ? 'Gratuito' : event.price}
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-8">Garanta sua Vaga</h3>
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-widest">Nome Completo</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-[#0B1120] border border-slate-700/60 rounded-xl py-3 px-4 text-white focus:ring-primary focus:border-primary outline-none transition-all"
                                            placeholder="Como no RG"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-widest">E-mail</label>
                                        <input
                                            required
                                            type="email"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full bg-[#0B1120] border border-slate-700/60 rounded-xl py-3 px-4 text-white focus:ring-primary focus:border-primary outline-none transition-all"
                                            placeholder="email@exemplo.com"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-widest">CPF</label>
                                            <input
                                                required
                                                type="text"
                                                value={formData.cpf}
                                                onChange={e => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                                                className="w-full bg-[#0B1120] border border-slate-700/60 rounded-xl py-3 px-4 text-white focus:ring-primary focus:border-primary outline-none transition-all"
                                                placeholder="000.000.000-00"
                                                maxLength={14}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-widest">Telefone</label>
                                            <input
                                                required
                                                type="text"
                                                value={formData.phone}
                                                onChange={e => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                                                className="w-full bg-[#0B1120] border border-slate-700/60 rounded-xl py-3 px-4 text-white focus:ring-primary focus:border-primary outline-none transition-all"
                                                placeholder="(00) 00000-0000"
                                                maxLength={15}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full bg-primary hover:bg-primary-dark text-black font-bold py-4 rounded-xl mt-4 transition-all shadow-glow active:scale-[0.98]"
                                    >
                                        CONFIRMAR INSCRIÇÃO
                                    </button>
                                    <p className="text-[10px] text-center text-slate-500">
                                        Ao se inscrever você concorda com nossos termos de privacidade.
                                    </p>
                                </form>
                            </div>
                        );
                    })()}
                </div>
            </div>

            <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-800 text-center">
                <p className="text-slate-500 text-sm">© 2024 True Church Experience. Todos os direitos reservados.</p>
            </footer>
        </div>
    );
};

export default EventLanding;
