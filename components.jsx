// Shared components — Icon, TopBar, BottomNav, SwipeableInstrumentRow, HoldToConfirmButton

const Icon = ({ name, size = 22, color, style, className }) => (
  <span
    className={"material-symbols-outlined " + (className || "")}
    style={{ fontSize: size, color, lineHeight: 1, ...style }}
  >{name}</span>
);

// ────────────────────────────────────────────────────────
const TopBar = ({ variant, title, right, onBack }) => {
  const ctx = React.useContext(window.XutraContext || React.createContext({}));
  // When variant is omitted (default screens) but back-stack has entries,
  // automatically swap the hamburger for a back arrow.
  const effectiveVariant = variant || (ctx.canGoBack ? "back" : "default");
  const leftIcon = effectiveVariant === "back" ? "arrow_back" : effectiveVariant === "close" ? "close" : "menu";
  const leftHandler = () => {
    if (effectiveVariant === "default") {
      ctx.openSettings && ctx.openSettings();
    } else if (onBack) {
      onBack();
    } else {
      ctx.goBack && ctx.goBack();
    }
  };
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="topbar-icon-btn primary" onClick={leftHandler} aria-label={leftIcon}>
          <Icon name={leftIcon} size={24} />
        </button>
        <a className="brand-wordmark" href="#" onClick={(e) => { e.preventDefault(); ctx.go && ctx.go({ name: "home" }); }}>Xutra</a>
        {title ? (
          <>
            <div className="topbar-divider" />
            <div style={{ minWidth: 0 }}>{title}</div>
          </>
        ) : null}
      </div>
      <div className="topbar-actions">
        {right || (
          <>
            <button className="topbar-icon-btn" aria-label="Search"><Icon name="search" size={22} /></button>
            <button className="topbar-icon-btn" aria-label="Notifications"><Icon name="notifications" size={22} /></button>
          </>
        )}
      </div>
    </header>
  );
};

// ────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { to: "home", label: "Home", icon: "home" },
  { to: "watchlist", label: "Watchlist", icon: "list_alt" },
  { to: "portfolio", label: "Portfolio", icon: "pie_chart" },
  { to: "orders", label: "Orders", icon: "receipt_long" },
  { to: "account", label: "Account", icon: "person" },
];

