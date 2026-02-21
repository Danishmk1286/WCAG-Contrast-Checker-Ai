import React from "react";
import { Card, CardContent } from "@/components/ui/card";
// Tree-shake lucide-react imports for better performance
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";
import XCircle from "lucide-react/dist/esm/icons/x-circle";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import Info from "lucide-react/dist/esm/icons/info";
import Check from "lucide-react/dist/esm/icons/check";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ContrastResult {
  ratio: number;
  aaLarge: boolean;
  aaNormal: boolean;
  aaaLarge: boolean;
  aaaNormal: boolean;
}

interface ContrastResultsProps {
  result: ContrastResult;
  textColor?: string;
  backgroundColor?: string;
}

// PERFORMANCE: Pre-defined status objects to avoid object recreation on every render
const CONTRAST_STATUS = {
  excellent: {
    label: "Excellent contrast",
    color: "text-green-700 dark:text-green-400",
    iconColor: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-900/20",
    borderColor: "border-green-200 dark:border-green-800"
  },
  good: {
    label: "Good contrast",
    color: "text-green-700 dark:text-green-400",
    iconColor: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-900/20",
    borderColor: "border-green-200 dark:border-green-800"
  },
  fair: {
    label: "Fair contrast",
    color: "text-amber-700 dark:text-amber-400",
    iconColor: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-900/15",
    borderColor: "border-amber-200 dark:border-amber-800/50"
  },
  poor: {
    label: "Poor contrast",
    color: "text-red-700 dark:text-red-400",
    iconColor: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-900/20",
    borderColor: "border-red-200 dark:border-red-800"
  }
} as const;

