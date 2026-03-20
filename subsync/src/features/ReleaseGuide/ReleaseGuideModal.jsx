import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button.jsx';
import { cn } from '@/lib/utils.js';

// ─── Step progress dots ───────────────────────────────────────────────────────
function StepDots({ total, current }) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <motion.div
          key={i}
          animate={{
            width: i === current ? 20 : 6,
            opacity: i === current ? 1 : 0.35,
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="h-1.5 rounded-full bg-blue-500"
        />
      ))}
    </div>
  );
}

// ─── Single step content with enter/exit animation ───────────────────────────
const stepVariants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
};

/**
 * ReleaseGuideModal
 * Props:
 *   guide  — ReleaseGuide object (from releaseGuides.js)
 *   open   — boolean
 *   onClose — () => void  (dismiss / complete)
 */
export default function ReleaseGuideModal({ guide, open, onClose }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1); // +1 = forward, -1 = back

  // Reset step index whenever guide changes or modal opens
  useEffect(() => {
    if (open) setStepIndex(0);
  }, [open, guide?.id]);

  const steps = guide?.steps ?? [];
  const totalSteps = steps.length;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;
  const currentStep = steps[stepIndex];

  const goNext = useCallback(() => {
    if (isLast) {
      onClose();
    } else {
      setDirection(1);
      setStepIndex((i) => i + 1);
    }
  }, [isLast, onClose]);

  const goBack = useCallback(() => {
    setDirection(-1);
    setStepIndex((i) => i - 1);
  }, []);

  if (!guide) return null;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogPrimitive.Portal>
        {/* Backdrop */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Modal panel */}
        <DialogPrimitive.Content
          onInteractOutside={(e) => e.preventDefault()}
          className={cn(
            'fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%]',
            'overflow-hidden rounded-2xl bg-background shadow-2xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
            'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
            'duration-200'
          )}
        >
          {/* ── Gradient header ── */}
          <div className="relative bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 px-6 pt-6 pb-8">
            {/* Our single close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors rounded-full p-1 hover:bg-white/10"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Icon + version badge */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-bold text-white/70 uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded-full">
                v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : guide.version}
              </span>
            </div>

            <DialogPrimitive.Title className="text-xl font-black text-white leading-tight">
              {guide.title}
            </DialogPrimitive.Title>
            {guide.description && (
              <DialogPrimitive.Description className="text-sm text-white/75 mt-1">
                {guide.description}
              </DialogPrimitive.Description>
            )}
          </div>

          {/* ── Step content ── */}
          <div className="px-6 py-5 min-h-[130px] relative overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep?.id ?? stepIndex}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'tween', ease: 'easeInOut', duration: 0.2 }}
              >
                {currentStep?.title && (
                  <p className="text-sm font-bold text-foreground mb-1.5">
                    {currentStep.title}
                  </p>
                )}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {currentStep?.body}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-between px-6 pb-6 gap-3">
            <StepDots total={totalSteps} current={stepIndex} />

            <div className="flex items-center gap-2 ml-auto">
              {!isFirst && (
                <Button variant="ghost" size="sm" onClick={goBack} className="gap-1.5">
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Back
                </Button>
              )}

              <Button
                size="sm"
                onClick={goNext}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 px-4 font-semibold"
              >
                {isLast ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Got it!
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
