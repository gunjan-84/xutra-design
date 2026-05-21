// App shell — internal router + Tweaks panel + Settings drawer
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": ["#e16ceb", "#e890f0", "#f4c8f8"],
  "dark": false,
  "forceHold": false,
  "indexStyle": "tile"
}/*EDITMODE-END*/;

// Each palette: [primary, container, dim]. All in the purple→pink gradient,
// curated for trading-app legibility on light and dark surfaces.
const PALETTE_OPTIONS = [
  ["#6d28d9", "#8b5cf6", "#c4b5fd"], // Deep Violet
  ["#7c3aed", "#9b6cf2", "#d4c0ff"], // Violet
  ["#9333ea", "#b06bf0", "#e0c8ff"], // Purple
  ["#a855f7", "#c084fc", "#e9d5ff"], // Bright Purple
  ["#c026d3", "#d65ce0", "#f6c4ff"], // Magenta
  ["#ec4899", "#f06cae", "#ffd0e3"], // Hot Pink
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

function mixWithWhite(hex, amount) {
  const h = hex.replace('#', '').padEnd(6, '0');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return '#' + [r, g, b].map(c => Math.round(c + (255 - c) * amount).toString(16).padStart(2, '0')).join('');
}

function normalizeHex(v) {
  if (/^#[0-9a-f]{3}$/i.test(v)) {
    const [r, g, b] = v.slice(1);
    return ('#' + r + r + g + g + b + b).toLowerCase();
  }
  return v.toLowerCase();
}

function CustomHexInput({ onChange }) {
  const [hex, setHex] = React.useState('');
  const isValid = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex);

  const handleChange = (e) => {
    let v = e.target.value.trim();
    if (v && !v.startsWith('#')) v = '#' + v;
    setHex(v);
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) {
      const primary = normalizeHex(v);
      onChange([primary, mixWithWhite(primary, 0.18), mixWithWhite(primary, 0.52)]);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 24, height: 24, borderRadius: 6, flexShrink: 0,
        background: isValid ? hex : 'rgba(0,0,0,0.08)',
        border: '0.5px solid rgba(0,0,0,0.15)',
        transition: 'background 120ms',
      }} />
      <input
        className="twk-field"
        type="text"
        value={hex}
        placeholder="#e16ceb"
        maxLength={7}
        spellCheck={false}
        onChange={handleChange}
        style={{ flex: 1, fontFamily: 'monospace', letterSpacing: '0.02em' }}
      />
    </div>
  );
}

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

  return (
    <XutraContext.Provider value={{ go, goTab, goReplace, goBack, openSettings, canGoBack, brokers, feed, feedBroker, tweaks }}>
      <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "var(--color-background)", overflow: "hidden", paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)", paddingLeft: "env(safe-area-inset-left)", paddingRight: "env(safe-area-inset-right)" }}>
          <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
            {content}
          </div>
          <window.SettingsDrawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            brokers={brokers}
            setBroker={setBroker}
            feed={feed}
            setFeed={setFeed}
          />
      </div>

      <window.TweaksPanel title="Tweaks" showTrigger={true}>
        <window.TweakSection label="Color theme">
          <window.TweakColor
            label="Palette"
            value={tweaks.palette}
            options={PALETTE_OPTIONS}
            onChange={(p) => setTweak('palette', p)}
          />
          <window.TweakRow label="Custom hex">
            <CustomHexInput onChange={(p) => setTweak('palette', p)} />
          </window.TweakRow>
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
