// Settings drawer — slides in from left, lets user manage broker connections
// and pick which one provides the live price feed.

const BROKERS_SEED = [
  { id: "zerodha", name: "Zerodha",  monogram: "Z", brandHue: "#387ed1", logo: "https://cdn.xutra.in/brokers_logo/ZERODHA.png", tagline: "NSE · BSE · MCX",       connected: true,  lastSync: "Just now" },
  { id: "upstox",  name: "Upstox",   monogram: "U", brandHue: "#7b2bf9", logo: "https://cdn.xutra.in/brokers_logo/UPSTOX.png",  tagline: "Discount brokerage",  connected: true,  lastSync: "2 min ago" },
  { id: "groww",   name: "Groww",    monogram: "G", brandHue: "#00d09c", logo: "https://cdn.xutra.in/brokers_logo/GROWW.png",   tagline: "Stocks · F&O · MF",   connected: false, lastSync: "—" },
];

function useBrokers() {
  const KEY = "xutra.brokers.v2";
  const FEED_KEY = "xutra.priceFeed.v1";

  const [brokers, setBrokers] = React.useState(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Reconcile with seed in case shape changed
        return BROKERS_SEED.map(s => ({ ...s, ...(parsed.find(p => p.id === s.id) || {}) }));
      }
    } catch (_) {}
    return BROKERS_SEED;
  });
  const [feed, setFeed] = React.useState(() => {
    try { return localStorage.getItem(FEED_KEY) || "zerodha"; } catch (_) { return "zerodha"; }
  });

  React.useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(brokers)); } catch (_) {} }, [brokers]);
  React.useEffect(() => { try { localStorage.setItem(FEED_KEY, feed); } catch (_) {} }, [feed]);

  const setBroker = (id, patch) => setBrokers(bs => bs.map(b => b.id === id ? { ...b, ...patch } : b));
  return { brokers, setBrokers, feed, setFeed, setBroker };
}

