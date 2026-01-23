import React from 'react';
import { ExternalLink, Zap, Clock, ArrowRight } from 'lucide-react';

// Integration data for POS systems
const POS_SYSTEMS = [
    {
        id: 'dutchie',
        name: 'Dutchie',
        logo: '🌿',
        description: 'Leading cannabis ecommerce and POS platform for dispensaries',
        color: '#4ade80',
        features: ['Real-time inventory sync', 'Order management', 'Menu updates']
    },
    {
        id: 'blaze',
        name: 'Blaze',
        logo: '🔥',
        description: 'All-in-one cannabis retail management and POS system',
        color: '#f97316',
        features: ['Inventory tracking', 'Customer data sync', 'Sales analytics']
    },
    {
        id: 'treez',
        name: 'Treez',
        logo: '🌲',
        description: 'Enterprise cannabis retail platform with advanced analytics',
        color: '#22c55e',
        features: ['Product sync', 'Order automation', 'Compliance tracking']
    }
];

// Integration data for ERP systems
const ERP_SYSTEMS = [
    {
        id: 'leaflink',
        name: 'LeafLink',
        logo: '🍃',
        description: 'The largest B2B cannabis marketplace connecting brands and retailers',
        color: '#10b981',
        features: ['Order sync', 'Inventory management', 'Catalog updates']
    },
    {
        id: 'distru',
        name: 'Distru',
        logo: '📦',
        description: 'Cannabis distribution and inventory management software',
        color: '#6366f1',
        features: ['Fulfillment tracking', 'Compliance', 'Route optimization']
    },
    {
        id: 'canix',
        name: 'Canix',
        logo: '⚡',
        description: 'Seed-to-sale tracking and manufacturing ERP for cannabis',
        color: '#8b5cf6',
        features: ['Batch tracking', 'Manufacturing', 'Lab results']
    },
    {
        id: 'flourish',
        name: 'Flourish',
        logo: '🌸',
        description: 'Cannabis ERP for cultivation, manufacturing, and distribution',
        color: '#ec4899',
        features: ['Supply chain', 'Cost tracking', 'Inventory sync']
    }
];

// Integration data for Compliance systems
const COMPLIANCE_SYSTEMS = [
    {
        id: 'metrc',
        name: 'METRC',
        logo: '🔒',
        description: 'State-mandated seed-to-sale cannabis tracking system used across multiple states',
        color: '#059669',
        features: ['Package tracking', 'Transfer manifests', 'Regulatory reporting']
    }
];

// Integration Card Component
function IntegrationCard({ integration, index }) {
    return (
        <div
            className="relative p-5 rounded-2xl transition-all duration-300 hover:scale-[1.02] group overflow-hidden"
            style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-primary)',
                animationDelay: `${index * 100}ms`
            }}
        >
            {/* Coming Soon Badge */}
            <div
                className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1"
                style={{ background: `${integration.color}20`, color: integration.color }}
            >
                <Clock size={12} />
                Coming Soon
            </div>

            {/* Logo and Name */}
            <div className="flex items-center gap-3 mb-3 pr-24">
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: `${integration.color}15` }}
                >
                    {integration.logo}
                </div>
                <div className="min-w-0">
                    <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                        {integration.name}
                    </h3>
                    <span className="text-xs" style={{ color: integration.color }}>
                        Integration Partner
                    </span>
                </div>
            </div>

            {/* Description */}
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                {integration.description}
            </p>

            {/* Features */}
            <div className="flex flex-wrap gap-2 mb-4">
                {integration.features.map((feature, idx) => (
                    <span
                        key={idx}
                        className="text-xs px-2 py-1 rounded-lg"
                        style={{ background: 'var(--bg-secondary)', color: 'var(--text-tertiary)' }}
                    >
                        {feature}
                    </span>
                ))}
            </div>

            {/* CTA Button - Disabled with Coming Soon */}
            <button
                disabled
                className="w-full py-2 rounded-xl flex items-center justify-center gap-2 text-sm font-medium opacity-60 cursor-not-allowed"
                style={{
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-secondary)',
                    border: '1px dashed var(--border-primary)'
                }}
            >
                <Zap size={14} />
                Connect {integration.name}
            </button>
        </div>
    );
}

// Main Component
export default function IntegrationsPreview({ showPOS = true, showERP = true, showCompliance = true, portalType = 'dispensary' }) {
    return (
        <div className="mt-8 p-6 rounded-2xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                    >
                        <Zap className="text-white" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                            Integrations
                        </h2>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            Connect your favorite tools • Coming Soon
                        </p>
                    </div>
                </div>
                <div
                    className="px-4 py-2 rounded-xl flex items-center gap-2"
                    style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))', border: '1px solid rgba(99, 102, 241, 0.3)' }}
                >
                    <span className="text-sm font-medium" style={{ color: '#8b5cf6' }}>In Development</span>
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                </div>
            </div>

            {/* Info Banner */}
            <div
                className="mb-6 p-4 rounded-xl flex items-start gap-3"
                style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(34, 197, 94, 0.05))', border: '1px solid rgba(16, 185, 129, 0.2)' }}
            >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(16, 185, 129, 0.2)' }}>
                    <span className="text-lg">🚀</span>
                </div>
                <div>
                    <p className="text-sm font-medium mb-1" style={{ color: '#10b981' }}>
                        We're building powerful integrations!
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        Our team is actively working on integrating the top {portalType === 'dispensary' ? 'POS systems' : 'ERP and POS systems'} in the cannabis industry.
                        These integrations will enable seamless data sync, automated order management, and real-time inventory updates.
                    </p>
                </div>
            </div>

            {/* ERP Systems Section */}
            {showERP && (
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">📊</span>
                        <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>
                            ERP Systems
                        </h3>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                            {ERP_SYSTEMS.length} integrations
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {ERP_SYSTEMS.map((integration, index) => (
                            <IntegrationCard key={integration.id} integration={integration} index={index} />
                        ))}
                    </div>
                </div>
            )}

            {/* Compliance Systems Section */}
            {showCompliance && (
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">🔒</span>
                        <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>
                            Compliance & Tracking
                        </h3>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(5, 150, 105, 0.1)', color: '#059669' }}>
                            {COMPLIANCE_SYSTEMS.length} integrations
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {COMPLIANCE_SYSTEMS.map((integration, index) => (
                            <IntegrationCard key={integration.id} integration={integration} index={index} />
                        ))}
                    </div>
                </div>
            )}

            {/* POS Systems Section */}
            {showPOS && (
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">💳</span>
                        <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>
                            POS Systems
                        </h3>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
                            {POS_SYSTEMS.length} integrations
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {POS_SYSTEMS.map((integration, index) => (
                            <IntegrationCard key={integration.id} integration={integration} index={index} />
                        ))}
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="mt-6 pt-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-primary)' }}>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    💡 Have a specific integration request? Let us know!
                </p>
                <button
                    className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                    style={{ background: 'var(--accent-primary)', color: 'var(--text-inverse)' }}
                    onClick={() => window.open('mailto:sales@thegreentruthnyc.com?subject=Integration Request', '_blank')}
                >
                    Request Integration
                    <ArrowRight size={12} />
                </button>
            </div>
        </div>
    );
}