const ContrastResults: React.FC<ContrastResultsProps> = React.memo(({ result, textColor, backgroundColor }) => {
  const [normalTextTooltipOpen, setNormalTextTooltipOpen] = React.useState(false);
  const [largeTextTooltipOpen, setLargeTextTooltipOpen] = React.useState(false);

  // PERFORMANCE: Memoize contrast status to avoid recalculation on every render
  const contrastStatus = React.useMemo(() => {
    const ratio = result.ratio;
    if (ratio >= 7) return CONTRAST_STATUS.excellent;
    if (ratio >= 4.5) return CONTRAST_STATUS.good;
    if (ratio >= 3) return CONTRAST_STATUS.fair;
    return CONTRAST_STATUS.poor;
  }, [result.ratio]);
  
  const isPassing = result.ratio >= 4.5;

  const getPassIcon = (passed: boolean, isMobile: boolean = false) => {
    const size = isMobile ? "w-3 h-3" : "w-3.5 h-3.5";
    return passed ? (
      <CheckCircle className={`${size} text-green-600 dark:text-green-400`} />
    ) : (
      <XCircle className={`${size} text-red-600 dark:text-red-400`} />
    );
  };

  const getPassBadge = (passed: boolean, label: string, isMobile: boolean = false) => {
    if (isMobile) {
      // Mobile: Compact single-row badge
      return (
        <div className="flex flex-col items-center gap-1 p-1.5 rounded-md bg-muted/40 dark:bg-muted/30 border border-border/40">
          <div className="flex items-center gap-1">
            {getPassIcon(passed, true)}
            <span className="text-[10px] font-semibold text-foreground leading-tight text-center">{label}</span>
          </div>
          <span className={`text-[10px] font-bold leading-tight ${
            passed ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          }`}>
            {passed ? "Pass" : "Fail"}
          </span>
        </div>
      );
    }
    // Desktop: Full badge
    return (
      <div className="flex items-center gap-2.5 p-2.5 rounded-md bg-muted/40 dark:bg-muted/30 border border-border/40">
        <div className="flex items-center gap-2 flex-1">
          {getPassIcon(passed, false)}
          <span className="text-xs font-semibold text-foreground leading-tight">{label}</span>
        </div>
        <span className={`text-xs font-bold leading-tight ${
          passed ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
        }`}>
          {passed ? "Pass" : "Fail"}
        </span>
      </div>
    );
  };

  const handleViewFullPreview = () => {
    const previewSection = document.getElementById('live-preview-section');
    if (previewSection) {
      previewSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Determine achieved WCAG level for progress bar
  // When AAA is achieved, we highlight "Pass" as the highest level indicator
  const getAchievedLevel = (aaPassed: boolean, aaaPassed: boolean): 'fail' | 'aa' | 'aaa' | 'pass' => {
    if (!aaPassed) return 'fail';
    if (aaPassed && !aaaPassed) return 'aa';
    if (aaaPassed) return 'pass'; // AAA achieved = Pass (highest level)
    return 'fail';
  };

  // Progress bar component for mobile
  const WCAGProgressBar: React.FC<{
    title: string;
    achievedLevel: 'fail' | 'aa' | 'aaa' | 'pass';
  }> = ({ title, achievedLevel }) => {
    const segments = [
      { label: 'Fail', level: 'fail' as const, color: 'bg-red-500 dark:bg-red-600' },
      { label: 'AA', level: 'aa' as const, color: 'bg-yellow-500 dark:bg-yellow-600' },
      { label: 'AAA', level: 'aaa' as const, color: 'bg-green-400 dark:bg-green-500' },
      { label: 'Pass', level: 'pass' as const, color: 'bg-green-600 dark:bg-green-700' },
    ];

    const getLevelIndex = (level: string) => {
      const index = segments.findIndex(s => s.level === level);
      return index >= 0 ? index : 0;
    };

    const achievedIndex = getLevelIndex(achievedLevel);

    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-[10px] font-semibold text-foreground/90 uppercase tracking-wide leading-tight">
            {title}
          </h4>
          {achievedLevel !== 'fail' && (
            <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
          )}
        </div>
        <div 
          className="relative flex h-7 rounded-md overflow-hidden border border-border/40 bg-muted/20"
          style={{
            contain: 'layout style',
            willChange: 'auto'
          }}
        >
          {segments.map((segment, index) => {
            const isCurrent = index === achievedIndex;
            // All segments up to and including achieved level are considered "achieved"
            const isAchieved = index <= achievedIndex;
            const opacity = isCurrent 
              ? 'opacity-100' 
              : isAchieved 
              ? 'opacity-60' 
              : 'opacity-30';
            
            return (
              <div
                key={segment.level}
                className={`flex-1 flex flex-col items-center justify-center transition-opacity duration-300 ${segment.color} ${opacity} relative ${
                  isCurrent ? 'ring-2 ring-primary ring-offset-1 ring-offset-background z-10' : 'z-0'
                }`}
                style={{ 
                  transition: 'opacity 0.3s ease-in-out',
                  transform: 'translateZ(0)',
                  backfaceVisibility: 'hidden',
                  contain: 'layout style paint',
                  willChange: 'opacity'
                }}
              >
                <span className={`text-[9px] font-bold leading-tight ${
                  isCurrent
                    ? 'text-white dark:text-white' 
                    : isAchieved 
                    ? 'text-white/90 dark:text-white/90' 
                    : 'text-white/50 dark:text-white/50'
                }`}>
                  {segment.label}
                </span>
                {isCurrent && (
                  <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 z-20">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full border-2 border-background shadow-sm" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Generate accessible announcement for screen readers
  const getAccessibilityAnnouncement = () => {
    const ratio = result.ratio;
    const status = isPassing ? "passes" : "fails";
    const aaNormalStatus = result.aaNormal ? "passes" : "fails";
    const aaLargeStatus = result.aaLarge ? "passes" : "fails";
    const aaaNormalStatus = result.aaaNormal ? "passes" : "fails";
    const aaaLargeStatus = result.aaaLarge ? "passes" : "fails";
    
    return `Contrast ratio ${ratio.toFixed(2)}: ${status}. WCAG AA Normal Text: ${aaNormalStatus}. WCAG AA Large Text: ${aaLargeStatus}. WCAG AAA Normal Text: ${aaaNormalStatus}. WCAG AAA Large Text: ${aaLargeStatus}.`;
  };

  return (
    <Card
      role="region"
      aria-label="Contrast ratio and WCAG compliance results"
      className="border-border/60 bg-card rounded-lg w-full h-full flex flex-col shadow-sm mx-1 md:mx-0"
      style={{
        contain: 'layout style',
        willChange: 'auto'
      }}
    >
      {/* Screen reader announcement for contrast results */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
        role="status"
      >
        {getAccessibilityAnnouncement()}
      </div>
      <CardContent className="p-4 md:p-5 space-y-4 md:space-y-5 flex-1 flex flex-col">
        {/* Contrast Ratio Display with Live Indicator - Refined */}
        <div 
          className={`text-center py-5 px-5 rounded-lg border ${contrastStatus.bgColor} ${contrastStatus.borderColor} shadow-md`}
          style={{
            contain: 'layout style paint',
            willChange: 'auto'
          }}
        >
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <div className="text-[11px] uppercase tracking-wider text-foreground/60 font-semibold leading-tight">
              CONTRAST RATIO
            </div>
            {/* Premium LIVE Status Indicator - Clear and Compact */}
            <div 
              className="flex items-center gap-2 px-2 py-1 rounded-full bg-primary/10 dark:bg-primary/20 border border-primary/30 dark:border-primary/40 shadow-sm" 
              role="status" 
              aria-label="Live updates enabled - Contrast ratio updates in real-time"
              title="Live updates - Contrast ratio updates in real-time"
              style={{
                contain: 'layout style',
                flexShrink: 0
              }}
            >
              {/* Breathing Dot Indicator */}
              <div className="relative flex items-center justify-center" style={{ width: '8px', height: '8px', flexShrink: 0 }}>
                {/* Soft Glow Layer */}
                <div 
                  className="absolute w-2 h-2 rounded-full bg-primary/40 animate-live-glow motion-reduce:animate-none"
                  aria-hidden="true"
                  style={{ width: '8px', height: '8px' }}
                />
                {/* Main Breathing Dot */}
                <div 
                  className="relative w-2 h-2 rounded-full bg-primary animate-live-breathe motion-reduce:animate-none"
                  aria-hidden="true"
                  style={{ width: '8px', height: '8px' }}
                />
              </div>
              {/* Clear LIVE Text */}
              <span className="text-[10px] md:text-xs font-bold text-primary uppercase tracking-wider leading-none" style={{ whiteSpace: 'nowrap' }}>
                LIVE
              </span>
            </div>
          </div>
          {/* Contrast Number - More Dominant - Fixed Width to Prevent Layout Shift */}
          <div 
            className={`text-5xl md:text-6xl lg:text-7xl font-black mb-2.5 md:mb-3 ${contrastStatus.color} leading-none tracking-tight`}
            style={{
              minWidth: '100%',
              width: '100%',
              display: 'block',
              contain: 'layout style',
              fontVariantNumeric: 'tabular-nums',
              fontFeatureSettings: '"tnum"'
            }}
          >
            <span style={{ display: 'inline-block', minWidth: '100%', textAlign: 'center' }}>
              {result.ratio.toFixed(2)}
            </span>
          </div>
          {/* Status Badge - Compact Design */}
          <div className={`inline-flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1 md:py-1.5 rounded-full ${contrastStatus.bgColor} border ${contrastStatus.borderColor}`}>
            {isPassing ? (
              <CheckCircle className={`w-4 h-4 ${contrastStatus.iconColor}`} />
            ) : (
              <XCircle className={`w-4 h-4 ${contrastStatus.iconColor}`} />
            )}
            <span className={`text-xs font-semibold ${contrastStatus.color} leading-tight`}>
              {contrastStatus.label}
            </span>
          </div>
        </div>

        {/* WCAG Results - Refined */}
        <TooltipProvider delayDuration={0}>
          {/* Mobile: Single Row | Desktop: Two Columns */}
          <div>
            {/* Mobile: Progress bars */}
            <div className="md:hidden space-y-3">
              <div className="flex items-center gap-1.5 mb-2.5">
                <h3 className="text-xs font-semibold text-foreground/90 uppercase tracking-wide leading-tight">
                  WCAG Results
                </h3>
              </div>
              <WCAGProgressBar 
                title="Normal Text" 
                achievedLevel={getAchievedLevel(result.aaNormal, result.aaaNormal)} 
              />
              <WCAGProgressBar 
                title="Large Text" 
                achievedLevel={getAchievedLevel(result.aaLarge, result.aaaLarge)} 
              />
            </div>
            
            {/* Desktop: Two Column Layout */}
            <div className="hidden md:grid md:grid-cols-2 md:gap-3 lg:gap-4">
              <div className="space-y-1">
              <div className="flex items-center gap-1.5 mb-2.5 md:mb-3">
                <h3 className="text-xs font-semibold text-foreground/90 uppercase tracking-wide leading-tight">
                  WCAG Normal Text
                </h3>
                <Tooltip open={normalTextTooltipOpen} onOpenChange={setNormalTextTooltipOpen}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setNormalTextTooltipOpen(!normalTextTooltipOpen)}
                      className={`inline-flex items-center justify-center w-5 h-5 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                        normalTextTooltipOpen
                          ? "text-primary bg-primary/10 scale-110"
                          : "text-foreground/60 hover:text-foreground/90 hover:bg-muted/50"
                      }`}
                      aria-label="Learn more about WCAG Normal Text requirements"
                      aria-expanded={normalTextTooltipOpen}
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    sideOffset={8}
                    className="max-w-sm bg-card border-2 border-primary/30 text-foreground shadow-xl p-4 z-50"
                    onPointerDownOutside={() => setNormalTextTooltipOpen(false)}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 mt-0.5">
                        <Info className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground mb-1">
                          WCAG Normal Text
                        </p>
                        <p className="text-sm leading-relaxed text-foreground/90">
                          Text smaller than 18pt (24px) regular or smaller than 14pt (18.5px) bold.
                        </p>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="space-y-2 md:space-y-2.5">
                {getPassBadge(result.aaNormal, "AA")}
                {getPassBadge(result.aaaNormal, "AAA")}
              </div>
            </div>
            <div className="hidden md:block space-y-1">
              <div className="flex items-center gap-1.5 mb-2.5 md:mb-3">
                <h3 className="text-xs font-semibold text-foreground/90 uppercase tracking-wide leading-tight">
                  WCAG Large Text
                </h3>
                <Tooltip open={largeTextTooltipOpen} onOpenChange={setLargeTextTooltipOpen}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setLargeTextTooltipOpen(!largeTextTooltipOpen)}
                      className={`inline-flex items-center justify-center w-5 h-5 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                        largeTextTooltipOpen
                          ? "text-primary bg-primary/10 scale-110"
                          : "text-foreground/60 hover:text-foreground/90 hover:bg-muted/50"
                      }`}
                      aria-label="Learn more about WCAG Large Text requirements"
                      aria-expanded={largeTextTooltipOpen}
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    sideOffset={8}
                    className="max-w-sm bg-card border-2 border-primary/30 text-foreground shadow-xl p-4 z-50"
                    onPointerDownOutside={() => setLargeTextTooltipOpen(false)}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 mt-0.5">
                        <Info className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground mb-1">
                          WCAG Large Text
                        </p>
                        <p className="text-sm leading-relaxed text-foreground/90">
                          Text at least 18pt (24px) regular or at least 14pt (18.5px) bold.
                        </p>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="space-y-2 md:space-y-2.5">
                {getPassBadge(result.aaLarge, "AA")}
                {getPassBadge(result.aaaLarge, "AAA")}
              </div>
            </div>
            </div>
          </div>
        </TooltipProvider>

        {/* Large Preview - Desktop Only */}
        {textColor && backgroundColor && (
          <div 
            className="hidden md:flex rounded-lg border border-border/60 overflow-hidden flex-1 flex flex-col shadow-sm"
            style={{ 
              backgroundColor: backgroundColor,
              contain: 'layout style paint',
              minHeight: '300px',
              willChange: 'background-color'
            }}
          >
            <div 
              className="p-5 md:p-6 flex-1 flex flex-col justify-center"
            >
              {/* Heading */}
              <h4 style={{ 
                color: textColor, 
                fontWeight: 700, 
                fontSize: '18px', 
                marginBottom: '14px',
                lineHeight: '1.3',
                letterSpacing: '-0.01em'
              }}>
                Live Colors Preview
              </h4>
              
              {/* First paragraph */}
              <p style={{ 
                color: textColor, 
                fontSize: '14px', 
                marginBottom: '14px',
                lineHeight: '1.6',
                fontWeight: 400
              }}>
                This is a sample paragraph demonstrating how your text color looks on the selected background color.
              </p>
              
              {/* Second paragraph */}
              <p style={{ 
                color: textColor, 
                fontSize: '14px', 
                marginBottom: '14px',
                lineHeight: '1.6',
                fontWeight: 400
              }}>
                Additional content to show how different text sizes appear with your color combination.
              </p>
              
              {/* Divider line */}
              <div 
                style={{ 
                  height: '1px',
                  backgroundColor: textColor,
                  opacity: 0.2,
                  marginBottom: '14px',
                  width: '100%'
                }}
              />
              
              {/* Smaller caption */}
              <span style={{ 
                color: textColor, 
                fontSize: '12px', 
                lineHeight: '1.5',
                fontWeight: 400,
                opacity: 0.8
              }}>
                Smaller text for captions and metadata
              </span>
            </div>
          </div>
        )}

        {/* View Full Preview Button - Hidden on mobile */}
        <Button
          variant="outline"
          onClick={handleViewFullPreview}
          className="hidden md:flex w-full items-center justify-center gap-2 mt-auto py-2.5 text-xs min-h-[44px]"
        >
          View Full Preview
          <ChevronDown className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
});

ContrastResults.displayName = "ContrastResults";

export default ContrastResults;
