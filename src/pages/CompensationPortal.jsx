import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader, BookOpen, DollarSign, Award, Calendar, TrendingUp, Zap, Car, Bus } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { generateCompensationRebuttal, generatePayrollAnswer, generateMotivation } from '../services/geminiService';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

export default function CompensationPortal() {
    const navigate = useNavigate();

    // AI Tool States
    const [objectionInput, setObjectionInput] = useState('');
    const [objectionOutput, setObjectionOutput] = useState('');
    const [objectionLoading, setObjectionLoading] = useState(false);

    const [qaInput, setQaInput] = useState('');
    const [qaOutput, setQaOutput] = useState('');
    const [qaLoading, setQaLoading] = useState(false);

    // Calculator States
    const [bwHours, setBwHours] = useState(40);
    const [bwAccounts, setBwAccounts] = useState(25);
    const [bwMiles, setBwMiles] = useState(100);
    const [bwTransport, setBwTransport] = useState('vehicle');
    const [bwResult, setBwResult] = useState(null);

    const [commSales, setCommSales] = useState(15000);
    const [commAccounts, setCommAccounts] = useState(30);
    const [commResult, setCommResult] = useState(null);
    const [aiMotivation, setAiMotivation] = useState('');
    const [motivationLoading, setMotivationLoading] = useState(false);

    // AI Tool Handlers
    const handleObjection = async () => {
        if (!objectionInput.trim()) return;
        setObjectionLoading(true);
        try {
            const response = await generateCompensationRebuttal(objectionInput);
            setObjectionOutput(response);
        } catch (err) {
            setObjectionOutput('Error connecting to AI service. Please try again.');
        }
        setObjectionLoading(false);
    };

    const handleQA = async () => {
        if (!qaInput.trim()) return;
        setQaLoading(true);
        try {
            const response = await generatePayrollAnswer(qaInput);
            setQaOutput(response);
        } catch (err) {
            setQaOutput('Error connecting to AI service. Please try again.');
        }
        setQaLoading(false);
    };

    // Biweekly Calculator
    const calculateBiweekly = () => {
        const tiers = Math.floor(bwAccounts / 10);
        const hourlyRate = Math.min(20 + tiers, 30);
        const wageTotal = bwHours * hourlyRate;
        const mileRate = bwTransport === 'vehicle' ? 0.35 : 0.20;
        const mileTotal = bwMiles * mileRate;
        const total = wageTotal + mileTotal;

        setBwResult({ hourlyRate, wageTotal, mileTotal, total });
    };

    // Commission Calculator
    const calculateCommission = async () => {
        const commission = commSales * 0.02;
        let bonus = 0;
        const tiers = Math.floor(commAccounts / 10);
        for (let i = 1; i <= tiers; i++) {
            bonus += i * 100;
        }
        const total = commission + bonus;

        setCommResult({ commission, bonus, total });
        setMotivationLoading(true);

        try {
            const motivation = await generateMotivation(commAccounts, commSales, commission, bonus, total);
            setAiMotivation(motivation);
        } catch (err) {
            setAiMotivation('🚀 Keep pushing! Every sale counts!');
        }
        setMotivationLoading(false);
    };

    // Chart Configurations
    const hourlyChartData = {
        labels: ['0', '10', '20', '30', '40', '50', '60', '70', '80', '90', '100+'],
        datasets: [{
            data: [20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
            borderColor: '#00b894',
            backgroundColor: 'rgba(0, 184, 148, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.3
        }]
    };

    const bonusChartData = {
        labels: ['10', '20', '30', '40', '50', '60', '70', '80', '90', '100'],
        datasets: [{
            data: [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000],
            backgroundColor: '#6c5ce7',
            borderRadius: 4
        }]
    };

    // Profit Sharing Chart - shows how much of company's 5% goes to rep
    const profitSharingChartData = {
        labels: ['Your Share (2%)', 'Company Keeps (3%)'],
        datasets: [{
            data: [40, 60],  // 2% out of 5% = 40%
            backgroundColor: ['#00b894', '#6c5ce7'],
            borderWidth: 0
        }]
    };

    const mileageChartData = {
        labels: ['Personal Vehicle', 'Public Transit'],
        datasets: [{
            data: [0.35, 0.20],
            backgroundColor: ['#00b894', '#b2bec3'],
            borderRadius: 4,
            barThickness: 40
        }]
    };

    return (
        <div className="min-h-screen pb-16" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
            {/* Header */}
            <header className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white py-8 md:py-12 px-4 shadow-xl">
                <div className="max-w-6xl mx-auto">
                    <button
                        onClick={() => navigate('/app')}
                        className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span>Back to Dashboard</span>
                    </button>
                    <h1 className="text-3xl md:text-5xl font-black mb-2 tracking-tight">The Green Truth NYC</h1>
                    <p className="text-lg md:text-xl font-light opacity-95">Cannabis Consultant Compensation Portal</p>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-6 md:py-8 space-y-8 md:space-y-12">

                {/* Intro */}
                <section className="rounded-2xl shadow-sm p-6 md:p-8 border-l-4 border-emerald-500" style={{ background: 'var(--bg-card)' }}>
                    <h2 className="text-2xl font-bold mb-2">Compensation Structure Overview</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Below is the detailed breakdown of how we calculate your rates. Use the charts to understand your growth trajectory from a starting Cannabis Consultant to a Top Seller.
                    </p>
                </section>

                {/* Section 1: Hourly Pay */}
                <section>
                    <div className="mb-6 flex items-center gap-3">
                        <span className="bg-emerald-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                        <h2 className="text-2xl font-bold">Hourly Rate Progression</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="p-6 rounded-2xl shadow-md flex flex-col justify-center items-center text-center" style={{ background: 'var(--bg-card)' }}>
                            <div className="text-5xl font-black text-emerald-500 mb-1">$20<span className="text-xl font-normal" style={{ color: 'var(--text-tertiary)' }}>/hr</span></div>
                            <p className="text-xs uppercase tracking-wider mb-4" style={{ color: 'var(--text-tertiary)' }}>Start</p>
                            <div className="w-16 h-1 rounded mb-4" style={{ background: 'var(--border-primary)' }}></div>
                            <div className="text-5xl font-black text-blue-500 mb-1">$30<span className="text-xl font-normal" style={{ color: 'var(--text-tertiary)' }}>/hr</span></div>
                            <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Max</p>
                        </div>

                        <div className="lg:col-span-2 p-4 md:p-6 rounded-2xl shadow-md" style={{ background: 'var(--bg-card)' }}>
                            <div className="h-[250px] md:h-[300px]">
                                <Line
                                    data={hourlyChartData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { display: false } },
                                        scales: {
                                            y: { min: 18, max: 32, ticks: { callback: v => '$' + v } },
                                            x: { title: { display: true, text: 'Active Accounts' } }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 2: Milestone Bonuses */}
                <section>
                    <div className="mb-6 flex items-center gap-3">
                        <span className="bg-purple-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                        <h2 className="text-2xl font-bold">Milestone Bonuses</h2>
                    </div>

                    <div className="p-4 md:p-6 rounded-2xl shadow-md" style={{ background: 'var(--bg-card)' }}>
                        <div className="h-[250px] md:h-[300px]">
                            <Bar
                                data={bonusChartData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: {
                                        y: { ticks: { callback: v => '$' + v } },
                                        x: { title: { display: true, text: 'Accounts' } }
                                    }
                                }}
                            />
                        </div>

                        <div className="mt-6 p-5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 text-sm">
                            <h4 className="font-bold mb-2 flex items-center gap-2 text-blue-900 dark:text-blue-200">ℹ️ Important Bonus Rules</h4>
                            <ul className="space-y-2 list-disc pl-5 text-blue-800 dark:text-blue-300">
                                <li><strong>Milestone Bonuses (One-Time):</strong> Available to everyone. You earn cash for every 10 accounts you add. These are paid once per milestone.</li>
                                <li><strong>Quarterly Top Seller Bonus (Recurring):</strong> Open to everyone immediately. This is a consistent bonus awarded every quarter to the highest-performing Cannabis Consultant.</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Section 3: Commission & Profit Sharing */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="p-6 md:p-8 rounded-2xl shadow-md" style={{ background: 'var(--bg-card)' }}>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-purple-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                            <h2 className="text-xl font-bold">Profit Sharing</h2>
                        </div>
                        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                            <strong className="text-emerald-500">You receive 40% of our profits</strong> from your sales. The Green Truth earns 5% on each sale — we give you 2%, keeping only 3%.
                        </p>
                        <div className="h-[200px]">
                            <Doughnut
                                data={profitSharingChartData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    cutout: '65%',
                                    plugins: {
                                        legend: { position: 'bottom' },
                                        tooltip: {
                                            callbacks: {
                                                label: (ctx) => `${ctx.label}: ${ctx.raw}% of profits`
                                            }
                                        }
                                    }
                                }}
                            />
                        </div>
                        <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                            <p className="text-sm text-center font-medium text-emerald-700 dark:text-emerald-400">
                                💰 You get 2% of every sale = <strong>40% of our commission!</strong>
                            </p>
                        </div>
                    </div>

                    <div className="p-6 md:p-8 rounded-2xl shadow-md flex flex-col justify-center" style={{ background: 'var(--bg-card)' }}>
                        <h2 className="text-2xl font-bold mb-8 border-l-4 border-purple-500 pl-3">Payment Calendar</h2>

                        <div className="space-y-8 relative">
                            <div className="absolute left-4 top-2 bottom-2 w-1 rounded" style={{ background: 'var(--border-primary)' }}></div>

                            <div className="relative pl-12">
                                <div className="absolute left-0 top-0 w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold shadow-sm">1</div>
                                <h3 className="text-lg font-bold text-emerald-500">Biweekly Payouts</h3>
                                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Base Hourly Rate ($20 - $30/hr)</p>
                                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Paid every two weeks for pop-up hours.</p>
                            </div>

                            <div className="relative pl-12">
                                <div className="absolute left-0 top-0 w-9 h-9 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-sm">2</div>
                                <h3 className="text-lg font-bold text-purple-500">Quarterly Payouts</h3>
                                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Commissions (2%) + Milestone Bonuses</p>
                                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Accumulated and paid every 3 months.</p>
                            </div>

                            <div className="relative pl-12">
                                <div className="absolute left-0 top-0 w-9 h-9 bg-gray-700 rounded-full flex items-center justify-center text-white font-bold shadow-sm">3</div>
                                <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Termination Protection</h3>
                                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Final Quarter Guarantee</p>
                                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>If you leave, you still get paid commissions earned in your final quarter.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 4: Duties & Expenses */}
                <section>
                    <div className="mb-8 flex items-center gap-3">
                        <span className="bg-gray-800 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">4</span>
                        <h2 className="text-2xl font-bold">Duties & Expenses</h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        {[
                            { icon: '📸', title: 'Exterior Photo', desc: 'Required for every dispensary visit.' },
                            { icon: '📹', title: 'Video Walkthrough', desc: 'Required for every pop-up event.' },
                            { icon: '📥', title: 'Daily Submission', desc: 'Send to Social Media Manager by EOD.' },
                            { icon: '🗓️', title: 'Weekly Meeting', desc: 'Attendance is mandatory for team syncs.' }
                        ].map((item, i) => (
                            <div key={i} className="p-4 md:p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                                <div className="text-2xl md:text-3xl mb-2">{item.icon}</div>
                                <h3 className="font-bold text-sm md:text-base">{item.title}</h3>
                                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{item.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="p-6 rounded-2xl shadow-md" style={{ background: 'var(--bg-card)' }}>
                            <h3 className="text-lg font-bold mb-4">Mileage Reimbursement Rates</h3>
                            <div className="h-[200px]">
                                <Bar
                                    data={mileageChartData}
                                    options={{
                                        indexAxis: 'y',
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { display: false } },
                                        scales: {
                                            x: { beginAtZero: true, max: 0.45 }
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl shadow-md flex flex-col justify-between" style={{ background: 'var(--bg-card)' }}>
                            <div>
                                <h3 className="text-lg font-bold mb-4">Reimbursement Rules</h3>
                                <ul className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    <li className="flex items-start gap-2">
                                        <span className="text-emerald-500 font-bold">✓</span>
                                        <span><strong>Tolls:</strong> 100% Reimbursed.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-emerald-500 font-bold">✓</span>
                                        <span><strong>Vehicle:</strong> $0.35 per mile.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-emerald-500 font-bold">✓</span>
                                        <span><strong>No Vehicle:</strong> $0.20 per mile.</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800 text-center">
                                <div className="text-2xl mb-1">🧾</div>
                                <p className="text-red-700 dark:text-red-400 font-bold text-sm">Receipts & Logs are MANDATORY</p>
                                <p className="text-red-500 dark:text-red-300 text-xs">No documentation = No reimbursement.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 5: AI Tools */}
                <section className="rounded-2xl shadow-lg border overflow-hidden" style={{ borderColor: 'var(--border-primary)' }}>
                    <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 md:p-8">
                        <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
                            <span className="text-3xl">🤖</span>
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-purple-300">AI Field Companion</span>
                        </h2>
                        <p className="text-gray-400 mt-2 text-sm">Powered by Gemini. Tools to help you close deals and understand your pay.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                        {/* Objection Handler */}
                        <div className="p-6 md:p-8">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-bold uppercase">Sales Coach</span>
                                <h3 className="font-bold">Objection Crusher</h3>
                            </div>
                            <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>Client saying "No"? Type their reason below and get a pro rebuttal.</p>

                            <textarea
                                value={objectionInput}
                                onChange={(e) => setObjectionInput(e.target.value)}
                                className="w-full rounded-lg p-3 text-base focus:ring-2 focus:ring-red-400 outline-none mb-3 resize-none h-24"
                                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                                placeholder="e.g. 'We already carry too many gummy brands.'"
                            />

                            <button
                                onClick={handleObjection}
                                disabled={objectionLoading}
                                className="w-full bg-gray-800 hover:bg-black text-white text-base font-bold py-3 rounded-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                            >
                                {objectionLoading ? <Loader size={18} className="animate-spin" /> : <><span>Generate Rebuttal</span> <span>✨</span></>}
                            </button>

                            {objectionOutput && (
                                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm border border-red-100 dark:border-red-800 italic" style={{ color: 'var(--text-secondary)' }}>
                                    {objectionOutput}
                                </div>
                            )}
                        </div>

                        {/* Payroll Q&A */}
                        <div className="p-6 md:p-8">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs font-bold uppercase">Handbook</span>
                                <h3 className="font-bold">Payroll Genius</h3>
                            </div>
                            <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>Confused about the rules? Ask any question about your comp plan.</p>

                            <textarea
                                value={qaInput}
                                onChange={(e) => setQaInput(e.target.value)}
                                className="w-full rounded-lg p-3 text-base focus:ring-2 focus:ring-blue-400 outline-none mb-3 resize-none h-24"
                                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                                placeholder="e.g. 'What happens to my commission if I quit?'"
                            />

                            <button
                                onClick={handleQA}
                                disabled={qaLoading}
                                className="w-full bg-gray-800 hover:bg-black text-white text-base font-bold py-3 rounded-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                            >
                                {qaLoading ? <Loader size={18} className="animate-spin" /> : <><span>Ask AI</span> <span>✨</span></>}
                            </button>

                            {qaOutput && (
                                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm border border-blue-100 dark:border-blue-800" style={{ color: 'var(--text-secondary)' }}>
                                    {qaOutput}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Section 6: Calculators */}
                <section className="p-4 md:p-8 rounded-3xl" style={{ background: 'var(--bg-secondary)' }}>
                    <div className="text-center mb-8">
                        <h2 className="text-2xl md:text-3xl font-black">Compensation Simulators</h2>
                        <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>Ready to see your potential? Calculate your next check below.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Biweekly Calculator */}
                        <div className="rounded-2xl shadow-lg overflow-hidden border-t-8 border-emerald-500" style={{ background: 'var(--bg-card)' }}>
                            <div className="p-6 md:p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="bg-emerald-500 text-white p-3 rounded-lg text-xl">💸</div>
                                    <div>
                                        <h3 className="text-xl font-bold">Biweekly Pay Check</h3>
                                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Hours + Mileage</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-tertiary)' }}>Hours Worked (2 Weeks)</label>
                                        <input
                                            type="number"
                                            value={bwHours}
                                            onChange={(e) => setBwHours(Number(e.target.value))}
                                            className="w-full rounded-lg p-3 text-base focus:ring-2 focus:ring-emerald-500 outline-none transition font-bold"
                                            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-tertiary)' }}>Current Active Accounts</label>
                                        <input
                                            type="number"
                                            value={bwAccounts}
                                            onChange={(e) => setBwAccounts(Number(e.target.value))}
                                            className="w-full rounded-lg p-3 text-base focus:ring-2 focus:ring-emerald-500 outline-none transition"
                                            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                                        />
                                        <p className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>Determines your hourly rate ($20 - $30/hr)</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-tertiary)' }}>Miles</label>
                                            <input
                                                type="number"
                                                value={bwMiles}
                                                onChange={(e) => setBwMiles(Number(e.target.value))}
                                                className="w-full rounded-lg p-3 text-base focus:ring-2 focus:ring-emerald-500 outline-none transition"
                                                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-tertiary)' }}>Transport</label>
                                            <select
                                                value={bwTransport}
                                                onChange={(e) => setBwTransport(e.target.value)}
                                                className="w-full rounded-lg p-3 text-base focus:ring-2 focus:ring-emerald-500 outline-none h-[50px]"
                                                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                                            >
                                                <option value="vehicle">Car ($0.35)</option>
                                                <option value="none">Transit ($0.20)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={calculateBiweekly}
                                    className="mt-6 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl transition-all shadow-md active:scale-95"
                                >
                                    Calculate Paycheck
                                </button>

                                {bwResult && (
                                    <div className="mt-6 pt-6 border-t border-dashed" style={{ borderColor: 'var(--border-primary)' }}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Hourly Rate:</span>
                                            <span className="font-bold text-emerald-500">${bwResult.hourlyRate.toFixed(2)}/hr</span>
                                        </div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Gross Wages:</span>
                                            <span className="font-mono">${bwResult.wageTotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Mileage Reimb:</span>
                                            <span className="font-mono">${bwResult.mileTotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-3 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                                            <span className="font-bold">Est. Check:</span>
                                            <span className="text-2xl font-black text-emerald-500">${bwResult.total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Commission Calculator */}
                        <div className="rounded-2xl shadow-lg overflow-hidden border-t-8 border-purple-500" style={{ background: 'var(--bg-card)' }}>
                            <div className="p-6 md:p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="bg-purple-500 text-white p-3 rounded-lg text-xl">🚀</div>
                                    <div>
                                        <h3 className="text-xl font-bold">Quarterly Commission</h3>
                                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Sales % + Cumulative Bonuses</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-tertiary)' }}>Est. Quarterly Sales ($)</label>
                                        <input
                                            type="number"
                                            value={commSales}
                                            onChange={(e) => setCommSales(Number(e.target.value))}
                                            className="w-full rounded-lg p-3 text-base focus:ring-2 focus:ring-purple-500 outline-none transition font-bold"
                                            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-tertiary)' }}>Target Account Count</label>
                                        <input
                                            type="number"
                                            value={commAccounts}
                                            onChange={(e) => setCommAccounts(Number(e.target.value))}
                                            className="w-full rounded-lg p-3 text-base focus:ring-2 focus:ring-purple-500 outline-none transition"
                                            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                                        />
                                        <p className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>Calculates potential cumulative bonuses for this level.</p>
                                    </div>
                                </div>

                                <button
                                    onClick={calculateCommission}
                                    disabled={motivationLoading}
                                    className="mt-20 w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 rounded-xl transition-all shadow-md active:scale-95 flex justify-center items-center gap-2 disabled:opacity-50"
                                >
                                    {motivationLoading ? <Loader size={18} className="animate-spin" /> : <><span>Forecast & Motivate Me</span> <span className="text-lg">✨</span></>}
                                </button>

                                {commResult && (
                                    <div className="mt-6 pt-6 border-t border-dashed" style={{ borderColor: 'var(--border-primary)' }}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Commission (2%):</span>
                                            <span className="font-mono text-purple-500 font-bold">${commResult.commission.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Cumulative Bonuses:</span>
                                            <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>${commResult.bonus.toFixed(2)}</span>
                                        </div>
                                        <div className="text-[10px] italic mb-4" style={{ color: 'var(--text-tertiary)' }}>*Assumes achieving these tiers for the 1st time.</div>

                                        <div className="flex justify-between items-center pt-3 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                                            <span className="font-bold">Quarterly Potential:</span>
                                            <span className="text-2xl font-black text-purple-500">${commResult.total.toFixed(2)}</span>
                                        </div>

                                        {aiMotivation && (
                                            <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-xs md:text-sm text-purple-600 dark:text-purple-300 text-center font-medium italic border border-purple-100 dark:border-purple-800">
                                                {aiMotivation}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="text-center text-xs py-8" style={{ color: 'var(--text-tertiary)' }}>
                    <p>© 2025 The Green Truth NYC.</p>
                </footer>
            </main>
        </div>
    );
}
