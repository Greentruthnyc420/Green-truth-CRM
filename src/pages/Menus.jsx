import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Download, ChevronDown, ChevronRight, ChevronLeft, Package, DollarSign, Boxes, Search, Filter, ExternalLink, X, Leaf, Zap, Flame, Wind, Cookie } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAllBrandProfiles } from '../services/firestoreService';
import { BRAND_LICENSES } from '../contexts/BrandAuthContext';
import { PRODUCT_CATALOG } from '../data/productCatalog';
import { useNotification } from '../contexts/NotificationContext';

// Brand logo mapping
const BRAND_LOGOS = {
    'honey-king': '/logos/partner-6.png',
    'bud-cracker': '/logos/partner-4.png',
    'canna-dots': '/logos/partner-3.jpg',
    'space-poppers': '/logos/partner-2.png',
    'smoothie-bar': '/logos/smoothie-bar.png',
    'waferz': '/logos/waferz.png',
    'pines': '/logos/pines.png',
    'flx-extracts': '/logos/flx-extracts.png',
    'jusbud': '/logos/jusbud.png'
};

// Static menu PDFs/images - supports both single images (string) and multi-page (array)
const MENU_PDFS = {
    'honey-king': '/menus/Honey_King_Menu.jpg',
    'canna-dots': '/menus/Canna_Dots_Menu.png',
    // Space Poppers has 2 pages - the full catalog
    'space-poppers': [
        '/menus/space-poppers-2025-page1.jpg',
        '/menus/space-poppers-2025-page2.jpg'
    ],
    'smoothie-bar': '/menus/smoothie-bar-sheet.jpg',
    'waferz': '/menus/waferz-2025.jpg',
    'pines': '/menus/pines-january-2025.png'
};

// Category icons and colors
const CATEGORY_CONFIG = {
    'Vape': { icon: Zap, color: 'from-blue-500 to-cyan-500', bgColor: 'bg-blue-500/10', textColor: 'text-blue-600' },
    'Flower': { icon: Leaf, color: 'from-green-500 to-emerald-500', bgColor: 'bg-green-500/10', textColor: 'text-green-600' },
    'Pre-Roll': { icon: Flame, color: 'from-orange-500 to-amber-500', bgColor: 'bg-orange-500/10', textColor: 'text-orange-600' },
    'Edible': { icon: Cookie, color: 'from-purple-500 to-pink-500', bgColor: 'bg-purple-500/10', textColor: 'text-purple-600' },
    'Concentrate': { icon: Wind, color: 'from-indigo-500 to-violet-500', bgColor: 'bg-indigo-500/10', textColor: 'text-indigo-600' }
};

// Strain type colors
const STRAIN_COLORS = {
    'Sativa': 'bg-amber-100 text-amber-700 border-amber-200',
    'Indica': 'bg-purple-100 text-purple-700 border-purple-200',
    'Hybrid': 'bg-emerald-100 text-emerald-700 border-emerald-200'
};

