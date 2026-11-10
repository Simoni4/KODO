import { Point } from './types';
import { GameSprites } from './spriteLoader';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export class IsometricRenderer {
  public tileW = 68;
  public tileH = 34;
  public blockDepth = 20;
  public elevationStep = 20;
  public particles: Particle[] = [];
  public snowflakes: { x: number; y: number; speed: number; size: number; drift: number }[] = [];

  constructor() {
    for (let i = 0; i < 50; i++) {
      this.snowflakes.push({
        x: Math.random() * 800,
        y: Math.random() * 950,
        speed: 0.6 + Math.random() * 1.0,
        size: 1.5 + Math.random() * 2.8,
        drift: -0.4 + Math.random() * 0.8,
      });
    }
  }

  // Configure tile dimensions and return centered origin (originX, originY) for any grid size
  public configureGridMetrics(
    canvasWidth: number,
    canvasHeight: number,
    cols: number,
    rows: number
  ): { originX: number; originY: number } {
    const maxDim = Math.max(cols, rows);
    let preferredTileW: number;
    if (maxDim <= 7) {
      preferredTileW = 70;
    } else if (maxDim <= 9) {
      preferredTileW = 60;
    } else if (maxDim <= 11) {
      preferredTileW = 54;
    } else {
      preferredTileW = 48;
    }

    // Fit the complete isometric footprint to the canvas instead of allowing
    // wide procedural maps (especially 18x18 Race) to clip at the left/right edges.
    const horizontalSteps = Math.max(1, cols + rows - 2);
    const verticalSteps = Math.max(1, cols + rows - 2);
    const widthFit = (canvasWidth - 48) * 2 / horizontalSteps;
    const heightFit = (canvasHeight - 150) * 2 / verticalSteps;
    this.tileW = Math.max(28, Math.min(preferredTileW, widthFit, heightFit));
    this.tileH = this.tileW * 0.5;
    this.blockDepth = this.tileW * 0.3125;
    this.elevationStep = this.tileW * 0.3125;

    const centerCol = (cols - 1) / 2;
    const centerRow = (rows - 1) / 2;
    const originX = canvasWidth / 2 - (centerCol - centerRow) * (this.tileW / 2);
    const projectedHeight = (centerCol + centerRow) * (this.tileH / 2);
    const originY = canvasHeight / 2 - projectedHeight + 10;

    return { originX, originY };
  }

  public gridToIso(
    x: number,
    y: number,
    originX: number,
    originY: number,
    elevation: number = 0
  ): Point {
    return {
      x: originX + (x - y) * (this.tileW / 2),
      y: originY + (x + y) * (this.tileH / 2) - elevation * this.elevationStep,
    };
  }

  public isoToGrid(screenX: number, screenY: number, originX: number, originY: number): Point {
    const halfW = this.tileW / 2;
    const halfH = this.tileH / 2;
    const dx = screenX - originX;
    const dy = screenY - (originY + halfH);

    const x = (dy / halfH + dx / halfW) / 2;
    const y = (dy / halfH - dx / halfW) / 2;

    return {
      x: Math.round(x),
      y: Math.round(y),
    };
  }

  // Convert an angle in radians to cardinal isometric direction
  public angleToDirection(angleRad: number): 'up' | 'down' | 'left' | 'right' {
    let a = angleRad;
    while (a < -Math.PI) a += Math.PI * 2;
    while (a >= Math.PI) a -= Math.PI * 2;

    if (a >= -Math.PI * 0.5 && a < 0) {
      return 'right';
    } else if (a >= 0 && a < Math.PI * 0.5) {
      return 'down';
    } else if (a >= Math.PI * 0.5 && a < Math.PI) {
      return 'left';
    } else {
      return 'up';
    }
  }

  public getDirectionFromScreenAngle(
    playerScreen: Point,
    targetScreen: Point
  ): 'up' | 'down' | 'left' | 'right' {
    const dx = targetScreen.x - playerScreen.x;
    const dy = targetScreen.y - playerScreen.y;
    const angle = Math.atan2(dy, dx);
    return this.angleToDirection(angle);
  }

  public addDustPuff(x: number, y: number, color = 'rgba(255, 255, 255, 0.85)') {
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 2.2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed * 0.4 - 0.4,
        life: 0.8,
        maxLife: 0.8,
        size: 2.5 + Math.random() * 3.0,
        color,
      });
    }
  }

  public addVictoryStars(x: number, y: number) {
    const colors = ['#facc15', '#fbbf24', '#f59e0b', '#38bdf8', '#ffffff'];
    for (let i = 0; i < 28; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.0 + Math.random() * 4.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.8,
        life: 1.2,
        maxLife: 1.2,
        size: 3.0 + Math.random() * 4.0,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  public updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * 60 * dt;
      p.y += p.vy * 60 * dt;
      p.vy += 2.2 * dt;
      p.life -= dt * 1.5;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (const sf of this.snowflakes) {
      sf.y += sf.speed * 60 * dt;
      sf.x += sf.drift * 60 * dt;
      if (sf.y > 950) {
        sf.y = -10;
        sf.x = Math.random() * 800;
      }
      if (sf.x < -10) sf.x = 810;
      if (sf.x > 810) sf.x = -10;
    }
  }

  public renderSnowflakes(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    for (const sf of this.snowflakes) {
      ctx.beginPath();
      ctx.arc(sf.x % width, sf.y % height, sf.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  public renderParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  }

  // Draw multi-layered 3D isometric snow block column supporting heights 0, 1, 2, 3
  // Note: isoX, isoY passed here is the base ground coordinate (elevation = 0),
  // and `tileType` (1, 2, 3, 4) determines stack height `elevation = Math.max(0, tileType - 1)`.
  public drawSeamlessBlock(
    ctx: CanvasRenderingContext2D,
    baseIsoX: number,
    baseIsoY: number,
    tileType: number = 1,
    isWarning: boolean = false
  ) {
    const hw = this.tileW / 2;
    const hh = this.tileH / 2;
    const d = this.blockDepth;
    const elevation = Math.max(0, tileType - 1);

    // Ground drop shadow at base level
    ctx.fillStyle = 'rgba(10, 15, 30, 0.38)';
    ctx.beginPath();
    ctx.ellipse(baseIsoX, baseIsoY + hh + d + 4, hw * 0.95, hh * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw stacked 3D block layers from ground (layer 0) up to top (layer = elevation)
    for (let layer = 0; layer <= elevation; layer++) {
      const isTopLayer = layer === elevation;
      const isoX = baseIsoX;
      const isoY = baseIsoY - layer * this.elevationStep;

      // Left Cliff Face
      ctx.beginPath();
      ctx.moveTo(isoX - hw, isoY + hh);
      ctx.lineTo(isoX, isoY + this.tileH);
      ctx.lineTo(isoX, isoY + this.tileH + d);
      ctx.lineTo(isoX - hw, isoY + hh + d);
      ctx.closePath();

      if (isWarning) {
        ctx.fillStyle = '#dc2626';
      } else if (layer === 0 && elevation === 0) {
        const leftGrad = ctx.createLinearGradient(isoX - hw, isoY, isoX, isoY + d);
        leftGrad.addColorStop(0, '#92400e');
        leftGrad.addColorStop(1, '#713f12');
        ctx.fillStyle = leftGrad;
      } else if (layer === 1) {
        const leftGrad = ctx.createLinearGradient(isoX - hw, isoY, isoX, isoY + d);
        leftGrad.addColorStop(0, '#475569');
        leftGrad.addColorStop(1, '#1e293b');
        ctx.fillStyle = leftGrad;
      } else if (layer >= 2) {
        const leftGrad = ctx.createLinearGradient(isoX - hw, isoY, isoX, isoY + d);
        leftGrad.addColorStop(0, '#0284c7');
        leftGrad.addColorStop(1, '#1e3a8a');
        ctx.fillStyle = leftGrad;
      } else {
        const leftGrad = ctx.createLinearGradient(isoX - hw, isoY, isoX, isoY + d);
        leftGrad.addColorStop(0, '#64748b');
        leftGrad.addColorStop(1, '#334155');
        ctx.fillStyle = leftGrad;
      }
      ctx.fill();
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.55)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Right Cliff Face
      ctx.beginPath();
      ctx.moveTo(isoX, isoY + this.tileH);
      ctx.lineTo(isoX + hw, isoY + hh);
      ctx.lineTo(isoX + hw, isoY + hh + d);
      ctx.lineTo(isoX, isoY + this.tileH + d);
      ctx.closePath();

      if (isWarning) {
        ctx.fillStyle = '#991b1b';
      } else if (layer === 0 && elevation === 0) {
        const rightGrad = ctx.createLinearGradient(isoX, isoY, isoX + hw, isoY + d);
        rightGrad.addColorStop(0, '#78350f');
        rightGrad.addColorStop(1, '#451a03');
        ctx.fillStyle = rightGrad;
      } else if (layer === 1) {
        const rightGrad = ctx.createLinearGradient(isoX, isoY, isoX + hw, isoY + d);
        rightGrad.addColorStop(0, '#334155');
        rightGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = rightGrad;
      } else if (layer >= 2) {
        const rightGrad = ctx.createLinearGradient(isoX, isoY, isoX + hw, isoY + d);
        rightGrad.addColorStop(0, '#0369a1');
        rightGrad.addColorStop(1, '#172554');
        ctx.fillStyle = rightGrad;
      } else {
        const rightGrad = ctx.createLinearGradient(isoX, isoY, isoX + hw, isoY + d);
        rightGrad.addColorStop(0, '#475569');
        rightGrad.addColorStop(1, '#1e293b');
        ctx.fillStyle = rightGrad;
      }
      ctx.fill();
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.65)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Only draw the Snow Cap on the top-most layer of the column
      if (isTopLayer) {
        ctx.beginPath();
        ctx.moveTo(isoX, isoY);
        ctx.lineTo(isoX + hw, isoY + hh);
        ctx.lineTo(isoX, isoY + this.tileH);
        ctx.lineTo(isoX - hw, isoY + hh);
        ctx.closePath();

        if (isWarning) {
          const warnGrad = ctx.createLinearGradient(isoX, isoY, isoX, isoY + this.tileH);
          warnGrad.addColorStop(0, '#f87171');
          warnGrad.addColorStop(1, '#ef4444');
          ctx.fillStyle = warnGrad;
        } else if (elevation === 0) {
          const snowGrad = ctx.createLinearGradient(isoX, isoY, isoX, isoY + this.tileH);
          snowGrad.addColorStop(0, '#ffffff');
          snowGrad.addColorStop(0.55, '#f0f9ff');
          snowGrad.addColorStop(1, '#bae6fd');
          ctx.fillStyle = snowGrad;
        } else if (elevation === 1) {
          // +1 Block Elevated Terrace: crisp icy-sky tint
          const snowGrad = ctx.createLinearGradient(isoX, isoY, isoX, isoY + this.tileH);
          snowGrad.addColorStop(0, '#ffffff');
          snowGrad.addColorStop(0.45, '#e0f2fe');
          snowGrad.addColorStop(1, '#7dd3fc');
          ctx.fillStyle = snowGrad;
        } else {
          // +2 / +3 High Alpine Peak: gleaming crystal-gold/cyan snow cap
          const snowGrad = ctx.createLinearGradient(isoX, isoY, isoX, isoY + this.tileH);
          snowGrad.addColorStop(0, '#fef9c3');
          snowGrad.addColorStop(0.4, '#e0f2fe');
          snowGrad.addColorStop(1, '#38bdf8');
          ctx.fillStyle = snowGrad;
        }
        ctx.fill();

        ctx.strokeStyle = isWarning
          ? '#b91c1c'
          : elevation === 0
          ? '#7dd3fc'
          : elevation === 1
          ? '#38bdf8'
          : '#facc15';
        ctx.lineWidth = elevation > 0 ? 1.6 : 1.2;
        ctx.stroke();

        // Specular snow shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.beginPath();
        ctx.ellipse(isoX, isoY + hh * 0.8, hw * 0.38, hh * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Draw 100% transparent vector wooden crate (no black box!)
  public drawWoodenCrate(ctx: CanvasRenderingContext2D, isoX: number, isoY: number) {
    const w = 48;
    const h = 48;
    const topY = isoY - h + 24;

    // Ground contact shadow
    ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
    ctx.beginPath();
    ctx.ellipse(isoX, isoY + 12, 22, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Crate box body
    const crateGrad = ctx.createLinearGradient(isoX - w / 2, topY, isoX + w / 2, topY + h);
    crateGrad.addColorStop(0, '#b45309');
    crateGrad.addColorStop(0.5, '#92400e');
    crateGrad.addColorStop(1, '#78350f');
    ctx.fillStyle = crateGrad;
    ctx.fillRect(isoX - w / 2, topY, w, h);

    // Darker outline
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(isoX - w / 2, topY, w, h);

    // Wood planks and diagonal cross braces
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    // Border inset
    ctx.rect(isoX - w / 2 + 4, topY + 4, w - 8, h - 8);
    // Cross brace
    ctx.moveTo(isoX - w / 2 + 5, topY + 5);
    ctx.lineTo(isoX + w / 2 - 5, topY + h - 5);
    ctx.moveTo(isoX + w / 2 - 5, topY + 5);
    ctx.lineTo(isoX - w / 2 + 5, topY + h - 5);
    ctx.stroke();

    // Golden/iron corner brackets
    ctx.fillStyle = '#f59e0b';
    const corners = [
      [isoX - w / 2, topY],
      [isoX + w / 2 - 8, topY],
      [isoX - w / 2, topY + h - 8],
      [isoX + w / 2 - 8, topY + h - 8],
    ];
    for (const [cx, cy] of corners) {
      ctx.fillRect(cx, cy, 8, 8);
    }
  }

  // Draw 100% transparent vector fortress gate arch (zero black backgrounds!)
  public drawGate(
    ctx: CanvasRenderingContext2D,
    isoX: number,
    isoY: number,
    color: 'green' | 'blue' | 'red' | 'yellow' | 'iron'
  ) {
    const colorMap: Record<string, { main: string; glow: string; dark: string }> = {
      green: { main: '#22c55e', glow: '#4ade80', dark: '#15803d' },
      blue: { main: '#38bdf8', glow: '#7dd3fc', dark: '#0369a1' },
      red: { main: '#ef4444', glow: '#f87171', dark: '#b91c1c' },
      yellow: { main: '#facc15', glow: '#fde047', dark: '#a16207' },
      iron: { main: '#94a3b8', glow: '#cbd5e1', dark: '#475569' },
    };
    const palette = colorMap[color] || colorMap.iron;
    const baseY = isoY + this.tileH / 2 + 4;

    ctx.save();
    // Contact shadow
    ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
    ctx.beginPath();
    ctx.ellipse(isoX, baseY, 24, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stone Archway Pillars
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(isoX - 22, baseY - 52, 10, 52, 3);
    ctx.roundRect(isoX + 12, baseY - 52, 10, 52, 3);
    ctx.fill();
    ctx.stroke();

    // Top Stone Arch Beam
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.roundRect(isoX - 25, baseY - 58, 50, 12, 5);
    ctx.fill();
    ctx.stroke();

    // Snow Cap on Arch
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(isoX - 23, baseY - 60, 46, 5, 3);
    ctx.fill();

    // Glowing Color Energy Bars / Portcullis
    ctx.strokeStyle = palette.main;
    ctx.lineWidth = 3.5;
    ctx.shadowColor = palette.glow;
    ctx.shadowBlur = 8;
    for (const bx of [-8, 0, 8]) {
      ctx.beginPath();
      ctx.moveTo(isoX + bx, baseY - 46);
      ctx.lineTo(isoX + bx, baseY - 2);
      ctx.stroke();
    }

    // Center Keystone Gem
    ctx.fillStyle = palette.glow;
    ctx.beginPath();
    ctx.arc(isoX, baseY - 52, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Draw 100% transparent vector enemies (Red Imp, Purple Ghost, Spiked Mine, Tasty Bug)
  public drawEnemy(
    ctx: CanvasRenderingContext2D,
    isoX: number,
    isoY: number,
    type: 'chaser' | 'patrol' | 'mine' | 'bug',
    animTime: number
  ) {
    const baseY = isoY + this.tileH / 2;
    const bobY = Math.sin(animTime * 4.5 + isoX * 0.05) * 3;

    ctx.save();
    // Ground Shadow
    ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
    ctx.beginPath();
    ctx.ellipse(isoX, baseY + 2, type === 'bug' ? 11 : 16, type === 'bug' ? 5 : 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(isoX, baseY + bobY);

    if (type === 'chaser') {
      // Red Angry Imp with horns and furrowed brows
      // Horns
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.moveTo(-12, -28);
      ctx.quadraticCurveTo(-18, -38, -8, -36);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(12, -28);
      ctx.quadraticCurveTo(18, -38, 8, -36);
      ctx.closePath();
      ctx.fill();

      // Body
      const impGrad = ctx.createRadialGradient(-4, -22, 3, 0, -16, 20);
      impGrad.addColorStop(0, '#f87171');
      impGrad.addColorStop(0.6, '#dc2626');
      impGrad.addColorStop(1, '#7f1d1d');
      ctx.fillStyle = impGrad;
      ctx.beginPath();
      ctx.arc(0, -16, 18, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(-6, -18, 4.5, 0, Math.PI * 2);
      ctx.arc(6, -18, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-5.5, -18, 2.2, 0, Math.PI * 2);
      ctx.arc(5.5, -18, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Angry Eyebrows
      ctx.strokeStyle = '#450a0a';
      ctx.lineWidth = 2.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-11, -24);
      ctx.lineTo(-2, -20);
      ctx.moveTo(11, -24);
      ctx.lineTo(2, -20);
      ctx.stroke();

      // Scowl mouth
      ctx.beginPath();
      ctx.arc(0, -9, 5, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    } else if (type === 'patrol') {
      // Purple Hooded Phantom with glowing golden eyes
      const ghostGrad = ctx.createLinearGradient(0, -36, 0, 2);
      ghostGrad.addColorStop(0, '#c084fc');
      ghostGrad.addColorStop(0.6, '#7e22ce');
      ghostGrad.addColorStop(1, '#3b0764');
      ctx.fillStyle = ghostGrad;
      ctx.beginPath();
      ctx.arc(0, -20, 16, Math.PI, 0, false);
      ctx.lineTo(16, -2);
      ctx.quadraticCurveTo(8, -7, 0, -2);
      ctx.quadraticCurveTo(-8, -7, -16, -2);
      ctx.closePath();
      ctx.fill();

      // Dark hood interior
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.ellipse(0, -19, 11, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Glowing Golden Eyes
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(-4.5, -19, 3, 0, Math.PI * 2);
      ctx.arc(4.5, -19, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (type === 'mine') {
      // Spiked Metal Mine with glowing red eyes
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4 + animTime * 0.8;
        ctx.beginPath();
        ctx.moveTo(0, -16);
        ctx.lineTo(Math.cos(a) * 22, -16 + Math.sin(a) * 22);
        ctx.stroke();
      }
      const mineGrad = ctx.createRadialGradient(-4, -20, 2, 0, -16, 15);
      mineGrad.addColorStop(0, '#64748b');
      mineGrad.addColorStop(0.7, '#334155');
      mineGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = mineGrad;
      ctx.beginPath();
      ctx.arc(0, -16, 14, 0, Math.PI * 2);
      ctx.fill();

      // Glowing red sensor eye
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(-4, -17, 2.8, 0, Math.PI * 2);
      ctx.arc(4, -17, 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      // Tasty Bug (Cute crimson berry beetle that Kodo can squash!)
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.ellipse(0, -9, 11, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#881337';
      ctx.beginPath();
      ctx.arc(-4, -11, 2, 0, Math.PI * 2);
      ctx.arc(4, -11, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-3.5, -7, 2.5, 0, Math.PI * 2);
      ctx.arc(3.5, -7, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Draw 100% transparent vector Kodo the Blue Bird (ZERO black pixels, fully animated!)
  public drawKodoBird(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    facing: 'left' | 'right' | 'front',
    isJumping: boolean,
    jumpArc: number,
    animTime: number,
    customColor?: string
  ) {
    const idleBob = !isJumping ? Math.sin(animTime * 3.5) * 2.5 : 0;
    const wingFlap = isJumping ? Math.sin(animTime * 25) * 16 : Math.sin(animTime * 3.5) * 3;
    const isBlink = Math.sin(animTime * 0.8) > 0.94;

    ctx.save();
    ctx.translate(x, y - jumpArc + idleBob);
    if (facing === 'left') {
      ctx.scale(-1, 1);
    }

    // Color palette resolution
    let cLight = '#7dd3fc';
    let cMid = '#0284c7';
    let cDark = '#0369a1';
    let cCrest1 = '#0ea5e9';
    let cCrest2 = '#38bdf8';

    if (customColor === '#ef4444' || customColor === '#dc2626' || customColor === '#f87171') {
      cLight = '#fca5a5';
      cMid = '#ef4444';
      cDark = '#991b1b';
      cCrest1 = '#f87171';
      cCrest2 = '#fca5a5';
    } else if (customColor === '#a855f7' || customColor === '#9333ea' || customColor === '#c084fc') {
      cLight = '#d8b4fe';
      cMid = '#a855f7';
      cDark = '#6b21a8';
      cCrest1 = '#c084fc';
      cCrest2 = '#e9d5ff';
    } else if (customColor === '#eab308' || customColor === '#f59e0b' || customColor === '#facc15') {
      cLight = '#fef08a';
      cMid = '#eab308';
      cDark = '#a16207';
      cCrest1 = '#fde047';
      cCrest2 = '#fef9c3';
    } else if (customColor === '#10b981' || customColor === '#059669') {
      cLight = '#6ee7b7';
      cMid = '#10b981';
      cDark = '#065f46';
      cCrest1 = '#34d399';
      cCrest2 = '#a7f3d0';
    }

    // 1. Triple Head Crest Feathers
    ctx.fillStyle = cCrest1;
    ctx.beginPath();
    ctx.ellipse(0, -38, 5, 12, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = cCrest2;
    ctx.beginPath();
    ctx.ellipse(-5, -36, 4, 10, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = cMid;
    ctx.beginPath();
    ctx.ellipse(5, -36, 4, 10, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // 2. Wings
    ctx.fillStyle = cDark;
    // Left Wing
    ctx.beginPath();
    ctx.ellipse(-18, -12 + wingFlap * 0.4, 7, 13, -0.3 + wingFlap * 0.03, 0, Math.PI * 2);
    ctx.fill();
    // Right Wing
    ctx.beginPath();
    ctx.ellipse(18, -12 - wingFlap * 0.4, 7, 13, 0.3 - wingFlap * 0.03, 0, Math.PI * 2);
    ctx.fill();

    // 3. Round Bird Body
    const bodyGrad = ctx.createRadialGradient(-4, -20, 4, 0, -16, 26);
    bodyGrad.addColorStop(0, cLight);
    bodyGrad.addColorStop(0.65, cMid);
    bodyGrad.addColorStop(1, cDark);
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(0, -16, 22, 0, Math.PI * 2);
    ctx.fill();

    // 4. White Belly Patch
    const bellyGrad = ctx.createLinearGradient(0, -18, 0, 4);
    bellyGrad.addColorStop(0, '#ffffff');
    bellyGrad.addColorStop(1, '#e0f2fe');
    ctx.fillStyle = bellyGrad;
    ctx.beginPath();
    ctx.ellipse(0, -10, 14, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // 5. Orange Feet
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(-7, 5, 4.5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(7, 5, 4.5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 6. Blush Cheeks
    ctx.fillStyle = 'rgba(244, 114, 182, 0.55)';
    ctx.beginPath();
    ctx.ellipse(-13, -13, 4.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(13, -13, 4.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // 7. Expressive Cartoon Eyes
    if (!isBlink) {
      // Left Eye
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(-7, -22, 6, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(-6, -22, 4, 5.5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Double sparkle gleams
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-5, -24, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-7, -20, 0.9, 0, Math.PI * 2);
      ctx.fill();

      // Right Eye
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(7, -22, 6, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(8, -22, 4, 5.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(9, -24, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(7, -20, 0.9, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Happy blink curved lines
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(-7, -20, 5, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(7, -20, 5, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    }

    // 8. Cute Orange Beak
    const beakGrad = ctx.createLinearGradient(0, -18, 0, -10);
    beakGrad.addColorStop(0, '#fde047');
    beakGrad.addColorStop(0.5, '#f59e0b');
    beakGrad.addColorStop(1, '#d97706');
    ctx.fillStyle = beakGrad;
    ctx.beginPath();
    ctx.moveTo(-6, -18);
    ctx.lineTo(6, -18);
    ctx.lineTo(0, -10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  // Clockwise 4 directions on isometric grid: Up (Up-Right) -> Right (Down-Right) -> Down (Down-Left) -> Left (Up-Left)
  public static readonly CLOCKWISE_DIRECTIONS: ('up' | 'right' | 'down' | 'left')[] = [
    'up',
    'right',
    'down',
    'left',
  ];

  // State-driven direction controller:
  // - Holds chosen direction during hop + 0.2s after stopping so player can chain hops in same direction
  // - Resumes fast clockwise stepping every 0.5s after stopping
  public currentDirection: 'up' | 'right' | 'down' | 'left' = 'up';
  public holdAfterStopRemaining: number = 0; // seconds remaining in 0.2s post-stop hold window
  public stepTimer: number = 0; // seconds elapsed in current clockwise direction step
  public readonly stepDuration: number = 0.5; // fast 0.5s per clockwise step
  public readonly postStopHoldDuration: number = 0.2; // 0.2s delay after stopping before arrow rotates again

  // Called when player hops in `dir`
  public notifyPlayerHop(dir: 'up' | 'right' | 'down' | 'left') {
    this.currentDirection = dir;
    this.holdAfterStopRemaining = this.postStopHoldDuration;
    this.stepTimer = 0;
  }

  // Called every frame with delta time `dt` (in seconds) and whether player is currently mid-hop (`isMoving`)
  public updateDirection(dt: number, isMoving: boolean = false): 'up' | 'right' | 'down' | 'left' {
    if (isMoving) {
      // While mid-hop, keep direction locked and keep full 0.5s post-stop delay ready for landing
      this.holdAfterStopRemaining = this.postStopHoldDuration;
      this.stepTimer = 0;
      return this.currentDirection;
    }

    if (this.holdAfterStopRemaining > 0) {
      this.holdAfterStopRemaining -= dt;
      if (this.holdAfterStopRemaining <= 0) {
        // 0.5s after stopping has elapsed: immediately advance to next clockwise direction and resume rotation!
        this.holdAfterStopRemaining = 0;
        this.stepTimer = 0;
        const idx = IsometricRenderer.CLOCKWISE_DIRECTIONS.indexOf(this.currentDirection);
        this.currentDirection = IsometricRenderer.CLOCKWISE_DIRECTIONS[(idx + 1) % 4];
      }
      return this.currentDirection;
    }

    // Dynamic clockwise rotation while standing idle
    this.stepTimer += dt;
    if (this.stepTimer >= this.stepDuration) {
      this.stepTimer -= this.stepDuration;
      const idx = IsometricRenderer.CLOCKWISE_DIRECTIONS.indexOf(this.currentDirection);
      this.currentDirection = IsometricRenderer.CLOCKWISE_DIRECTIONS[(idx + 1) % 4];
    }

    return this.currentDirection;
  }

  // Deterministic helper for stateless time-based queries
  public getClockwiseDirection(animTime: number): 'up' | 'right' | 'down' | 'left' {
    const step = ((Math.floor(animTime) % 4) + 4) % 4;
    return IsometricRenderer.CLOCKWISE_DIRECTIONS[step] || 'right';
  }

  // Get angle in radians pointing from player toward the adjacent block in given direction
  public directionToAngle(dir: 'up' | 'right' | 'down' | 'left'): number {
    const hw = this.tileW / 2;
    const hh = this.tileH / 2;
    const baseAngle = Math.atan2(hh, hw);
    switch (dir) {
      case 'up': // grid (0, -1) -> Screen Up-Right (-26.5°)
        return -baseAngle;
      case 'right': // grid (1, 0) -> Screen Down-Right (+26.5°)
        return baseAngle;
      case 'down': // grid (0, 1) -> Screen Down-Left (+153.5°)
        return Math.PI - baseAngle;
      case 'left': // grid (-1, 0) -> Screen Up-Left (-153.5°)
        return -Math.PI + baseAngle;
      default:
        return baseAngle;
    }
  }

  // Screen offset from player position to the target adjacent isometric block
  public directionToScreenDelta(dir: 'up' | 'right' | 'down' | 'left'): Point {
    const hw = this.tileW / 2;
    const hh = this.tileH / 2;
    switch (dir) {
      case 'up':
        return { x: hw, y: -hh };
      case 'right':
        return { x: hw, y: hh };
      case 'down':
        return { x: -hw, y: hh };
      case 'left':
        return { x: -hw, y: -hh };
      default:
        return { x: hw, y: hh };
    }
  }

  // Draw the 4-direction Clockwise Directional Arrow Indicator around Kodo
  // Blinks dynamically in the active direction pointing directly to the target block
  public drawDirectionalIndicator(
    ctx: CanvasRenderingContext2D,
    playerIso: Point,
    activeDirOrAngle: 'up' | 'right' | 'down' | 'left' | number,
    animTime: number,
    targetElevationDiff: number = 0
  ) {
    if (!playerIso) return;
    const hw = this.tileW / 2;
    const hh = this.tileH / 2;

    // Resolve direction safely
    let activeDir: 'up' | 'right' | 'down' | 'left' = 'right';
    if (typeof activeDirOrAngle === 'number') {
      activeDir = this.angleToDirection(activeDirOrAngle);
    } else if (IsometricRenderer.CLOCKWISE_DIRECTIONS.includes(activeDirOrAngle)) {
      activeDir = activeDirOrAngle;
    }

    const activeAngleRad = this.directionToAngle(activeDir);
    const targetDelta = this.directionToScreenDelta(activeDir);
    const elevOffsetY = -targetElevationDiff * this.elevationStep;

    // Target block top diamond center on screen (adjusted for +1 up / -1 down block height!)
    const targetCenterX = playerIso.x + targetDelta.x;
    const targetCenterY = playerIso.y + hh + targetDelta.y + elevOffsetY;

    const isHoldingDirection = this.holdAfterStopRemaining > 0;
    // Dynamic blink / pulse cadence
    const stepPhase = isHoldingDirection ? 1.0 : (this.stepTimer / this.stepDuration);
    const pulseFactor = isHoldingDirection
      ? 0.85 + 0.15 * Math.sin(animTime * 12)
      : 0.5 + 0.5 * Math.cos(stepPhase * Math.PI * 2);
    const arrowDistance = Math.max(28, this.tileW * 0.45) + pulseFactor * 6;

    const arrowX = playerIso.x + Math.cos(activeAngleRad) * arrowDistance;
    const arrowY =
      playerIso.y + hh + Math.sin(activeAngleRad) * (arrowDistance * 0.58) + elevOffsetY * 0.45;

    ctx.save();

    // 1. Subtle Preview Indicators for the 4 Clockwise Directions
    const allDirs: ('up' | 'right' | 'down' | 'left')[] = ['up', 'right', 'down', 'left'];
    for (const d of allDirs) {
      const dDelta = this.directionToScreenDelta(d);
      const dotX = playerIso.x + dDelta.x * 0.52;
      const dotY = playerIso.y + hh + dDelta.y * 0.52;
      const isCur = d === activeDir;

      if (!isCur) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
        ctx.beginPath();
        ctx.arc(dotX, dotY, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 2. Glowing Target Block Diamond Highlight centered on the destination tile
    ctx.save();
    ctx.translate(targetCenterX, targetCenterY);
    ctx.beginPath();
    ctx.moveTo(0, -hh * 0.78);
    ctx.lineTo(hw * 0.78, 0);
    ctx.lineTo(0, hh * 0.78);
    ctx.lineTo(-hw * 0.78, 0);
    ctx.closePath();

    const highlightRgb = isHoldingDirection ? '56, 189, 248' : '250, 204, 21';
    ctx.fillStyle = `rgba(${highlightRgb}, ${0.18 + pulseFactor * 0.28})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(${highlightRgb}, ${0.5 + pulseFactor * 0.5})`;
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.restore();

    // 3. Glowing trajectory beacon dots from player to target block
    for (let i = 1; i <= 3; i++) {
      const dotT = i / 3.5;
      const dotX = playerIso.x + targetDelta.x * dotT;
      const dotY = playerIso.y + hh + targetDelta.y * dotT + elevOffsetY * dotT;
      ctx.fillStyle = isHoldingDirection
        ? `rgba(56, 189, 248, ${0.55 + pulseFactor * 0.4})`
        : `rgba(250, 204, 21, ${0.45 + pulseFactor * 0.45})`;
      ctx.beginPath();
      ctx.arc(dotX, dotY, 2.2 + i * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Arrow Head pointing into the target block
    ctx.translate(arrowX, arrowY);
    ctx.rotate(activeAngleRad + Math.PI / 2);

    ctx.shadowColor = isHoldingDirection ? '#38bdf8' : '#facc15';
    ctx.shadowBlur = 12 + pulseFactor * 8;

    // Glowing Arrow Shape
    ctx.fillStyle = isHoldingDirection ? '#38bdf8' : '#facc15';
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(13, 7);
    ctx.lineTo(4.5, 3);
    ctx.lineTo(4.5, 14);
    ctx.lineTo(-4.5, 14);
    ctx.lineTo(-4.5, 3);
    ctx.lineTo(-13, 7);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    ctx.restore();
  }

  // Draw animated waving cloth finish flag
  public drawAnimatedFlag(
    ctx: CanvasRenderingContext2D,
    flagIso: Point,
    animTime: number
  ) {
    const baseX = flagIso.x;
    const baseY = flagIso.y + this.tileH / 2 + 4;

    // Double golden stand
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.ellipse(baseX, baseY, 16, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(baseX, baseY - 3, 11, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Golden pole
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(baseX - 2.5, baseY - 58, 5, 55);

    // Golden ball finial
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(baseX, baseY - 58, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Waving red cloth flag with sine wave ripple
    const wave1 = Math.sin(animTime * 6) * 4;
    const wave2 = Math.cos(animTime * 6) * 3;

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(baseX + 2.5, baseY - 56);
    ctx.quadraticCurveTo(
      baseX + 16 + wave1,
      baseY - 50,
      baseX + 32 + wave2,
      baseY - 44
    );
    ctx.lineTo(baseX + 2.5, baseY - 34);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(baseX + 2.5, baseY - 52);
    ctx.quadraticCurveTo(
      baseX + 14 + wave1,
      baseY - 46,
      baseX + 26 + wave2,
      baseY - 40
    );
    ctx.stroke();
  }
}
