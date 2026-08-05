import React, { useState, useEffect, useRef } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Layers, 
  DollarSign, 
  ArrowUpRight, 
  Zap, 
  ShieldCheck,
  Award,
  CandlestickChart,
  LineChart as LineChartIcon,
  Activity,
  Maximize2,
  Clock,
  BarChart2
} from "lucide-react";

export interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isBull: boolean;
}

// Initial Realistic Historical Candlestick Data with long monthly trading candles & strong upward dollar growth
const initialCandles: CandleData[] = [
  { time: "JAN", open: 18500000, high: 22800000, low: 17900000, close: 22100000, volume: 12850000, isBull: true },
  { time: "FEB", open: 22100000, high: 25400000, low: 21500000, close: 24800000, volume: 14420000, isBull: true },
  { time: "MAR", open: 24800000, high: 26100000, low: 22800000, close: 23500000, volume: 11980000, isBull: false },
  { time: "APR", open: 23500000, high: 28900000, low: 23100000, close: 28200000, volume: 16850000, isBull: true },
  { time: "MAY", open: 28200000, high: 32500000, low: 27800000, close: 31900000, volume: 18100000, isBull: true },
  { time: "JUN", open: 31900000, high: 33400000, low: 29500000, close: 30200000, volume: 13150000, isBull: false },
  { time: "JUL", open: 30200000, high: 36800000, low: 29800000, close: 36100000, volume: 19800000, isBull: true },
  { time: "AUG", open: 36100000, high: 40500000, low: 35500000, close: 39800000, volume: 22300000, isBull: true },
  { time: "SEP", open: 39800000, high: 41200000, low: 37900000, close: 38400000, volume: 15300000, isBull: false },
  { time: "OCT", open: 38400000, high: 45200000, low: 37800000, close: 44600000, volume: 25100000, isBull: true },
  { time: "NOV", open: 44600000, high: 49500000, low: 43900000, close: 48900000, volume: 27800000, isBull: true },
  { time: "DEC", open: 48900000, high: 54100000, low: 48200000, close: 53500000, volume: 31200000, isBull: true },
  { time: "JAN '26", open: 53500000, high: 58800000, low: 52900000, close: 58100000, volume: 34500000, isBull: true },
  { time: "FEB '26", open: 58100000, high: 63500000, low: 57500000, close: 62900000, volume: 38200000, isBull: true },
  // Active dynamic live candle extending upwards
  { time: "LIVE", open: 62900000, high: 68500000, low: 62200000, close: 67800000, volume: 42100000, isBull: true },
];

