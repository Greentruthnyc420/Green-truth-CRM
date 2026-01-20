import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, ArrowLeft, Users, Package, Store, Shield, Crown, Camera, CheckCircle } from 'lucide-react';
import OnboardingTour from '../components/onboarding/OnboardingTour';
import { getTourSteps } from '../data/tourSteps';

/**
 * Tour Testing Page - Simple and Working
 */
export default function TourTestPage() {
    const navigate = useNavigate();
    const [activeTour, setActiveTour] = useState(null);
    const [completedTours, setCompletedTours] = useState([]);

    const tours = [
        { id: 'sales_rep', label: 'Sales Rep', icon: Users, color: 'bg-orange-500' },
        { id: 'social_manager', label: 'Social Manager', icon: Camera, color: 'bg-pink-500' },
        { id: 'brand', label: 'Brand Partner', icon: Package, color: 'bg-emerald-500' },
        { id: 'processor', label: 'Processor (FLX)', icon: Package, color: 'bg-teal-500' },
        { id: 'dispensary', label: 'Dispensary', icon: Store, color: 'bg-purple-500' },
        { id: 'admin', label: 'Admin', icon: Shield, color: 'bg-slate-500' },
        { id: 'super_admin', label: 'Super Admin', icon: Crown, color: 'bg-amber-500' },
    ];

    const handleStartTour = (tourId) => {
        console.log('Starting tour:', tourId);
        setActiveTour(tourId);
    };

    const handleTourComplete = () => {
        console.log('Tour completed:', activeTour);
        if (activeTour && !completedTours.includes(activeTour)) {
            setCompletedTours(prev => [...prev, activeTour]);
        }
        setActiveTour(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
            <div className="max-w-3xl mx-auto">
                {/* Back button */}
                <button
                    onClick={() => navigate('/gateway')}
                    className="flex items-center gap-2 text-slate-400 hover:text-white mb-8"
                >
                    <ArrowLeft size={20} />
                    Back to Gateway
                </button>

                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-white mb-3">🧪 Tour Testing Lab</h1>
                    <p className="text-slate-400">Click any tour to test it</p>
                    <p className="text-sm text-slate-500 mt-2">
                        Completed: {completedTours.length} / {tours.length}
                    </p>
                </div>

                {/* Tour Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tours.map((tour, idx) => {
                        const Icon = tour.icon;
                        const isComplete = completedTours.includes(tour.id);
                        const steps = getTourSteps(tour.id);

                        return (
                            <motion.div
                                key={tour.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <button
                                    onClick={() => handleStartTour(tour.id)}
                                    className={`w-full p-5 rounded-xl border text-left transition-all hover:scale-[1.02] ${isComplete
                                            ? 'bg-emerald-900/30 border-emerald-500/50'
                                            : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 ${tour.color} rounded-xl flex items-center justify-center`}>
                                            <Icon size={24} className="text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-bold text-white">{tour.label}</h3>
                                                {isComplete && <CheckCircle size={16} className="text-emerald-400" />}
                                            </div>
                                            <p className="text-slate-500 text-sm">{steps.length} steps</p>
                                        </div>
                                        <Play size={20} className="text-slate-400" />
                                    </div>
                                </button>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Instructions */}
                <div className="mt-8 p-5 bg-slate-800/50 rounded-xl border border-slate-700">
                    <h3 className="font-bold text-white mb-2">📋 How to Test</h3>
                    <ul className="text-slate-400 text-sm space-y-1">
                        <li>• Click a tour card to start</li>
                        <li>• Use Next/Back to navigate steps</li>
                        <li>• Click X to close anytime</li>
                    </ul>
                </div>
            </div>

            {/* Active Tour Overlay */}
            {activeTour && (
                <OnboardingTour
                    steps={getTourSteps(activeTour)}
                    isFirstTime={false}
                    onComplete={handleTourComplete}
                    tourKey={activeTour}
                />
            )}
        </div>
    );
}