// ─────────────────────────────────────────
// Login modal (overlays inside the drawer)
const LoginPrompt = ({ broker, onCancel, onConnect }) => {
  const [step, setStep] = React.useState("creds"); // creds → otp → done
  const [userId, setUserId] = React.useState("");
  const [pwd, setPwd] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  function next() {
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      if (step === "creds") setStep("otp");
      else if (step === "otp") onConnect();
    }, 700);
  }

  return (
    <div style={{
      position: "absolute", inset: 0, background: "rgba(15,12,30,0.4)",
      backdropFilter: "blur(6px)",
      zIndex: 70,
      display: "flex", alignItems: "flex-end",
    }} onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()}
           style={{
             width: "100%",
             background: "var(--color-surface)",
             borderTopLeftRadius: 20, borderTopRightRadius: 20,
             padding: "18px 20px 28px",
             boxShadow: "0 -10px 30px rgba(0,0,0,0.2)",
           }}>
        {/* handle */}
        <div style={{ width: 38, height: 4, borderRadius: 4, background: "var(--color-outline-variant)", margin: "0 auto 16px" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <BrokerMonogram broker={broker} size={40} />
          <div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>Connect to {broker.name}</div>
            <div style={{ fontSize: 12, color: "var(--color-on-surface-variant)" }}>
              {step === "creds" ? "Sign in with your broker credentials" : "Enter the 6-digit OTP we just sent"}
            </div>
          </div>
        </div>

        {step === "creds" && (
          <>
            <Field label="USER ID">
              <input className="text-input" placeholder="ABC1234"
                     value={userId} onChange={(e) => setUserId(e.target.value)} />
            </Field>
            <Field label="PASSWORD">
              <input className="text-input" type="password" placeholder="••••••••"
                     value={pwd} onChange={(e) => setPwd(e.target.value)} />
            </Field>
          </>
        )}

        {step === "otp" && (
          <Field label="2-FACTOR OTP">
            <input className="text-input" inputMode="numeric" maxLength={6} placeholder="000000"
                   value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                   style={{ letterSpacing: "0.4em", textAlign: "center", fontSize: 18 }} />
          </Field>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          <button className="btn-outline" style={{ flex: 1 }} onClick={onCancel}>Cancel</button>
          <button
            className="btn-primary"
            style={{ flex: 2, opacity: busy ? 0.7 : 1 }}
            disabled={busy || (step === "creds" ? (!userId || !pwd) : otp.length !== 6)}
            onClick={next}
          >
            {busy ? "Connecting…" : step === "creds" ? "Continue" : "Connect broker"}
          </button>
        </div>

        <p style={{ marginTop: 14, fontSize: 11, color: "var(--color-on-surface-variant)", textAlign: "center" }}>
          Xutra never stores your broker password. Tokens are revocable from your broker dashboard.
        </p>
      </div>
    </div>
  );
};

const Field = ({ label, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
    <span className="font-label-caps" style={{ color: "var(--color-on-surface-variant)" }}>{label}</span>
    {children}
  </div>
);

// ─────────────────────────────────────────
// BrokerLogo — renders the real broker mark on a white tile.
// Falls back to a letter monogram on image-load failure (e.g. CDN unreachable in preview).
const BrokerLogo = ({ broker, size = 44, dim = false, square = false }) => {
  const [errored, setErrored] = React.useState(false);
  const radius = square ? size * 0.22 : size * 0.28;

  if (errored || !broker.logo) {
    return (
      <div style={{
        width: size, height: size, borderRadius: radius,
        background: dim ? "var(--color-surface-container-high)" : broker.brandHue,
        color: dim ? "var(--color-on-surface-variant)" : "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 800, fontSize: size * 0.45,
        flexShrink: 0,
      }}>{broker.monogram}</div>
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: radius,
      background: "#fff",
      border: "1px solid var(--color-outline-variant)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: size * 0.14, boxSizing: "border-box",
      flexShrink: 0,
      filter: dim ? "grayscale(1)" : "none",
      opacity: dim ? 0.7 : 1,
      boxShadow: dim ? "none" : "0 2px 6px rgba(15,12,30,0.06)",
      transition: "all 200ms ease",
    }}>
      <img src={broker.logo} alt={broker.name}
           onError={() => setErrored(true)}
           style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
    </div>
  );
};

// Backwards-compat alias — older call sites still use BrokerMonogram
const BrokerMonogram = BrokerLogo;

// ─────────────────────────────────────────
// Broker row
const BrokerRow = ({ broker, onConnect, onDisconnect }) => {
  const dim = !broker.connected;
  return (
    <div style={{
      padding: "14px 16px",
      display: "flex", alignItems: "center", gap: 12,
      background: "transparent",
      opacity: dim ? 0.55 : 1,
      transition: "opacity 200ms ease, background 200ms ease",
    }}>
      <BrokerMonogram broker={broker} dim={dim} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>{broker.name}</span>
          {broker.connected ? (
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
              padding: "2px 6px", borderRadius: 3,
              background: "color-mix(in oklab, var(--color-secondary) 14%, transparent)",
              color: "var(--color-secondary)",
            }}>LIVE</span>
          ) : (
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
              padding: "2px 6px", borderRadius: 3,
              background: "var(--color-surface-container-high)",
              color: "var(--color-on-surface-variant)",
            }}>LOGGED OUT</span>
          )}
        </div>
        <span style={{ fontSize: 11, color: "var(--color-on-surface-variant)" }}>
          {broker.tagline} · {broker.connected ? `Synced ${broker.lastSync}` : "Connect to sync orders"}
        </span>
      </div>

      {broker.connected ? (
        <button
          onClick={onDisconnect}
          aria-label={`Log out of ${broker.name}`}
          title={`Log out of ${broker.name}`}
          style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "6px 10px", borderRadius: 8,
            border: "1px solid var(--color-outline-variant)",
            background: "var(--color-surface)",
            color: "var(--color-on-surface-variant)",
            fontSize: 11, fontWeight: 600, letterSpacing: "0.04em",
            cursor: "pointer", flexShrink: 0,
          }}
        >
          <Icon name="logout" size={14} color="var(--color-on-surface-variant)" />
          <span>Logout</span>
        </button>
      ) : (
        <button
          onClick={onConnect}
          style={{
            padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer",
            background: "var(--color-primary)", color: "var(--color-on-primary)",
            fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
            flexShrink: 0,
          }}
        >Connect</button>
      )}
    </div>
  );
};

