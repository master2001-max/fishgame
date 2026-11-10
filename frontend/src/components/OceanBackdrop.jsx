const BUBBLES = [
  { left: '8%', size: 6, duration: '14s', delay: '0s' },
  { left: '19%', size: 10, duration: '19s', delay: '3s' },
  { left: '33%', size: 5, duration: '12s', delay: '6s' },
  { left: '48%', size: 8, duration: '16s', delay: '1.5s' },
  { left: '64%', size: 11, duration: '21s', delay: '4s' },
  { left: '77%', size: 6, duration: '15s', delay: '2s' },
  { left: '90%', size: 9, duration: '17s', delay: '5s' },
];

export default function OceanBackdrop() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {/* Subtle photography texture blended underneath deep ocean palette */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center opacity-20 mix-blend-luminosity scale-105" />

      {/* Multi-layered deep-sea gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 55% at 50% -5%, rgba(14, 165, 233, 0.34), transparent 70%), linear-gradient(180deg, rgba(4, 24, 48, 0.85) 0%, rgba(3, 15, 32, 0.94) 55%, rgba(1, 7, 17, 0.99) 100%)',
        }}
      />

      {/* Volumetric surface light rays */}
      <div
        className="animate-ray-sway absolute -top-24 left-[14%] w-56 h-[75vh] blur-2xl"
        style={{
          background:
            'linear-gradient(180deg, rgba(103, 232, 249, 0.24) 0%, rgba(14, 165, 233, 0.05) 60%, transparent 100%)',
        }}
      />
      <div
        className="animate-ray-sway absolute -top-20 left-[52%] w-72 h-[80vh] blur-3xl"
        style={{
          animationDelay: '-4s',
          background:
            'linear-gradient(180deg, rgba(56, 189, 248, 0.22) 0%, rgba(6, 182, 212, 0.04) 65%, transparent 100%)',
        }}
      />
      <div
        className="animate-ray-sway absolute -top-24 right-[10%] w-44 h-[70vh] blur-2xl"
        style={{
          animationDelay: '-2s',
          background:
            'linear-gradient(180deg, rgba(45, 212, 191, 0.16) 0%, transparent 80%)',
        }}
      />

      {/* Bioluminescent ambient orbs */}
      <div className="animate-float-slow absolute bottom-[-8%] left-[-6%] w-[420px] h-[420px] rounded-full bg-cyan-500/10 blur-[120px]" />
      <div
        className="animate-float-slow absolute top-[18%] right-[-8%] w-[380px] h-[380px] rounded-full bg-teal-400/10 blur-[110px]"
        style={{ animationDelay: '-3s' }}
      />

      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'radial-gradient(rgba(186, 230, 253, 0.8) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />

      {/* Rising ambient bubbles */}
      {BUBBLES.map((b, idx) => (
        <span
          key={idx}
          className="absolute bottom-[-20px] rounded-full border border-cyan-200/30 bg-cyan-200/10"
          style={{
            left: b.left,
            width: `${b.size}px`,
            height: `${b.size}px`,
            animation: `riseBubble ${b.duration} linear ${b.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
}
