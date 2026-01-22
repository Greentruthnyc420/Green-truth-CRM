import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight, ChevronLeft, HelpCircle, X, MousePointer } from 'lucide-react';

/**
 * OnboardingTour - Spotlight overlay with tooltips
 * Auto-starts when mounted and steps are provided
 * 
 * Step properties:
 * - target: CSS selector to highlight
 * - title: Step title
 * - description: Step description
 * - position: Tooltip position (top, bottom, left, right, center)
 * - navigateTo: (optional) Route to navigate to for this step
 * - clickToAdvance: (optional) If true, user must CLICK the target element to advance
 */
export default function OnboardingTour({
    steps,
    isFirstTime = false,
    onComplete,
    tourKey = 'default'
}) {
    const navigate = useNavigate();
    const location = useLocation();
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState(null);
    const [isNextEnabled, setIsNextEnabled] = useState(!isFirstTime);
    const [countdown, setCountdown] = useState(isFirstTime ? 2 : 0);
    const [isNavigating, setIsNavigating] = useState(false);
    const clickHandlerRef = useRef(null);

    // Anti-spam: On first-time tours, delay the Next button by 2 seconds per step
    useEffect(() => {
        if (!isFirstTime) {
            setIsNextEnabled(true);
            return;
        }

        // For clickToAdvance steps, enable immediately after countdown
        const step = steps?.[currentStep];
        if (step?.clickToAdvance) {
            setIsNextEnabled(false);
            setCountdown(1); // Just 1 second for click steps
        } else {
            setIsNextEnabled(false);
            setCountdown(2);
        }

        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setIsNextEnabled(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [currentStep, isFirstTime, steps]);

    // Handle clickToAdvance - attach click listener to target element
    useEffect(() => {
        if (!steps || !steps[currentStep]) return;

        const step = steps[currentStep];
        if (!step.clickToAdvance || !step.target || step.target === 'body') return;

        const attachClickHandler = () => {
            const element = document.querySelector(step.target);
            if (!element) return;

            // Remove any previous handler
            if (clickHandlerRef.current) {
                document.removeEventListener('click', clickHandlerRef.current, true);
            }

            // Create new click handler
            const handleClick = (e) => {
                // Check if click was on or within the target element
                if (element.contains(e.target) || element === e.target) {
                    // Advance to next step
                    setTimeout(() => {
                        if (currentStep < steps.length - 1) {
                            setCurrentStep(prev => prev + 1);
                        } else {
                            if (onComplete) onComplete();
                        }
                    }, 100); // Small delay to let natural click happen first
                }
            };

            clickHandlerRef.current = handleClick;
            document.addEventListener('click', handleClick, true);
        };

        // Try immediately and again after a delay (for elements that load async)
        attachClickHandler();
        const retryTimeout = setTimeout(attachClickHandler, 500);

        return () => {
            clearTimeout(retryTimeout);
            if (clickHandlerRef.current) {
                document.removeEventListener('click', clickHandlerRef.current, true);
                clickHandlerRef.current = null;
            }
        };
    }, [currentStep, steps, onComplete]);

    // Handle navigation when step has navigateTo property
    useEffect(() => {
        if (!steps || !steps[currentStep]) return;

        const step = steps[currentStep];
        if (step.navigateTo && location.pathname !== step.navigateTo) {
            setIsNavigating(true);
            navigate(step.navigateTo);
            // Give time for page to render
            setTimeout(() => {
                setIsNavigating(false);
            }, 500);
        }
    }, [currentStep, steps, navigate, location.pathname]);

    // Find and highlight target element
    const updateTarget = useCallback(() => {
        if (!steps || !steps[currentStep] || isNavigating) return;

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
    }, [currentStep, steps, isNavigating]);

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
        const tooltipMaxHeight = 350; // Ensure tooltip never exceeds this

        // On mobile, always center horizontally with safe margins
        if (isMobile) {
            return {
                top: targetRect ? Math.min(targetRect.top + targetRect.height + 16, viewportHeight - tooltipMaxHeight - 16) : '50%',
                left: 16,
                right: 16,
                maxWidth: 'calc(100vw - 32px)',
                maxHeight: tooltipMaxHeight,
                transform: targetRect ? 'none' : 'translateY(-50%)'
            };
        }

        if (!targetRect) {
            return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', maxHeight: tooltipMaxHeight };
        }

        const pos = step.position || 'bottom';
        const pad = 20;
        const tooltipWidth = 320;

        // Ensure tooltip stays within viewport
        const safeLeft = Math.max(16, Math.min(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, viewportWidth - tooltipWidth - 16));

        // Calculate safe top position - never go below viewport - tooltipMaxHeight
        const maxTop = viewportHeight - tooltipMaxHeight - 16;

        switch (pos) {
            case 'top':
                return {
                    bottom: viewportHeight - targetRect.top + pad,
                    left: safeLeft,
                    maxWidth: tooltipWidth,
                    maxHeight: tooltipMaxHeight
                };
            case 'left':
                return {
                    top: Math.max(16, Math.min(targetRect.top + targetRect.height / 2 - 80, maxTop)),
                    right: viewportWidth - targetRect.left + pad,
                    maxWidth: Math.min(tooltipWidth, targetRect.left - 32),
                    maxHeight: tooltipMaxHeight
                };
            case 'right':
                return {
                    top: Math.max(16, Math.min(targetRect.top + targetRect.height / 2 - 80, maxTop)),
                    left: targetRect.left + targetRect.width + pad,
                    maxWidth: Math.min(tooltipWidth, viewportWidth - targetRect.left - targetRect.width - 32),
                    maxHeight: tooltipMaxHeight
                };
            case 'center':
                return {
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    maxWidth: Math.min(380, viewportWidth - 32),
                    maxHeight: tooltipMaxHeight
                };
            default: // bottom
                return {
                    top: Math.max(16, Math.min(targetRect.top + targetRect.height + pad, maxTop)),
                    left: safeLeft,
                    maxWidth: tooltipWidth,
                    maxHeight: tooltipMaxHeight
                };
        }
    };

    return createPortal(
        <>
            {/* SVG Overlay with transparent spotlight cutout */}
            <svg
                className="fixed inset-0 z-[9998] w-full h-full"
                style={{ pointerEvents: canSkip ? 'auto' : 'none' }}
                onClick={canSkip ? handleClose : undefined}
            >
                <defs>
                    <mask id="spotlight-mask">
                        {/* White = visible (dark overlay), Black = transparent (spotlight) */}
                        <rect width="100%" height="100%" fill="white" />
                        {targetRect && (
                            <rect
                                x={targetRect.left - 8}
                                y={targetRect.top - 8}
                                width={targetRect.width + 16}
                                height={targetRect.height + 16}
                                rx="12"
                                ry="12"
                                fill="black"
                            />
                        )}
                    </mask>
                </defs>
                {/* Dark overlay with spotlight cutout */}
                <rect
                    width="100%"
                    height="100%"
                    fill="rgba(0,0,0,0.75)"
                    mask="url(#spotlight-mask)"
                    style={{ pointerEvents: canSkip ? 'auto' : 'none' }}
                />
            </svg>

            {/* Spotlight border highlight - now visible since content shows through */}
            {targetRect && (
                <div
                    className="fixed z-[9999] pointer-events-none"
                    style={{
                        top: targetRect.top - 8,
                        left: targetRect.left - 8,
                        width: targetRect.width + 16,
                        height: targetRect.height + 16,
                        borderRadius: '12px',
                        border: '3px solid #10b981',
                        boxShadow: '0 0 20px rgba(16, 185, 129, 0.5), inset 0 0 0 1px rgba(255,255,255,0.1)'
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

                    {/* Show "Click the Item" for clickToAdvance steps, otherwise show Next button */}
                    {step.clickToAdvance && isNextEnabled ? (
                        <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg font-bold animate-pulse">
                            <MousePointer size={16} />
                            <span>Click the Item Above ☝️</span>
                        </div>
                    ) : (
                        <button
                            onClick={handleNext}
                            disabled={!isNextEnabled || step.clickToAdvance}
                            className={`flex items-center gap-1 px-5 py-2 rounded-lg font-bold transition-all ${isNextEnabled && !step.clickToAdvance
                                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                }`}
                        >
                            {!isNextEnabled && countdown > 0 ? (
                                <>{countdown}s...</>
                            ) : step.clickToAdvance ? (
                                <>Wait...</>
                            ) : (
                                <>
                                    {currentStep === steps.length - 1 ? 'Done!' : 'Next'}
                                    <ChevronRight size={16} />
                                </>
                            )}
                        </button>
                    )}
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