// ─────────────────────────────────────────
// FeedDropdown — picks which connected broker streams the live price feed.
// Built as a custom popover so we can show broker logos in the trigger + list.
const FeedDropdown = ({ brokers, value, onChange }) => {
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef(null);
  const current = brokers.find(b => b.id === value) || brokers[0];

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  if (!current) return null;

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          width: "100%",
          padding: "12px 12px",
          borderRadius: 12,
          background: "var(--color-surface)",
          border: "1.5px solid " + (open ? "var(--color-primary)" : "var(--color-outline-variant)"),
          display: "flex", alignItems: "center", gap: 12,
          cursor: "pointer", textAlign: "left",
          transition: "border-color 160ms",
        }}
      >
        <BrokerLogo broker={current} size={36} />
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--color-on-surface)" }}>{current.name}</span>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
              color: "var(--color-secondary)",
            }}>
              <span style={{ width: 5, height: 5, borderRadius: 9999, background: "var(--color-secondary)", boxShadow: "0 0 6px var(--color-secondary)" }} />
              LIVE
            </span>
          </div>
          <span style={{ fontSize: 11, color: "var(--color-on-surface-variant)" }}>
            Streaming quotes from {current.name}
          </span>
        </div>
        <Icon name={open ? "expand_less" : "expand_more"} size={22} color="var(--color-on-surface-variant)" />
      </button>

      {open && (
        <div role="listbox"
             style={{
               position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
               background: "var(--color-surface)",
               border: "1px solid var(--color-outline-variant)",
               borderRadius: 12,
               boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
               overflow: "hidden",
               zIndex: 50,
             }}>
          {brokers.map((b, i) => {
            const active = b.id === value;
            return (
              <button key={b.id}
                      role="option"
                      aria-selected={active}
                      onClick={() => { onChange(b.id); setOpen(false); }}
                      style={{
                        width: "100%", padding: "10px 12px",
                        display: "flex", alignItems: "center", gap: 12,
                        background: active ? "color-mix(in oklab, var(--color-primary) 8%, transparent)" : "transparent",
                        border: "none",
                        borderTop: i === 0 ? "none" : "1px solid var(--color-outline-variant)",
                        cursor: "pointer", textAlign: "left",
                      }}>
                <BrokerLogo broker={b} size={28} />
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: active ? "var(--color-primary)" : "var(--color-on-surface)" }}>
                  {b.name}
                </span>
                {active && <Icon name="check" size={18} color="var(--color-primary)" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────
// Settings Drawer (slides in from left)
const SettingsDrawer = ({ open, onClose, brokers, setBroker, feed, setFeed }) => {
  const [loginTarget, setLoginTarget] = React.useState(null);

  // If user disconnects the currently-feeding broker, fall back to first connected one
  function disconnect(id) {
    setBroker(id, { connected: false, lastSync: "—" });
    if (feed === id) {
      const fallback = brokers.find(b => b.connected && b.id !== id);
      if (fallback) setFeed(fallback.id);
    }
  }
  function connect(id) {
    setBroker(id, { connected: true, lastSync: "Just now" });
    // If no feed currently selected from a connected broker, prefer this one
    const currentFeedBroker = brokers.find(b => b.id === feed);
    if (!currentFeedBroker?.connected) setFeed(id);
    setLoginTarget(null);
  }

  const connectedCount = brokers.filter(b => b.connected).length;
  const feedBroker = brokers.find(b => b.id === feed);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute", inset: 0,
          background: open ? "rgba(20,17,42,0.45)" : "transparent",
          backdropFilter: open ? "blur(2px)" : "none",
          pointerEvents: open ? "auto" : "none",
          opacity: open ? 1 : 0,
          transition: "opacity 220ms ease, background 220ms ease",
          zIndex: 60,
        }}
      />
      {/* Panel */}
      <aside style={{
        position: "absolute", top: 0, bottom: 0, left: 0,
        width: "86%", maxWidth: 360,
        background: "var(--color-surface)",
        boxShadow: "8px 0 36px rgba(0,0,0,0.18)",
        transform: open ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 280ms cubic-bezier(.2,.8,.2,1)",
        zIndex: 61,
        display: "flex", flexDirection: "column",
        paddingTop: 62, /* clear iOS status bar */
      }}>
        {/* Drawer header */}
        <div style={{
          padding: "16px 16px 12px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: "1px solid var(--color-outline-variant)",
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-on-surface-variant)" }}>Settings</div>
            <div className="brand-wordmark" style={{ fontSize: 24, marginTop: 2 }}>Xutra</div>
          </div>
          <button onClick={onClose} className="topbar-icon-btn" aria-label="Close">
            <Icon name="close" size={22} />
          </button>
        </div>

        {/* scroll area */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {/* Brokers section */}
          <section>
            <div style={{ padding: "20px 16px 8px", display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700 }}>Brokers</div>
                <div style={{ fontSize: 12, color: "var(--color-on-surface-variant)", marginTop: 2 }}>
                  {connectedCount} of {brokers.length} connected
                </div>
              </div>
              <button style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "6px 10px", borderRadius: 8,
                background: "var(--color-surface-container-low)",
                border: "1px solid var(--color-outline-variant)",
                color: "var(--color-primary)", cursor: "pointer",
                fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
              }}>
                <Icon name="add" size={14} />Add
              </button>
            </div>

            <div className="list-divide" style={{ background: "var(--color-surface)", borderTop: "1px solid var(--color-outline-variant)", borderBottom: "1px solid var(--color-outline-variant)" }}>
              {brokers.map(b => (
                <BrokerRow
                  key={b.id}
                  broker={b}
                  onConnect={() => setLoginTarget(b)}
                  onDisconnect={() => disconnect(b.id)}
                />
              ))}
            </div>

            <div style={{ padding: "10px 16px 8px", fontSize: 11, color: "var(--color-on-surface-variant)", lineHeight: 1.45 }}>
              The selected broker's feed powers prices, watchlist quotes and order routing. Logged-out brokers stay greyed out until you reconnect.
            </div>
          </section>

          {/* Price feed switcher */}
          <section style={{ padding: "12px 16px 4px" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-on-surface-variant)" }}>
                Active price feed
              </div>
              <span style={{ fontSize: 11, color: "var(--color-on-surface-variant)" }}>
                Powers quotes & LTPs
              </span>
            </div>

            {brokers.filter(b => b.connected).length === 0 ? (
              <div style={{
                padding: 14, borderRadius: 12,
                border: "1px dashed var(--color-outline-variant)",
                background: "var(--color-surface-container-low)",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--color-surface-container-high)",
                              display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="signal_disconnected" size={20} color="var(--color-on-surface-variant)" />
                </div>
                <div style={{ flex: 1, fontSize: 13, color: "var(--color-on-surface-variant)" }}>
                  No broker connected. Connect one above to start streaming live prices.
                </div>
              </div>
            ) : (
              <FeedDropdown
                brokers={brokers.filter(b => b.connected)}
                value={feed}
                onChange={setFeed}
              />
            )}
          </section>

          {/* Misc settings */}
          <section style={{ padding: "20px 0 24px" }}>
            <div style={{ padding: "0 16px 8px", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-on-surface-variant)" }}>
              Account
            </div>
            <div className="list-divide" style={{ borderTop: "1px solid var(--color-outline-variant)", borderBottom: "1px solid var(--color-outline-variant)" }}>
              {[
                ["palette", "Appearance & theme"],
                ["notifications", "Alerts & notifications"],
                ["lock", "Privacy & security"],
                ["help_outline", "Help & support"],
                ["info", "About Xutra"],
              ].map(([ic, label]) => (
                <button key={ic} style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 14,
                  padding: "12px 16px", border: "none", background: "transparent",
                  cursor: "pointer", textAlign: "left",
                }}>
                  <Icon name={ic} size={20} color="var(--color-on-surface-variant)" />
                  <span style={{ flex: 1, fontSize: 14 }}>{label}</span>
                  <Icon name="chevron_right" size={18} color="var(--color-on-surface-variant)" />
                </button>
              ))}
            </div>
          </section>
        </div>
      </aside>

      {loginTarget && (
        <LoginPrompt
          broker={loginTarget}
          onCancel={() => setLoginTarget(null)}
          onConnect={() => connect(loginTarget.id)}
        />
      )}
    </>
  );
};

Object.assign(window, { SettingsDrawer, useBrokers, BrokerLogo, BrokerMonogram });
