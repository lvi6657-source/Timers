import React, { useState, useEffect, useRef } from 'react';
import { Plus, Minus, Play, Pause, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

const TEXT_FONTS = [
  'system-ui, sans-serif',
  '"Tektur", sans-serif',
  '"Jura", sans-serif',
  '"Exo 2", sans-serif',
  '"Play", sans-serif',
  '"Russo One", sans-serif',
  '"Scada", sans-serif',
  '"Monda", sans-serif',
  '"Kelly Slab", sans-serif',
  '"Krona One", sans-serif',
  '"Prosto One", sans-serif',
  '"Unbounded", sans-serif',
  '"Geologica", sans-serif',
  '"Ruda", sans-serif',
  '"Cuprum", sans-serif',
  '"Oswald", sans-serif',
  '"Fira Sans Extra Condensed", sans-serif',
  '"Yanone Kaffeesatz", sans-serif',
  '"Jost", sans-serif',
  '"Rubik", sans-serif'
];

const NUMBER_FONTS = [
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  '"JetBrains Mono", monospace',
  '"Fira Code", monospace',
  '"Roboto Mono", monospace',
  '"Source Code Pro", monospace',
  '"IBM Plex Mono", monospace',
  '"Anonymous Pro", monospace',
  '"Ubuntu Mono", monospace',
  '"PT Mono", monospace',
  '"Courier Prime", monospace',
  '"Cousine", monospace',
  '"Victor Mono", monospace',
  '"Martian Mono", monospace',
  '"Fragment Mono", monospace',
  '"Inconsolata", monospace',
  '"Fira Mono", monospace',
  '"Noto Sans Mono", monospace',
  '"Tektur", sans-serif',
  '"Jura", sans-serif',
  '"Exo 2", sans-serif'
];
import { Reorder, useDragControls, AnimatePresence, motion } from 'motion/react';

const RollingText = ({ text, value, animate = true }: { text: string, value: number, animate?: boolean }) => {
  const [prevValue, setPrevValue] = useState(value);
  const [direction, setDirection] = useState(1);

  if (value !== prevValue) {
    setDirection(value > prevValue ? 1 : -1);
    setPrevValue(value);
  }

  const chars = text.split('');
  return (
    <span className="inline-flex items-center justify-end overflow-hidden" style={{ height: '1em', lineHeight: '1em' }}>
      {chars.map((char, i) => {
        const keyFromEnd = chars.length - i;
        if (!animate) {
          return (
            <span key={keyFromEnd} className="relative inline-flex justify-center items-center" style={{ width: '1ch', height: '1em' }}>
              {char}
            </span>
          );
        }
        return (
          <span key={keyFromEnd} className="relative inline-flex justify-center" style={{ width: '1ch', height: '1em' }}>
            <AnimatePresence initial={false} custom={direction}>
              <motion.span
                key={char}
                custom={direction}
                initial={(d: number) => ({ y: d > 0 ? '-100%' : '100%' })}
                animate={{ y: '0%' }}
                exit={(d: number) => ({ y: d > 0 ? '100%' : '-100%' })}
                transition={{ type: "spring", stiffness: 800, damping: 40, mass: 0.5 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                {char}
              </motion.span>
            </AnimatePresence>
          </span>
        );
      })}
    </span>
  );
};

type TimerData = {
  id: string;
  name: string;
  startTime: number | null;
  lastResumeTime: number | null;
  accumulatedMs: number;
  isRunning: boolean;
  color: string;
};

type Workspace = {
  id: string;
  name: string;
  isExclusive: boolean;
  timers: TimerData[];
};

const COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-cyan-500',
  'bg-rose-500',
  'bg-indigo-500'
];

const getRandomUniqueColor = (usedColors: Set<string>) => {
  const available = COLORS.filter(c => !usedColors.has(c));
  const pool = available.length > 0 ? available : COLORS;
  return pool[Math.floor(Math.random() * pool.length)];
};

const createEmptyTimer = (colorIndex = 0): TimerData => ({
  id: Math.random().toString(36).substr(2, 9),
  name: '',
  startTime: null,
  lastResumeTime: null,
  accumulatedMs: 0,
  isRunning: false,
  color: COLORS[colorIndex % COLORS.length]
});

const SECONDS_BLOCKS = Array.from({ length: 30 }).map((_, i) => {
  return {
    id: i,
    bottom: `${(i / 30) * 100}%`
  };
});

const defaultWorkspaces: Workspace[] = [
  { id: 't1', name: 'T1', isExclusive: false, timers: [createEmptyTimer(0)] },
  { id: 'l1', name: 'L1', isExclusive: true, timers: [createEmptyTimer(0)] },
];

const sortWorkspaces = (ws: Workspace[]) => {
  return [...ws].sort((a, b) => {
    if (a.isExclusive !== b.isExclusive) {
      return a.isExclusive ? 1 : -1;
    }
    const numA = parseInt(a.name.substring(1)) || 0;
    const numB = parseInt(b.name.substring(1)) || 0;
    return numA - numB;
  });
};

const formatTime = (ms: number) => {
  const isNegative = ms < 0;
  const absMs = Math.abs(ms);
  const totalMinutes = Math.floor(absMs / 60000);
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);
  
  const sign = isNegative ? '-' : '';

  if (days > 0) {
    const remainingHours = totalHours % 24;
    const d = days.toString();
    const h = remainingHours.toString().padStart(2, '0');
    return `${sign}${d}/${h}`;
  }
  
  if (totalHours === 0) {
    return `${sign}${totalMinutes}`;
  }
  
  const h = totalHours.toString();
  const m = (totalMinutes % 60).toString().padStart(2, '0');
  return `${sign}${h}:${m}`;
};

const formatStartTime = (ts: number) => {
  return new Date(ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
};

export type UiSettings = {
  gapSize: number;
  subTextSize: number;
  descSize: number;
  timeSize: number;
  timerHeight: number;
};

export const defaultUiSettings: UiSettings = {
  gapSize: 4,
  subTextSize: 24,
  descSize: 24,
  timeSize: 36,
  timerHeight: 64,
};

const UiSettingStrip = ({
  label,
  value,
  min,
  max,
  onChange,
  height,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
  height: number;
}) => {
  const stripRef = useRef({ isResizing: false, startX: 0, startValue: 0 });

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    stripRef.current.isResizing = true;
    stripRef.current.startX = e.clientX;
    stripRef.current.startValue = value;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!stripRef.current.isResizing) return;
    const deltaX = e.clientX - stripRef.current.startX;
    // Adjust sensitivity as needed
    const newValue = Math.max(min, Math.min(max, stripRef.current.startValue + deltaX * 0.2));
    onChange(newValue);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.currentTarget.releasePointerCapture(e.pointerId);
    stripRef.current.isResizing = false;
  };

  return (
    <div 
      className="w-full bg-gray-800/20 border-b border-gray-700/30 flex items-center justify-between text-gray-400"
      style={{ height }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="h-full px-6 flex items-center justify-center hover:text-white hover:bg-gray-800/40 active:bg-gray-700 active:scale-90 transition-all duration-75 cursor-pointer touch-none select-none"
      >
        <ChevronLeft size={28} />
      </button>
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="flex-1 h-full flex items-center justify-center cursor-pointer hover:bg-gray-800/40 active:bg-gray-700 transition-all duration-75 touch-none select-none"
      >
        <span className="text-lg font-medium">{label}: {Math.round(value)}</span>
      </div>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="h-full px-6 flex items-center justify-center hover:text-white hover:bg-gray-800/40 active:bg-gray-700 active:scale-90 transition-all duration-75 cursor-pointer touch-none select-none"
      >
        <ChevronRight size={28} />
      </button>
    </div>
  );
};

const TimerStrip = ({
  timer,
  previousStartTime,
  updateTimer,
  toggleTimer,
  removeTimer,
  selectedTimerId,
  setSelectedTimerId,
  textFont,
  numberFont,
  isTextBold,
  isNumberBold,
  timerHeight,
  uiSettings
}: {
  timer: TimerData;
  previousStartTime?: number | null;
  updateTimer: (id: string, data: Partial<TimerData>) => void;
  toggleTimer: (id: string) => void;
  removeTimer: (id: string) => void;
  selectedTimerId: string | null;
  setSelectedTimerId: (id: string | null) => void;
  textFont: string;
  numberFont: string;
  isTextBold: boolean;
  isNumberBold: boolean;
  timerHeight: number;
  uiSettings: UiSettings;
  key?: React.Key;
}) => {
  const [now, setNow] = useState(Date.now());
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const dragControls = useDragControls();

  const stripRef = useRef<HTMLDivElement>(null);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragStartStartTime, setDragStartStartTime] = useState<number | null>(null);
  const [hasMoved, setHasMoved] = useState(false);

  const isSelected = selectedTimerId === timer.id;

  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetBlurTimeout = () => {
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    blurTimeoutRef.current = setTimeout(() => {
      inputRef.current?.blur();
    }, 5000);
  };

  useEffect(() => {
    if (isFocused) {
      resetBlurTimeout();
    } else {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    }
    return () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    };
  }, [isFocused]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isSelected && timer.startTime) {
      e.stopPropagation();
      setDragStartX(e.clientX);
      setDragStartStartTime(timer.startTime);
      setHasMoved(false);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isSelected && dragStartX !== null && dragStartStartTime !== null && stripRef.current) {
      const dx = e.clientX - dragStartX;
      if (Math.abs(dx) > 5) {
        setHasMoved(true);
      }
      const width = stripRef.current.offsetWidth;
      const deltaMinutes = Math.round((dx / width) * 60);
      
      const newStartTime = dragStartStartTime + deltaMinutes * 60000;
      if (newStartTime !== timer.startTime) {
        const diffMs = newStartTime - timer.startTime;
        
        const updates: Partial<TimerData> = { startTime: newStartTime };
        if (timer.isRunning) {
          updates.lastResumeTime = timer.lastResumeTime! + diffMs;
        } else {
          updates.accumulatedMs = Math.max(0, timer.accumulatedMs - diffMs);
        }
        
        updateTimer(timer.id, updates);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isSelected) {
      if (!hasMoved) {
        setSelectedTimerId(null);
      }
      setDragStartX(null);
      setDragStartStartTime(null);
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  useEffect(() => {
    if (!timer.isRunning) return;
    let frame: number;
    const tick = () => {
      setNow(Date.now());
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [timer.isRunning]);

  const currentTime = timer.isRunning ? now : (timer.lastResumeTime || Date.now());
  const elapsedMs = timer.accumulatedMs + (timer.isRunning && timer.lastResumeTime ? (currentTime - timer.lastResumeTime) : 0);
  
  const isOverOneHour = elapsedMs >= 3600000;
  const progress = isOverOneHour 
    ? Math.min((elapsedMs / (24 * 3600000)) * 100, 100)
    : ((elapsedMs % 3600000) / 3600000) * 100;

  const fillColorClass = isOverOneHour ? 'bg-gray-500' : timer.color;

  let triangleLeft = 0;
  if (timer.startTime) {
    const date = new Date(timer.startTime);
    const secondsSinceMidnight = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
    triangleLeft = (secondsSinceMidnight / 86400) * 100;
  }

  const startPress = () => {
    if (isSelected || isFocused) return;
    setIsDeleting(true);
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      removeTimer(timer.id);
    }, 600);
  };

  const cancelPress = () => {
    setIsDeleting(false);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const isNeverStarted = timer.accumulatedMs === 0 && !timer.isRunning;
  const isPaused = timer.accumulatedMs > 0 && !timer.isRunning;

  let diffString = null;
  if (timer.startTime && previousStartTime) {
    const diffMs = timer.startTime - previousStartTime;
    const sign = diffMs >= 0 ? '+' : '-';
    const absDiffMs = Math.abs(diffMs);
    const diffMinutes = Math.floor(absDiffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const m = (diffMinutes % 60).toString().padStart(2, '0');
    
    if (diffHours === 0) {
      diffString = `${sign}${diffMinutes}`;
    } else {
      const h = diffHours.toString();
      diffString = `${sign}${h}:${m}`;
    }
  }

  const nameColor = isNeverStarted ? 'text-gray-700 placeholder-gray-800' :
                    isPaused ? 'text-gray-400 placeholder-gray-500' :
                    'text-white placeholder-gray-400';

  const timeColor = isNeverStarted ? 'text-gray-700' :
                    isPaused ? 'text-gray-400' :
                    'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]';

  const startTimeColor = isNeverStarted ? 'text-gray-700' :
                         isPaused ? 'text-gray-500' :
                         'text-gray-300';

  const minuteProgress = (elapsedMs % 60000) / 60000;
  const r = Math.round(34 + (249 - 34) * minuteProgress);
  const g = Math.round(197 + (115 - 197) * minuteProgress);
  const b = Math.round(94 + (22 - 94) * minuteProgress);
  const currentBarColor = `rgb(${r}, ${g}, ${b})`;

  return (
    <Reorder.Item
      value={timer}
      id={timer.id}
      dragListener={false}
      dragControls={dragControls}
      transition={{ type: 'spring', stiffness: 800, damping: 40 }}
      className={`relative w-full border-b border-gray-700/50 overflow-hidden select-none transition-[background-color] duration-[600ms] ease-linear ${isDeleting ? 'bg-red-900/80' : 'bg-gray-800/80'} ${isSelected ? 'ring-2 ring-blue-500 z-50' : ''}`}
      style={{ height: timerHeight }}
      onTouchStart={startPress}
      onTouchEnd={cancelPress}
      onTouchMove={cancelPress}
      onMouseDown={startPress}
      onMouseUp={cancelPress}
      onMouseLeave={cancelPress}
      onContextMenu={(e) => { e.preventDefault(); }}
      onClick={(e) => e.stopPropagation()}
    >
      <div ref={stripRef} className="absolute inset-0 pointer-events-none" />
      
      {isSelected && (
        <div 
          className="absolute inset-0 z-50 cursor-ew-resize bg-blue-500/10 touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      )}

      {/* Progress Fill */}
      <div
        className={`absolute top-0 left-0 h-full ${fillColorClass} opacity-30`}
        style={{ width: `${progress}%` }}
      >
        {timer.isRunning && progress > 0 && progress < 100 && (
          <div className="absolute top-0 right-0 w-1 h-full bg-white/50 shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
        )}
      </div>

      {/* Grid Lines */}
      <div className="absolute inset-0 flex pointer-events-none z-0">
        {isOverOneHour ? (
          Array.from({ length: 23 }).map((_, i) => {
            const isMajor = i === 5 || i === 11 || i === 17;
            return (
              <div key={i} className={`flex-1 border-r h-full ${isMajor ? 'border-white/10' : 'border-white/5'}`} />
            );
          })
        ) : (
          [1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex-1 border-r border-white/10 h-full" />
          ))
        )}
        <div className="flex-1 h-full" />
      </div>

      {/* Red Triangle */}
      {timer.startTime && (
        <div
          className="absolute bottom-0 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-red-500 z-20"
          style={{ left: `${triangleLeft}%`, transform: 'translateX(-50%)' }}
        />
      )}

      {/* Right Signal Indicator (Seconds Bar) */}
      {timer.startTime && (
        <div className="absolute right-0 bottom-0 w-[12px] h-full z-20">
          {SECONDS_BLOCKS.map(block => {
            const currentSec = Math.floor(elapsedMs / 1000) % 60;
            let isVisible = false;
            if (currentSec < 30) {
              isVisible = block.id < currentSec;
            } else {
              isVisible = block.id < 60 - currentSec;
            }
            if (!isVisible) return null;
            return (
              <div
                key={block.id}
                className="absolute w-full"
                style={{
                  height: `${100 / 30}%`,
                  bottom: block.bottom,
                  backgroundColor: timer.isRunning ? currentBarColor : '#ef4444'
                }}
              />
            );
          })}
        </div>
      )}

      {/* Content */}
      <div className="flex items-center justify-between h-full pl-[15px] pr-5 relative z-10 gap-4">
        {/* Left Half - Input */}
        <div className="flex flex-col justify-center h-full w-[70%] relative z-30">
          <div 
            className="flex items-center gap-1.5 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTimerId(isSelected ? null : timer.id);
            }}
            style={{ fontFamily: numberFont, marginBottom: `${uiSettings.gapSize}px` }}
          >
            <span 
              className={`${isNumberBold ? 'font-bold' : 'font-medium'} tracking-wide leading-none transition-colors ${startTimeColor}`}
              style={{ fontSize: `${uiSettings.subTextSize}px` }}
            >
              {timer.startTime ? formatStartTime(timer.startTime) : '--:--'}
              {diffString && <span className="ml-2 opacity-60">{diffString}</span>}
            </span>
          </div>
          <input
            ref={inputRef}
            type="text"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={`w-full bg-transparent p-0 m-0 ${isTextBold ? 'font-bold' : 'font-normal'} tracking-tighter outline-none truncate leading-none transition-colors ${nameColor}`}
            placeholder=""
            value={timer.name}
            onChange={(e) => {
              updateTimer(timer.id, { name: e.target.value });
              resetBlurTimeout();
            }}
            style={{ fontFamily: textFont, fontSize: `${uiSettings.descSize}px` }}
          />
        </div>

        {/* Right Half - Time */}
        <div 
          className={`${isNumberBold ? 'font-bold' : 'font-light'} tracking-tight shrink-0 transition-colors w-[30%] flex justify-end items-center relative z-10 ${timeColor}`}
          style={{ fontFamily: numberFont, fontSize: `${uiSettings.timeSize}px` }}
        >
          <RollingText text={formatTime(elapsedMs)} value={elapsedMs} animate={dragStartX === null} />
        </div>
      </div>

      {/* Center Drag Area */}
      <div 
        className="absolute top-0 left-[60%] right-[30%] h-full z-40 touch-none"
        onPointerDown={(e) => dragControls.start(e)}
      />

      {/* Right Half Click Area for Toggle */}
      <div 
        className="absolute right-0 top-0 w-[30%] h-full z-40 cursor-pointer" 
        onClick={() => toggleTimer(timer.id)} 
      />
    </Reorder.Item>
  );
};

export default function App() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('t1');
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedTimerId, setSelectedTimerId] = useState<string | null>(null);
  const [textFontIndex, setTextFontIndex] = useState(0);
  const [numberFontIndex, setNumberFontIndex] = useState(0);
  const [isTextBold, setIsTextBold] = useState(false);
  const [isNumberBold, setIsNumberBold] = useState(false);
  const [uiSettings, setUiSettings] = useState<UiSettings>(defaultUiSettings);
  const [isUiSettingsMode, setIsUiSettingsMode] = useState(false);
  const uiSettingsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isUiSettingsMode) {
      if (uiSettingsTimeoutRef.current) clearTimeout(uiSettingsTimeoutRef.current);
      uiSettingsTimeoutRef.current = setTimeout(() => {
        setIsUiSettingsMode(false);
      }, 10000);
    } else {
      if (uiSettingsTimeoutRef.current) clearTimeout(uiSettingsTimeoutRef.current);
    }
    return () => {
      if (uiSettingsTimeoutRef.current) clearTimeout(uiSettingsTimeoutRef.current);
    };
  }, [isUiSettingsMode, uiSettings, textFontIndex, numberFontIndex, isTextBold, isNumberBold]);

  const workspaceLongPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [isWorkspaceLongPressTriggered, setIsWorkspaceLongPressTriggered] = useState(false);
  const textPressRef = useRef({ timer: null as NodeJS.Timeout | null, isLong: false, isDown: false });
  const numberPressRef = useRef({ timer: null as NodeJS.Timeout | null, isLong: false, isDown: false });
  const addTimerRef = useRef({ timer: null as NodeJS.Timeout | null, isResizing: false, startX: 0, startHeight: 0, isDown: false });
  const emptyAreaRef = useRef({ timer: null as NodeJS.Timeout | null, isDown: false, isLongPressTriggered: false });

  const handlePointerDownText = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    textPressRef.current.isLong = false;
    textPressRef.current.isDown = true;
    if (textPressRef.current.timer) clearTimeout(textPressRef.current.timer);
    textPressRef.current.timer = setTimeout(() => {
      textPressRef.current.isLong = true;
      setIsTextBold(prev => !prev);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 400);
  };

  const handlePointerUpText = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (!textPressRef.current.isDown) return;
    textPressRef.current.isDown = false;
    if (textPressRef.current.timer) clearTimeout(textPressRef.current.timer);
    if (!textPressRef.current.isLong) {
      setTextFontIndex(prev => (prev + 1) % TEXT_FONTS.length);
    }
  };

  const cancelPointerText = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.releasePointerCapture(e.pointerId);
    textPressRef.current.isDown = false;
    if (textPressRef.current.timer) {
      clearTimeout(textPressRef.current.timer);
      textPressRef.current.timer = null;
    }
  };

  const handlePointerDownNumber = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    numberPressRef.current.isLong = false;
    numberPressRef.current.isDown = true;
    if (numberPressRef.current.timer) clearTimeout(numberPressRef.current.timer);
    numberPressRef.current.timer = setTimeout(() => {
      numberPressRef.current.isLong = true;
      setIsNumberBold(prev => !prev);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 400);
  };

  const handlePointerUpNumber = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (!numberPressRef.current.isDown) return;
    numberPressRef.current.isDown = false;
    if (numberPressRef.current.timer) clearTimeout(numberPressRef.current.timer);
    if (!numberPressRef.current.isLong) {
      setNumberFontIndex(prev => (prev + 1) % NUMBER_FONTS.length);
    }
  };

  const cancelPointerNumber = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.releasePointerCapture(e.pointerId);
    numberPressRef.current.isDown = false;
    if (numberPressRef.current.timer) {
      clearTimeout(numberPressRef.current.timer);
      numberPressRef.current.timer = null;
    }
  };

  const handleAddPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    addTimerRef.current.isDown = true;
    addTimerRef.current.isResizing = false;
    addTimerRef.current.startX = e.clientX;
    addTimerRef.current.startHeight = uiSettings.timerHeight;

    if (addTimerRef.current.timer) clearTimeout(addTimerRef.current.timer);
    addTimerRef.current.timer = setTimeout(() => {
      addTimerRef.current.isResizing = true;
      if (navigator.vibrate) navigator.vibrate(50);
    }, 400);
  };

  const handleAddPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!addTimerRef.current.isDown) return;
    if (addTimerRef.current.isResizing) {
      const deltaX = e.clientX - addTimerRef.current.startX;
      const newHeight = Math.max(40, Math.min(120, addTimerRef.current.startHeight + deltaX * 0.5));
      setUiSettings(s => ({ ...s, timerHeight: newHeight }));
    } else if (addTimerRef.current.timer) {
      if (Math.abs(e.clientX - addTimerRef.current.startX) > 10) {
        clearTimeout(addTimerRef.current.timer);
        addTimerRef.current.timer = null;
      }
    }
  };

  const handleAddPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.releasePointerCapture(e.pointerId);
    
    if (!addTimerRef.current.isDown) return;
    addTimerRef.current.isDown = false;

    if (addTimerRef.current.timer) {
      clearTimeout(addTimerRef.current.timer);
      addTimerRef.current.timer = null;
    }
    if (!addTimerRef.current.isResizing) {
      addTimer();
    }
    addTimerRef.current.isResizing = false;
  };

  const handleEmptyAreaPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    emptyAreaRef.current.isDown = true;
    emptyAreaRef.current.isLongPressTriggered = false;
    if (emptyAreaRef.current.timer) clearTimeout(emptyAreaRef.current.timer);
    emptyAreaRef.current.timer = setTimeout(() => {
      if (emptyAreaRef.current.isDown) {
        emptyAreaRef.current.isLongPressTriggered = true;
        setIsUiSettingsMode(true);
        if (navigator.vibrate) navigator.vibrate(50);
      }
    }, 500);
  };

  const handleEmptyAreaPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!emptyAreaRef.current.isDown) return;
    emptyAreaRef.current.isDown = false;
    if (emptyAreaRef.current.timer) {
      clearTimeout(emptyAreaRef.current.timer);
      emptyAreaRef.current.timer = null;
    }
    if (isUiSettingsMode && !emptyAreaRef.current.isLongPressTriggered) {
      setIsUiSettingsMode(false);
    }
  };

  const handleEmptyAreaPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    emptyAreaRef.current.isDown = false;
    if (emptyAreaRef.current.timer) {
      clearTimeout(emptyAreaRef.current.timer);
      emptyAreaRef.current.timer = null;
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('timer-app-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migration check: if old format with "Окно", reset to default
        if (parsed.workspaces && parsed.workspaces.some((w: Workspace) => w.name.includes('Окно'))) {
          setWorkspaces(defaultWorkspaces);
          setActiveWorkspaceId('t1');
        } else {
          setWorkspaces(sortWorkspaces(parsed.workspaces || defaultWorkspaces));
          setActiveWorkspaceId(parsed.activeWorkspaceId || 't1');
        }
        if (parsed.uiSettings) {
          setUiSettings({ ...defaultUiSettings, ...parsed.uiSettings });
        }
        if (parsed.textFontIndex !== undefined) setTextFontIndex(parsed.textFontIndex);
        if (parsed.numberFontIndex !== undefined) setNumberFontIndex(parsed.numberFontIndex);
        if (parsed.isTextBold !== undefined) setIsTextBold(parsed.isTextBold);
        if (parsed.isNumberBold !== undefined) setIsNumberBold(parsed.isNumberBold);
      } catch (e) {
        setWorkspaces(defaultWorkspaces);
      }
    } else {
      setWorkspaces(defaultWorkspaces);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('timer-app-state', JSON.stringify({
        workspaces,
        activeWorkspaceId,
        uiSettings,
        textFontIndex,
        numberFontIndex,
        isTextBold,
        isNumberBold
      }));
    }
  }, [workspaces, activeWorkspaceId, uiSettings, textFontIndex, numberFontIndex, isTextBold, isNumberBold, isLoaded]);

  if (!isLoaded || workspaces.length === 0) return null;

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0];

  const updateWorkspaceTimers = (newTimers: TimerData[]) => {
    setWorkspaces(ws => ws.map(w => w.id === activeWorkspaceId ? { ...w, timers: newTimers } : w));
  };

  const cycleWorkspace = () => {
    const currentIndex = workspaces.findIndex(w => w.id === activeWorkspaceId);
    const nextIndex = (currentIndex + 1) % workspaces.length;
    setActiveWorkspaceId(workspaces[nextIndex].id);
  };

  const clearWorkspaceTimers = () => {
    updateWorkspaceTimers([]);
  };

  const startWorkspacePress = () => {
    setIsWorkspaceLongPressTriggered(false);
    if (workspaceLongPressTimer.current) clearTimeout(workspaceLongPressTimer.current);
    workspaceLongPressTimer.current = setTimeout(() => {
      setIsWorkspaceLongPressTriggered(true);
      clearWorkspaceTimers();
    }, 600);
  };

  const cancelWorkspacePress = () => {
    if (workspaceLongPressTimer.current) {
      clearTimeout(workspaceLongPressTimer.current);
      workspaceLongPressTimer.current = null;
    }
  };

  const handleWorkspaceClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isWorkspaceLongPressTriggered) {
      cycleWorkspace();
    }
  };

  const addWorkspace = () => {
    const isExclusive = activeWorkspace.isExclusive;
    const prefix = isExclusive ? 'L' : 'T';
    const sameTypeWorkspaces = workspaces.filter(w => w.isExclusive === isExclusive);
    
    let maxNum = 0;
    sameTypeWorkspaces.forEach(w => {
      const num = parseInt(w.name.substring(1));
      if (!isNaN(num) && num > maxNum) maxNum = num;
    });
    
    const nextNum = maxNum + 1;
    const newId = `${prefix.toLowerCase()}${nextNum}_${Date.now()}`;
    const newWorkspace: Workspace = {
      id: newId,
      name: `${prefix}${nextNum}`,
      isExclusive,
      timers: [createEmptyTimer(0)]
    };
    
    const updatedWorkspaces = sortWorkspaces([...workspaces, newWorkspace]);
    setWorkspaces(updatedWorkspaces);
    setActiveWorkspaceId(newId);
  };

  const removeWorkspace = () => {
    if (activeWorkspace.name === 'T1' || activeWorkspace.name === 'L1') return;
    
    const currentIndex = workspaces.findIndex(w => w.id === activeWorkspaceId);
    const newWorkspaces = workspaces.filter(w => w.id !== activeWorkspaceId);
    setWorkspaces(newWorkspaces);
    
    const nextIndex = Math.max(0, currentIndex - 1);
    setActiveWorkspaceId(newWorkspaces[nextIndex].id);
  };

  const addTimer = () => {
    if (selectedTimerId) {
      let timerToMove: TimerData | null = null;
      let sourceWorkspaceId: string | null = null;
      
      for (const w of workspaces) {
        const t = w.timers.find(t => t.id === selectedTimerId);
        if (t) {
          timerToMove = t;
          sourceWorkspaceId = w.id;
          break;
        }
      }
      
      if (timerToMove && sourceWorkspaceId !== activeWorkspaceId) {
        setWorkspaces(ws => ws.map(w => {
          if (w.id === sourceWorkspaceId) {
            return { ...w, timers: w.timers.filter(t => t.id !== selectedTimerId) };
          }
          if (w.id === activeWorkspaceId) {
            return { ...w, timers: [...w.timers, timerToMove!] };
          }
          return w;
        }));
        setSelectedTimerId(null);
        return;
      }
      
      if (timerToMove && sourceWorkspaceId === activeWorkspaceId) {
        setSelectedTimerId(null);
      }
    }

    const now = Date.now();
    let newTimers = [...activeWorkspace.timers];
    
    if (activeWorkspace.isExclusive) {
      newTimers = newTimers.map(t => t.isRunning ? {
        ...t,
        isRunning: false,
        accumulatedMs: t.accumulatedMs + (now - t.lastResumeTime!)
      } : t);
    }
    
    const usedColors = new Set<string>(newTimers.filter(t => t.startTime).map(t => t.color));
    const newColor = getRandomUniqueColor(usedColors);
    
    newTimers.push({
      id: Date.now().toString(),
      name: '',
      startTime: now,
      lastResumeTime: now,
      accumulatedMs: 0,
      isRunning: true,
      color: newColor
    });
    
    updateWorkspaceTimers(newTimers);
  };

  const updateTimer = (id: string, data: Partial<TimerData>) => {
    updateWorkspaceTimers(activeWorkspace.timers.map(t => t.id === id ? { ...t, ...data } : t));
  };

  const toggleTimer = (id: string) => {
    const now = Date.now();
    let newTimers = [...activeWorkspace.timers];
    
    const targetTimer = newTimers.find(t => t.id === id);
    if (!targetTimer) return;

    if (activeWorkspace.isExclusive && !targetTimer.isRunning) {
      newTimers = newTimers.map(t => t.isRunning ? {
        ...t,
        isRunning: false,
        accumulatedMs: t.accumulatedMs + (now - t.lastResumeTime!)
      } : t);
    }

    newTimers = newTimers.map(t => {
      if (t.id !== id) return t;
      if (t.isRunning) {
        return {
          ...t,
          isRunning: false,
          accumulatedMs: t.accumulatedMs + (now - t.lastResumeTime!)
        };
      } else {
        const isFirstStart = !t.startTime;
        let color = t.color;
        if (isFirstStart) {
          const usedColors = new Set<string>(newTimers.filter(x => x.id !== t.id && x.startTime).map(x => x.color));
          color = getRandomUniqueColor(usedColors);
        }
        return {
          ...t,
          isRunning: true,
          startTime: t.startTime || now,
          lastResumeTime: now,
          color
        };
      }
    });
    
    updateWorkspaceTimers(newTimers);
  };

  const removeTimer = (id: string) => {
    updateWorkspaceTimers(activeWorkspace.timers.filter(t => t.id !== id));
  };

  const pauseAll = () => {
    const now = Date.now();
    updateWorkspaceTimers(activeWorkspace.timers.map(t => t.isRunning ? {
      ...t,
      isRunning: false,
      accumulatedMs: t.accumulatedMs + (now - t.lastResumeTime!)
    } : t));
  };

  const resumeAll = () => {
    const now = Date.now();
    const usedColors = new Set<string>(activeWorkspace.timers.filter(t => t.startTime).map(t => t.color));
    
    updateWorkspaceTimers(activeWorkspace.timers.map(t => {
      if (!t.isRunning) {
        const isFirstStart = !t.startTime;
        let color = t.color;
        if (isFirstStart) {
          color = getRandomUniqueColor(usedColors);
          usedColors.add(color);
        }
        return {
          ...t,
          isRunning: true,
          startTime: t.startTime || now,
          lastResumeTime: now,
          color
        };
      }
      return t;
    }));
  };

  const resetAll = () => {
    updateWorkspaceTimers(activeWorkspace.timers.map(t => ({
      ...t,
      isRunning: false,
      startTime: null,
      lastResumeTime: null,
      accumulatedMs: 0
    })));
  };

  const canDeleteWorkspace = activeWorkspace.name !== 'T1' && activeWorkspace.name !== 'L1';

  return (
    <div 
      className="min-h-screen bg-gray-950 text-white flex flex-col font-sans selection:bg-white/20"
      onClick={() => {
        setSelectedTimerId(null);
        setIsUiSettingsMode(false);
      }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 bg-gray-900 border-b border-gray-800 sticky top-0 z-50 shadow-md">
        
        {/* Workspace Controls */}
        <div className="flex items-center gap-1">
          <button 
            onClick={removeWorkspace}
            disabled={!canDeleteWorkspace}
            className="p-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
          >
            <Minus size={22} />
          </button>
          
          <button 
            onClick={handleWorkspaceClick}
            onTouchStart={startWorkspacePress}
            onTouchEnd={cancelWorkspacePress}
            onTouchMove={cancelWorkspacePress}
            onMouseDown={startWorkspacePress}
            onMouseUp={cancelWorkspacePress}
            onMouseLeave={cancelWorkspacePress}
            onContextMenu={(e) => { e.preventDefault(); }}
            className="bg-gray-800 text-white text-lg font-semibold rounded-lg px-4 py-2 outline-none cursor-pointer border border-gray-700 hover:border-gray-600 transition-colors active:bg-gray-700 min-w-[4rem] text-center select-none"
          >
            {activeWorkspace.name}
          </button>

          <button 
            onClick={addWorkspace}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <Plus size={22} />
          </button>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-4">
          <button onClick={resumeAll} className="p-2 text-emerald-400 hover:bg-emerald-400/10 active:bg-emerald-400/20 active:scale-90 rounded-lg transition-all duration-75">
            <Play size={22}/>
          </button>
          <button onClick={pauseAll} className="p-2 text-amber-400 hover:bg-amber-400/10 active:bg-amber-400/20 active:scale-90 rounded-lg transition-all duration-75">
            <Pause size={22}/>
          </button>
          <button onClick={resetAll} className="p-2 text-red-400 hover:bg-red-400/10 active:bg-red-400/20 active:scale-90 rounded-lg transition-all duration-75">
            <RotateCcw size={22}/>
          </button>
        </div>
      </header>

      {/* Timers List */}
      <main className="flex-1 overflow-y-auto pb-24 flex flex-col">
        <Reorder.Group axis="y" values={activeWorkspace.timers} onReorder={updateWorkspaceTimers} className="flex flex-col">
          {activeWorkspace.timers.map((timer, index) => (
            <TimerStrip
              key={timer.id}
              timer={timer}
              previousStartTime={index > 0 ? activeWorkspace.timers[index - 1].startTime : null}
              updateTimer={updateTimer}
              toggleTimer={toggleTimer}
              removeTimer={removeTimer}
              selectedTimerId={selectedTimerId}
              setSelectedTimerId={setSelectedTimerId}
              textFont={TEXT_FONTS[textFontIndex]}
              numberFont={NUMBER_FONTS[numberFontIndex]}
              isTextBold={isTextBold}
              isNumberBold={isNumberBold}
              timerHeight={uiSettings.timerHeight}
              uiSettings={uiSettings}
            />
          ))}
          
          {/* Add Timer Strip */}
          <div 
            className="w-full bg-gray-800/20 border-b border-gray-700/30 flex items-center justify-between text-gray-600"
            style={{ height: uiSettings.timerHeight }}
          >
            <button
              onPointerDown={handlePointerDownText}
              onPointerUp={handlePointerUpText}
              onPointerLeave={cancelPointerText}
              onPointerCancel={cancelPointerText}
              onTouchEnd={(e) => e.preventDefault()}
              onContextMenu={(e) => e.preventDefault()}
              className="h-full px-6 flex items-center justify-center hover:text-white hover:bg-gray-800/40 active:bg-gray-700 active:scale-90 transition-all duration-75 cursor-pointer touch-none select-none"
            >
              <ChevronLeft size={28} />
            </button>
            <div
              onPointerDown={handleAddPointerDown}
              onPointerMove={handleAddPointerMove}
              onPointerUp={handleAddPointerUp}
              onPointerCancel={handleAddPointerUp}
              onTouchEnd={(e) => e.preventDefault()}
              onContextMenu={(e) => e.preventDefault()}
              className="flex-1 h-full flex items-center justify-center cursor-pointer hover:bg-gray-800/40 active:bg-gray-700 active:scale-[0.98] transition-all duration-75 touch-none select-none"
            >
              <Plus size={28} />
            </div>
            <button
              onPointerDown={handlePointerDownNumber}
              onPointerUp={handlePointerUpNumber}
              onPointerLeave={cancelPointerNumber}
              onPointerCancel={cancelPointerNumber}
              onTouchEnd={(e) => e.preventDefault()}
              onContextMenu={(e) => e.preventDefault()}
              className="h-full px-6 flex items-center justify-center hover:text-white hover:bg-gray-800/40 active:bg-gray-700 active:scale-90 transition-all duration-75 cursor-pointer touch-none select-none"
            >
              <ChevronRight size={28} />
            </button>
          </div>

          {isUiSettingsMode && (
            <div className="flex flex-col" onClick={(e) => e.stopPropagation()}>
              <UiSettingStrip
                label="Интервал"
                value={uiSettings.gapSize}
                min={-10}
                max={32}
                onChange={(val) => setUiSettings(s => ({ ...s, gapSize: val }))}
                height={uiSettings.timerHeight}
              />
              <UiSettingStrip
                label="Время старта"
                value={uiSettings.subTextSize}
                min={10}
                max={64}
                onChange={(val) => setUiSettings(s => ({ ...s, subTextSize: val }))}
                height={uiSettings.timerHeight}
              />
              <UiSettingStrip
                label="Описание"
                value={uiSettings.descSize}
                min={10}
                max={64}
                onChange={(val) => setUiSettings(s => ({ ...s, descSize: val }))}
                height={uiSettings.timerHeight}
              />
              <UiSettingStrip
                label="Прошедшее время"
                value={uiSettings.timeSize}
                min={10}
                max={128}
                onChange={(val) => setUiSettings(s => ({ ...s, timeSize: val }))}
                height={uiSettings.timerHeight}
              />
              <div 
                className="w-full bg-gray-800/20 border-b border-gray-700/30 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800/40 active:bg-gray-700 active:scale-[0.98] transition-all duration-75 cursor-pointer touch-none select-none"
                style={{ height: uiSettings.timerHeight }}
                onClick={() => {
                  setUiSettings(defaultUiSettings);
                  setTextFontIndex(0);
                  setNumberFontIndex(0);
                  setIsTextBold(false);
                  setIsNumberBold(false);
                }}
              >
                <span className="font-medium tracking-wide">СБРОСИТЬ НАСТРОЙКИ</span>
              </div>
            </div>
          )}
        </Reorder.Group>

        <div 
          className="flex-1 min-h-[100px] touch-none"
          onPointerDown={handleEmptyAreaPointerDown}
          onPointerUp={handleEmptyAreaPointerUp}
          onPointerCancel={handleEmptyAreaPointerCancel}
          onPointerLeave={handleEmptyAreaPointerCancel}
          onContextMenu={(e) => e.preventDefault()}
        />
      </main>
    </div>
  );
}
