
import React, { useState } from 'react';
import { api } from '../api';
import { showNotification } from '../components/Notification';

const Login: React.FC<{ onLogin: (user: any) => void }> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await api.auth.login({ email, password });
            if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('token', data.token);
                onLogin(data.user);
                showNotification(`Bem-vindo, ${data.user.name}!`, "success");
            } else {
                showNotification(data.message || "Erro ao fazer login", "error");
            }
        } catch (error) {
            console.error(error);
            showNotification("Erro interno do servidor", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#050a14] relative overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] size-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] size-[400px] bg-primary/5 rounded-full blur-[100px]"></div>

            <div className="w-full max-w-md p-8 relative z-10">
                <div className="bg-surface-dark border border-slate-700/60 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
                    <div className="text-center mb-10 flex flex-col items-center">
                        <img
                            src="https://media.discordapp.net/attachments/1194391051851534478/1452759170976841983/LOGO_TRUE_BRANCO.png?ex=694afae9&is=6949a969&hm=05b669a4d1375de873cbbfb6fd193bc32973c2994a8b7a215b454ba2b10bc98c&=&format=webp&quality=lossless&width=1768&height=648"
                            alt="True Church Logo"
                            className="w-full max-w-[280px] h-auto mb-6 object-contain"
                        />
                        <div className="h-px w-12 bg-primary/30 mb-4"></div>
                        <p className="text-slate-400 text-[10px] font-bold tracking-[0.2em] uppercase">Gestão Eclesiástica</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">E-mail</label>
                            <div className="relative group">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg group-focus-within:text-primary transition-colors">mail</span>
                                <input
                                    required
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="exemplo@igreja.com"
                                    className="w-full bg-slate-800/50 border border-slate-700/60 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-slate-600 focus:ring-1 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Senha</label>
                            <div className="relative group">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg group-focus-within:text-primary transition-colors">lock</span>
                                <input
                                    required
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-800/50 border border-slate-700/60 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-slate-600 focus:ring-1 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1">
                            <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                                <input type="checkbox" className="size-4 rounded accent-primary bg-slate-800 border-slate-700" />
                                Lembrar-me
                            </label>
                            <button type="button" className="text-primary hover:text-primary-light font-bold transition-colors">Esqueci a senha?</button>
                        </div>

                        <button
                            disabled={loading}
                            type="submit"
                            className="w-full bg-primary hover:bg-primary-dark text-slate-900 font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="material-symbols-outlined animate-spin">refresh</span>
                            ) : (
                                <>
                                    ACESSAR SISTEMA
                                    <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-slate-700/50 text-center">
                        <p className="text-slate-500 text-xs tracking-wide uppercase font-bold">
                            True Church ERP © 2025
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
