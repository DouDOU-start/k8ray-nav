import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  Sparkles,
  Bot,
  Cpu,
  ChevronRight,
  Github
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Particle System Logic ---

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = (Math.random() - 0.5) * 0.5;
    this.radius = Math.random() * 1.5 + 0.5;
  }

  update(mouseX: number, mouseY: number) {
    // Basic movement
    this.x += this.vx;
    this.y += this.vy;

    // Bounce off edges
    if (this.x < 0 || this.x > this.canvas.width) this.vx *= -1;
    if (this.y < 0 || this.y > this.canvas.height) this.vy *= -1;

    // Mouse Interaction: Magnetic attraction
    const dx = mouseX - this.x;
    const dy = mouseY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < 200) {
      this.x += dx * 0.01;
      this.y += dy * 0.01;
    }
  }

  draw() {
    this.ctx.beginPath();
    this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.fill();
  }
}

const ParticleBackground = ({ mousePos }: { mousePos: { x: number, y: number } }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    };

    const init = () => {
      particles.current = [];
      const count = Math.floor((canvas.width * canvas.height) / 10000);
      for (let i = 0; i < Math.min(count, 150); i++) {
        particles.current.push(new Particle(canvas, ctx));
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const pArr = particles.current;
      for (let i = 0; i < pArr.length; i++) {
        pArr[i].update(mousePos.x, mousePos.y);
        pArr[i].draw();

        // Connect particles
        for (let j = i + 1; j < pArr.length; j++) {
          const dx = pArr[i].x - pArr[j].x;
          const dy = pArr[i].y - pArr[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(34, 211, 238, ${0.15 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(pArr[i].x, pArr[i].y);
            ctx.lineTo(pArr[j].x, pArr[j].y);
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    resize();
    animate();

    return () => window.removeEventListener('resize', resize);
  }, []);

  // Update particles with mouse position changes (though animate loop already does this via ref)
  useEffect(() => {
    // The animate loop uses mousePos directly from closure, but we want to ensure it has latest
  }, [mousePos]);

  return <canvas ref={canvasRef} className="fixed inset-0 opacity-60" />;
};

// --- Main App ---

const DATA = [
  {
    id: 'register',
    title: 'ChatGPT 注册机',
    desc: '自动化多线程账号注册系统',
    icon: <Bot className="size-6 text-cyan-400" />,
    url: 'https://cgr.k8ray.com/',
    color: 'from-cyan-500/20 to-blue-500/20',
    borderColor: 'border-cyan-500/30'
  },
  {
    id: 'creator',
    title: '内容创作中心',
    desc: 'AI 驱动的内容生产工作流',
    icon: <Sparkles className="size-6 text-purple-400" />,
    url: 'https://creator.k8ray.com/',
    color: 'from-purple-500/20 to-pink-500/20',
    borderColor: 'border-purple-500/30'
  },
  {
    id: 'relay',
    title: 'AI 中转服务',
    desc: '多模型 API 聚合加速平台',
    icon: <Zap className="size-6 text-amber-400" />,
    url: 'https://sub2api.k8ray.com/',
    color: 'from-amber-500/20 to-orange-500/20',
    borderColor: 'border-amber-500/30'
  },
  {
    id: 'chat',
    title: '智能对话终端',
    desc: '部署中 // 敬请期待',
    icon: <Cpu className="size-6 text-slate-400" />,
    url: '#',
    color: 'from-slate-500/10 to-slate-500/5',
    borderColor: 'border-slate-500/20',
    disabled: true
  }
];

export default function App() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="relative min-h-screen bg-black text-white selection:bg-cyan-500/30 overflow-x-hidden">
      <ParticleBackground mousePos={mousePos} />

      {/* Mouse Glow Follower */}
      <div
        className="cursor-glow pointer-events-none"
        style={{ left: mousePos.x, top: mousePos.y }}
      />

      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 sm:px-10 py-6 sm:py-8 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 sm:gap-4"
        >
          <div className="size-8 sm:size-10 rounded-full bg-cyan-500 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.5)]">
            <span className="font-black text-black text-xs sm:text-base">K8</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg sm:text-xl font-bold tracking-tighter text-glow">K8RAY</span>
            <span className="text-[8px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-cyan-500/70 font-bold leading-none">量子导航门户</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex gap-4 sm:gap-8 items-center"
        >
          <a href="https://github.com/DouDOU-start" target="_blank" className="text-slate-400 hover:text-white transition-colors flex items-center gap-2">
            <Github className="size-5 sm:size-6" />
            <span className="hidden sm:inline text-xs font-bold tracking-widest uppercase">GitHub</span>
          </a>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 pt-24 sm:pt-0">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-center mb-12 sm:mb-20"
        >
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter mb-4 sm:mb-6 inline-block bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-slate-900 leading-tight sm:leading-none">
            智启未来 · 协同共生
          </h1>
          <p className="text-slate-500 text-sm sm:text-lg tracking-[0.2em] sm:tracking-[0.5em] font-medium max-w-2xl mx-auto leading-relaxed px-4">
            连接人类创意与 <span className="text-cyan-400">人工智能</span> 的无限可能
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full max-w-7xl mb-20 sm:mb-0">
          {DATA.map((item, idx) => (
            <motion.a
              key={item.id}
              href={item.url}
              target={item.disabled ? undefined : "_blank"}
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              className={cn(
                "group relative quantum-card p-6 rounded-[2rem] overflow-hidden transition-all duration-500",
                "hover:scale-[1.02] hover:-translate-y-2",
                item.disabled ? "opacity-50 grayscale cursor-not-allowed" : "cursor-pointer",
                item.borderColor
              )}
            >
              {/* Card Gradient Inner Glow */}
              <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-br", item.color)} />

              <div className="relative z-10">
                <div className="size-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/10 group-hover:border-white/20 transition-colors">
                  {item.icon}
                </div>

                <h3 className="text-2xl font-bold mb-2 group-hover:text-glow transition-all">{item.title}</h3>
                <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">
                  {item.desc}
                </p>

                <div className="flex items-center justify-between text-xs font-bold tracking-widest text-slate-400 group-hover:text-white transition-colors mt-auto">
                  <span>{item.disabled ? '正在部署中...' : '立即开启门户'}</span>
                  <div className="size-8 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                    {item.disabled ? <div className="size-1 bg-slate-500 rounded-full" /> : <ChevronRight className="size-4" />}
                  </div>
                </div>
              </div>

              {/* Decorative Scanline inside card */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]" />
            </motion.a>
          ))}
        </div>
      </main>


      {/* Background Ambience Layers */}
      <div className="fixed inset-0 pointer-events-none z-[1]">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 right-0 w-[600px] h-[600px] bg-purple-500/5 blur-[120px] rounded-full" />
      </div>

    </div>
  );
}
