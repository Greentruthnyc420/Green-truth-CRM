import React, { useState } from 'react';
import { X, Settings, Building2, Palette, HelpCircle, ChevronRight, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeSwitcher from './ThemeSwitcher';
import BrandSettingsModal from './BrandSettingsModal';
import OnboardingTour from './onboarding/OnboardingTour';
import { getTourSteps } from '../data/tourSteps';

// Unified Settings Menu for Brand sidebar
export default function BrandUnifiedSettingsMenu({ isOpen, onClose, brandUser, onLogout }) {
    const [showBrandSettings, setShowBrandSettings] = useState(false);
    const [showTheme, setShowTheme] = useState(false);
    const [showTour, setShowTour] = useState(false);

    const menuItems = [
        {
            id: 'business',
            icon: Building2,
            label: 'Business Settings',
            description: 'Edit your business & ACH info',
            color: 'emerald',
            onClick: () => {
                setShowBrandSettings(true);
            }
        },
        {
            id: 'theme',
            icon: Palette,
            label: 'Theme',
            description: 'Customize appearance',
            color: 'purple',
            onClick: () => {
                setShowTheme(!showTheme);
            }
        },
        {
            id: 'tour',
            icon: HelpCircle,
            label: 'Dashboard Tour',
            description: 'Learn how to use the portal',
            color: 'blue',
            onClick: () => {
                onClose();
                setShowTour(true);
            }
        }
    ];

    if (!isOpen && !showBrandSettings && !showTour) return null;

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-emerald-600 to-green-600 p-5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                                        <Settings size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white">Settings</h2>
                                        <p className="text-white/70 text-xs">Configure your portal</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center text-white"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Menu Items */}
                            <div className="p-4 space-y-2">
                                {menuItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={item.onClick}
                                        className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 transition-all group text-left"
                                    >
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${item.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                                            item.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                                                'bg-blue-100 text-blue-600'
                                            }`}>
                                            <item.icon size={22} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-800">{item.label}</p>
                                            <p className="text-sm text-slate-500">{item.description}</p>
                                        </div>
                                        <ChevronRight size={20} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                                    </button>
                                ))}

                                {/* Inline Theme Switcher */}
                                <AnimatePresence>
                                    {showTheme && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="pt-2 pb-2">
                                                <ThemeSwitcher isOpen={true} onClose={() => setShowTheme(false)} inline={true} />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Footer - Sign Out */}
                            <div className="px-4 pb-4 pt-2 border-t border-slate-100">
                                <button
                                    onClick={() => { onClose(); if (onLogout) onLogout(); }}
                                    className="w-full flex items-center gap-4 p-3 rounded-xl bg-red-50 hover:bg-red-100 transition-all group text-left"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                                        <LogOut size={20} className="text-red-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-red-700">Sign Out</p>
                                        <p className="text-xs text-red-500">Log out of your account</p>
                                    </div>
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Brand Settings Sub-Modal */}
            <BrandSettingsModal
                isOpen={showBrandSettings}
                onClose={() => setShowBrandSettings(false)}
                brandUser={brandUser}
            />

            {/* Tour Overlay */}
            {showTour && (
                <OnboardingTour
                    steps={getTourSteps('brand')}
                    isFirstTime={false}
                    onComplete={() => setShowTour(false)}
                    tourKey="brand_settings_tour"
                />
            )}
        </>
    );
}
