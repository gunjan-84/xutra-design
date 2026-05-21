// Screens: Home, Watchlist, Portfolio, Orders, Account
const { fmt, watchlist } = window.MarketData;

// ───────────────────────────────────────── HOME
const homeIndices = [
  { name: "NIFTY 50", value: "22,147.20", pct: 0.82, abs: "+180.45" },
  { name: "SENSEX", value: "72,831.94", pct: 0.75, abs: "+542.10" },
  { name: "BANKNIFTY", value: "46,512.10", pct: -0.32, abs: "-148.90" },
  { name: "FINNIFTY", value: "20,884.55", pct: 0.41, abs: "+85.20" },
];

const MoverCard = ({ title, items, positive, go }) => (
  <div style={{
    background: "var(--color-surface-container-lowest)",
    border: "1px solid var(--color-outline-variant)",
    borderRadius: 12, overflow: "hidden",
  }}>
    <div style={{
      padding: "10px 16px",
      borderBottom: "1px solid var(--color-outline-variant)",
      background: "var(--color-surface-container-low)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <span style={{ fontSize: 16, fontWeight: 600 }}>{title}</span>
      <Icon name={positive ? "trending_up" : "trending_down"} size={18}
            color={positive ? "var(--color-secondary)" : "var(--color-error)"} />
    </div>
    <div className="list-divide">
      {items.map(w => {
        const up = w.changePct >= 0;
        return (
          <div key={w.symbol}
               onClick={() => go({ name: "instrument", symbol: w.symbol })}
               style={{
                 display: "flex", justifyContent: "space-between", alignItems: "center",
                 padding: "10px 16px", cursor: "pointer",
               }}>
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{w.symbol}</span>
              <span style={{ fontSize: 10, color: "var(--color-on-surface-variant)" }}>{w.exchange}</span>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="font-data-mono" style={{ fontSize: 13, fontWeight: 600 }}>{fmt(w.price)}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: up ? "var(--color-secondary)" : "var(--color-error)" }}>
                {up ? "+" : ""}{w.changePct.toFixed(2)}%
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const HomeScreen = ({ go }) => {
  const gainers = [...watchlist].sort((a, b) => b.changePct - a.changePct).slice(0, 3);
  const losers = [...watchlist].sort((a, b) => a.changePct - b.changePct).slice(0, 3);

  return (
    <div className="app-screen">
      <TopBar />
      <main className="app-main" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Greeting */}
        <section style={{ padding: "0 16px" }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Good Morning</h1>
          <p style={{ fontSize: 13, color: "var(--color-on-surface-variant)", margin: "4px 0 0" }}>
            Markets are open · NSE & BSE
          </p>
        </section>

        {/* Indices strip */}
        <section>
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4, padding: "0 16px" }}
               className="no-scrollbar">
            {homeIndices.map(i => {
              const up = i.pct >= 0;
              return (
                <div key={i.name} className="dark-hero" style={{ minWidth: 160, padding: 16, display: "flex", flexDirection: "column", gap: 4 }}>
                  <span className="font-label-caps" style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>{i.name}</span>
                  <span className="font-data-mono" style={{ fontSize: 17, fontWeight: 700 }}>{i.value}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: up ? "var(--color-secondary)" : "var(--color-error)" }}>
                    {i.abs} ({up ? "+" : ""}{i.pct.toFixed(2)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Funds */}
        <section style={{ padding: "0 16px" }}>
          <div style={{
            borderRadius: 14, padding: 16,
            border: "1px solid var(--color-outline-variant)",
            background: "var(--color-surface-container-lowest)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 17, fontWeight: 700 }}>Funds</span>
              <button onClick={() => go({ name: "account" })}
                      className="font-label-caps"
                      style={{ background: "transparent", border: "none", color: "var(--color-primary)", cursor: "pointer", padding: 0 }}>
                MANAGE
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
              {[
                ["Available", "₹1,42,084", "var(--color-secondary)"],
                ["Used Margin", "₹38,420", "var(--color-on-surface)"],
                ["Opening Bal.", "₹1,80,504", "var(--color-on-surface)"],
              ].map(([l, v, c]) => (
                <div key={l} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span className="font-label-caps" style={{ fontSize: 10, color: "var(--color-on-surface-variant)" }}>{l}</span>
                  <span className="font-data-mono" style={{ fontSize: 15, fontWeight: 600, color: c }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
              <button className="btn-primary">Add Funds</button>
              <button className="btn-outline">Withdraw</button>
            </div>
          </div>
        </section>

        {/* Movers */}
        <section style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, padding: "0 16px" }}>
          <MoverCard title="Top Gainers" items={gainers} positive go={go} />
          <MoverCard title="Top Losers" items={losers} positive={false} go={go} />
        </section>

        {/* Market health */}
        <section style={{ margin: "0 16px" }}>
          <div className="card" style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 16, fontWeight: 600 }}>Market Health</span>
              <span style={{ fontSize: 13, color: "var(--color-on-surface-variant)" }}>32 Advancing · 18 Declining</span>
            </div>
            <div style={{ display: "flex", height: 8, width: 128, borderRadius: 9999, overflow: "hidden", background: "color-mix(in oklab, var(--color-error) 20%, transparent)" }}>
              <div style={{ background: "var(--color-secondary)", height: "100%", width: "64%" }} />
            </div>
          </div>
        </section>
      </main>
      <BottomNav active="home" go={go} />
    </div>
  );
};

// ───────────────────────────────────────── WATCHLIST
const WATCHLIST_DEFAULT = {
  "My Watchlist": ["RELIANCE", "HDFCBANK", "TCS", "INFY", "ICICIBANK", "ZOMATO", "NIFTY 22400 CE"],
  "Banking": ["HDFCBANK", "ICICIBANK"],
  "FnO": ["NIFTY 22400 CE", "BANKNIFTY 46500 PE"],
  "Energy": ["RELIANCE"],
};
const WL_FILTERS = ["All", "Stocks", "FnO"];

const WatchlistScreen = ({ go }) => {
  const STORAGE_KEY = "xutra.watchlists.v1";
  const [lists, setLists] = React.useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return WATCHLIST_DEFAULT;
  });
  const [active, setActive] = React.useState(() => Object.keys(lists)[0]);
  const [filter, setFilter] = React.useState("All");
  const [creating, setCreating] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const newNameRef = React.useRef(null);

  React.useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(lists)); } catch (_) {}
  }, [lists]);

  React.useEffect(() => {
    if (creating) setTimeout(() => newNameRef.current?.focus(), 60);
  }, [creating]);

  function createList() {
    const name = newName.trim();
    if (!name) return;
    if (lists[name]) {
      // Duplicate — just switch to it
      setActive(name);
      setCreating(false);
      setNewName("");
      return;
    }
    setLists(prev => ({ ...prev, [name]: [] }));
    setActive(name);
    setCreating(false);
    setNewName("");
  }

  const symbols = lists[active] || [];
  const items = React.useMemo(() => {
    const present = symbols.map(s => watchlist.find(i => i.symbol === s)).filter(Boolean);
    if (filter === "Stocks") return present.filter(i => i.segment === "Equity");
    if (filter === "FnO") return present.filter(i => i.segment !== "Equity");
    return present;
  }, [symbols, filter]);

  return (
    <div className="app-screen">
      <TopBar />
      <main className="app-main" style={{ padding: "16px 16px 24px" }}>
        <div className="tab-row no-scrollbar" style={{ marginBottom: 16 }}>
          {Object.keys(lists).map(name => (
            <button key={name}
                    onClick={() => setActive(name)}
                    className={"tab " + (name === active ? "active" : "")}>
              {name}
            </button>
          ))}
          <button className="tab" style={{ paddingLeft: 12, paddingRight: 12 }}
                  onClick={() => setCreating(true)}
                  aria-label="New watchlist"><Icon name="add" size={20} /></button>
          <button className="tab" style={{ paddingLeft: 12, paddingRight: 12 }}><Icon name="edit" size={20} /></button>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
          {WL_FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
                    className={"chip " + (filter === f ? "active" : "")}>
              {f}
            </button>
          ))}
          <Icon name="filter_list" size={20} style={{ marginLeft: "auto", color: "var(--color-on-surface-variant)" }} />
        </div>

        <div style={{
          background: "var(--color-surface-container-lowest)",
          border: "1px solid var(--color-outline-variant)",
          borderRadius: 12, overflow: "hidden",
        }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            padding: "10px 16px",
            background: "var(--color-surface-container-low)",
            borderBottom: "1px solid var(--color-outline-variant)",
          }}>
            <span className="font-label-caps" style={{ color: "var(--color-on-surface-variant)" }}>Symbol</span>
            <span className="font-label-caps" style={{ color: "var(--color-on-surface-variant)" }}>Price / Chg</span>
          </div>
          {items.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", fontSize: 13, color: "var(--color-on-surface-variant)" }}>
              No instruments match this filter.
            </div>
          ) : (
            <div className="list-divide">
              {items.map(w => (
                <SwipeableInstrumentRow key={w.symbol} inst={w} go={go} />
              ))}
            </div>
          )}
        </div>
      </main>

      <button className="fab" aria-label="Search">
        <Icon name="search" size={28} />
      </button>
      <BottomNav active="watchlist" go={go} />

      {/* New watchlist sheet */}
      {creating && (
        <div onClick={() => setCreating(false)}
             style={{
               position: "absolute", inset: 0, zIndex: 70,
               background: "rgba(20,17,42,0.45)",
               display: "flex", alignItems: "flex-end", justifyContent: "center",
             }}>
          <div onClick={(e) => e.stopPropagation()}
               style={{
                 width: "100%",
                 background: "var(--color-surface)",
                 borderTopLeftRadius: 18, borderTopRightRadius: 18,
                 padding: "16px 16px 24px",
                 boxShadow: "0 -12px 32px rgba(0,0,0,0.18)",
               }}>
            <div style={{
              width: 36, height: 4, borderRadius: 4,
              background: "var(--color-outline-variant)",
              margin: "0 auto 14px",
            }} />
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 17, fontWeight: 700 }}>New watchlist</span>
              <span style={{ fontSize: 11, color: "var(--color-on-surface-variant)" }}>
                {Object.keys(lists).length} of 10
              </span>
            </div>
            <p style={{ margin: "0 0 14px", fontSize: 12, color: "var(--color-on-surface-variant)" }}>
              Group instruments under a name. You can add stocks and F&amp;O contracts to it later.
            </p>
            <input
              ref={newNameRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") createList(); if (e.key === "Escape") setCreating(false); }}
              maxLength={28}
              placeholder="e.g. Tech, Long term, F&O plays"
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "12px 14px", borderRadius: 10,
                border: "1.5px solid var(--color-outline-variant)",
                background: "var(--color-surface-container-lowest)",
                color: "var(--color-on-surface)",
                fontSize: 15, fontWeight: 500,
                outline: "none",
              }}
              onFocus={(e) => e.target.style.borderColor = "var(--color-primary)"}
              onBlur={(e) => e.target.style.borderColor = "var(--color-outline-variant)"}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
              <button className="btn-outline" onClick={() => setCreating(false)}>Cancel</button>
              <button className="btn-primary"
                      onClick={createList}
                      disabled={!newName.trim()}
                      style={{ opacity: newName.trim() ? 1 : 0.5 }}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ───────────────────────────────────────── ORDERS
