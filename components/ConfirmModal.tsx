
import React from 'react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    type?: 'danger' | 'warning' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    onConfirm,
    onCancel,
    type = 'info'
}) => {
    if (!isOpen) return null;

    const colors = {
        danger: 'bg-red-500 hover:bg-red-600 shadow-red-500/20',
        warning: 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20',
        info: 'bg-primary hover:bg-primary-dark shadow-primary/20'
    };

    const icons = {
        danger: 'delete_forever',
        warning: 'report_problem',
        info: 'help'
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-surface-dark w-full max-w-md rounded-3xl border border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                <div className="p-8 text-center">
                    <div className={`size-16 rounded-2xl mx-auto mb-6 flex items-center justify-center border ${type === 'danger' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                            type === 'warning' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' :
                                'bg-primary/10 border-primary/20 text-primary'
                        }`}>
                        <span className="material-symbols-outlined text-3xl">{icons[type]}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{message}</p>
                </div>
                <div className="flex gap-4 p-6 bg-slate-800/20 border-t border-slate-700/60">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 px-6 rounded-xl font-bold text-slate-400 border border-slate-700 hover:bg-slate-700 transition-all uppercase tracking-widest text-xs"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 py-3 px-6 rounded-xl font-bold text-slate-900 transition-all uppercase tracking-widest text-xs shadow-lg ${colors[type]}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
