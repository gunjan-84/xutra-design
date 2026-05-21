// App shell — internal router + Tweaks panel + Settings drawer
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": ["#7c3aed", "#9b6cf2", "#d4c0ff"],
  "dark": false,
  "forceHold": false,
  "indexStyle": "hero"
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
      <div style={{ position: "relative", width: "100%", height: "100dvh", display: "flex", flexDirection: "column", background: "var(--color-background)", overflow: "hidden" }}>
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