const ORDERS = [
  { symbol: "RELIANCE", side: "BUY",  qty: 10, price: 2980,    type: "LIMIT",  status: "OPEN",     time: "10:14 AM", broker: "zerodha" },
  { symbol: "TCS",      side: "SELL", qty: 5,  price: 3920,    type: "LIMIT",  status: "OPEN",     time: "10:02 AM", broker: "upstox"  },
  { symbol: "INFY",     side: "BUY",  qty: 25, price: 1624.95, type: "MARKET", status: "EXECUTED", time: "09:58 AM", broker: "upstox"  },
  { symbol: "ZOMATO",   side: "BUY",  qty: 100,price: 182.40,  type: "MARKET", status: "EXECUTED", time: "09:30 AM", broker: "zerodha" },
  { symbol: "HDFCBANK", side: "SELL", qty: 8,  price: 1450,    type: "LIMIT",  status: "REJECTED", time: "09:21 AM", broker: "zerodha" },
];
const ORDER_TABS = ["OPEN", "EXECUTED", "REJECTED"];
const statusBgFor = {
  OPEN:     { c: "var(--color-warning)", b: "color-mix(in oklab, var(--color-warning) 15%, transparent)" },
  EXECUTED: { c: "var(--color-secondary)", b: "color-mix(in oklab, var(--color-secondary) 12%, transparent)" },
  REJECTED: { c: "var(--color-error)", b: "color-mix(in oklab, var(--color-error) 12%, transparent)" },
};

