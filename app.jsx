// App shell — internal router + Tweaks panel + Settings drawer
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": ["#ec4899", "#f06cae", "#ffd0e3"],
  "dark": false,
  "forceHold": false,
  "indexStyle": "tile"
}/*EDITMODE-END*/;

// Each palette: [primary, container, dim]. Top 3 are the recommended picks
// (Violet — default, Deep Violet — serious, Hot Pink — distinctive), followed
// by the wider purple→pink range.
const PALETTE_OPTIONS = [
  ["#7c3aed", "#9b6cf2", "#d4c0ff"], // Violet ★ default
  ["#6d28d9", "#8b5cf6", "#c4b5fd"], // Deep Violet ★ serious
  ["#ec4899", "#f06cae", "#ffd0e3"], // Hot Pink ★ distinctive
  ["#9333ea", "#b06bf0", "#e0c8ff"], // Purple
  ["#a855f7", "#c084fc", "#e9d5ff"], // Bright Purple
  ["#c026d3", "#d65ce0", "#f6c4ff"], // Magenta
  ["#f472b6", "#f9a8d4", "#fce7f3"], // Soft Pink
  ["#e11d48", "#f06b8e", "#ffd0e0"], // Rose
];

function applyPalette(palette) {
  const [primary, container, dim] = palette || [];
  if (!primary) return;
  const r = document.documentElement;
  r.style.setProperty("--color-primary", primary);
  r.style.setProperty("--color-primary-container", container);
  r.style.setProperty("--color-primary-fixed-dim", dim);
  r.style.setProperty("--color-inverse-primary", dim);
}

// Shared app context (broker state + navigation + settings drawer toggle)
const XutraContext = React.createContext({});
window.XutraContext = XutraContext;

// Tab order for swipe navigation (matches BottomNav order in components.jsx)
const TAB_ORDER = ["home", "watchlist", "portfolio", "orders", "account"];

