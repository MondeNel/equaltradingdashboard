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
  }, []);

  return <span>{val.toLocaleString()}</span>;
}

export default function LandingPage() {
  const nav = useNavigate();

  return (
    <div className="flex justify-center bg-black min-h-screen">

      {/* PHONE CONTAINER */}
      <div className="w-full max-w-sm min-h-screen bg-[#05050e] text-white font-mono flex flex-col relative">

        {/* ALERT BADGE */}
        <div className="absolute top-5 right-4">
          <div className="flex items-center gap-2 px-3 py-1 text-[10px] tracking-widest text-purple-400 border border-purple-500/40 rounded-full bg-purple-900/20">
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
            3 ALERTS
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex flex-col items-center flex-1 px-6 pt-28">

          {/* LOGO CIRCLE */}
          <div className="w-40 h-40 rounded-full border border-cyan-400 flex items-center justify-center text-2xl text-cyan-300 shadow-[0_0_35px_rgba(34,211,238,0.35)]">
            e<span className="text-white font-semibold">Q</span>ual
          </div>

          {/* TAGLINE */}
          <div className="text-center text-cyan-400 tracking-[0.35em] text-[11px] mt-10 leading-relaxed">
            COMPLEXITY IS THE ENEMY <br />
            OF EXECUTION
          </div>

          {/* STATS PANEL */}
          <div className="mt-10 w-full bg-[#0a0820] border border-purple-500/30 rounded-xl py-4 grid grid-cols-3 text-center">

            <div>
              <div className="text-green-400 text-lg font-semibold">
                <SimCounter base={1247} step={5} interval={800} />
              </div>
              <div className="text-[9px] text-purple-300/70 tracking-widest mt-1">
                ACTIVE TRADERS
              </div>
            </div>

            <div className="border-x border-purple-500/20">
              <div className="text-yellow-400 text-lg font-semibold">
                R2.4M
              </div>
              <div className="text-[9px] text-purple-300/70 tracking-widest mt-1">
                TODAY'S VOLUME
              </div>
            </div>

            <div>
              <div className="text-cyan-400 text-lg font-semibold">
                #1
              </div>
              <div className="text-[9px] text-purple-300/70 tracking-widest mt-1">
                SA PLATFORM
              </div>
            </div>

          </div>

          {/* AI ALERT */}
          <div
            onClick={() => nav("/trade")}
            className="mt-6 w-full bg-[#0a0820] border border-purple-500/40 rounded-xl p-4 cursor-pointer active:scale-[0.98] transition"
          >
            <div className="flex items-center gap-3">

              {/* AI ICON */}
              <div className="w-10 h-10 rounded-full bg-purple-700 flex items-center justify-center text-xs font-bold">
                AI
              </div>

              <div className="flex-1">

                <div className="text-[9px] tracking-widest text-purple-400">
                  PETER · JUST NOW
                </div>

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