const OrdersScreen = ({ go }) => {
  const [tab, setTab] = React.useState("OPEN");
  const [brokerFilter, setBrokerFilter] = React.useState("all");
  const ctx = React.useContext(window.XutraContext);
  const brokers = ctx.brokers || [];

  // If the active filter broker logs out, snap back to "all"
  React.useEffect(() => {
    if (brokerFilter !== "all" && !brokers.find(b => b.id === brokerFilter && b.connected)) {
      setBrokerFilter("all");
    }
  }, [brokers, brokerFilter]);

  const brokerScoped = brokerFilter === "all" ? ORDERS : ORDERS.filter(o => o.broker === brokerFilter);
  const filtered = brokerScoped.filter(o => o.status === tab);

  const counts = React.useMemo(() => {
    const out = { all: ORDERS.length };
    ORDERS.forEach(o => { out[o.broker] = (out[o.broker] || 0) + 1; });
    return out;
  }, []);

  return (
    <div className="app-screen">
      <TopBar />
      <main className="app-main" style={{ padding: "16px 16px 24px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 12px" }}>Orders</h1>

        {brokers.filter(b => b.connected).length > 1 && (
          <div style={{ marginBottom: 12 }}>
            <window.BrokerFilterRow
              brokers={brokers}
              value={brokerFilter}
              onChange={setBrokerFilter}
              counts={counts}
            />
          </div>
        )}

        <div className="tab-row" style={{ marginBottom: 16 }}>
          {ORDER_TABS.map(t => {
            const count = brokerScoped.filter(o => o.status === t).length;
            return (
              <button key={t} onClick={() => setTab(t)}
                      className={"tab " + (t === tab ? "active" : "")}
                      style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <span className="font-label-caps">{t}</span>
                <span style={{ fontSize: 10, color: "var(--color-outline)" }}>({count})</span>
              </button>
            );
          })}
        </div>

        <div className="card" style={{ overflow: "hidden" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", fontSize: 13, color: "var(--color-on-surface-variant)" }}>
              No {tab.toLowerCase()} orders{brokerFilter !== "all" ? ` on ${brokers.find(b => b.id === brokerFilter)?.name || "this broker"}` : ""}.
            </div>
          ) : (
            <div className="list-divide">
              {filtered.map((o, i) => (
                <div key={i} style={{ padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <window.BrokerBadge brokerId={o.broker} brokers={brokers} />
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                        padding: "2px 6px", borderRadius: 4,
                        background: o.side === "BUY" ? "color-mix(in oklab, var(--color-secondary) 12%, transparent)" : "color-mix(in oklab, var(--color-error) 12%, transparent)",
                        color: o.side === "BUY" ? "var(--color-secondary)" : "var(--color-error)",
                      }}>{o.side}</span>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{o.symbol}</span>
                    </div>
                    <span style={{ fontSize: 11, color: "var(--color-on-surface-variant)" }}>
                      {o.qty} qty · {o.type} · {o.time}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="font-data-mono" style={{ fontSize: 15, fontWeight: 600 }}>{fmt(o.price)}</div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                      padding: "2px 6px", borderRadius: 4,
                      background: statusBgFor[o.status].b, color: statusBgFor[o.status].c,
                    }}>{o.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <BottomNav active="orders" go={go} />
    </div>
  );
};

// ───────────────────────────────────────── ACCOUNT
const ACCOUNT_ROWS = [
  ["account_balance", "Bank & Payouts"],
  ["security", "Security & 2FA"],
  ["notifications", "Notifications"],
  ["palette", "Appearance"],
  ["help", "Help & Support"],
  ["description", "Terms & Policies"],
  ["logout", "Sign out", true],
];
const AccountScreen = ({ go }) => (
  <div className="app-screen">
    <TopBar />
    <main className="app-main" style={{ padding: "16px 16px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
      <section className="card" style={{ padding: 16, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 9999,
          background: "var(--color-primary)", color: "var(--color-on-primary)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, fontWeight: 800,
        }}>AR</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Aarav Rao</p>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--color-on-surface-variant)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            CLI-294017 · aarav@example.com
          </p>
        </div>
        <Icon name="chevron_right" size={22} color="var(--color-on-surface-variant)" />
      </section>

      <section className="card" style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Funds</h3>
          <button className="font-label-caps" style={{ background: "transparent", border: "none", color: "var(--color-primary)", cursor: "pointer" }}>ADD</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            ["Available", fmt(142084), null],
            ["Used Margin", fmt(28450), "var(--color-error)"],
          ].map(([l, v, c]) => (
            <div key={l} style={{ background: "var(--color-surface-container-low)", padding: 16, borderRadius: 10 }}>
              <p style={{ margin: 0, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-on-surface-variant)", fontWeight: 600 }}>{l}</p>
              <p className="font-data-mono" style={{ margin: "4px 0 0", fontSize: 17, fontWeight: 700, color: c || "var(--color-on-surface)" }}>{v}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card list-divide" style={{ overflow: "hidden" }}>
        {ACCOUNT_ROWS.map(([icon, label, danger], i) => (
          <button key={i} style={{
            width: "100%", display: "flex", alignItems: "center", gap: 16,
            padding: "14px 16px", border: "none",
            background: "transparent", cursor: "pointer", textAlign: "left",
            color: danger ? "var(--color-error)" : "var(--color-on-surface)",
          }}>
            <Icon name={icon} size={22} color={danger ? "var(--color-error)" : "var(--color-on-surface-variant)"} />
            <span style={{ flex: 1, fontSize: 15 }}>{label}</span>
            {!danger ? <Icon name="chevron_right" size={20} color="var(--color-on-surface-variant)" /> : null}
          </button>
        ))}
      </section>

      <p style={{ textAlign: "center", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase",
                  color: "var(--color-outline)", fontWeight: 600, paddingTop: 16, margin: 0 }}>
        Xutra v1.0 · build 2025.05
      </p>
    </main>
    <BottomNav active="account" go={go} />
  </div>
);

Object.assign(window, { HomeScreen, WatchlistScreen, OrdersScreen, AccountScreen });
