import React from 'react';
import { FileText, Download, Eye, Mail, X, File, Image as ImageIcon } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAllBrandProfiles } from '../services/firestoreService';
import { BRAND_LICENSES } from '../contexts/BrandAuthContext';

export default function Menus() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [viewingImage, setViewingImage] = React.useState(null);
    const [menus, setMenus] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    // Security Check
    React.useEffect(() => {
        if (!currentUser) {
            navigate('/');
        }
    }, [currentUser, navigate]);

    // Fetch Dynamic Menus
    React.useEffect(() => {
        async function fetchMenus() {
            setLoading(true);
            const profiles = await getAllBrandProfiles();

            // Map profiles to menu structure, filtering by official licenses
            const officialBrandIds = Object.values(BRAND_LICENSES).map(b => b.brandId);

            const dynamicMenus = profiles
                .filter(brand => officialBrandIds.includes(brand.id) || officialBrandIds.includes(brand.brandId))
                .map(brand => ({
                    title: `${brand.brandName || brand.id} Menu`,
                    src: brand.menuUrl || null,
                    brandName: brand.brandName || brand.id,
                    autoLink: true
                }))
                .filter(m => m.src); // Only show dynamic menus if they actually have a file

            const staticMenus = [
                { title: 'Honey King Pricing', src: '/menus/Honey_King_Menu.jpg', autoLink: true, brandName: 'Honey King' },
                { title: 'Wanders New York Menu', src: '/menus/wanderers.jpg', autoLink: true, brandName: 'Wanderers' },
                { title: 'Canna Dots Price List', src: '/menus/Canna_Dots_Menu.png', autoLink: true, brandName: 'Canna Dots' },
                { title: 'Space Poppers Menu', src: '/menus/space-poppers-2025.jpg', autoLink: true, brandName: 'Space Poppers' },
                { title: 'Smoothie Bar Pricing', src: '/menus/smoothie-bar-sheet.jpg', autoLink: true, brandName: 'Smoothie Bar' },
                { title: 'Waferz NY', src: '/menus/waferz-2025.jpg', autoLink: true, brandName: 'Waferz' },
                { title: 'Pines', src: '/menus/pines_december_menu.jpg', autoLink: true, brandName: 'Pines' }
            ];

            const merged = [...dynamicMenus];

            // Add static menus if not already present (by brandName or title match)
            staticMenus.forEach(s => {
                const alreadyExists = merged.find(d =>
                    d.brandName?.toLowerCase() === s.brandName?.toLowerCase() ||
                    d.title === s.title
                );
                if (!alreadyExists) {
                    merged.push(s);
                }
            });

            setMenus(merged);
            setLoading(false);
        }
        fetchMenus();
    }, []);

    const getFileType = (url) => {
        if (!url) return 'unknown';
        const cleanUrl = url.split('?')[0].toLowerCase();
        if (cleanUrl.endsWith('.pdf')) return 'pdf';
        if (cleanUrl.match(/\.(jpeg|jpg|png|webp)$/)) return 'image';
        return 'file';
    };

    const handleDownloadOriginal = async (menu) => {
        if (!menu.src) return;

        try {
            const response = await fetch(menu.src);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;

            // Guess extension
            let ext = 'file';
            const fileType = getFileType(menu.src);
            if (fileType === 'pdf') ext = 'pdf';
            else if (fileType === 'image') ext = 'jpg'; // simplified

            a.download = `${menu.brandName || 'Menu'}_Original.${ext}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Download failed", error);
            // Fallback to direct link
            window.open(menu.src, '_blank');
        }
    };

    const handleDownloadPDF = async (menu) => {
        if (!menu.src) return;

        // If it's already a PDF, just download it directly
        if (getFileType(menu.src) === 'pdf') {
            handleDownloadOriginal(menu);
            return;
        }

        try {
            const pdf = new jsPDF();
            const img = new Image();
            img.crossOrigin = "Anonymous";  // Prevent taint
            img.src = menu.src;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                // Get normalized Data URL (always JPEG for PDF compatibility)
                const imgData = canvas.toDataURL('image/jpeg', 0.95);

                const imgWidth = 210; // A4 width in mm
                const imgHeight = (img.height * imgWidth) / img.width;

                pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
                pdf.save(`${menu.brandName || 'Menu'}_Converted.pdf`);
            };
        } catch (error) {
            console.error("PDF Generation Error", error);
            alert("Failed to generate PDF. You can try downloading the original file instead.");
        }
    };

    const handleEmail = (menu) => {
        const subject = `The Green Truth - ${menu.brandName || 'Brand'} Menu`;
        const body = `Attached is the menu for ${menu.brandName || 'the requested brand'} as requested.\n\n(Please attach the file manually as automated attachments are not supported by mailto links).`;

        // Use a safer trigger method
        const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoLink;
    };

    return (
        <div className="max-w-4xl mx-auto relative px-4">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800">Product Menus & Pricing</h1>
                <p className="text-slate-500">Reference guides for all active brands.</p>
            </div>

            <div className="space-y-8 pb-12">
                {menus.map((menu) => {
                    const fileType = getFileType(menu.src);
                    const isPDF = fileType === 'pdf';

                    return (
                        <div key={menu.title} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-all">
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                                    <FileText size={18} className="text-brand-600" />
                                    {menu.title}
                                </h2>

                                {/* Standard Download (Existing Logic) */}
                                {menu.src && !menu.autoLink && (
                                    <button
                                        onClick={() => handleDownloadOriginal(menu)}
                                        className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors"
                                    >
                                        <Download size={16} />
                                        Download
                                    </button>
                                )}
                                {/* Pending Badge */}
                                {!menu.src && (
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide px-2 py-1 bg-slate-100 rounded-md">
                                        Pending
                                    </span>
                                )}
                            </div>

                            <div className="p-0 bg-slate-50/30">
                                {menu.src ? (
                                    <div className="relative">
                                        {/* Preview Area */}
                                        {isPDF ? (
                                            <div className="w-full h-64 flex flex-col items-center justify-center bg-slate-100 text-slate-500 gap-3">
                                                <FileText size={48} className="text-slate-400" />
                                                <span className="font-medium">PDF Document Preview Not Available</span>
                                                <a
                                                    href={menu.src}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-sm text-brand-600 hover:underline"
                                                >
                                                    Open in New Tab
                                                </a>
                                            </div>
                                        ) : (
                                            <img
                                                src={menu.src}
                                                alt={menu.title}
                                                className="w-full h-auto max-h-[500px] object-cover object-top opacity-95 group-hover:opacity-100 transition-opacity"
                                            />
                                        )}

                                        {/* Action Overlay */}
                                        {menu.autoLink && (
                                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex flex-wrap justify-center gap-3 backdrop-blur-[2px]">
                                                {!isPDF && (
                                                    <button
                                                        onClick={() => setViewingImage(menu.src)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white text-slate-800 rounded-lg text-sm font-bold shadow-lg transition-all hover:scale-105"
                                                    >
                                                        <Eye size={16} /> View
                                                    </button>
                                                )}

                                                {/* Generic Download Button with Dropdown logic simplified to two buttons for clarity */}
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleDownloadOriginal(menu)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-bold shadow-lg transition-all hover:scale-105"
                                                        title="Download original file"
                                                    >
                                                        <Download size={16} />
                                                        {isPDF ? 'Download PDF' : 'Download Original'}
                                                    </button>

                                                    {/* Only show Convert to PDF if it's an image */}
                                                    {!isPDF && (
                                                        <button
                                                            onClick={() => handleDownloadPDF(menu)}
                                                            className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold shadow-lg transition-all hover:scale-105"
                                                            title="Convert Image to PDF"
                                                        >
                                                            <FileText size={14} /> As PDF
                                                        </button>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={() => handleEmail(menu)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold shadow-lg transition-all hover:scale-105"
                                                >
                                                    <Mail size={16} /> Email
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="w-full h-48 flex flex-col items-center justify-center border-t border-dashed border-slate-200 text-slate-400 gap-2">
                                        <div className="p-4 bg-slate-50 rounded-full">
                                            <FileText size={24} className="opacity-40" />
                                        </div>
                                        <span className="text-sm font-medium">Menu Coming Soon</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Lightbox Modal */}
            {viewingImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200" onClick={() => setViewingImage(null)}>
                    <button
                        onClick={() => setViewingImage(null)}
                        className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <X size={32} />
                    </button>
                    <img
                        src={viewingImage}
                        alt="Full Size Menu"
                        className="max-w-full max-h-[90vh] rounded-lg shadow-2xl object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
