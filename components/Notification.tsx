
import React, { useState, useEffect } from 'react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationProps {
    message: string;
    type: NotificationType;
    onClose: () => void;
    duration?: number;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [onClose, duration]);

    const icons = {
        success: 'check_circle',
        error: 'error',
        info: 'info',
        warning: 'warning'
    };

    const colors = {
        success: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        error: 'bg-red-500/10 text-red-500 border-red-500/20',
        info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        warning: 'bg-orange-500/10 text-orange-400 border-orange-500/20'
    };

    return (
        <div className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-6 py-4 rounded-2xl border backdrop-blur-md shadow-2xl animate-in slide-in-from-right duration-300 ${colors[type]}`}>
            <span className="material-symbols-outlined">{icons[type]}</span>
            <p className="font-bold text-sm tracking-wide">{message}</p>
            <button onClick={onClose} className="ml-4 opacity-50 hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-sm">close</span>
            </button>
        </div>
    );
};

// Global helper to trigger notifications
export const showNotification = (message: string, type: NotificationType = 'info') => {
    const event = new CustomEvent('show-notification', { detail: { message, type } });
    window.dispatchEvent(event);
};

export const NotificationContainer: React.FC = () => {
    const [notification, setNotification] = useState<{ message: string; type: NotificationType } | null>(null);

    useEffect(() => {
        const handleEvent = (e: any) => {
            setNotification(e.detail);
        };
        window.addEventListener('show-notification', handleEvent);
        return () => window.removeEventListener('show-notification', handleEvent);
    }, []);

    if (!notification) return null;

    return (
        <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
        />
    );
};