export const YieldProjectionChart: React.FC = () => {
  const [candles, setCandles] = useState<CandleData[]>(initialCandles);
  const [chartMode, setChartMode] = useState<"candle" | "line" | "volume">("candle");
  const [timeframe, setTimeframe] = useState<"1M" | "3M" | "6M" | "1Y" | "ALL">("1Y");
  const [isTickActive, setIsTickActive] = useState<boolean>(true);
  const [hoveredCandle, setHoveredCandle] = useState<CandleData | null>(null);
  const tickCountRef = useRef<number>(0);

  const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const currentMonthIdxRef = useRef<number>(2); // March

  // Dynamic live upward dollar accumulation engine
  useEffect(() => {
    if (!isTickActive) return;

    // Fast live trading ticks: updates every 900ms
    const timer = setInterval(() => {
      setCandles((prevCandles) => {
        const updated = [...prevCandles];
        const lastIdx = updated.length - 1;
        const last = { ...updated[lastIdx] };

        // Strong upward dollar surge nudge: -25,000 to +115,000 (bullish live accumulation)
        const delta = (Math.random() - 0.2) * 140000;
        let newClose = Math.max(last.open - 180000, last.close + delta);
        let newHigh = Math.max(last.high, newClose + Math.random() * 80000);
        let newLow = Math.min(last.low, newClose - Math.random() * 25000);
        let isBull = newClose >= last.open;

        last.close = Math.round(newClose);
        last.high = Math.round(newHigh);
        last.low = Math.round(newLow);
        last.isBull = isBull;
        last.volume += Math.floor(Math.random() * 85000 + 20000);

        updated[lastIdx] = last;

        // Spawn a new candle after 10 ticks carrying upward momentum
        tickCountRef.current += 1;
        if (tickCountRef.current >= 10) {
          tickCountRef.current = 0;
          const monthLabel = monthNames[currentMonthIdxRef.current % 12];
          currentMonthIdxRef.current += 1;

          // Finalize previous candle
          updated[lastIdx].time = monthLabel;

          // Create fresh new live candle starting at previous close with upward room
          const newOpen = last.close;
          const nextCandle: CandleData = {
            time: "LIVE",
            open: newOpen,
            high: newOpen + Math.floor(Math.random() * 250000 + 100000),
            low: newOpen - Math.floor(Math.random() * 80000),
            close: newOpen + Math.floor(Math.random() * 180000 + 50000),
            volume: 850000,
            isBull: true,
          };

          // Keep max 15 candles visible for ideal high-resolution long candle presentation
          if (updated.length >= 15) {
            updated.shift();
          }
          updated.push(nextCandle);
        }

        return updated;
      });
    }, 900);

    return () => clearInterval(timer);
  }, [isTickActive]);

  // Active candle for top ticker display
  const activeCandle = hoveredCandle || candles[candles.length - 1];
  const priceChange = activeCandle.close - activeCandle.open;
  const priceChangePct = (priceChange / activeCandle.open) * 100;

  // Format Large Currency
  const formatCurrency = (val: number) => {
    return `$${(val / 1_000_000).toFixed(2)}M`;
  };

  const formatExactCurrency = (val: number) => {
    return `$${val.toLocaleString()}`;
  };

  // Min / Max Price calculations for SVG layout rendering
  const minPrice = Math.min(...candles.map((c) => c.low)) * 0.998;
  const maxPrice = Math.max(...candles.map((c) => c.high)) * 1.002;
  const priceRange = maxPrice - minPrice || 1;

  // Max volume for volume bars
  const maxVolume = Math.max(...candles.map((c) => c.volume)) || 1;

  return (
    <div className="w-full bg-gradient-to-br from-[#0B0F17] via-[#0E1628] to-[#07090E] border border-cyan-500/20 rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl relative overflow-hidden text-white font-sans">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* 1. TOP HEADER & NAVIGATION CONTROLS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-800/80 relative z-10">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-2xl border border-cyan-500/40 text-cyan-400 shrink-0 shadow-lg shadow-cyan-500/10">
            <CandlestickChart className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-lg md:text-xl font-black text-white tracking-wider uppercase font-mono">
                Total Earnings Candlestick Market
              </h3>
              <button
                onClick={() => setIsTickActive(!isTickActive)}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  isTickActive
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isTickActive ? "bg-emerald-400 animate-ping" : "bg-amber-400"}`}></span>
                {isTickActive ? "LIVE TICKING (SLOW)" : "PAUSED"}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Institutional micro-tick candlestick telemetry for global yield compounding & daily returns.
            </p>
          </div>
        </div>

        {/* CONTROLS: VIEW MODES & TIMEFRAME */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Chart View Switcher */}
          <div className="flex items-center bg-slate-950/90 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setChartMode("candle")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                chartMode === "candle"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <CandlestickChart className="w-3.5 h-3.5" />
              <span>Candles</span>
            </button>
            <button
              onClick={() => setChartMode("line")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                chartMode === "line"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <LineChartIcon className="w-3.5 h-3.5" />
              <span>Trend Line</span>
            </button>
            <button
              onClick={() => setChartMode("volume")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                chartMode === "volume"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Volume</span>
            </button>
          </div>

          {/* Timeframe selector */}
          <div className="flex items-center bg-slate-950/90 p-1 rounded-2xl border border-slate-800">
            {(["1M", "3M", "6M", "1Y", "ALL"] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  timeframe === tf
                    ? "bg-slate-800 text-cyan-400 border border-cyan-500/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>



      {/* 3. PROFESSIONAL SVG CANDLESTICK GRAPH CONTAINER */}
      <div className="relative w-full h-[420px] sm:h-[500px] md:h-[560px] bg-gradient-to-b from-[#080D1A]/95 via-[#050812]/98 to-[#020409] rounded-3xl border border-cyan-500/30 p-4 sm:p-6 overflow-hidden z-10 group shadow-[0_0_50px_-10px_rgba(6,182,212,0.2)]">
        
        {/* Background Grid Mesh */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:2rem_2rem] pointer-events-none" />

        {/* Y-AXIS PRICE LABELS */}
        <div className="absolute right-4 top-6 bottom-10 flex flex-col justify-between font-mono text-[11px] font-bold text-slate-400 pointer-events-none z-20">
          <span className="bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800 text-cyan-300">{formatCurrency(maxPrice)}</span>
          <span className="text-slate-500">{formatCurrency((maxPrice * 0.75 + minPrice * 0.25))}</span>
          <span className="text-slate-500">{formatCurrency((maxPrice * 0.5 + minPrice * 0.5))}</span>
          <span className="text-slate-500">{formatCurrency((maxPrice * 0.25 + minPrice * 0.75))}</span>
          <span className="bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800 text-slate-400">{formatCurrency(minPrice)}</span>
        </div>

        {/* SVG CANDLESTICK GRAPH RENDERER */}
        <svg className="w-full h-full pr-16 pb-8 overflow-visible" viewBox="0 0 800 420" preserveAspectRatio="none">
          {/* Subtle Grid Lines */}
          <line x1="0" y1="80" x2="800" y2="80" stroke="#1E293B" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
          <line x1="0" y1="160" x2="800" y2="160" stroke="#1E293B" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
          <line x1="0" y1="240" x2="800" y2="240" stroke="#1E293B" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
          <line x1="0" y1="320" x2="800" y2="320" stroke="#1E293B" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />

          {/* CANDLESTICKS OR ALTERNATIVE VIEWS */}
          {chartMode === "candle" && (
            candles.map((candle, idx) => {
              const totalWidth = 710;
              const candleWidth = totalWidth / candles.length;
              const x = idx * candleWidth + candleWidth / 2 + 10;

              // Taller Y scale mapping helper (top=30px, bottom=370px -> 340px total vertical height for candles)
              const getY = (val: number) => {
                const ratio = (val - minPrice) / priceRange;
                return 370 - ratio * 340;
              };

              const openY = getY(candle.open);
              const closeY = getY(candle.close);
              const highY = getY(candle.high);
              const lowY = getY(candle.low);

              const bodyTop = Math.min(openY, closeY);
              const bodyBottom = Math.max(openY, closeY);
              const bodyHeight = Math.max(16, bodyBottom - bodyTop);
              const isBull = candle.isBull;

              const isLive = idx === candles.length - 1;

              return (
                <g
                  key={`candle-${idx}`}
                  className="cursor-pointer transition-all duration-300 hover:opacity-100 opacity-95"
                  onMouseEnter={() => setHoveredCandle(candle)}
                  onMouseLeave={() => setHoveredCandle(null)}
                >
                  {/* Wick (High to Low line with glow) */}
                  <line
                    x1={x}
                    y1={highY}
                    x2={x}
                    y2={lowY}
                    stroke={isBull ? "#10B981" : "#F43F5E"}
                    strokeWidth={isLive ? 2.5 : 2}
                    filter={isBull ? "url(#glowBull)" : "url(#glowBear)"}
                  />

                  {/* Candle Body - Taller & Larger */}
                  <rect
                    x={x - Math.min(14, candleWidth * 0.38)}
                    y={bodyTop}
                    width={Math.min(28, candleWidth * 0.76)}
                    height={bodyHeight}
                    rx={3}
                    fill={isBull ? "url(#bullGrad)" : "url(#bearGrad)"}
                    stroke={isBull ? "#34D399" : "#FB7185"}
                    strokeWidth={isLive ? 2 : 1.2}
                    filter={isBull ? "url(#glowBull)" : "url(#glowBear)"}
                    className={isLive ? "animate-pulse" : ""}
                  />

                  {/* Live candle pulse aura */}
                  {isLive && (
                    <circle
                      cx={x}
                      cy={closeY}
                      r={7}
                      fill={isBull ? "#10B981" : "#F43F5E"}
                      className="animate-ping opacity-80"
                    />
                  )}

                  {/* Time label below candle */}
                  <text
                    x={x}
                    y={395}
                    textAnchor="middle"
                    fill={isLive ? "#00D2FF" : "#94A3B8"}
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight={isLive ? "bold" : "600"}
                  >
                    {candle.time}
                  </text>
                </g>
              );
            })
          )}

          {/* TREND LINE MODE */}
          {chartMode === "line" && (
            <g>
              <path
                d={candles.map((c, idx) => {
                  const candleWidth = 710 / candles.length;
                  const x = idx * candleWidth + candleWidth / 2 + 10;
                  const ratio = (c.close - minPrice) / priceRange;
                  const y = 370 - ratio * 340;
                  return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
                }).join(" ")}
                fill="none"
                stroke="#00D2FF"
                strokeWidth="4"
                strokeLinecap="round"
                filter="url(#glowLine)"
              />
              {candles.map((c, idx) => {
                const candleWidth = 710 / candles.length;
                const x = idx * candleWidth + candleWidth / 2 + 10;
                const ratio = (c.close - minPrice) / priceRange;
                const y = 370 - ratio * 340;
                return (
                  <circle
                    key={`point-${idx}`}
                    cx={x}
                    cy={y}
                    r={idx === candles.length - 1 ? 6 : 4}
                    fill={idx === candles.length - 1 ? "#00D2FF" : "#38BDF8"}
                    stroke="#0B0F17"
                    strokeWidth="2.5"
                  />
                );
              })}
            </g>
          )}

          {/* VOLUME MODE */}
          {chartMode === "volume" && (
            candles.map((candle, idx) => {
              const candleWidth = 710 / candles.length;
              const x = idx * candleWidth + candleWidth / 2 + 10;
              const volRatio = candle.volume / maxVolume;
              const barHeight = volRatio * 320;
              const y = 370 - barHeight;

              return (
                <rect
                  key={`vol-${idx}`}
                  x={x - Math.min(12, candleWidth * 0.35)}
                  y={y}
                  width={Math.min(24, candleWidth * 0.7)}
                  height={barHeight}
                  rx={4}
                  fill={candle.isBull ? "url(#bullGrad)" : "url(#bearGrad)"}
                  opacity={0.85}
                  filter={candle.isBull ? "url(#glowBull)" : "url(#glowBear)"}
                />
              );
            })
          )}

          {/* LIVE PRICE TRACKING LINE ACROSS CHART */}
          {(() => {
            const active = candles[candles.length - 1];
            const ratio = (active.close - minPrice) / priceRange;
            const liveY = 370 - ratio * 340;
            return (
              <g className="transition-all duration-500">
                <line
                  x1="0"
                  y1={liveY}
                  x2="780"
                  y2={liveY}
                  stroke={active.isBull ? "#10B981" : "#F43F5E"}
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <rect
                  x="715"
                  y={liveY - 12}
                  width="80"
                  height="24"
                  rx="6"
                  fill={active.isBull ? "#064E3B" : "#881337"}
                  stroke={active.isBull ? "#34D399" : "#FB7185"}
                  strokeWidth="1.5"
                  className="shadow-lg"
                />
                <text
                  x="755"
                  y={liveY + 3}
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="black"
                >
                  {formatCurrency(active.close)}
                </text>
              </g>
            );
          })()}

          {/* GRADIENTS & GLOW FILTERS DEFINITION */}
          <defs>
            <linearGradient id="bullGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="50%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
            <linearGradient id="bearGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FB7185" />
              <stop offset="50%" stopColor="#F43F5E" />
              <stop offset="100%" stopColor="#9F1239" />
            </linearGradient>

            <filter id="glowBull" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#10B981" floodOpacity="0.6" />
            </filter>
            <filter id="glowBear" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#F43F5E" floodOpacity="0.6" />
            </filter>
            <filter id="glowLine" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#00D2FF" floodOpacity="0.7" />
            </filter>
          </defs>
        </svg>

        {/* LIVE TICKING OVERLAY BADGE */}
        <div className="absolute top-4 left-4 bg-slate-950/90 border border-slate-800 rounded-2xl px-3.5 py-2 flex items-center gap-2.5 font-mono text-[11px] text-slate-300 shadow-xl backdrop-blur-md">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
          <span>EMA(20): <strong className="text-cyan-300 font-bold">$48.25M</strong></span>
          <span className="text-slate-700">|</span>
          <span>VOL: <strong className="text-emerald-400 font-bold">{(activeCandle.volume / 1000).toFixed(0)}k</strong></span>
          <span className="text-slate-700">|</span>
          <span>RSI(14): <strong className="text-purple-300 font-bold">68.4</strong></span>
        </div>
      </div>


    </div>
  );
};