const App = () => {
  const [screen, setScreen] = React.useState({ name: "home" });
  const [history, setHistory] = React.useState([]);
  const [tweaks, setTweak] = window.useTweaks(TWEAK_DEFAULTS);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const { brokers, feed, setFeed, setBroker } = window.useBrokers();

  // Drill-down navigation: pushes the current screen onto the back-stack
  const go = React.useCallback((s) => {
    setHistory(h => [...h, screen]);
    setScreen(s);
  }, [screen]);

  // Tab navigation: clears the stack (tabs aren't a drill-down)
  const goTab = React.useCallback((s) => {
    setHistory([]);
    setScreen(s);
  }, []);

  // Replace current screen without pushing (used after order submit, so back
  // from Orders skips the Trade screen and lands where the user was before)
  const goReplace = React.useCallback((s) => setScreen(s), []);

  const goBack = React.useCallback(() => {
    setHistory(h => {
      if (!h.length) { setScreen({ name: "home" }); return h; }
      const prev = h[h.length - 1];
      setScreen(prev);
      return h.slice(0, -1);
    });
  }, []);

  const openSettings = () => setDrawerOpen(true);

  React.useEffect(() => { window.XutraApp = { go, goTab, goReplace, goBack, openSettings }; });

  React.useEffect(() => {
    applyPalette(tweaks.palette);
  }, [tweaks.palette]);

  React.useEffect(() => {
    if (tweaks.dark) document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");
  }, [tweaks.dark]);

  let content;
  if (screen.name === "home")            content = <HomeScreen go={go} goTab={goTab} />;
  else if (screen.name === "watchlist")  content = <WatchlistScreen go={go} goTab={goTab} />;
  else if (screen.name === "portfolio")  content = <PortfolioScreen go={go} goTab={goTab} />;
  else if (screen.name === "orders")     content = <OrdersScreen go={go} goTab={goTab} />;
  else if (screen.name === "account")    content = <AccountScreen go={go} goTab={goTab} />;
  else if (screen.name === "instrument") content = <InstrumentScreen symbol={screen.symbol} go={go} goTab={goTab} />;
  else if (screen.name === "trade")      content = <TradeScreen symbol={screen.symbol} mode={screen.mode} go={go} goTab={goTab} goReplace={goReplace} forceHold={tweaks.forceHold} />;
  else                                   content = <HomeScreen go={go} goTab={goTab} />;

  const feedBroker = brokers.find(b => b.id === feed && b.connected) || null;
  const canGoBack = history.length > 0;

  // ── Swipe-between-tabs ──
  // Horizontal flick on a tab screen navigates to the prev/next tab.
  // Skipped if the gesture starts inside something with [data-no-page-swipe]
  // (row swipe-to-trade, horizontal scrollers, chips, etc.) or if we're on
  // a drill-down screen (instrument / trade).
  const swipeRef = React.useRef({});
  const [swipeDx, setSwipeDx] = React.useState(0);
  const [swiping, setSwiping] = React.useState(false);

  const onTouchStart = React.useCallback((e) => {
    if (!TAB_ORDER.includes(screen.name)) return;
    if (e.target.closest && e.target.closest('[data-no-page-swipe]')) return;
    const t = e.touches[0];
    swipeRef.current = {
      x0: t.clientX, y0: t.clientY,
      t0: Date.now(), active: true, decided: false, dx: 0,
    };
  }, [screen.name]);

  const onTouchMove = React.useCallback((e) => {
    const s = swipeRef.current;
    if (!s.active) return;
    const t = e.touches[0];
    const dx = t.clientX - s.x0;
    const dy = t.clientY - s.y0;
    if (!s.decided) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      // Need to be clearly more horizontal than vertical to claim the gesture
      if (Math.abs(dx) < Math.abs(dy) * 1.2) { s.active = false; setSwiping(false); setSwipeDx(0); return; }
      s.decided = true;
      setSwiping(true);
    }
    s.dx = dx;
    // Edge resistance at the ends of the tab list
    const idx = TAB_ORDER.indexOf(screen.name);
    const atStart = idx <= 0 && dx > 0;
    const atEnd   = idx >= TAB_ORDER.length - 1 && dx < 0;
    const shown = (atStart || atEnd) ? dx * 0.25 : dx;
    setSwipeDx(Math.max(-180, Math.min(180, shown)));
  }, [screen.name]);

  const onTouchEnd = React.useCallback(() => {
    const s = swipeRef.current;
    if (!s.active || !s.decided) {
      swipeRef.current = {}; setSwiping(false); setSwipeDx(0); return;
    }
    const dt = Date.now() - s.t0;
    const dx = s.dx || 0;
    const idx = TAB_ORDER.indexOf(screen.name);
    const fast = Math.abs(dx) > 40 && dt < 280;
    const FAR  = 70;
    let nextIdx = idx;
    if (dx <= -FAR || (fast && dx < 0)) nextIdx = Math.min(TAB_ORDER.length - 1, idx + 1);
    else if (dx >= FAR || (fast && dx > 0)) nextIdx = Math.max(0, idx - 1);
    swipeRef.current = {};
    setSwiping(false); setSwipeDx(0);
    if (nextIdx !== idx) goTab({ name: TAB_ORDER[nextIdx] });
  }, [screen.name, goTab]);

  const contentTransform = swiping
    ? `translateX(${swipeDx}px)`
    : "translateX(0)";
  const contentTransition = swiping ? "none" : "transform 220ms cubic-bezier(.2,.7,.2,1)";

  return (
    <XutraContext.Provider value={{ go, goTab, goReplace, goBack, openSettings, canGoBack, brokers, feed, feedBroker, tweaks }}>
      <div style={{
        position: "fixed", inset: 0,
        display: "flex", flexDirection: "column",
        background: "var(--color-background)",
        overflow: "hidden",
      }}>
        <div
          style={{ flex: 1, minHeight: 0, position: "relative", overflow: "hidden" }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
        >
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            transform: contentTransform,
            transition: contentTransition,
            willChange: "transform",
          }}>
            {content}
          </div>
        </div>
        <window.SettingsDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          brokers={brokers}
          setBroker={setBroker}
          feed={feed}
          setFeed={setFeed}
        />
        <button
          type="button"
          aria-label="Open Tweaks"
          title="Tweaks"
          onClick={() => window.postMessage({ type: '__activate_edit_mode' }, '*')}
          style={{
            position: "absolute",
            right: 16, bottom: 88,
            width: 48, height: 48,
            borderRadius: 9999,
            border: "1px solid var(--color-outline-variant)",
            background: "var(--color-surface)",
            color: "var(--color-primary)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
            cursor: "pointer",
            zIndex: 50,
          }}
        >
          <window.Icon name="tune" size={22} />
        </button>
      </div>

      <window.TweaksPanel title="Tweaks">
        <window.TweakSection label="Color theme">
          <window.TweakColor
            label="Palette"
            value={tweaks.palette}
            options={PALETTE_OPTIONS}
            onChange={(p) => setTweak('palette', p)}
          />
          <window.TweakToggle
            label="Dark mode"
            value={tweaks.dark}
            onChange={(v) => setTweak('dark', v)}
          />
        </window.TweakSection>

        <window.TweakSection label="Home indices">
          <window.TweakSelect
            label="Style"
            value={tweaks.indexStyle}
            options={[
              { value: "hero",   label: "Dark hero"   },
              { value: "tile",   label: "Light tile"  },
              { value: "spark",  label: "Sparkline"   },
              { value: "ticker", label: "Ticker bar"  },
            ]}
            onChange={(v) => setTweak('indexStyle', v)}
          />
        </window.TweakSection>

        <window.TweakSection label="Order confirmation">
          <window.TweakToggle
            label="Always require hold-to-confirm"
            value={tweaks.forceHold}
            onChange={(v) => setTweak('forceHold', v)}
          />
        </window.TweakSection>
      </window.TweaksPanel>
    </XutraContext.Provider>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
