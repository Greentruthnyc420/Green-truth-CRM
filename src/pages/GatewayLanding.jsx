import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Package, Shield, Sparkles } from 'lucide-react';

// Import main logo
import logoMain from '../assets/images/logo-main.png';
// Import partner logos
import partner1 from '../assets/images/partner-1.png';
import partner2 from '../assets/images/partner-2.png';
import partner3 from '../assets/images/partner-3.jpg';
import partner4 from '../assets/images/partner-4.png';
import partner5 from '../assets/images/partner-5.png';
import partner6 from '../assets/images/partner-6.png';
import partner7 from '../assets/images/partner-7.png';
import waferz from '../assets/images/waferz.png';
import smoothieBar from '../assets/images/smoothie-bar.png';
import flxExtracts from '../assets/images/flx-extracts.png';

const partnerLogos = [
    { src: partner1, name: 'Wanders New York' },
    { src: partner5, name: 'Honey King' },
    { src: partner2, name: 'Space Poppers' },
    { src: partner4, name: 'Budcracker Blvd' }, // Primary
    { src: partner3, name: 'Canna Dots' },
    { src: waferz, name: 'Waferz' },
    { src: partner6, name: 'Honey King Lion' },
    { src: smoothieBar, name: 'Smoothie Bar' },
    { src: flxExtracts, name: 'FLX Extracts' },
    { src: partner7, name: 'Budcracker NYC' },  // Secondary
];

// SVG Component for a simplified Cannabis Leaf
const CannabisLeaf = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L14.5 9L21 10.5L15.5 14L16.5 21L12 17L7.5 21L8.5 14L3 10.5L9.5 9L12 2Z"
            style={{ filter: 'blur(0.5px)' }}
        />
    </svg>
);