const BottomNav = ({ active, go }) => {
  const ctx = React.useContext(window.XutraContext || React.createContext({}));
  const navigate = ctx.goTab || go;
  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(it => {
        const isActive = active === it.to ||
                         (it.to === "watchlist" && (active === "instrument" || active === "trade"));
        return (
          <button
            key={it.to}
            className={"bottom-nav-item " + (isActive ? "active" : "")}
            onClick={() => navigate({ name: it.to })}
          >
            <Icon name={it.icon} size={24} />
            <span className="bottom-nav-label">{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

// ────────────────────────────────────────────────────────
const THRESHOLD = 70;
const MAX = 96;
const SwipeableInstrumentRow = ({ inst, go }) => {
  const [dx, setDx] = React.useState(0);
  const startX = React.useRef(null);
  const startY = React.useRef(null);
  const dragging = React.useRef(false);
  const decided = React.useRef(false);
  const moved = React.useRef(false);
  const up = inst.changePct >= 0;

  function reset() {
    setDx(0);
    startX.current = null; startY.current = null;
    dragging.current = false; decided.current = false;
  }
  function onPointerDown(e) {
    startX.current = e.clientX; startY.current = e.clientY;
    dragging.current = true; decided.current = false; moved.current = false;
  }
  function onPointerMove(e) {
    if (!dragging.current || startX.current === null) return;
    const dX = e.clientX - startX.current;
    const dY = e.clientY - startY.current;
    if (!decided.current) {
      if (Math.abs(dX) < 6 && Math.abs(dY) < 6) return;
      if (Math.abs(dX) <= Math.abs(dY)) { dragging.current = false; setDx(0); return; }
      decided.current = true;
      try { e.target.setPointerCapture && e.target.setPointerCapture(e.pointerId); } catch (_) {}
    }
    moved.current = true;
    setDx(Math.max(-MAX, Math.min(MAX, dX)));
  }
  function onPointerEnd() {
    if (!dragging.current) return reset();
    if (dx >= THRESHOLD) go({ name: "trade", symbol: inst.symbol, mode: "buy" });
    else if (dx <= -THRESHOLD) go({ name: "trade", symbol: inst.symbol, mode: "sell" });
    reset();
  }

  return (
    <div style={{ position: "relative", overflow: "hidden", background: "var(--color-surface-container-lowest)" }}>
      {/* Action backgrounds */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "stretch" }}>
        <div style={{
          width: Math.max(0, dx) + "px",
          background: "var(--color-secondary)", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "flex-start",
          paddingLeft: 16, fontWeight: 700, opacity: dx > 0 ? 1 : 0, transition: "opacity 100ms",
        }}>{dx > 24 ? "BUY" : ""}</div>
        <div style={{ flex: 1 }} />
        <div style={{
          width: Math.max(0, -dx) + "px",
          background: "var(--color-error)", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "flex-end",
          paddingRight: 16, fontWeight: 700, opacity: dx < 0 ? 1 : 0, transition: "opacity 100ms",
        }}>{dx < -24 ? "SELL" : ""}</div>
      </div>

      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={reset}
        onClick={(e) => {
          if (moved.current) { e.preventDefault(); return; }
          go({ name: "instrument", symbol: inst.symbol });
        }}
        style={{
          position: "relative",
          transform: `translateX(${dx}px)`,
          transition: dragging.current ? "none" : "transform 180ms ease-out",
          touchAction: "pan-y",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px",
          background: "var(--color-surface-container-lowest)",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--color-on-surface)" }}>{inst.symbol}</span>
          <span style={{ fontSize: 11, color: "var(--color-on-surface-variant)" }}>
            {inst.exchange} · {inst.segment}
          </span>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="font-data-mono" style={{ fontSize: 15, fontWeight: 600 }}>
            {window.MarketData.fmt(inst.price)}
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: up ? "var(--color-secondary)" : "var(--color-error)" }}>
            {up ? "+" : ""}{inst.changePct.toFixed(2)}%
          </div>
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────
const HoldToConfirmButton = ({
  label, sublabel, variant, requireHold, holdMs = 3000, onConfirm,
}) => {
  const [progress, setProgress] = React.useState(0);
  const [holding, setHolding] = React.useState(false);
  const startRef = React.useRef(null);
  const rafRef = React.useRef(null);

  const bg = variant === "buy" ? "var(--color-secondary)" : "var(--color-error)";
  const fill = variant === "buy"
    ? "rgba(0, 161, 114, 0.55)"
    : "rgba(186, 26, 26, 0.55)";

  function cancel() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null; startRef.current = null;
    setHolding(false); setProgress(0);
  }
  function tick() {
    if (startRef.current == null) return;
    const elapsed = performance.now() - startRef.current;
    const p = Math.min(1, elapsed / holdMs);
    setProgress(p);
    if (p >= 1) { cancel(); onConfirm && onConfirm(); return; }
    rafRef.current = requestAnimationFrame(tick);
  }
  function onPointerDown() {
    if (!requireHold) return;
    setHolding(true);
    startRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
  }
  function onClick() {
    if (requireHold) return;
    onConfirm && onConfirm();
  }
  React.useEffect(() => () => cancel(), []);

  const secondsLeft = Math.max(0, Math.ceil((holdMs * (1 - progress)) / 1000));

  return (
    <button
      onPointerDown={onPointerDown}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onClick={onClick}
      style={{
        position: "relative", overflow: "hidden",
        width: "100%", color: "#fff",
        fontWeight: 800, fontSize: 16,
        padding: "18px 16px", borderRadius: 14, border: "none",
        background: bg,
        boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
        cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 8, userSelect: "none", touchAction: "none",
        transition: "transform 80ms ease",
      }}
      onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.98)"}
      onMouseUp={(e) => e.currentTarget.style.transform = ""}
    >
      {requireHold && (
        <span style={{
          position: "absolute", top: 0, bottom: 0, left: 0,
          width: (progress * 100) + "%",
          background: fill, transition: "width 60ms linear",
        }} />
      )}
      <span style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.15 }}>
        <span>{holding && requireHold ? `HOLD ${secondsLeft}s` : label}</span>
        {sublabel && (
          <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.85 }}>
            {requireHold && !holding ? "Press & hold to confirm" : sublabel}
          </span>
        )}
      </span>
    </button>
  );
};

Object.assign(window, { Icon, TopBar, BottomNav, SwipeableInstrumentRow, HoldToConfirmButton });
