import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft, Loader, Check, Link2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { testMondayConnection } from '../../services/mondayService';

const OnboardingStep = ({ step, title, children, onNext, onPrev, isNextDisabled, isNextLoading }) => (
    <motion.div
        key={step}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="w-full"
    >
        <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
        <div className="text-slate-500 space-y-4 mb-6">{children}</div>
        <div className="flex justify-between items-center">
            {onPrev ? (
                <button
                    onClick={onPrev}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                    <ArrowLeft size={16} />
                    Back
                </button>
            ) : <div />}
            <button
                onClick={onNext}
                disabled={isNextDisabled || isNextLoading}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 disabled:opacity-50"
            >
                {isNextLoading ? <Loader size={18} className="animate-spin" /> : 'Next'}
                {!isNextLoading && <ArrowRight size={16} />}
            </button>
        </div>
    </motion.div>
);

export default function MondayOnboarding({ show, onClose, onSave }) {
    const [step, setStep] = useState(1);
    const [apiToken, setApiToken] = useState('');
    const [leadsBoardId, setLeadsBoardId] = useState('');
    const [ordersBoardId, setOrdersBoardId] = useState('');

    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null); // null, 'success', 'error'

    const handleTest = async () => {
        setTesting(true);
        setTestResult(null);
        const result = await testMondayConnection(apiToken);
        if (result.success) {
            setTestResult('success');
            setTimeout(() => setStep(3), 1000);
        } else {
            setTestResult('error');
        }
        setTesting(false);
    };

    const handleFinalSave = () => {
        const settings = {
            mondayApiToken: apiToken,
            leadsBoardId,
            ordersBoardId,
            autoSyncLeads: true,
            autoSyncOrders: true,
        };
        onSave(settings);
    };

    const steps = [
        {
            id: 1,
            title: "Step 1: Get your API Token",
            content: (
                <div>
                    <p>First, you'll need your "Personal API Token" from your Monday.com account.</p>
                    <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                        <h4 className="font-bold text-slate-700">How to get your token:</h4>
                        <ol className="list-decimal list-inside text-xs text-slate-500 mt-2 space-y-1">
                            <li>Click your avatar in the bottom-left of Monday.com.</li>
                            <li>Go to <strong>Developers</strong>.</li>
                            <li>Find the <strong>Developer</strong> section.</li>
                            <li>Copy your Personal API Token.</li>
                        </ol>
                    </div>
                </div>
            )
        },
        {
            id: 2,
            title: "Step 2: Test Connection",
            content: (
                 <div>
                    <p>Paste your API Token below to test the connection to your Monday.com account.</p>
                    <input
                        type="password"
                        value={apiToken}
                        onChange={(e) => setApiToken(e.target.value)}
                        placeholder="Paste your API token here"
                        className="w-full px-4 py-3 mt-2 border border-slate-200 rounded-xl"
                    />
                    {testResult === 'error' && <p className="text-red-500 text-sm mt-2">Connection failed. Please check your token and try again.</p>}
                    {testResult === 'success' && <p className="text-emerald-500 text-sm mt-2">Connection successful!</p>}
                </div>
            )
        },
        {
            id: 3,
            title: "Step 3: Configure Board IDs",
            content: (
                <div>
                    <p>Now, enter the Board IDs for where you want to sync your Leads and Orders. You can find this in your board's URL.</p>
                     <div className="space-y-3 mt-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Leads Board ID</label>
                            <input
                                type="text"
                                value={leadsBoardId}
                                onChange={(e) => setLeadsBoardId(e.target.value)}
                                placeholder="e.g., 1234567890"
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Orders Board ID</label>
                            <input
                                type="text"
                                value={ordersBoardId}
                                onChange={(e) => setOrdersBoardId(e.target.value)}
                                placeholder="e.g., 1234567890"
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl"
                            />
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 4,
            title: "Step 4: Ready to Go!",
            content: (
                <div className="text-center p-8">
                    <Check className="w-16 h-16 mx-auto text-emerald-500 bg-emerald-50 p-3 rounded-full" />
                    <h3 className="text-2xl font-bold mt-4">Setup Complete!</h3>
                    <p>You're all set. Auto-sync has been enabled by default. Click "Finish" to save your settings.</p>
                </div>
            )
        }
    ];

    if (!show) return null;

    const currentStep = steps[step - 1];

    const getNextAction = () => {
        if (step === 2) return handleTest;
        if (step === 4) return handleFinalSave;
        return () => setStep(s => Math.min(s + 1, steps.length));
    };

    return (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-200"
                    >
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold">Monday.com Setup</h2>
                            <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <AnimatePresence mode="wait">
                                <OnboardingStep
                                    step={step}
                                    title={currentStep.title}
                                    onNext={getNextAction()}
                                    onPrev={step > 1 ? () => setStep(s => s - 1) : null}
                                    isNextLoading={testing}
                                    isNextDisabled={step === 2 ? !apiToken : (step === 3 ? !leadsBoardId || !ordersBoardId : false)}
                                >
                                    {currentStep.content}
                                </OnboardingStep>
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
