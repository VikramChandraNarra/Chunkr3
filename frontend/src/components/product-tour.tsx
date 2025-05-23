import React, { useEffect, useRef, useState } from "react";

const TOUR_STEPS = [
  {
    key: "new-chat",
    title: "Start a New Chat",
    description: "Click here to create a new chat.",
    selector: '[data-tour="new-chat"]',
  },
  {
    key: "file-upload",
    title: "Upload Files",
    description: "Attach files to your chat here.",
    selector: '[data-tour="file-upload2"]',
  },
  {
    key: "chat-input",
    title: "Type Your Message",
    description: "Enter your message to chat with the AI.",
    selector: '[data-tour="chat-input"]',
  },
  {
    key: "search",
    title: "Search Chats",
    description: "Search through your chats here.",
    selector: '[data-tour="search-input"]',
  },
  {
    key: "finished",
    title: "You're all set!",
    description: "Enjoy using the app.",
    selector: null,
  },
];

const TOUR_STORAGE_KEY = "product-tour-completed";

export const ProductTourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [step, setStep] = useState<number | null>(null);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Start tour for first timers
  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem(TOUR_STORAGE_KEY)) {
      setStep(0);
    }
  }, []);

  // Highlight the current step's element
  useEffect(() => {
    if (step === null || TOUR_STEPS[step].selector == null) {
      setHighlightRect(null);
      return;
    }
    let el: Element | null = null;
    if (TOUR_STEPS[step].key === "file-upload") {
      // Find all elements matching the selector
      const candidates = Array.from(document.querySelectorAll(TOUR_STEPS[step].selector!));
      // Pick the first visible one in the viewport
      el = candidates.find(e => {
        const rect = e.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.bottom <= window.innerHeight && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden';
      }) || candidates[0] || null;
    } else {
      el = document.querySelector(TOUR_STEPS[step].selector!);
    }
    if (el) {
      const rect = el.getBoundingClientRect();
      setHighlightRect(rect);
    } else {
      setHighlightRect(null);
    }
  }, [step]);

  // Scroll to the highlighted element
  useEffect(() => {
    if (highlightRect && step !== null) {
      window.scrollTo({
        top: Math.max(0, window.scrollY + highlightRect.top - 120),
        behavior: "smooth",
      });
    }
  }, [highlightRect, step]);

  const handleNext = () => {
    if (step === null) return;
    // If on the 'new-chat' step, trigger the button click
    if (TOUR_STEPS[step].key === "new-chat") {
      const btn = document.querySelector('[data-tour="new-chat"]') as HTMLElement | null;
      if (btn) btn.click();
      // Wait a short moment for UI to update before advancing
      setTimeout(() => setStep(step + 1), 300);
      return;
    }
    if (step < TOUR_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      finishTour();
    }
  };

  const skipTour = () => {
    finishTour();
  };

  const finishTour = () => {
    setStep(null);
    if (typeof window !== "undefined") {
      localStorage.setItem(TOUR_STORAGE_KEY, "1");
    }
  };

  // Add a Confetti component (CSS/JS, no external libraries)
  function Confetti() {
    // Simple confetti using absolutely positioned divs and random animation
    const colors = ["#FFC700", "#FF0000", "#2E3191", "#41BBC7", "#7CFC00", "#FF69B4"];
    const confettiPieces = Array.from({ length: 40 });
    return (
      <div className="pointer-events-none fixed inset-0 z-[1100] overflow-hidden">
        {confettiPieces.map((_, i) => {
          const left = Math.random() * 100;
          const duration = 2.5 + Math.random() * 1.5;
          const delay = Math.random() * 1.5;
          const size = 8 + Math.random() * 8;
          const color = colors[Math.floor(Math.random() * colors.length)];
          const rotate = Math.random() * 360;
          return (
            <div
              key={i}
              style={{
                left: `${left}%`,
                animation: `confetti-fall ${duration}s ${delay}s linear forwards`,
                width: size,
                height: size * 0.4,
                background: color,
                borderRadius: 2,
                position: "absolute",
                top: -20,
                transform: `rotate(${rotate}deg)`,
                opacity: 0.85,
              }}
            />
          );
        })}
        <style>{`
          @keyframes confetti-fall {
            0% { opacity: 1; transform: translateY(0) scale(1) rotate(0deg); }
            80% { opacity: 1; }
            100% { opacity: 0.7; transform: translateY(100vh) scale(1.1) rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Overlay rendering
  return (
    <>
      {children}
      {step !== null && (
        <div>
          {/* Dimmed background */}
          <div
            className="fixed inset-0 z-[1000] bg-black/40 transition-opacity"
            style={{ pointerEvents: "auto" }}
            aria-hidden="true"
          />
          {/* Confetti and special card for finished step */}
          {TOUR_STEPS[step].key === "finished" ? (
            <>
              <Confetti />
              <div
                className="fixed z-[1002] max-w-sm w-full bg-gradient-to-br from-white via-[#f8fafc] to-[#e0e7ff] border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 animate-in fade-in-0"
                style={{ top: "50vh", left: "50vw", transform: "translate(-50%, -50%)" }}
              >
                <div className="text-5xl mb-2">🎉</div>
                <div className="font-extrabold text-2xl text-center text-primary mb-1">You're all set!</div>
                <div className="flex gap-2 justify-center mt-2 w-full">
                  <button
                    className="px-4 py-2 rounded-lg text-base bg-muted hover:bg-muted/80 text-gray-700 dark:text-gray-200 font-medium"
                    onClick={skipTour}
                  >
                    Skip
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg text-base bg-gradient-to-r from-primary to-indigo-500 text-white font-bold shadow-lg hover:brightness-110 focus:ring-2 focus:ring-primary"
                    onClick={finishTour}
                    autoFocus
                  >
                    Finish
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Highlighted element border */}
              {highlightRect && (
                <div
                  className="fixed z-[1001] border-4 border-primary rounded-xl pointer-events-none transition-all duration-200 shadow-xl"
                  style={{
                    top: highlightRect.top - 8,
                    left: highlightRect.left - 8,
                    width: highlightRect.width + 16,
                    height: highlightRect.height + 16,
                    boxSizing: "border-box",
                  }}
                />
              )}
              {/* Step popover */}
              <div
                ref={overlayRef}
                className="fixed z-[1002] max-w-xs bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-2xl p-6 flex flex-col gap-3 animate-in fade-in-0"
                style={(() => {
                  if (highlightRect && TOUR_STEPS[step].key === "file-upload") {
                    // Center horizontally over the button, just below it
                    const popoverWidth = 320; // max-w-xs
                    let left = highlightRect.left + highlightRect.width / 2 - popoverWidth / 2;
                    let top = highlightRect.bottom + 16;
                    // Clamp left and top to viewport
                    left = Math.max(16, Math.min(left, window.innerWidth - popoverWidth - 16));
                    top = Math.min(top, window.innerHeight - 180); // 180px is a safe popover height
                    return {
                      top: `${top}px`,
                      left: `${left}px`,
                      width: `${popoverWidth}px`,
                    };
                  }
                  if (highlightRect) {
                    return {
                      top: `${Math.max(24, highlightRect.bottom + 16)}px`,
                      left: `${Math.max(24, highlightRect.left)}px`,
                    };
                  }
                  return { top: "40vh", left: "50vw", transform: "translate(-50%, -50%)" };
                })()}
              >
                {/* Arrow for file-upload step */}
                {highlightRect && TOUR_STEPS[step].key === "file-upload" && (
                  <div
                    className="absolute left-1/2 -top-3 -translate-x-1/2"
                    style={{ width: 0, height: 0, borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderBottom: '12px solid white', zIndex: 1 }}
                  />
                )}
                <div className="font-semibold text-lg mb-1">{TOUR_STEPS[step].title}</div>
                <div className="text-sm text-muted-foreground mb-2">{TOUR_STEPS[step].description}</div>
                <div className="flex gap-2 justify-end mt-2">
                  <button
                    className="px-3 py-1 rounded-md text-xs bg-muted hover:bg-muted/80 text-gray-700 dark:text-gray-200"
                    onClick={skipTour}
                  >
                    Skip
                  </button>
                  {step < TOUR_STEPS.length - 1 ? (
                    <button
                      className="px-3 py-1 rounded-md text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={handleNext}
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      className="px-3 py-1 rounded-md text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={finishTour}
                    >
                      Finish
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}; 