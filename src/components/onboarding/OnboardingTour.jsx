import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, ChevronLeft, HelpCircle, X } from 'lucide-react';

/**
 * OnboardingTour - Spotlight overlay with tooltips
 * Auto-starts when mounted and steps are provided
 */
export default function OnboardingTour({
    steps,
    isFirstTime = false,
    onComplete,
    tourKey = 'default'
}) {
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState(null);

    // Find and highlight target element
    const updateTarget = useCallback(() => {
        if (!steps || !steps[currentStep]) return;

        const selector = steps[currentStep].target;
        if (!selector || selector === 'body') {
            setTargetRect(null);
            return;
        }

        const element = document.querySelector(selector);
        if (element) {
            const rect = element.getBoundingClientRect();
            setTargetRect({
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height
            });
        } else {
            setTargetRect(null);
        }
    }, [currentStep, steps]);

    // Update position on step change
    useEffect(() => {
        updateTarget();
        const interval = setInterval(updateTarget, 500);
        window.addEventListener('resize', updateTarget);
        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', updateTarget);
        };
    }, [currentStep, updateTarget]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            if (onComplete) onComplete();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleClose = () => {
        if (onComplete) onComplete();
    };

    // Don't render if no steps
    if (!steps || steps.length === 0) return null;

    const step = steps[currentStep];
    const canSkip = !isFirstTime;

    // Tooltip positioning - mobile responsive
    const getTooltipStyle = () => {
        const isMobile = window.innerWidth < 640;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // On mobile, always center horizontally with safe margins
        if (isMobile) {
            return {
                top: targetRect ? Math.min(targetRect.top + targetRect.height + 16, viewportHeight - 280) : '50%',
                left: 16,
                right: 16,
                maxWidth: 'calc(100vw - 32px)',
                transform: targetRect ? 'none' : 'translateY(-50%)'
            };
        }

        if (!targetRect) {
            return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
        }

        const pos = step.position || 'bottom';
        const pad = 20;
        const tooltipWidth = 320;

        // Ensure tooltip stays within viewport
        const safeLeft = Math.max(16, Math.min(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, viewportWidth - tooltipWidth - 16));

        switch (pos) {
            case 'top':
                return {
                    bottom: viewportHeight - targetRect.top + pad,
                    left: safeLeft,
                    maxWidth: tooltipWidth
                };
            case 'left':
                return {
                    top: Math.max(16, Math.min(targetRect.top + targetRect.height / 2 - 80, viewportHeight - 200)),
                    right: viewportWidth - targetRect.left + pad,
                    maxWidth: Math.min(tooltipWidth, targetRect.left - 32)
                };
            case 'right':
                return {
                    top: Math.max(16, Math.min(targetRect.top + targetRect.height / 2 - 80, viewportHeight - 200)),
                    left: targetRect.left + targetRect.width + pad,
                    maxWidth: Math.min(tooltipWidth, viewportWidth - targetRect.left - targetRect.width - 32)
                };
            case 'center':
                return {
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    maxWidth: Math.min(380, viewportWidth - 32)
                };
            default: // bottom
                return {
                    top: Math.min(targetRect.top + targetRect.height + pad, viewportHeight - 200),
                    left: safeLeft,
                    maxWidth: tooltipWidth
                };
        }
    };

    return createPortal(
        <>
            {/* Dark overlay */}
            <div
                className="fixed inset-0 z-[9998]"
                style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
                onClick={canSkip ? handleClose : undefined}
            />

            {/* Spotlight cutout */}
            {targetRect && (
                <div
                    className="fixed z-[9999] pointer-events-none"
                    style={{
                        top: targetRect.top - 8,
                        left: targetRect.left - 8,
                        width: targetRect.width + 16,
                        height: targetRect.height + 16,
                        boxShadow: '0 0 0 9999px rgba(0,0,0,0.7)',
                        borderRadius: '12px',
                        border: '3px solid #10b981'
                    }}
                />
            )}

            {/* Tooltip - mobile responsive */}
            <div
                className="fixed z-[10000] bg-white rounded-xl shadow-2xl overflow-hidden sm:w-80"
                style={getTooltipStyle()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-3 flex justify-between items-center">
                    <span className="text-white font-bold text-sm">
                        Step {currentStep + 1} / {steps.length}
                    </span>
                    {canSkip && (
                        <button
                            onClick={handleClose}
                            className="text-white/80 hover:text-white transition-colors"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="p-4">
                    <h3 className="font-bold text-slate-800 text-lg mb-2">{step.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{step.description}</p>
                </div>

                {/* Progress bar */}
                <div className="px-4 pb-2">
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-300"
                            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Navigation */}
                <div className="px-4 pb-4 flex justify-between items-center">
                    <button
                        onClick={handlePrev}
                        disabled={currentStep === 0}
                        className="flex items-center gap-1 px-3 py-2 text-slate-500 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft size={16} /> Back
                    </button>
                    <button
                        onClick={handleNext}
                        className="flex items-center gap-1 px-5 py-2 bg-emerald-500 text-white rounded-lg font-bold hover:bg-emerald-600 transition-colors"
                    >
                        {currentStep === steps.length - 1 ? 'Done!' : 'Next'}
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </>,
        document.body
    );
}

// Trigger button for replaying
export function TourTriggerButton({ onClick }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-600"
        >
            <HelpCircle size={16} /> Replay Tour
        </button>
    );
}
