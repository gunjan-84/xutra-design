// Screens: Portfolio (holdings + positions, broker-aware filter)
const { fmt: fmtP } = window.MarketData;

const HOLDINGS = [
  { symbol: "RELIANCE",  qty: 45, avg: 2450.20, ltp: 2984.15, broker: "zerodha" },
  { symbol: "HDFCBANK",  qty: 30, avg: 1500.00, ltp: 1442.80, broker: "zerodha" },
  { symbol: "TCS",       qty: 12, avg: 3650.00, ltp: 3921.40, broker: "upstox" },
  { symbol: "INFY",      qty: 60, avg: 1700.00, ltp: 1624.95, broker: "upstox" },
  { symbol: "ICICIBANK", qty: 80, avg:  950.00, ltp: 1085.30, broker: "groww" },
];
const POSITIONS = [
  { symbol: "NIFTY 22400 CE",     product: "MIS", qty: 50,  avg: 126.45, ltp: 142.15, side: "BUY",  broker: "zerodha" },
  { symbol: "ZOMATO",             product: "MIS", qty: 200, avg: 175.05, ltp: 182.40, side: "BUY",  broker: "upstox" },
  { symbol: "BANKNIFTY 46500 PE", product: "MIS", qty: 25,  avg: 188.20, ltp: 162.55, side: "SELL", broker: "zerodha" },
];

const BrokerBadge = ({ brokerId, brokers }) => {
  const b = brokers.find(x => x.id === brokerId);
  if (!b) return null;
  return (
    <span title={b.name} style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 18, height: 18, borderRadius: 4,
      background: b.brandHue, color: "#fff",
      fontSize: 10, fontWeight: 800, lineHeight: 1, flexShrink: 0,
    }}>{b.monogram}</span>
  );
};

// ─────────────────────────────────────────
// Persisted order hook + Reorderable card wrapper
function usePersistedOrder(key, def) {
  const [order, setOrder] = React.useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const arr = JSON.parse(raw);
        // Only accept if it has the exact same set of ids
        if (Array.isArray(arr) && arr.length === def.length && def.every(id => arr.includes(id))) {
          return arr;
        }
      }
    } catch (_) {}
    return def;
  });
  React.useEffect(() => { try { localStorage.setItem(key, JSON.stringify(order)); } catch (_) {} }, [key, order]);
  return [order, setOrder];
}

function moveItem(arr, fromId, toId) {
  if (fromId === toId) return arr;
  const next = arr.filter(id => id !== fromId);
  const idx = next.indexOf(toId);
  next.splice(idx, 0, fromId);
  return next;
}

const ReorderItemContext = React.createContext(null);

