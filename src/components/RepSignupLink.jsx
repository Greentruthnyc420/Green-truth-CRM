import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Copy, Link as LinkIcon } from 'lucide-react';

export default function RepSignupLink() {
    const { currentUser } = useAuth();
    const [copied, setCopied] = React.useState(false);

    if (!currentUser) return null;

    const signupLink = `${window.location.origin}/dispensary/verify?ref=${currentUser.uid}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(signupLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="themed-card p-6 rounded-xl">
            <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                <LinkIcon size={20} className="text-brand-600" />
                Referral Signup Link
            </h3>
            <p className="text-slate-500 text-sm mb-4">
                Share this link with dispensaries. When they sign up, they will be automatically attributed to you.
            </p>

            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                <code className="text-xs text-slate-600 flex-1 overflow-hidden text-ellipsis whitespace-nowrap px-2 font-mono">
                    {signupLink}
                </code>
                <button
                    onClick={handleCopy}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1
                        ${copied ? 'bg-emerald-100 text-emerald-700' : 'border transition-all'}
                    `}
                    style={!copied ? { background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' } : {}}
                >
                    <Copy size={14} />
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>
        </div>
    );
}
