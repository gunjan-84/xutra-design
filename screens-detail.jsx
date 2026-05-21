// Screens: Instrument detail + Trade (buy/sell)
const { fmt: fmtD, findInstrument } = window.MarketData;

// ───────────────────────────────────────── INSTRUMENT DETAIL
const RANGES = ["1D", "1W", "1M", "1Y"];

const PriceChartSVG = () => (
  <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100" style={{ position: "relative", zIndex: 0 }}>
    <path
      d="M 0 60 L 10 55 L 20 65 L 30 50 L 40 70 L 50 45 L 60 60 L 70 40 L 80 55 L 90 35 L 100 45"
      fill="none" stroke="var(--color-primary)"
      strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.8"
    />
  </svg>
);

const InstrumentScreen = ({ symbol, go }) => {
  const inst = findInstrument(symbol);
  const up = inst.changePct >= 0;
  const [range, setRange] = React.useState("1D");

  return (
    <div className="app-screen">
      <TopBar variant="back" />
      <main className="app-main short" style={{ padding: "16px 16px 88px", display: "flex", flexDirection: "column", gap: 16 }}>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{inst.symbol}</h1>
          <span className="font-label-caps" style={{ color: "var(--color-on-surface-variant)" }}>
            {inst.exchange} · {inst.segment}
          </span>
        </div>

        <section style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <span className="font-data-mono" style={{ fontSize: 28, fontWeight: 700 }}>{fmtD(inst.price)}</span>
            <div className="font-data-mono" style={{ display: "flex", alignItems: "center", gap: 4,
                                                     color: up ? "var(--color-secondary)" : "var(--color-error)",
                                                     fontSize: 15 }}>
              <Icon name={up ? "arrow_drop_up" : "arrow_drop_down"} size={20} />
              <span>{up ? "+" : ""}{inst.changeAbs?.toFixed(2)} ({inst.changePct.toFixed(2)}%)</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {RANGES.map((r) => {
              const active = range === r;
              return (
                <button key={r} onClick={() => setRange(r)}
                        style={{
                          padding: "6px 10px", borderRadius: 6,
                          background: active ? "var(--color-surface-container-low)" : "transparent",
                          border: active ? "1px solid var(--color-outline-variant)" : "1px solid transparent",
                          cursor: "pointer",
                          fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
                          color: active ? "var(--color-primary)" : "var(--color-on-surface-variant)",
                        }}>{r}</button>
              );
            })}
          </div>
        </section>

        {/* Chart */}
        <section style={{ position: "relative", background: "var(--color-surface-container-lowest)",
                          borderRadius: 10, border: "1px solid var(--color-outline-variant)",
                          overflow: "hidden", minHeight: 240, flexShrink: 0 }}>
          <div style={{
            position: "absolute", top: 12, right: 12, zIndex: 2,
            display: "flex", padding: 2,
            background: "var(--color-surface-container-low)",
            borderRadius: 10,
            border: "1px solid color-mix(in oklab, var(--color-outline-variant) 50%, transparent)",
          }}>
            {[
              ["show_chart", true],
              ["candlestick_chart", false],
              ["bar_chart", false],
            ].map(([icon, active], idx) => (
              <button key={idx} style={{
                padding: "4px 8px", borderRadius: 8, border: "none",
                background: active ? "var(--color-surface)" : "transparent",
                boxShadow: active ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                cursor: "pointer",
              }}>
                <Icon name={icon} size={18}
                      color={active ? "var(--color-primary)" : "var(--color-on-surface-variant)"} />
              </button>
            ))}
          </div>

          <div className="chart-grid" />

          <div style={{ position: "relative", width: "100%", height: "100%", padding: 4 }}>
            <div style={{
              position: "absolute", left: 4, right: 4, bottom: 4, height: "70%",
              clipPath: "polygon(0% 100%, 0% 40%, 10% 35%, 20% 45%, 30% 30%, 40% 50%, 50% 25%, 60% 40%, 70% 20%, 80% 35%, 90% 15%, 100% 25%, 100% 100%)",
            }} className="chart-gradient" />
            <PriceChartSVG />
          </div>
        </section>

        {/* Performance & stats */}
        <section className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 16px" }}>Performance &amp; Stats</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", rowGap: 16, columnGap: 16 }}>
            {[
              ["Open", "2,904.00", null],
              ["Prev Close", "2,903.45", null],
              ["Day High", "2,958.00", "var(--color-secondary)"],
              ["Day Low", "2,900.10", "var(--color-error)"],
              ["52W High", "3,024.90", null],
              ["52W Low", "2,220.30", null],
              ["Volume", "4.2M", null],
              ["Avg Vol", "5.8M", null],
            ].map(([l, v, c]) => (
              <div key={l} style={{ borderBottom: "1px solid var(--color-surface-container)", paddingBottom: 4 }}>
                <p className="font-label-caps" style={{ margin: 0, color: "var(--color-outline)" }}>{l}</p>
                <p className="font-data-mono" style={{ margin: "2px 0 0", fontSize: 15, color: c || "var(--color-on-surface)" }}>{v}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { lo: "DAY LOW", hi: "DAY HIGH", left: "10%", right: "30%", marker: "75%" },
              { lo: "52W LOW", hi: "52W HIGH", left: "20%", right: "5%", marker: "90%" },
            ].map((r) => (
              <div key={r.lo}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}
                     className="font-label-caps">
                  <span style={{ color: "var(--color-on-surface-variant)" }}>{r.lo}</span>
                  <span style={{ color: "var(--color-on-surface-variant)" }}>{r.hi}</span>
                </div>
                <div style={{ width: "100%", height: 4, background: "var(--color-surface-container)", borderRadius: 9999, position: "relative" }}>
                  <div style={{ position: "absolute", top: 0, bottom: 0, left: r.left, right: r.right,
                                background: "var(--color-primary)", borderRadius: 9999 }} />
                  <div style={{ position: "absolute", top: "50%", left: r.marker, transform: "translate(-50%, -50%)",
                                width: 10, height: 10, background: "var(--color-on-background)",
                                border: "2px solid #fff", borderRadius: 9999 }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* News */}
        <section className="card" style={{ padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Latest News</h3>
            <span className="font-label-caps" style={{ color: "var(--color-primary)", cursor: "pointer" }}>VIEW ALL</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              ["Reliance Jio launches new 5G international roaming packs…", "2h ago · Reuters"],
              ["Reliance Retail valuation nears $100B as growth accelerates…", "5h ago · Bloomberg"],
              ["Quarterly earnings beat estimates; energy margins strong.", "1d ago · CNBC"],
            ].map(([t, m], i, arr) => (
              <div key={i}>
                <article style={{ display: "flex", gap: 12, padding: "4px 0", cursor: "pointer" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ margin: 0, fontSize: 15, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{t}</h4>
                    <p className="font-label-caps" style={{ margin: "4px 0 0", color: "var(--color-outline)" }}>{m}</p>
                  </div>
                </article>
                {i < arr.length - 1 ? <div style={{ height: 1, background: "var(--color-outline-variant)", opacity: 0.3, marginTop: 12 }} /> : null}
              </div>
            ))}
          </div>
        </section>

        {/* Fundamentals */}
        <section className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 16px" }}>Fundamentals</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              ["Market Cap", "19.82T"],
              ["P/E Ratio", "28.45"],
              ["Div Yield", "0.31%"],
              ["ROE", "12.8%"],
              ["Book Value", "1,042.1"],
              ["EPS", "104.85"],
            ].map(([l, v]) => (
              <div key={l} style={{ padding: 4 }}>
                <p className="font-label-caps" style={{ margin: 0, color: "var(--color-outline)" }}>{l}</p>
                <p className="font-data-mono" style={{ margin: "2px 0 0", fontSize: 15 }}>{v}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Corporate events */}
        <section className="card" style={{ padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Corporate Events</h3>
            <div style={{ display: "flex", gap: 16 }}>
              <span className="font-label-caps" style={{ borderBottom: "2px solid var(--color-primary)", paddingBottom: 2, cursor: "pointer" }}>EVENTS</span>
              <span className="font-label-caps" style={{ color: "var(--color-on-surface-variant)", cursor: "pointer" }}>ANALYSIS</span>
              <span className="font-label-caps" style={{ color: "var(--color-on-surface-variant)", cursor: "pointer" }}>FINANCIALS</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
            <span style={{ fontWeight: 600 }}>2025</span>
            <span className="font-label-caps" style={{ fontSize: 10, color: "var(--color-outline)" }}>23 EVENTS</span>
          </div>
          {[
            { d: "12", m: "Nov", title: "Dividend", tag: "UPCOMING", value: "3.34", sub: "Per Share" },
            { d: "28", m: "Nov", title: "Bonus", tag: null, value: "1:2", sub: "Ratio" },
          ].map((e, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "8px 0",
              borderBottom: i === 0 ? "1px solid color-mix(in oklab, var(--color-surface-container) 50%, transparent)" : "none",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 8,
                              background: "var(--color-surface-container-low)",
                              border: "1px solid var(--color-outline-variant)",
                              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, lineHeight: 1 }}>{e.d}</span>
                  <span style={{ fontSize: 8, fontWeight: 700, color: "var(--color-on-surface-variant)", marginTop: 2 }}>{e.m.toUpperCase()}</span>
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{e.title}</span>
                    {e.tag && (
                      <span style={{ background: "#403000", color: "#FFD600", fontSize: 8, padding: "2px 4px", borderRadius: 3, fontWeight: 700 }}>
                        {e.tag}
                      </span>
                    )}
                  </div>
                  <span className="font-label-caps" style={{ fontSize: 10, color: "var(--color-outline)" }}>EX DATE</span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{e.value}</p>
                <p className="font-label-caps" style={{ margin: 0, fontSize: 9, color: "var(--color-outline)" }}>{e.sub.toUpperCase()}</p>
              </div>
            </div>
          ))}
        </section>
      </main>

      {/* Sell/Buy action bar */}
      <div className="action-bar">
        <button className="icon-btn"><Icon name="notifications_active" size={22} /></button>
        <button className="bg-error" style={{ flex: 1, padding: "12px 16px", border: "none", borderRadius: 10,
                                              fontWeight: 700, fontSize: 15, cursor: "pointer", color: "#fff" }}
                onClick={() => go({ name: "trade", symbol: inst.symbol, mode: "sell" })}>
          SELL
        </button>
        <button className="bg-secondary" style={{ flex: 1, padding: "12px 16px", border: "none", borderRadius: 10,
                                                   fontWeight: 700, fontSize: 15, cursor: "pointer", color: "#fff" }}
                onClick={() => go({ name: "trade", symbol: inst.symbol, mode: "buy" })}>
          BUY
        </button>
      </div>
      <BottomNav active="watchlist" go={go} />
    </div>
  );
};


// ───────────────────────────────────────── TRADE
const TradeScreen = ({ symbol, mode, go, goReplace, forceHold }) => {
  const inst = findInstrument(symbol);
  const isBuy = mode === "buy";
  const ctx = React.useContext(window.XutraContext);
  const brokers = ctx.brokers || [];
  const connectedBrokers = brokers.filter(b => b.connected);

  const [product, setProduct] = React.useState(isBuy ? "INTRADAY" : "LONGTERM");
  const [orderType, setOrderType] = React.useState("LIMIT");
  const [qty, setQty] = React.useState(1);
  const [price, setPrice] = React.useState(inst.price);
  const [toast, setToast] = React.useState(null);

  // Default to the active price feed broker if connected, else first connected
  const [orderBrokerId, setOrderBrokerId] = React.useState(() => {
    if (ctx.feedBroker?.connected) return ctx.feedBroker.id;
    return connectedBrokers[0]?.id || null;
  });
  // If the currently selected broker gets disconnected, fall back
  React.useEffect(() => {
    if (orderBrokerId && !brokers.find(b => b.id === orderBrokerId && b.connected)) {
      setOrderBrokerId(connectedBrokers[0]?.id || null);
    }
  }, [brokers]);
  const orderBroker = brokers.find(b => b.id === orderBrokerId) || null;

  const accent = {
    border: isBuy ? "var(--color-secondary)" : "var(--color-error)",
    bg: isBuy ? "color-mix(in oklab, var(--color-secondary) 8%, transparent)" : "color-mix(in oklab, var(--color-error) 8%, transparent)",
    text: isBuy ? "var(--color-secondary)" : "var(--color-error)",
    textMuted: isBuy ? "color-mix(in oklab, var(--color-secondary) 70%, var(--color-on-surface))" : "color-mix(in oklab, var(--color-error) 70%, var(--color-on-surface))",
  };

  const value = price * qty;
  const needsHold = forceHold || value > 50000;

  function confirmOrder() {
    setToast({
      side: mode.toUpperCase(),
      symbol: inst.symbol,
      qty, price,
      broker: orderBroker,
    });
    setTimeout(() => {
      setToast(null);
      // Replace, not push: back from Orders skips the trade screen
      // and lands on the page that opened the trade flow.
      goReplace({ name: "orders" });
    }, 1400);
  }

  return (
    <div className="app-screen">
      <TopBar
        variant="close"
        title={
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
            <h1 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
              {inst.symbol} <span style={{ fontSize: 11, color: "var(--color-on-surface-variant)", fontWeight: 400 }}>{inst.exchange}</span>
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
              <span className="font-data-mono" style={{ fontSize: 11, color: "var(--color-secondary)" }}>{fmtD(inst.price)}</span>
              <span className="font-label-caps" style={{ fontSize: 10, color: "var(--color-secondary)",
                                                         background: "color-mix(in oklab, var(--color-secondary) 12%, transparent)",
                                                         padding: "1px 4px", borderRadius: 4 }}>
                {inst.changePct >= 0 ? "+" : ""}{inst.changePct.toFixed(2)}%
              </span>
            </div>
          </div>
        }
        right={
          <>
            <button className="topbar-icon-btn"><Icon name="search" size={22} /></button>
            <button className="topbar-icon-btn"><Icon name="more_vert" size={22} /></button>
          </>
        }
      />

      <main className="app-main" style={{ padding: "16px 16px 220px", display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Buy/Sell switch */}
        <div style={{
          background: "var(--color-surface-container-low)",
          padding: 4, borderRadius: 10, display: "flex",
        }}>
          {["buy", "sell"].map(m => {
            const active = m === mode;
            const bg = m === "buy" ? "var(--color-secondary)" : "var(--color-error)";
            return (
              <button key={m}
                      onClick={() => goReplace({ name: "trade", symbol, mode: m })}
                      style={{
                        flex: 1, padding: "10px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                        background: active ? bg : "transparent",
                        color: active ? "#fff" : "var(--color-on-surface-variant)",
                        fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                        boxShadow: active ? "0 2px 6px rgba(0,0,0,0.1)" : "none",
                      }}>
                {m.toUpperCase()}
              </button>
            );
          })}
        </div>

        {/* Place order via (broker selector) */}
        <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <label className="font-label-caps" style={{ color: "var(--color-on-surface-variant)" }}>PLACE ORDER VIA</label>
            {connectedBrokers.length === 0 && (
              <button onClick={() => ctx.openSettings && ctx.openSettings()}
                      style={{ background: "transparent", border: "none", color: "var(--color-primary)",
                               fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                               cursor: "pointer" }}>
                CONNECT BROKER
              </button>
            )}
          </div>

          {connectedBrokers.length === 0 ? (
            <div style={{
              padding: 14, borderRadius: 10,
              border: "1px dashed var(--color-outline-variant)",
              background: "var(--color-surface-container-low)",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <Icon name="signal_disconnected" size={20} color="var(--color-on-surface-variant)" />
              <span style={{ fontSize: 13, color: "var(--color-on-surface-variant)" }}>
                No broker connected. Connect one to place orders.
              </span>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, margin: "0 -2px" }} className="no-scrollbar">
              {connectedBrokers.map(b => {
                const active = orderBrokerId === b.id;
                return (
                  <button key={b.id} onClick={() => setOrderBrokerId(b.id)}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 10,
                            padding: "8px 12px 8px 8px", borderRadius: 12, cursor: "pointer",
                            background: active ? "color-mix(in oklab, var(--color-primary) 10%, var(--color-surface))" : "var(--color-surface)",
                            border: "1.5px solid " + (active ? "var(--color-primary)" : "var(--color-outline-variant)"),
                            flexShrink: 0, position: "relative",
                          }}>
                    <window.BrokerLogo broker={b} size={28} square />
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.2 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: active ? "var(--color-primary)" : "var(--color-on-surface)" }}>{b.name}</span>
                      <span className="font-data-mono" style={{ fontSize: 11, color: "var(--color-on-surface-variant)" }}>
                        ₹{(b.funds?.available || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                    {active && (
                      <span style={{
                        width: 18, height: 18, borderRadius: 9999,
                        background: "var(--color-primary)", color: "var(--color-on-primary)",
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        marginLeft: 2,
                      }}>
                        <Icon name="check" size={14} color="#fff" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Product */}
        <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label className="font-label-caps" style={{ color: "var(--color-on-surface-variant)" }}>PRODUCT</label>
          <div style={{ display: "flex", gap: 12 }}>
            {[
              { k: "INTRADAY", t: "Intraday", s: "MIS" },
              { k: "LONGTERM", t: "Longterm", s: "CNC" },
            ].map(p => {
              const active = product === p.k;
              return (
                <button key={p.k} onClick={() => setProduct(p.k)}
                        style={{
                          flex: 1, padding: "16px 20px", borderRadius: 10,
                          display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4,
                          border: active ? `2px solid ${accent.border}` : "1px solid var(--color-outline-variant)",
                          background: active ? accent.bg : "transparent",
                          cursor: "pointer", textAlign: "left",
                        }}>
                  <span style={{ fontSize: 17, fontWeight: 700, color: active ? accent.text : "var(--color-on-surface)" }}>{p.t}</span>
                  <span style={{ fontSize: 13, color: active ? accent.textMuted : "var(--color-on-surface-variant)" }}>{p.s}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Qty / Price */}
        <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label className="font-label-caps" style={{ color: "var(--color-on-surface-variant)" }}>QUANTITY</label>
            <input type="number" value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                   className="text-input" />
            <span className="font-label-caps" style={{ fontSize: 10, color: "var(--color-on-surface-variant)" }}>Lot size: 1</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label className="font-label-caps" style={{ color: "var(--color-on-surface-variant)" }}>PRICE</label>
            <input type="number" step="0.05" value={price} onChange={(e) => setPrice(Number(e.target.value))}
                   className="text-input" />
            <span className="font-label-caps" style={{ fontSize: 10, color: "var(--color-on-surface-variant)" }}>Tick: 0.05</span>
          </div>
        </section>

        {/* Order type */}
        <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label className="font-label-caps" style={{ color: "var(--color-on-surface-variant)" }}>ORDER TYPE</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 4 }}>
            {["MARKET", "LIMIT", "SL", "SL-M"].map(t => {
              const active = orderType === t;
              return (
                <button key={t} onClick={() => setOrderType(t)}
                        style={{
                          padding: "10px 0", borderRadius: 10,
                          border: active ? `2px solid ${accent.border}` : "1px solid var(--color-outline-variant)",
                          background: active ? accent.bg : "transparent",
                          color: active ? accent.text : "var(--color-on-surface-variant)",
                          fontSize: 11, fontWeight: active ? 800 : 600, letterSpacing: "0.08em",
                          cursor: "pointer",
                        }}>
                  {t}
                </button>
              );
            })}
          </div>
        </section>

        <div style={{ borderTop: "1px solid var(--color-outline-variant)", paddingTop: 16 }}>
          <button style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            width: "100%", padding: "8px 0", border: "none", background: "transparent",
            color: accent.text, fontSize: 15, cursor: "pointer",
          }}>
            <span>Advanced Options</span>
            <Icon name="expand_more" size={22} />
          </button>
        </div>

        {/* Inventory */}
        <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            ["Holdings", "inventory_2", "45 Qty"],
            ["Avg. Price", "payments", "2,450.20"],
          ].map(([l, ic, v]) => (
            <div key={l} style={{ background: "var(--color-surface-container-low)", padding: 16, borderRadius: 10,
                                  display: "flex", flexDirection: "column", gap: 4 }}>
              <span className="font-label-caps" style={{ color: "var(--color-on-surface-variant)" }}>{l}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name={ic} size={18} color="var(--color-on-surface-variant)" />
                <span className="font-data-mono">{v}</span>
              </div>
            </div>
          ))}
        </section>
      </main>

      {/* Footer */}
      <footer className="trade-footer">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span className="font-label-caps" style={{ color: "var(--color-on-surface-variant)" }}>Margin Required</span>
            <span style={{ fontSize: 17, fontWeight: 700 }}>₹{fmtD(value)}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <span className="font-label-caps" style={{ color: "var(--color-on-surface-variant)" }}>
              Available{orderBroker ? ` · ${orderBroker.name}` : ""}
            </span>
            <span className="font-data-mono" style={{
              color: orderBroker ? "var(--color-secondary)" : "var(--color-on-surface-variant)",
            }}>
              {orderBroker
                ? "₹" + (orderBroker.funds?.available || 0).toLocaleString("en-IN")
                : "—"}
            </span>
          </div>
        </div>
        {orderBroker && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "6px 10px", borderRadius: 8,
            background: "var(--color-surface-container-low)",
            marginBottom: 12,
          }}>
            <window.BrokerLogo broker={orderBroker} size={20} square />
            <span style={{ fontSize: 11, color: "var(--color-on-surface-variant)" }}>
              Routing via <span style={{ fontWeight: 700, color: "var(--color-on-surface)" }}>{orderBroker.name}</span>
            </span>
          </div>
        )}
        <HoldToConfirmButton
          variant={isBuy ? "buy" : "sell"}
          label={`${isBuy ? "BUY" : "SELL"} ${inst.symbol}`}
          sublabel={orderBroker ? `₹${fmtD(value)} via ${orderBroker.name}` : `₹${fmtD(value)} order`}
          requireHold={needsHold}
          holdMs={3000}
          onConfirm={orderBroker ? confirmOrder : undefined}
        />
      </footer>

      {toast && (
        <div style={{
          position: "absolute", bottom: 100, left: "50%", transform: "translateX(-50%)",
          background: "var(--color-on-surface)", color: "var(--color-surface)",
          padding: "12px 20px", borderRadius: 12, fontSize: 13, fontWeight: 600,
          boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
          display: "flex", alignItems: "center", gap: 8, zIndex: 50,
          maxWidth: "90%",
        }}>
          <Icon name="check_circle" size={18}
                color={toast.side === "BUY" ? "var(--color-secondary)" : "var(--color-error)"} />
          <span>
            {toast.side} order placed · {toast.qty} {toast.symbol} @ {fmtD(toast.price)}
            {toast.broker && <> · <span style={{ fontWeight: 700 }}>{toast.broker.name}</span></>}
          </span>
        </div>
      )}
    </div>
  );
};

Object.assign(window, { InstrumentScreen, TradeScreen });