const Reorderable = ({ id, drag, setDrag, order, setOrder, children }) => {
  const isActive = drag.active === id;
  const isOver = drag.over === id && drag.active && drag.active !== id;

  // Touch drag support — native HTML5 drag doesn't fire on touchscreens, so
  // we mirror the same {active, over} state using touch events from the handle.
  const startTouchDrag = React.useCallback((e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    setDrag({ active: id, over: null });

    const onMove = (ev) => {
      const t = ev.touches && ev.touches[0] ? ev.touches[0] : ev;
      const el = document.elementFromPoint(t.clientX, t.clientY);
      const overEl = el && el.closest ? el.closest("[data-reorder-id]") : null;
      const overId = overEl ? overEl.getAttribute("data-reorder-id") : null;
      setDrag(d => d.over === overId ? d : { ...d, over: overId });
      if (ev.cancelable) ev.preventDefault();
    };
    const cleanup = () => {
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", onEnd);
    };
    const onEnd = () => {
      setDrag(curDrag => {
        if (curDrag.active && curDrag.over && curDrag.active !== curDrag.over) {
          setOrder(o => moveItem(o, curDrag.active, curDrag.over));
        }
        return { active: null, over: null };
      });
      cleanup();
    };
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd);
    document.addEventListener("touchcancel", onEnd);
  }, [id, setDrag, setOrder]);

  return (
    <ReorderItemContext.Provider value={{ id, startTouchDrag }}>
      <div
        data-reorder-id={id}
        draggable
        onDragStart={(e) => {
          setDrag({ active: id, over: null });
          try { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", id); } catch (_) {}
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (drag.over !== id) setDrag(d => ({ ...d, over: id }));
        }}
        onDragLeave={() => setDrag(d => (d.over === id ? { ...d, over: null } : d))}
        onDrop={(e) => {
          e.preventDefault();
          const from = drag.active || e.dataTransfer.getData("text/plain");
          if (from && from !== id) setOrder(moveItem(order, from, id));
          setDrag({ active: null, over: null });
        }}
        onDragEnd={() => setDrag({ active: null, over: null })}
        style={{
          position: "relative",
          opacity: isActive ? 0.45 : 1,
          transform: isActive ? "scale(0.985)" : "scale(1)",
          transition: "opacity 120ms, transform 120ms",
        }}
      >
        {isOver && (
          <div style={{
            position: "absolute", top: -6, left: 0, right: 0, height: 3,
            background: "var(--color-primary)", borderRadius: 9999,
            boxShadow: "0 0 0 4px color-mix(in oklab, var(--color-primary) 18%, transparent)",
            zIndex: 5,
          }} />
        )}
        {children}
      </div>
    </ReorderItemContext.Provider>
  );
};

const DragHandle = () => {
  const ctx = React.useContext(ReorderItemContext);
  return (
    <span
      aria-label="Drag to reorder"
      title="Drag to reorder"
      onTouchStart={ctx ? (e) => ctx.startTouchDrag(e) : undefined}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        padding: 4, borderRadius: 6, cursor: "grab",
        color: "currentColor", opacity: 0.5,
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
      onMouseDown={(e) => e.currentTarget.style.cursor = "grabbing"}
      onMouseUp={(e) => e.currentTarget.style.cursor = "grab"}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>drag_indicator</span>
    </span>
  );
};

const BrokerFilterRow = ({ brokers, value, onChange, counts }) => {
  // Only show connected brokers + "All"
  const visible = [{ id: "all", name: "All", monogram: "∗" }, ...brokers.filter(b => b.connected)];
  return (
    <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "4px 0", flexShrink: 0 }} className="no-scrollbar">
      {visible.map(b => {
        const active = value === b.id;
        const total = counts[b.id] || 0;
        return (
          <button key={b.id} onClick={() => onChange(b.id)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "8px 14px", borderRadius: 10,
                    border: "1px solid " + (active ? "var(--color-primary)" : "var(--color-outline-variant)"),
                    background: active ? "color-mix(in oklab, var(--color-primary) 10%, var(--color-surface))" : "var(--color-surface)",
                    color: active ? "var(--color-primary)" : "var(--color-on-surface)",
                    cursor: "pointer", flexShrink: 0,
                    fontSize: 13, fontWeight: 600,
                    minHeight: 36,
                  }}>
            {b.id !== "all" && b.logo && (
              <img src={b.logo} alt=""
                   style={{ width: 18, height: 18, objectFit: "contain", display: "block", flexShrink: 0 }}
                   onError={(e) => { e.currentTarget.style.display = "none"; }} />
            )}
            <span>{b.name}</span>
            <span style={{
              fontSize: 11, fontWeight: 700, opacity: 0.6,
              minWidth: 12, textAlign: "center",
            }}>{total}</span>
          </button>
        );
      })}
    </div>
  );
};