export default function GatewayLanding() {
    const navigate = useNavigate();
    const [hoveredCard, setHoveredCard] = useState(null);

    const portalCards = [
        {
            id: 'rep',
            title: 'Sales Ambassadors',
            description: 'Track activations, commissions & leads',
            icon: Users,
            color: 'from-emerald-500 to-green-600',
            path: '/login',
            glow: 'shadow-emerald-500/50'
        },
        {
            id: 'brand',
            title: 'Brand Partners',
            description: 'Manage orders, invoices & menus',
            icon: Package,
            color: 'from-amber-500 to-orange-600',
            path: '/brand/login',
            glow: 'shadow-amber-500/50'
        },
        {
            id: 'admin',
            title: 'Admin',
            description: 'Oversight & Analytics',
            icon: Shield,
            color: 'from-slate-600 to-slate-800',
            path: '/admin/login',
            glow: 'shadow-slate-500/50',
            isSecondary: true
        }
    ];

    // Generate random floating particles
    const particles = Array.from({ length: 15 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 20 + 10,
        duration: Math.random() * 20 + 20,
        delay: Math.random() * 5
    }));

    return (
        <div className="min-h-screen bg-[#050505] relative overflow-hidden font-sans selection:bg-emerald-500/30">

            {/* --- Animated Premium Background --- */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">

                {/* Deep Ambient Gradients */}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-slate-950 via-green-950/20 to-slate-950 z-0" />

                {/* Floating "Smoke" Orbs */}
                <motion.div
                    className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-emerald-600/10 rounded-full blur-[100px]"
                    animate={{ x: [0, 50, 0], y: [0, 30, 0], opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-emerald-900/10 rounded-full blur-[100px]"
                    animate={{ x: [0, -50, 0], y: [0, -30, 0], opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Floating Leaf Particles */}
                {particles.map((p) => (
                    <motion.div
                        key={p.id}
                        className="absolute text-emerald-500/10"
                        style={{
                            left: `${p.x}%`,
                            top: `${p.y}%`,
                            width: p.size,
                            height: p.size,
                        }}
                        animate={{
                            y: [0, -100, 0],
                            x: [0, Math.random() * 50 - 25, 0],
                            rotate: [0, 360],
                            opacity: [0, 0.2, 0]
                        }}
                        transition={{
                            duration: p.duration,
                            repeat: Infinity,
                            delay: p.delay,
                            ease: "linear"
                        }}
                    >
                        <CannabisLeaf className="w-full h-full" />
                    </motion.div>
                ))}

                {/* Overlay Texture/Grid (Optional for "Tech" feel) */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
                {/* Hero Section - Logo */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: -30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                        duration: 1.2,
                        ease: [0.23, 1, 0.32, 1],
                    }}
                    className="mb-16 relative group"
                >
                    <motion.div
                        className="absolute -inset-12 bg-gradient-to-r from-emerald-500/20 to-lime-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    />

                    {/* Increased logo size by ~100% from max-w-2xl to max-w-4xl */}
                    <motion.img
                        src={logoMain}
                        alt="The Green Truth NYC"
                        className="w-full max-w-4xl h-auto relative z-10 drop-shadow-2xl"
                        whileHover={{
                            scale: 1.05,
                            filter: "drop-shadow(0 0 30px rgba(16, 185, 129, 0.3))"
                        }}
                        transition={{ duration: 0.3 }}
                    />

                    <motion.div
                        className="absolute -top-6 -right-6 text-emerald-400 opacity-80"
                        animate={{
                            rotate: [0, 15, 0],
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 1, 0.5]
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        <Sparkles size={40} />
                    </motion.div>
                </motion.div>

                {/* Portal Selector Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="w-full max-w-5xl"
                >
                    <h2 className="text-center text-2xl font-bold text-white mb-10 tracking-widest uppercase opacity-90">
                        Select Portal
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                        {portalCards.map((card, index) => (
                            <motion.button
                                key={card.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                                onClick={() => navigate(card.path)}
                                onMouseEnter={() => setHoveredCard(card.id)}
                                onMouseLeave={() => setHoveredCard(null)}
                                className="relative group perspective-1000"
                            >
                                {/* Glow Effect */}
                                <motion.div
                                    className={`absolute -inset-0.5 bg-gradient-to-r ${card.color} rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                                    animate={hoveredCard === card.id ? { scale: [1, 1.02, 1] } : {}}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />

                                {/* Card Content */}
                                <div className="relative bg-slate-900/95 backdrop-blur-xl border border-slate-800 group-hover:border-slate-600 rounded-2xl p-8 transition-all duration-300 h-full flex flex-col items-center text-center">
                                    <motion.div
                                        className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-6 shadow-lg`}
                                        whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        <card.icon size={36} className="text-white" />
                                    </motion.div>

                                    <h3 className="text-2xl font-bold text-white mb-3">{card.title}</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">{card.description}</p>

                                    {/* Particle Effect on Hover */}
                                    {hoveredCard === card.id && (
                                        <motion.div
                                            className="absolute top-4 right-4"
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0 }}
                                        >
                                            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${card.color} shadow-[0_0_10px_currentColor]`} />
                                        </motion.div>
                                    )}
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>

                {/* Partner Brands Section */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 1 }}
                    className="w-full max-w-7xl mt-auto pt-8 border-t border-white/5"
                >
                    <h3 className="text-center text-sm font-semibold text-slate-500 mb-8 tracking-[0.2em] uppercase">
                        Trusted Partners
                    </h3>

                    {/* Infinite Scrolling Ticker */}
                    <div className="relative overflow-hidden mask-gradient-x">
                        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#050505] to-transparent z-10"></div>
                        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#050505] to-transparent z-10"></div>

                        <div className="flex animate-scroll-infinite gap-20">
                            {[...partnerLogos, ...partnerLogos, ...partnerLogos].map((partner, index) => (
                                <motion.div
                                    key={`${partner.name}-${index}`}
                                    className="flex-shrink-0 transition-all duration-500 cursor-pointer"
                                    whileHover={{ scale: 1.1 }}
                                >
                                    <img
                                        src={partner.src}
                                        alt={partner.name}
                                        className="h-20 w-auto object-contain opacity-100 drop-shadow-lg"
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Custom CSS for infinite scroll */}
            <style jsx>{`
                @keyframes scroll-infinite {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(calc(-33.333% - (20px * (2/3)))); }
                }
                .animate-scroll-infinite {
                    animation: scroll-infinite 15s linear infinite;
                    display: flex;
                    width: max-content;
                }
                .animate-scroll-infinite:hover {
                    animation-play-state: paused;
                }
                /* Font enhancement */
                .font-sans {
                    font-family: 'Inter', system-ui, sans-serif;
                }
            `}</style>
        </div>
    );
}