export default function Menus() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    const [expandedBrands, setExpandedBrands] = useState({});
    const [expandedCategories, setExpandedCategories] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [viewingPDF, setViewingPDF] = useState(null);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);

    // Security Check
    useEffect(() => {
        if (!currentUser) {
            navigate('/');
        }
    }, [currentUser, navigate]);

    // Get brands with products (exclude processors without products)
    const brandsWithProducts = useMemo(() => {
        return PRODUCT_CATALOG.filter(brand =>
            brand.products && brand.products.length > 0 && !brand.isProcessor
        );
    }, []);

    // All unique categories
    const allCategories = useMemo(() => {
        const cats = new Set();
        brandsWithProducts.forEach(brand => {
            brand.products.forEach(p => cats.add(p.category));
        });
        return ['all', ...Array.from(cats).sort()];
    }, [brandsWithProducts]);

    // Filter products based on search and category
    const getFilteredProducts = (products) => {
        return products.filter(product => {
            const matchesSearch = !searchQuery ||
                product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.description?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    };

    // Group products by category
    const groupByCategory = (products) => {
        const grouped = {};
        products.forEach(product => {
            if (!grouped[product.category]) {
                grouped[product.category] = [];
            }
            grouped[product.category].push(product);
        });
        return grouped;
    };

    // Calculate category stats
    const getCategoryStats = (products, category) => {
        const categoryProducts = products.filter(p => p.category === category);
        const totalProducts = categoryProducts.length;
        const avgPrice = categoryProducts.reduce((sum, p) => sum + p.price, 0) / totalProducts;
        const totalCaseValue = categoryProducts.reduce((sum, p) => sum + (p.price * p.caseSize), 0);
        return { totalProducts, avgPrice, totalCaseValue };
    };

    const toggleBrand = (brandId) => {
        setExpandedBrands(prev => ({
            ...prev,
            [brandId]: !prev[brandId]
        }));
    };

    const toggleCategory = (brandId, category) => {
        const key = `${brandId}-${category}`;
        setExpandedCategories(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleDownloadMenu = (brandId) => {
        const menuUrl = MENU_PDFS[brandId];
        if (menuUrl) {
            setViewingPDF(menuUrl);
            setCurrentPageIndex(0); // Reset to first page when opening
        } else {
            showNotification('Menu not available for this brand', 'info');
        }
    };

    const handleCloseMenu = () => {
        setViewingPDF(null);
        setCurrentPageIndex(0);
    };

    const handleNextPage = () => {
        if (Array.isArray(viewingPDF) && currentPageIndex < viewingPDF.length - 1) {
            setCurrentPageIndex(prev => prev + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPageIndex > 0) {
            setCurrentPageIndex(prev => prev - 1);
        }
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!viewingPDF) return;

            if (e.key === 'Escape') {
                handleCloseMenu();
            } else if (e.key === 'ArrowRight') {
                handleNextPage();
            } else if (e.key === 'ArrowLeft') {
                handlePrevPage();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [viewingPDF, currentPageIndex]);

    return (
        <div className="max-w-6xl mx-auto px-4 pb-24">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Product Catalog</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Browse products by brand, view pricing, and download menus</p>
            </div>

            {/* Search & Filters */}
            <div className="themed-card rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border outline-none transition-all"
                        style={{
                            backgroundColor: 'var(--bg-secondary)',
                            borderColor: 'var(--border-primary)',
                            color: 'var(--text-primary)'
                        }}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Filter size={18} style={{ color: 'var(--text-tertiary)' }} />
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-4 py-3 rounded-xl border outline-none"
                        style={{
                            backgroundColor: 'var(--bg-secondary)',
                            borderColor: 'var(--border-primary)',
                            color: 'var(--text-primary)'
                        }}
                    >
                        {allCategories.map(cat => (
                            <option key={cat} value={cat}>
                                {cat === 'all' ? 'All Categories' : cat}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Brand Cards */}
            <div className="space-y-4">
                {brandsWithProducts.map(brand => {
                    const filteredProducts = getFilteredProducts(brand.products);
                    const groupedProducts = groupByCategory(filteredProducts);
                    const isExpanded = expandedBrands[brand.id];
                    const hasMenuPDF = MENU_PDFS[brand.id];

                    if (filteredProducts.length === 0) return null;

                    return (
                        <div
                            key={brand.id}
                            className="themed-card rounded-2xl overflow-hidden transition-all duration-300"
                            style={{ borderColor: isExpanded ? 'var(--brand-primary)' : 'var(--border-primary)' }}
                        >
                            {/* Brand Header */}
                            <div
                                className="p-4 md:p-6 flex items-center gap-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                onClick={() => toggleBrand(brand.id)}
                            >
                                {/* Logo */}
                                <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-white flex items-center justify-center p-2 shadow-sm border border-slate-100 shrink-0">
                                    {BRAND_LOGOS[brand.id] ? (
                                        <img
                                            src={BRAND_LOGOS[brand.id]}
                                            alt={brand.name}
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <Package size={28} className="text-slate-400" />
                                    )}
                                </div>

                                {/* Brand Info */}
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-lg md:text-xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                                        {brand.name}
                                    </h2>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                        <span className="flex items-center gap-1">
                                            <Package size={14} />
                                            {filteredProducts.length} products
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Boxes size={14} />
                                            {Object.keys(groupedProducts).length} categories
                                        </span>
                                        {brand.minimumOrder && (
                                            <span className="flex items-center gap-1">
                                                <DollarSign size={14} />
                                                Min: {brand.minimumOrder.type === 'amount'
                                                    ? `$${brand.minimumOrder.value.toLocaleString()}`
                                                    : `${brand.minimumOrder.value} cases`
                                                }
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    {hasMenuPDF && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownloadMenu(brand.id);
                                            }}
                                            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
                                            style={{
                                                backgroundColor: 'var(--brand-primary)',
                                                color: 'white'
                                            }}
                                        >
                                            <FileText size={16} />
                                            View Menu PDF
                                        </button>
                                    )}
                                    <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                    </div>
                                </div>
                            </div>

                            {/* Mobile Menu Button */}
                            {hasMenuPDF && (
                                <div className="md:hidden px-4 pb-4">
                                    <button
                                        onClick={() => handleDownloadMenu(brand.id)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all"
                                        style={{
                                            backgroundColor: 'var(--brand-primary)',
                                            color: 'white'
                                        }}
                                    >
                                        <FileText size={16} />
                                        View Full Menu PDF
                                    </button>
                                </div>
                            )}

                            {/* Expanded Content */}
                            {isExpanded && (
                                <div className="border-t" style={{ borderColor: 'var(--border-primary)' }}>
                                    {Object.entries(groupedProducts).map(([category, products]) => {
                                        const catKey = `${brand.id}-${category}`;
                                        const isCatExpanded = expandedCategories[catKey] !== false; // Default expanded
                                        const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG['Vape'];
                                        const Icon = config.icon;
                                        const stats = getCategoryStats(brand.products, category);
                                        const categoryPercentage = ((products.length / filteredProducts.length) * 100).toFixed(0);

                                        return (
                                            <div key={category} className="border-b last:border-b-0" style={{ borderColor: 'var(--border-primary)' }}>
                                                {/* Category Header */}
                                                <div
                                                    className="px-4 md:px-6 py-4 flex items-center gap-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                                    onClick={() => toggleCategory(brand.id, category)}
                                                >
                                                    <div className={`w-10 h-10 rounded-xl ${config.bgColor} flex items-center justify-center`}>
                                                        <Icon size={20} className={config.textColor} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3">
                                                            <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{category}</h3>
                                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                                                                {products.length} items • {categoryPercentage}%
                                                            </span>
                                                        </div>
                                                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                                                            Avg ${stats.avgPrice.toFixed(2)}/unit • Case value: ${stats.totalCaseValue.toLocaleString()}
                                                        </p>
                                                    </div>
                                                    {isCatExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                                </div>

                                                {/* Products Table */}
                                                {isCatExpanded && (
                                                    <div className="px-4 md:px-6 pb-4">
                                                        <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-primary)' }}>
                                                            {/* Table Header */}
                                                            <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}>
                                                                <div className="col-span-5">Product</div>
                                                                <div className="col-span-2">Strain</div>
                                                                <div className="col-span-2 text-right">Price/Unit</div>
                                                                <div className="col-span-1 text-center">Case</div>
                                                                <div className="col-span-2 text-right">Case Value</div>
                                                            </div>

                                                            {/* Product Rows */}
                                                            {products.map((product, idx) => (
                                                                <div
                                                                    key={product.id}
                                                                    className={`grid grid-cols-2 md:grid-cols-12 gap-2 md:gap-2 px-4 py-3 items-center ${idx % 2 === 0 ? '' : 'bg-black/[0.02] dark:bg-white/[0.02]'}`}
                                                                    style={{ borderTop: idx > 0 ? '1px solid var(--border-primary)' : 'none' }}
                                                                >
                                                                    {/* Product Name & Description */}
                                                                    <div className="col-span-2 md:col-span-5">
                                                                        <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{product.name}</p>
                                                                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{product.description}</p>
                                                                        {product.thc && (
                                                                            <span className="text-xs font-medium mt-1 inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                                                                                THC: {product.thc}
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    {/* Strain Type */}
                                                                    <div className="md:col-span-2 hidden md:block">
                                                                        <span className={`text-xs font-medium px-2 py-1 rounded-lg border ${STRAIN_COLORS[product.strainType] || 'bg-slate-100 text-slate-600'}`}>
                                                                            {product.strainType}
                                                                        </span>
                                                                    </div>

                                                                    {/* Mobile Layout */}
                                                                    <div className="col-span-2 md:hidden flex items-center justify-between mt-2 pt-2 border-t border-dashed" style={{ borderColor: 'var(--border-primary)' }}>
                                                                        <span className={`text-xs font-medium px-2 py-1 rounded-lg border ${STRAIN_COLORS[product.strainType] || 'bg-slate-100 text-slate-600'}`}>
                                                                            {product.strainType}
                                                                        </span>
                                                                        <div className="text-right">
                                                                            <p className="font-bold" style={{ color: 'var(--text-primary)' }}>${product.price.toFixed(2)}</p>
                                                                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                                                                {product.caseSize}ct = ${(product.price * product.caseSize).toFixed(2)}
                                                                            </p>
                                                                        </div>
                                                                    </div>

                                                                    {/* Desktop Price/Case */}
                                                                    <div className="hidden md:block md:col-span-2 text-right">
                                                                        <span className="font-bold" style={{ color: 'var(--text-primary)' }}>${product.price.toFixed(2)}</span>
                                                                    </div>
                                                                    <div className="hidden md:block md:col-span-1 text-center">
                                                                        <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{product.caseSize}ct</span>
                                                                    </div>
                                                                    <div className="hidden md:block md:col-span-2 text-right">
                                                                        <span className="font-bold" style={{ color: 'var(--brand-primary)' }}>
                                                                            ${(product.price * product.caseSize).toFixed(2)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Empty State */}
            {brandsWithProducts.filter(b => getFilteredProducts(b.products).length > 0).length === 0 && (
                <div className="themed-card rounded-2xl p-12 text-center">
                    <Package size={48} className="mx-auto mb-4 opacity-30" />
                    <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>No products found</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Try adjusting your search or filter criteria</p>
                </div>
            )}

            {/* PDF Viewer Modal */}
            {viewingPDF && (() => {
                const isMultiPage = Array.isArray(viewingPDF);
                const menuUrls = isMultiPage ? viewingPDF : [viewingPDF];
                const totalPages = menuUrls.length;
                const currentMenuUrl = menuUrls[currentPageIndex];
                const canGoPrev = currentPageIndex > 0;
                const canGoNext = currentPageIndex < totalPages - 1;

                return (
                    <div
                        className="fixed inset-0 z-50 bg-black/95 overflow-y-auto overflow-x-hidden"
                        onClick={handleCloseMenu}
                    >
                        {/* Close Button - Fixed position */}
                        <button
                            onClick={handleCloseMenu}
                            className="fixed top-4 right-4 text-white/80 hover:text-white p-3 rounded-full bg-black/50 hover:bg-black/70 transition-colors z-30 backdrop-blur-sm"
                            aria-label="Close menu"
                        >
                            <X size={28} />
                        </button>

                        {/* Scroll Indicator - Fade out after scrolling */}
                        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-sm font-medium animate-bounce pointer-events-none z-20 flex flex-col items-center gap-1 bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
                            <span>Scroll down to see more</span>
                            <ChevronDown size={18} />
                        </div>

                        {/* Previous Page Button - Fixed position */}
                        {isMultiPage && canGoPrev && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handlePrevPage();
                                }}
                                className="fixed left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-3 rounded-full bg-black/50 hover:bg-black/70 transition-colors z-30 backdrop-blur-sm"
                                aria-label="Previous page"
                            >
                                <ChevronLeft size={36} />
                            </button>
                        )}

                        {/* Next Page Button - Fixed position */}
                        {isMultiPage && canGoNext && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleNextPage();
                                }}
                                className="fixed right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-3 rounded-full bg-black/50 hover:bg-black/70 transition-colors z-30 backdrop-blur-sm"
                                aria-label="Next page"
                            >
                                <ChevronRight size={36} />
                            </button>
                        )}

                        {/* Menu Image Container - Full scrollable area */}
                        <div
                            className="min-h-screen flex flex-col items-center py-12 px-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* The actual menu image - displays at full size for scrolling */}
                            <img
                                src={currentMenuUrl}
                                alt={`Menu${isMultiPage ? ` - Page ${currentPageIndex + 1}` : ''}`}
                                className="rounded-lg shadow-2xl"
                                style={{
                                    width: 'auto',
                                    maxWidth: 'min(1200px, 95vw)', // Large but not wider than viewport
                                    height: 'auto' // Natural height - allows full scroll
                                }}
                            />

                            {/* Page Indicator for multi-page menus */}
                            {isMultiPage && (
                                <div className="mt-6 px-5 py-2.5 bg-white/10 backdrop-blur-md rounded-full text-white text-sm font-semibold border border-white/20">
                                    Page {currentPageIndex + 1} of {totalPages} — Use arrows to navigate
                                </div>
                            )}

                            {/* Bottom spacer to ensure scroll indicator doesn't cover content */}
                            <div className="h-20"></div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