const PortfolioScreen = ({ go }) => {
  const [tab, setTab] = React.useState("holdings");
  const [brokerFilter, setBrokerFilter] = React.useState("all");
  const ctx = React.useContext(window.XutraContext);
  const brokers = ctx.brokers || [];

  // Reorderable section list (persisted)
  const HOLDINGS_DEFAULT_ORDER = ["summary", "allocation", "list"];
  const POSITIONS_DEFAULT_ORDER = ["summary", "list"];

  const [holdingsOrder, setHoldingsOrder] = usePersistedOrder("xutra.portfolio.holdings.order", HOLDINGS_DEFAULT_ORDER);
  const [positionsOrder, setPositionsOrder] = usePersistedOrder("xutra.portfolio.positions.order", POSITIONS_DEFAULT_ORDER);

  // Drag state (which id is being dragged, which is hovered)
  const [drag, setDrag] = React.useState({ active: null, over: null });

  // Whenever broker filter targets a broker that's now disconnected, reset
  React.useEffect(() => {
    if (brokerFilter !== "all" && !brokers.find(b => b.id === brokerFilter && b.connected)) {
      setBrokerFilter("all");
    }
  }, [brokers, brokerFilter]);

  const filteredHoldings = brokerFilter === "all" ? HOLDINGS : HOLDINGS.filter(h => h.broker === brokerFilter);
  const filteredPositions = brokerFilter === "all" ? POSITIONS : POSITIONS.filter(p => p.broker === brokerFilter);

  const hInvested = filteredHoldings.reduce((s, h) => s + h.qty * h.avg, 0);
  const hCurrent = filteredHoldings.reduce((s, h) => s + h.qty * h.ltp, 0);
  const hPnl = hCurrent - hInvested;
  const hPct = hInvested ? (hPnl / hInvested) * 100 : 0;
  const hUp = hPnl >= 0;

  const pInvested = filteredPositions.reduce((s, p) => s + p.qty * p.avg, 0);
  const pCurrent = filteredPositions.reduce((s, p) => s + p.qty * p.ltp, 0);
  const pPnl = filteredPositions.reduce((s, p) => s + (p.side === "BUY" ? 1 : -1) * (p.ltp - p.avg) * p.qty, 0);
  const pPct = pInvested ? (pPnl / pInvested) * 100 : 0;
  const pUp = pPnl >= 0;

  // Counts per broker (for chips)
  const sourceSet = tab === "holdings" ? HOLDINGS : POSITIONS;
  const counts = { all: sourceSet.length };
  brokers.forEach(b => { counts[b.id] = sourceSet.filter(x => x.broker === b.id).length; });

  return (
    <div className="app-screen">
      <TopBar />
      <main className="app-main" style={{ padding: "16px 16px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Tab pill */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4,
          padding: 4, background: "var(--color-surface-container-low)",
          borderRadius: 9999, border: "1px solid var(--color-outline-variant)",
        }}>
          {[
            ["holdings",  "Holdings",  HOLDINGS.length, hPnl],
            ["positions", "Positions", POSITIONS.length, pPnl],
          ].map(([k, label, count, pnl]) => {
            const active = tab === k;
            const up = pnl >= 0;
            return (
              <button key={k} onClick={() => setTab(k)}
                      style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4,
                        padding: "10px 16px", border: "none", cursor: "pointer", borderRadius: 9999,
                        background: active ? "var(--color-primary)" : "transparent",
                        color: active ? "var(--color-on-primary)" : "var(--color-on-surface-variant)",
                        boxShadow: active ? "0 2px 6px color-mix(in oklab, var(--color-primary) 35%, transparent)" : "none",
                        fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                        transition: "background 120ms, color 120ms",
                      }}>
                <span>{label}</span>
                <span className="font-data-mono" style={{
                  opacity: active ? 0.9 : 1,
                  color: active ? "inherit" : (up ? "var(--color-secondary)" : "var(--color-error)"),
                }}>· {count}</span>
              </button>
            );
          })}
        </div>

        {/* Broker filter row */}
        <BrokerFilterRow
          brokers={brokers}
          value={brokerFilter}
          onChange={setBrokerFilter}
          counts={counts}
        />

        {tab === "holdings" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {holdingsOrder.filter(id => id !== "allocation" || brokerFilter === "all").map(id => (
              <Reorderable key={id} id={id}
                           drag={drag} setDrag={setDrag}
                           order={holdingsOrder} setOrder={setHoldingsOrder}>
                {id === "summary" && (
                  <section style={{
                    position: "relative",
                    background: "var(--color-surface-container-high)",
                    color: "var(--color-on-surface)",
                    borderRadius: 18, padding: 20,
                    border: "1px solid var(--color-outline-variant)",
                  }}>
                    <div style={{ position: "absolute", top: 8, right: 8, color: "var(--color-on-surface-variant)" }}><DragHandle /></div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <p className="font-label-caps" style={{ margin: 0, color: "var(--color-on-surface-variant)" }}>Current Value</p>
                        <p className="font-data-mono" style={{ fontSize: 28, fontWeight: 800, margin: "4px 0 0" }}>{fmtP(hCurrent)}</p>
                      </div>
                      <div style={{ textAlign: "right", marginRight: 24 }}>
                        <p className="font-label-caps" style={{ margin: 0, color: "var(--color-on-surface-variant)" }}>Invested</p>
                        <p className="font-data-mono" style={{ fontSize: 15, margin: "4px 0 0" }}>{fmtP(hInvested)}</p>
                      </div>
                    </div>
                    <div style={{ marginTop: 24, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                      <div>
                        <p className="font-label-caps" style={{ margin: 0, color: "var(--color-on-surface-variant)" }}>Overall P&amp;L</p>
                        <p className="font-data-mono" style={{ fontSize: 22, fontWeight: 700, margin: "4px 0 0",
                                                               color: hUp ? "var(--color-secondary)" : "var(--color-error)" }}>
                          {hUp ? "+" : ""}{fmtP(hPnl)}
                        </p>
                      </div>
                      <span style={{
                        padding: "6px 12px", borderRadius: 9999,
                        background: hUp
                          ? "color-mix(in oklab, var(--color-secondary) 14%, transparent)"
                          : "color-mix(in oklab, var(--color-error) 14%, transparent)",
                        color: hUp ? "var(--color-secondary)" : "var(--color-error)",
                        fontSize: 13, fontWeight: 700,
                      }}>{hUp ? "+" : ""}{hPct.toFixed(2)}%</span>
                    </div>
                  </section>
                )}

                {id === "allocation" && brokerFilter === "all" && (
                  <section className="card" style={{ padding: 16, position: "relative" }}>
                    <div style={{ position: "absolute", top: 6, right: 6 }}><DragHandle /></div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingRight: 28 }}>
                      <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Allocation by broker</h3>
                      <span className="font-label-caps" style={{ color: "var(--color-primary)", cursor: "pointer" }}>BY SECTOR</span>
                    </div>
                    <BrokerAllocation holdings={HOLDINGS} brokers={brokers} />
                  </section>
                )}

                {id === "list" && (
                  <section className="card" style={{ overflow: "hidden", position: "relative" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px",
                                  background: "var(--color-surface-container-low)",
                                  borderBottom: "1px solid var(--color-outline-variant)" }}>
                      <span className="font-label-caps" style={{ color: "var(--color-on-surface-variant)" }}>Holding</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span className="font-label-caps" style={{ color: "var(--color-on-surface-variant)" }}>P&amp;L</span>
                        <DragHandle />
                      </span>
                    </div>
                    {filteredHoldings.length === 0 ? (
                      <div style={{ padding: 28, textAlign: "center", fontSize: 13, color: "var(--color-on-surface-variant)" }}>
                        No holdings on this broker.
                      </div>
                    ) : (
                      <div className="list-divide">
                        {filteredHoldings.map(h => {
                          const v = h.qty * h.ltp;
                          const i = h.qty * h.avg;
                          const p = v - i;
                          const pp = (p / i) * 100;
                          const isUp = p >= 0;
                          return (
                            <div key={h.symbol + h.broker}
                                 onClick={() => go({ name: "instrument", symbol: h.symbol })}
                                 style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                                          padding: "10px 16px", cursor: "pointer" }}>
                              <div style={{ display: "flex", flexDirection: "column" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <BrokerBadge brokerId={h.broker} brokers={brokers} />
                                  <span style={{ fontSize: 14, fontWeight: 700 }}>{h.symbol}</span>
                                </div>
                                <span style={{ fontSize: 11, color: "var(--color-on-surface-variant)", marginTop: 4 }}>
                                  {h.qty} × {fmtP(h.avg)} <span style={{ color: "var(--color-outline)" }}>avg</span>
                                </span>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <div className="font-data-mono" style={{ fontSize: 15, fontWeight: 600, color: isUp ? "var(--color-secondary)" : "var(--color-error)" }}>
                                  {isUp ? "+" : ""}{fmtP(p)}
                                </div>
                                <div style={{ fontSize: 11, color: "var(--color-on-surface-variant)" }}>
                                  LTP <span className="font-data-mono">{fmtP(h.ltp)}</span> · {isUp ? "+" : ""}{pp.toFixed(2)}%
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                )}
              </Reorderable>
            ))}
          </div>
        )}

        {tab === "positions" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {positionsOrder.map(id => (
              <Reorderable key={id} id={id}
                           drag={drag} setDrag={setDrag}
                           order={positionsOrder} setOrder={setPositionsOrder}>
                {id === "summary" && (
                  <section style={{
                    position: "relative",
                    background: "var(--color-surface-container-high)",
                    borderRadius: 18, padding: 20,
                    border: "1px solid var(--color-outline-variant)",
                  }}>
                    <div style={{ position: "absolute", top: 8, right: 8 }}><DragHandle /></div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <p className="font-label-caps" style={{ margin: 0, color: "var(--color-on-surface-variant)" }}>Current Value</p>
                        <p className="font-data-mono" style={{ fontSize: 28, fontWeight: 800, margin: "4px 0 0" }}>{fmtP(pCurrent)}</p>
                      </div>
                      <div style={{ textAlign: "right", marginRight: 24 }}>
                        <p className="font-label-caps" style={{ margin: 0, color: "var(--color-on-surface-variant)" }}>Invested</p>
                        <p className="font-data-mono" style={{ fontSize: 15, margin: "4px 0 0" }}>{fmtP(pInvested)}</p>
                      </div>
                    </div>
                    <div style={{ marginTop: 24, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                      <div>
                        <p className="font-label-caps" style={{ margin: 0, color: "var(--color-on-surface-variant)" }}>Day P&amp;L</p>
                        <p className="font-data-mono" style={{ fontSize: 22, fontWeight: 700, margin: "4px 0 0",
                                                               color: pUp ? "var(--color-secondary)" : "var(--color-error)" }}>
                          {pUp ? "+" : ""}{fmtP(pPnl)}
                        </p>
                      </div>
                      <span style={{
                        padding: "6px 12px", borderRadius: 9999,
                        background: pUp ? "color-mix(in oklab, var(--color-secondary) 15%, transparent)" : "color-mix(in oklab, var(--color-error) 15%, transparent)",
                        color: pUp ? "var(--color-secondary)" : "var(--color-error)",
                        fontSize: 13, fontWeight: 700,
                      }}>{pUp ? "+" : ""}{pPct.toFixed(2)}%</span>
                    </div>
                  </section>
                )}

                {id === "list" && (
                  <section className="card" style={{ overflow: "hidden" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px",
                                  background: "var(--color-surface-container-low)",
                                  borderBottom: "1px solid var(--color-outline-variant)" }}>
                      <span className="font-label-caps" style={{ color: "var(--color-on-surface-variant)" }}>Position</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span className="font-label-caps" style={{ color: "var(--color-on-surface-variant)" }}>P&amp;L</span>
                        <DragHandle />
                      </span>
                    </div>
                    {filteredPositions.length === 0 ? (
                      <div style={{ padding: 28, textAlign: "center", fontSize: 13, color: "var(--color-on-surface-variant)" }}>
                        No open positions on this broker.
                      </div>
                    ) : (
                      <div className="list-divide">
                        {filteredPositions.map(p => {
                          const dir = p.side === "BUY" ? 1 : -1;
                          const pl = dir * (p.ltp - p.avg) * p.qty;
                          const plPct = ((p.ltp - p.avg) / p.avg) * 100 * dir;
                          const isUp = pl >= 0;
                          return (
                            <div key={p.symbol + p.broker}
                                 onClick={() => go({ name: "instrument", symbol: p.symbol })}
                                 style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                                          padding: "10px 16px", cursor: "pointer" }}>
                              <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <BrokerBadge brokerId={p.broker} brokers={brokers} />
                                  <span style={{
                                    padding: "2px 6px", borderRadius: 4,
                                    fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                                    background: p.side === "BUY"
                                      ? "color-mix(in oklab, var(--color-secondary) 15%, transparent)"
                                      : "color-mix(in oklab, var(--color-error) 15%, transparent)",
                                    color: p.side === "BUY" ? "var(--color-secondary)" : "var(--color-error)",
                                  }}>{p.side}</span>
                                  <span style={{ fontSize: 14, fontWeight: 700 }}>{p.symbol}</span>
                                </div>
                                <span style={{ fontSize: 11, color: "var(--color-on-surface-variant)", marginTop: 4 }}>
                                  {p.product} · {p.qty} Qty · Avg {fmtP(p.avg)}
                                </span>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <div className="font-data-mono" style={{ fontSize: 15, fontWeight: 600,
                                                                         color: isUp ? "var(--color-secondary)" : "var(--color-error)" }}>
                                  {isUp ? "+" : ""}{fmtP(pl)}
                                </div>
                                <div style={{ fontSize: 11, color: "var(--color-on-surface-variant)" }}>
                                  LTP <span className="font-data-mono">{fmtP(p.ltp)}</span> · {isUp ? "+" : ""}{plPct.toFixed(2)}%
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                )}
              </Reorderable>
            ))}
          </div>
        )}
      </main>
      <BottomNav active="portfolio" go={go} />
    </div>
  );
};

// Allocation by broker — horizontal stacked bar + legend
const BrokerAllocation = ({ holdings, brokers }) => {
  const byBroker = {};
  let total = 0;
  holdings.forEach(h => {
    const v = h.qty * h.ltp;
    total += v;
    byBroker[h.broker] = (byBroker[h.broker] || 0) + v;
  });
  const rows = brokers.filter(b => byBroker[b.id]).map(b => ({
    ...b,
    value: byBroker[b.id],
    pct: (byBroker[b.id] / total) * 100,
  }));

  return (
    <>
      <div style={{ display: "flex", height: 10, width: "100%", borderRadius: 9999, overflow: "hidden" }}>
        {rows.map(r => (
          <div key={r.id} style={{ background: r.brandHue, width: r.pct + "%" }} />
        ))}
      </div>
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
        {rows.map(r => (
          <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <span style={{ width: 8, height: 8, borderRadius: 9999, background: r.brandHue }} />
            <span style={{ flex: 1 }}>{r.name}</span>
            <span className="font-data-mono" style={{ color: "var(--color-on-surface-variant)" }}>{window.MarketData.fmt(r.value)}</span>
            <span className="font-data-mono" style={{ color: "var(--color-on-surface-variant)", width: 44, textAlign: "right" }}>{r.pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </>
  );
};

Object.assign(window, { PortfolioScreen, BrokerFilterRow, BrokerBadge, Reorderable, DragHandle, usePersistedOrder });
