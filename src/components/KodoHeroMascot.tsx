import React, { useState, useEffect } from 'react';

export const KodoHeroMascot: React.FC = () => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [jumpPhase, setJumpPhase] = useState(0);

  // Periodic blinking cycle (every 3.2s)
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 180);
    }, 3200);

    return () => clearInterval(blinkInterval);
  }, []);

  // Jump animation ticker for Kodo bird above the static logo
  useEffect(() => {
    let animId: number;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      const phase = (elapsed % 1.8) / 1.8;
      setJumpPhase(phase);
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Calculate jump arc for Kodo mascot
  let jumpY = 0;
  let wingFlap = 0;
  let squashX = 1;
  let squashY = 1;

  if (jumpPhase >= 0.1 && jumpPhase <= 0.75) {
    const jumpProgress = (jumpPhase - 0.1) / 0.65;
    jumpY = -Math.sin(jumpProgress * Math.PI) * 46;
    wingFlap = Math.sin(jumpProgress * Math.PI * 6) * 22;
    if (jumpProgress < 0.2) {
      squashX = 0.9;
      squashY = 1.12;
    } else if (jumpProgress > 0.8) {
      squashX = 1.12;
      squashY = 0.9;
    }
  } else if (jumpPhase > 0.75 && jumpPhase < 0.9) {
    const landProgress = (jumpPhase - 0.75) / 0.15;
    squashX = 1 + Math.sin(landProgress * Math.PI) * 0.12;
    squashY = 1 - Math.sin(landProgress * Math.PI) * 0.12;
  } else {
    const idleTime = jumpPhase * Math.PI * 4;
    squashY = 1 + Math.sin(idleTime) * 0.025;
    squashX = 1 - Math.sin(idleTime) * 0.025;
  }

  return (
    <div className="relative flex flex-col items-center justify-center select-none w-80 pointer-events-none">
      {/* 1. Jumping Kodo the Blue Bird Mascot */}
      <div
        className="relative z-10 -mb-5"
        style={{
          transform: `translateY(${jumpY}px) scale(${squashX}, ${squashY})`,
          transformOrigin: 'bottom center',
        }}
      >
        <svg
          viewBox="0 0 160 150"
          className="w-32 h-32 filter drop-shadow-[0_8px_14px_rgba(15,23,42,0.5)]"
        >
          <defs>
            <radialGradient id="kodoBodyGrad" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#7dd3fc" />
              <stop offset="60%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </radialGradient>

            <linearGradient id="kodoBellyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e0f2fe" />
            </linearGradient>

            <linearGradient id="kodoBeakGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>

            <radialGradient id="kodoBlushGrad">
              <stop offset="0%" stopColor="#f472b6" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#f472b6" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Triple Feather Crest on Head */}
          <g style={{ transformOrigin: '80px 25px' }}>
            <path
              d="M 80 25 C 75 8, 65 2, 70 0 C 78 0, 84 15, 80 25 Z"
              fill="#38bdf8"
            />
            <path
              d="M 76 25 C 68 12, 55 6, 60 4 C 68 4, 76 18, 76 25 Z"
              fill="#0284c7"
            />
            <path
              d="M 84 25 C 92 12, 105 6, 100 4 C 92 4, 84 18, 84 25 Z"
              fill="#0ea5e9"
            />
          </g>

          {/* Left Wing */}
          <path
            d="M 38 82 C 16 75, 12 95, 26 104 C 36 108, 42 98, 38 82 Z"
            fill="#0369a1"
            style={{
              transform: `rotate(${-wingFlap}deg)`,
              transformOrigin: '38px 85px',
            }}
          />
          {/* Right Wing */}
          <path
            d="M 122 82 C 144 75, 148 95, 134 104 C 124 108, 118 98, 122 82 Z"
            fill="#0369a1"
            style={{
              transform: `rotate(${wingFlap}deg)`,
              transformOrigin: '122px 85px',
            }}
          />

          {/* Main Round Body */}
          <ellipse cx="80" cy="85" rx="46" ry="44" fill="url(#kodoBodyGrad)" />

          {/* Fluffy White Belly */}
          <ellipse cx="80" cy="97" rx="30" ry="24" fill="url(#kodoBellyGrad)" opacity="0.95" />

          {/* Little Orange Feet */}
          <ellipse cx="66" cy="128" rx="9" ry="5" fill="#f59e0b" />
          <ellipse cx="94" cy="128" rx="9" ry="5" fill="#f59e0b" />

          {/* Cheerful Blush Cheeks */}
          <circle cx="54" cy="92" r="10" fill="url(#kodoBlushGrad)" />
          <circle cx="106" cy="92" r="10" fill="url(#kodoBlushGrad)" />

          {/* Left Eye */}
          <g>
            <ellipse cx="62" cy="74" rx="14" ry="16" fill="#ffffff" />
            {!isBlinking ? (
              <>
                <ellipse cx="65" cy="74" rx="9" ry="11" fill="#0f172a" />
                <circle cx="68" cy="70" r="3.5" fill="#ffffff" />
                <circle cx="63" cy="78" r="1.8" fill="#ffffff" />
              </>
            ) : (
              <path
                d="M 52 75 Q 62 82 72 75"
                stroke="#0f172a"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
              />
            )}
          </g>

          {/* Right Eye */}
          <g>
            <ellipse cx="98" cy="74" rx="14" ry="16" fill="#ffffff" />
            {!isBlinking ? (
              <>
                <ellipse cx="95" cy="74" rx="9" ry="11" fill="#0f172a" />
                <circle cx="98" cy="70" r="3.5" fill="#ffffff" />
                <circle cx="93" cy="78" r="1.8" fill="#ffffff" />
              </>
            ) : (
              <path
                d="M 88 75 Q 98 82 108 75"
                stroke="#0f172a"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
              />
            )}
          </g>

          {/* Orange Beak */}
          <polygon
            points="70,82 90,82 80,96"
            fill="url(#kodoBeakGrad)"
            stroke="#b45309"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M 74 83 Q 80 87 86 83" stroke="#fef08a" strokeWidth="1.2" fill="none" />
        </svg>
      </div>

      {/* 2. Static, Organic 3D "KODO" Logo with Overhanging Snow Caps on Letter Tops */}
      <div className="relative z-20 flex items-center justify-center w-full">
        <svg
          viewBox="0 0 360 126"
          className="w-76 sm:w-80 filter drop-shadow-[0_12px_18px_rgba(2,6,23,0.75)]"
        >
          <defs>
            {/* Dark Slate 3D Base / Extrusion Block */}
            <linearGradient id="logoBase3D" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="50%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            {/* Warm Cream / Ivory 3D Letter Face (matches reference KODO logo!) */}
            <linearGradient id="logoCreamFace" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="55%" stopColor="#fef3c7" />
              <stop offset="100%" stopColor="#fde68a" />
            </linearGradient>

            {/* Pure Winter Snow Overhang Top */}
            <linearGradient id="snowCapTop" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#f0f9ff" />
              <stop offset="100%" stopColor="#bae6fd" />
            </linearGradient>

            {/* Soft Blue Snow Under-Shadow for Overhanging Drips */}
            <linearGradient id="snowCapShade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#bae6fd" />
              <stop offset="100%" stopColor="#7dd3fc" />
            </linearGradient>
          </defs>

          {/* Outer Unified 3D Stone Plaque Backing behind K-O-D-O */}
          <path
            d="M 18 32
               Q 18 16, 38 16
               L 322 16
               Q 342 16, 342 36
               L 342 94
               Q 342 114, 320 114
               L 40 114
               Q 18 114, 18 94 Z"
            fill="url(#logoBase3D)"
            stroke="#0f172a"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          {/* Bottom 3D Bevel Rim of Plaque */}
          <path
            d="M 24 96 Q 180 106, 336 96 L 332 108 Q 180 117, 28 108 Z"
            fill="#090d16"
            opacity="0.7"
          />

          {/* ==================== LETTER 'K' (x: 28..96) ==================== */}
          <g>
            {/* 3D Extrusion Shadow of K */}
            <path
              d="M 32 34 L 54 34 L 54 60 L 74 34 L 98 34 L 74 66 L 98 102 L 73 102 L 54 74 L 54 102 L 32 102 Z"
              fill="#1e293b"
              stroke="#0f172a"
              strokeWidth="6"
              strokeLinejoin="round"
            />
            {/* Cream Front Face of K */}
            <path
              d="M 32 26 L 54 26 L 54 52 L 74 26 L 98 26 L 74 58 L 98 94 L 73 94 L 54 66 L 54 94 L 32 94 Z"
              fill="url(#logoCreamFace)"
              stroke="#475569"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Overhanging Snow Cap on Top of 'K' (Left stem + Right arm) */}
            <path
              d="M 27 28
                 C 27 18, 42 15, 57 20
                 C 66 23, 73 16, 86 17
                 C 96 18, 103 23, 101 31
                 C 100 36, 94 37, 89 34
                 C 84 31, 80 36, 75 33
                 C 70 30, 65 28, 59 32
                 C 54 36, 48 31, 42 35
                 C 36 39, 27 35, 27 28 Z"
              fill="url(#snowCapShade)"
            />
            <path
              d="M 27 25
                 C 27 16, 42 13, 57 18
                 C 66 21, 73 14, 86 15
                 C 96 16, 103 21, 101 28
                 C 100 33, 94 34, 89 31
                 C 84 28, 80 33, 75 30
                 C 70 27, 65 25, 59 29
                 C 54 33, 48 28, 42 32
                 C 36 36, 27 32, 27 25 Z"
              fill="url(#snowCapTop)"
              stroke="#e0f2fe"
              strokeWidth="1"
            />
          </g>

          {/* ==================== LETTER 'O' #1 (x: 104..174) ==================== */}
          <g>
            {/* 3D Extrusion Shadow of O */}
            <path
              fillRule="evenodd"
              d="M 139 32
                 C 162 32, 174 46, 174 68
                 C 174 90, 162 104, 139 104
                 C 116 104, 104 90, 104 68
                 C 104 46, 116 32, 139 32 Z
                 M 139 54
                 C 129 54, 125 60, 125 68
                 C 125 76, 129 82, 139 82
                 C 149 82, 153 76, 153 68
                 C 153 60, 149 54, 139 54 Z"
              fill="#1e293b"
              stroke="#0f172a"
              strokeWidth="6"
              strokeLinejoin="round"
            />
            {/* Cream Front Face of O */}
            <path
              fillRule="evenodd"
              d="M 139 24
                 C 162 24, 174 38, 174 60
                 C 174 82, 162 96, 139 96
                 C 116 96, 104 82, 104 60
                 C 104 38, 116 24, 139 24 Z
                 M 139 46
                 C 129 46, 125 52, 125 60
                 C 125 68, 129 74, 139 74
                 C 149 74, 153 68, 153 60
                 C 153 52, 149 46, 139 46 Z"
              fill="url(#logoCreamFace)"
              stroke="#475569"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Overhanging Snow Cap on Top of 'O' #1 */}
            <path
              d="M 103 33
                 C 105 20, 120 14, 139 14
                 C 158 14, 173 20, 175 33
                 C 176 39, 169 42, 163 37
                 C 157 32, 152 38, 145 34
                 C 138 30, 132 37, 124 33
                 C 117 29, 112 39, 106 37
                 C 103 36, 102 35, 103 33 Z"
              fill="url(#snowCapShade)"
            />
            <path
              d="M 103 30
                 C 105 17, 120 11, 139 11
                 C 158 11, 173 17, 175 30
                 C 176 36, 169 39, 163 34
                 C 157 29, 152 35, 145 31
                 C 138 27, 132 34, 124 30
                 C 117 26, 112 36, 106 34
                 C 103 33, 102 32, 103 30 Z"
              fill="url(#snowCapTop)"
              stroke="#e0f2fe"
              strokeWidth="1"
            />
          </g>

          {/* ==================== LETTER 'D' (x: 184..252) ==================== */}
          <g>
            {/* 3D Extrusion Shadow of D */}
            <path
              fillRule="evenodd"
              d="M 184 34
                 L 218 34
                 C 240 34, 252 47, 252 68
                 C 252 89, 240 102, 218 102
                 L 184 102 Z
                 M 206 54
                 L 215 54
                 C 225 54, 230 59, 230 68
                 C 230 77, 225 82, 215 82
                 L 206 82 Z"
              fill="#1e293b"
              stroke="#0f172a"
              strokeWidth="6"
              strokeLinejoin="round"
            />
            {/* Cream Front Face of D */}
            <path
              fillRule="evenodd"
              d="M 184 26
                 L 218 26
                 C 240 26, 252 39, 252 60
                 C 252 81, 240 94, 218 94
                 L 184 94 Z
                 M 206 46
                 L 215 46
                 C 225 46, 230 51, 230 60
                 C 230 69, 225 74, 215 74
                 L 206 74 Z"
              fill="url(#logoCreamFace)"
              stroke="#475569"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Overhanging Snow Cap on Top of 'D' */}
            <path
              d="M 180 29
                 C 180 18, 196 14, 216 15
                 C 235 16, 250 23, 252 35
                 C 253 41, 246 42, 240 37
                 C 233 32, 227 38, 219 33
                 C 211 29, 205 36, 197 32
                 C 190 29, 182 36, 180 29 Z"
              fill="url(#snowCapShade)"
            />
            <path
              d="M 180 26
                 C 180 15, 196 11, 216 12
                 C 235 13, 250 20, 252 32
                 C 253 38, 246 39, 240 34
                 C 233 29, 227 35, 219 30
                 C 211 26, 205 33, 197 29
                 C 190 26, 182 33, 180 26 Z"
              fill="url(#snowCapTop)"
              stroke="#e0f2fe"
              strokeWidth="1"
            />
          </g>

          {/* ==================== LETTER 'O' #2 (x: 260..330) ==================== */}
          <g>
            {/* 3D Extrusion Shadow of O #2 */}
            <path
              fillRule="evenodd"
              d="M 295 32
                 C 318 32, 330 46, 330 68
                 C 330 90, 318 104, 295 104
                 C 272 104, 260 90, 260 68
                 C 260 46, 272 32, 295 32 Z
                 M 295 54
                 C 285 54, 281 60, 281 68
                 C 281 76, 285 82, 295 82
                 C 305 82, 309 76, 309 68
                 C 309 60, 305 54, 295 54 Z"
              fill="#1e293b"
              stroke="#0f172a"
              strokeWidth="6"
              strokeLinejoin="round"
            />
            {/* Cream Front Face of O #2 */}
            <path
              fillRule="evenodd"
              d="M 295 24
                 C 318 24, 330 38, 330 60
                 C 330 82, 318 96, 295 96
                 C 272 96, 260 82, 260 60
                 C 260 38, 272 24, 295 24 Z
                 M 295 46
                 C 285 46, 281 52, 281 60
                 C 281 68, 285 74, 295 74
                 C 305 74, 309 68, 309 60
                 C 309 52, 305 46, 295 46 Z"
              fill="url(#logoCreamFace)"
              stroke="#475569"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Overhanging Snow Cap on Top of 'O' #2 */}
            <path
              d="M 259 33
                 C 261 20, 276 14, 295 14
                 C 314 14, 329 20, 331 33
                 C 332 39, 325 42, 319 37
                 C 313 32, 308 38, 301 34
                 C 294 30, 288 37, 280 33
                 C 273 29, 268 39, 262 37
                 C 259 36, 258 35, 259 33 Z"
              fill="url(#snowCapShade)"
            />
            <path
              d="M 259 30
                 C 261 17, 276 11, 295 11
                 C 314 11, 329 17, 331 30
                 C 332 36, 325 39, 319 34
                 C 313 29, 308 35, 301 31
                 C 294 27, 288 34, 280 30
                 C 273 26, 268 36, 262 34
                 C 259 33, 258 32, 259 30 Z"
              fill="url(#snowCapTop)"
              stroke="#e0f2fe"
              strokeWidth="1"
            />
          </g>
        </svg>
      </div>
    </div>
  );
};
