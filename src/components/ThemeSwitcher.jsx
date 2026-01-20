import React from 'react';
import { useTheme, THEMES } from '../contexts/ThemeContext';
import { Palette, Check, X } from 'lucide-react';

/**
 * Theme Switcher Component
 * A dropdown/modal to switch between available themes
 */
export default function ThemeSwitcher({ isOpen, onClose, variant = 'dropdown', inline = false }) {
    const { theme, setTheme, themes } = useTheme();

    const themeList = Object.values(themes);

    // Inline mode - for embedding in nav drawers
    if (inline) {
        return (
            <div className="grid grid-cols-2 gap-2">
                {themeList.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
                        style={{
                            background: theme === t.id ? 'var(--bg-sidebar-active)' : 'var(--bg-secondary)',
                            border: theme === t.id ? '2px solid var(--accent-primary)' : '2px solid transparent',
                            color: 'var(--text-primary)'
                        }}
                    >
                        <span className="text-lg">{t.icon}</span>
                        <span className="text-xs font-medium truncate">{t.name}</span>
                        {theme === t.id && (
                            <Check size={12} className="ml-auto" style={{ color: 'var(--accent-primary)' }} />
                        )}
                    </button>
                ))}
            </div>
        );
    }

    if (!isOpen) return null;

    if (variant === 'dropdown') {
        return (
            <div className="absolute bottom-16 left-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div
                    className="rounded-xl overflow-hidden"
                    style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-primary)',
                        boxShadow: 'var(--card-shadow-hover)'
                    }}
                >
                    <div
                        className="px-4 py-3 flex items-center justify-between"
                        style={{
                            background: 'var(--bg-tertiary)',
                            borderBottom: '1px solid var(--border-primary)'
                        }}
                    >
                        <div className="flex items-center gap-2">
                            <Palette size={16} style={{ color: 'var(--accent-primary)' }} />
                            <span
                                className="font-semibold text-sm"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                Choose Theme
                            </span>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-lg hover:bg-black/10 transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div className="p-2 space-y-1">
                        {themeList.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => {
                                    setTheme(t.id);
                                    onClose();
                                }}
                                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all"
                                style={{
                                    background: theme === t.id ? 'var(--bg-sidebar-active)' : 'transparent',
                                    color: 'var(--text-primary)'
                                }}
                            >
                                <span className="text-xl">{t.icon}</span>
                                <div className="flex-1 text-left">
                                    <p className="font-medium text-sm">{t.name}</p>
                                    <p
                                        className="text-xs"
                                        style={{ color: 'var(--text-secondary)' }}
                                    >
                                        {t.description}
                                    </p>
                                </div>
                                {theme === t.id && (
                                    <div
                                        className="w-5 h-5 rounded-full flex items-center justify-center"
                                        style={{
                                            background: 'var(--accent-primary)',
                                            color: 'var(--text-inverse)'
                                        }}
                                    >
                                        <Check size={12} />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    <div
                        className="px-4 py-2 text-xs"
                        style={{
                            background: 'var(--bg-tertiary)',
                            color: 'var(--text-tertiary)',
                            borderTop: '1px solid var(--border-primary)'
                        }}
                    >
                        Theme preference is saved automatically
                    </div>
                </div>
            </div>
        );
    }

    // Full modal variant
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={onClose}
        >
            <div
                className="max-w-md w-full rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-primary)',
                    boxShadow: 'var(--card-shadow-hover)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className="px-6 py-4 flex items-center justify-between"
                    style={{
                        background: 'var(--bg-tertiary)',
                        borderBottom: '1px solid var(--border-primary)'
                    }}
                >
                    <div className="flex items-center gap-3">
                        <div
                            className="p-2 rounded-lg"
                            style={{ background: 'var(--accent-gradient)' }}
                        >
                            <Palette size={20} style={{ color: 'var(--text-inverse)' }} />
                        </div>
                        <div>
                            <h3
                                className="font-bold"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                Choose Theme
                            </h3>
                            <p
                                className="text-xs"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                Customize your dashboard appearance
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-black/10 transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 grid grid-cols-2 gap-3">
                    {themeList.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => {
                                setTheme(t.id);
                            }}
                            className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all border-2"
                            style={{
                                background: theme === t.id ? 'var(--bg-sidebar-active)' : 'var(--bg-secondary)',
                                borderColor: theme === t.id ? 'var(--accent-primary)' : 'var(--border-primary)',
                                color: 'var(--text-primary)'
                            }}
                        >
                            <span className="text-3xl">{t.icon}</span>
                            <p className="font-semibold text-sm">{t.name}</p>
                            <p
                                className="text-xs text-center"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                {t.description}
                            </p>
                            {theme === t.id && (
                                <div
                                    className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                                    style={{
                                        background: 'var(--accent-primary)',
                                        color: 'var(--text-inverse)'
                                    }}
                                >
                                    <Check size={12} />
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                <div
                    className="px-6 py-4 flex justify-end"
                    style={{
                        background: 'var(--bg-tertiary)',
                        borderTop: '1px solid var(--border-primary)'
                    }}
                >
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg font-medium transition-all"
                        style={{
                            background: 'var(--accent-gradient)',
                            color: 'var(--text-inverse)'
                        }}
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Compact theme button for sidebars
 */
export function ThemeToggleButton({ onClick }) {
    const { theme, themes } = useTheme();
    const currentTheme = Object.values(themes).find(t => t.id === theme);

    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:bg-white/10"
            style={{ color: 'var(--text-sidebar)' }}
        >
            <span className="text-lg">{currentTheme?.icon || '🎨'}</span>
            <div className="flex-1 text-left">
                <p className="text-sm font-medium">Theme</p>
                <p className="text-xs opacity-70">{currentTheme?.name || 'Classic'}</p>
            </div>
            <Palette size={16} className="opacity-50" />
        </button>
    );
}

/**
 * Mobile Theme Bar - Compact horizontal row of 4 theme buttons
 * Shows emoji icons only, perfect for mobile bottom navigation
 */
export function MobileThemeBar() {
    const { theme, setTheme, themes } = useTheme();
    const themeList = Object.values(themes);

    return (
        <div className="flex items-center justify-center gap-2 py-2 px-3">
            <span className="text-xs font-medium mr-2" style={{ color: 'var(--text-tertiary)' }}>Theme:</span>
            {themeList.map((t) => (
                <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95"
                    style={{
                        background: theme === t.id ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                        border: theme === t.id ? '2px solid var(--accent-primary)' : '2px solid var(--border-primary)',
                        boxShadow: theme === t.id ? '0 2px 8px rgba(0,0,0,0.15)' : 'none'
                    }}
                    title={t.name}
                >
                    <span className="text-lg">{t.icon}</span>
                </button>
            ))}
        </div>
    );
}
