import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";

/**
 * Simulates live number updates
 * @param {number} base
 * @param {number} step
 * @param {number} interval
 */
function SimCounter({ base, step = 3, interval = 900 }) {
  const [val, setVal] = useState(base);

  useEffect(() => {
    const id = setInterval(() => {
      setVal((v) => v + Math.floor(Math.random() * step * 2) - Math.floor(step * 0.4));
    }, interval);

    return () => clearInterval(id);
  }, [step, interval]);

  return <span>{val.toLocaleString()}</span>;
}

/**
 * Typewriter effect for the slogan
 */
function Typewriter({ text, speed = 80 }) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);
  return <div className="text-cyan-400 text-[11px] tracking-[0.35em] mt-4 leading-relaxed">{displayed}</div>;
}

export default function LandingPage() {
  const nav = useNavigate();

  return (
    <div className="flex justify-center bg-black min-h-screen">
      {/* PHONE CONTAINER */}
      <div className="w-full max-w-sm min-h-screen bg-[#05050e] text-white font-sans flex flex-col relative">

        {/* ALERT BADGE */}
        <div className="absolute top-5 right-4">
          <div className="flex items-center gap-2 px-3 py-1 text-[10px] tracking-widest text-purple-400 border border-purple-500/40 rounded-full bg-purple-900/20">
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
            3 ALERTS
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex flex-col items-center flex-1 px-6 pt-28">

          {/* LOGO */}
        <div className="text-white text-3xl font-bold tracking-tight flex items-center justify-center">
          <span className="text-cyan-400">e</span>Qual
        </div>

        {/* SLOGAN */}
        <div className="w-4/5 mx-auto text-center">
          <Typewriter text="COMPLEXITY IS THE ENEMY OF EXECUTION" speed={60} />
        </div>

          {/* STATS PANEL */}
          <div className="mt-10 w-full bg-[#0a0820] border border-purple-500/30 rounded-xl py-4 grid grid-cols-3 text-center relative">
            
            {/* Active Traders */}
            <div className="flex flex-col items-center justify-center relative py-2">
              <div className="text-green-400 text-lg font-semibold">
                <SimCounter base={1247} step={5} interval={800} />
              </div>
              <div className="text-[9px] text-purple-300/70 tracking-widest mt-1">ACTIVE TRADERS</div>
              <div className="absolute top-1/2 right-0 h-6 border-r border-purple-500/20 transform -translate-y-1/2"></div>
            </div>

            {/* Today's Volume */}
            <div className="flex flex-col items-center justify-center relative py-2">
              <div className="text-yellow-400 text-lg font-semibold">
                R<SimCounter base={2400000} step={5000} interval={700} />
              </div>
              <div className="text-[9px] text-purple-300/70 tracking-widest mt-1">TODAY'S VOLUME</div>
              <div className="absolute top-1/2 right-0 h-6 border-r border-purple-500/20 transform -translate-y-1/2"></div>
            </div>

            {/* SA Platform */}
            <div className="flex flex-col items-center justify-center py-2">
              <div className="text-cyan-400 text-lg font-semibold">
                #<SimCounter base={1} step={0} interval={0} />
              </div>
              <div className="text-[9px] text-purple-300/70 tracking-widest mt-1">SA PLATFORM</div>
            </div>
          </div>

          {/* AI ALERT */}
          <div
            onClick={() => nav("/trade")}
            className="mt-6 w-full bg-[#0a0820] border border-purple-500/40 rounded-xl p-4 cursor-pointer active:scale-[0.98] transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-700 flex items-center justify-center text-xs font-bold">
                AI
              </div>
              <div className="flex-1">
                <div className="text-[9px] tracking-widest text-purple-400">PETER · JUST NOW</div>
                <div className="text-xs text-purple-200 mt-1 leading-relaxed">
                  USD/ZAR breakout forming — 89 pip opportunity detected
                </div>
              </div>
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
            </div>
          </div>

        </div>

        {/* BOTTOM NAV */}
        <BottomNav />
      </div>
    </div>
  );
}