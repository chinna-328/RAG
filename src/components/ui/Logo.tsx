export function Logo({ size = 28, withWordmark = true }: { size?: number; withWordmark?: boolean }) {
  return (
    <div className="inline-flex items-center gap-2">
      <div
        className="grid place-items-center relative shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_0_0_1px_rgba(0,212,255,0.5),0_0_18px_rgba(0,212,255,0.5),0_0_36px_rgba(0,255,157,0.18)]"
        style={{
          width: size,
          height: size,
          borderRadius: 8,
          background: 'linear-gradient(135deg, var(--accent) 0%, var(--neon) 100%)',
          transform: 'perspective(400px) rotateY(-8deg) rotateX(6deg)',
        }}
      >
        <svg
          width={size * 0.55}
          height={size * 0.55}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#001218"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3v3M12 18v3M5 12H2M22 12h-3M6 6l1.5 1.5M16.5 16.5 18 18M6 18l1.5-1.5M16.5 7.5 18 6" />
          <circle cx="12" cy="12" r="4" fill="#001218" />
        </svg>
      </div>
      {withWordmark && (
        <span
          className="font-serif tracking-tight"
          style={{ fontSize: size * 0.7, letterSpacing: '-0.02em' }}
        >
          Lumen
        </span>
      )}
    </div>
  );
}
