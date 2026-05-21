// Market data — ported from src/lib/market-data.ts
window.MarketData = (function () {
  const watchlist = [
    { symbol: "RELIANCE", exchange: "NSE", segment: "Equity", price: 2984.15, changePct: 1.45, changeAbs: 42.15 },
    { symbol: "HDFCBANK", exchange: "NSE", segment: "Equity", price: 1442.80, changePct: -0.24, changeAbs: -3.48 },
    { symbol: "TCS", exchange: "NSE", segment: "Equity", price: 3921.40, changePct: 0.68, changeAbs: 26.50 },
    { symbol: "INFY", exchange: "NSE", segment: "Equity", price: 1624.95, changePct: -1.12, changeAbs: -18.40 },
    { symbol: "ICICIBANK", exchange: "NSE", segment: "Equity", price: 1085.30, changePct: 0.32, changeAbs: 3.46 },
    { symbol: "ZOMATO", exchange: "NSE", segment: "Equity", price: 182.40, changePct: 4.20, changeAbs: 7.35 },
    { symbol: "NIFTY 22400 CE", exchange: "NSE", segment: "28 MAR OPT", price: 142.15, changePct: 12.45, changeAbs: 15.70 },
    { symbol: "BANKNIFTY 46500 PE", exchange: "NSE", segment: "28 MAR OPT", price: 162.55, changePct: -8.40, changeAbs: -14.90 },
  ];

  function fmt(n) {
    return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function findInstrument(symbol) {
    return watchlist.find(w => w.symbol.toLowerCase() === (symbol || "").toLowerCase()) || watchlist[0];
  }

  return { watchlist, fmt, findInstrument };
})();
