// demoSim.js - demo simulator but can accept history & future if provided.
export async function fakeSimulate({ ticker='AAPL', horizon_days=30, M=500, target_k=null, S0=null, history=null, future=null, labels=null }) {
  // pseudo-random generator (deterministic per ticker)
  const seed = ticker.split('').reduce((a,c)=>a + c.charCodeAt(0), 42);
  const rng = (s => () => {
    s = Math.sin(s) * 10000; return s - Math.floor(s);
  })(seed);

  // base price
  const base = S0 || (150 + Math.floor(rng()*20));

  // prepare labels (dates). If provided use labels, otherwise use synthetic dates (train_end + days)
  let outLabels;
  if (labels && labels.length >= 1) {
    // Expect labels to be [historyDates..., futureDates...], length = historyLen + futureLen
    outLabels = labels;
  } else {
    outLabels = [];
    const start = new Date('2025-08-01');
    // create history part as negative indices (optional)
    for (let i = -Math.max(0, horizon_days-1); i <= horizon_days; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      outLabels.push(d.toISOString().slice(0,10));
    }
  }

  // actual combined: history + future
  let actualCombined = [];
  if (history && history.length > 0) {
    actualCombined = [...history];
    // append future values if provided
    if (future && future.length > 0) {
      actualCombined = [...actualCombined, ...future.slice(0, horizon_days)];
    } else {
      // pad with last history
      actualCombined = [...actualCombined, ...Array(horizon_days).fill(actualCombined[actualCombined.length-1] || base)];
    }
  } else {
    // generate synthetic actual series starting at base
    let s = base;
    actualCombined.push(s);
    for (let i=1;i<outLabels.length;i++){
      s = s * Math.exp((rng()-0.5)*0.02);
      actualCombined.push(Number(s.toFixed(4)));
    }
  }

  // simulate M paths: paths should be arrays of same length as actualCombined (we'll simulate only future horizon portion and prepend history part)
  const horizonOnly = horizon_days;
  const simPaths = [];
  for (let i=0;i<M;i++){
    const path = [];
    // start from last history price
    const startPrice = (history && history.length>0) ? history[history.length-1] : base;
    path.push(startPrice);
    let prev = startPrice;
    for (let t=1; t<=horizonOnly; t++){
      // diffusion small
      const z = (rng()-0.5) * 0.02;
      // occasional jump
      const isJump = rng() < 0.02;
      const y = isJump ? (rng()-0.5) * 0.4 : 0;
      const r = z + y;
      const next = prev * Math.exp(r);
      path.push(Number(next.toFixed(4)));
      prev = next;
    }
    // path length = horizonOnly+1 (includes start)
    // we want to return full path aligned with labels: prepend history part (except last element because start already is last history)
    let fullPath = [];
    if (history && history.length>0) {
      // history: [...h0 ... h_last], path: [h_last, f1, f2...]
      fullPath = [...history, ...path.slice(1)];
    } else {
      // no history: create pseudo-history by repeating start
      const histFake = Array(Math.max(0, outLabels.length - (horizonOnly+1))).fill(startPrice);
      fullPath = [...histFake, ...path];
    }
    simPaths.push(fullPath);
  }

  // final prices (last element of each simulated path)
  const finals = simPaths.map(p => p[p.length-1]);

  const expected_final = finals.reduce((a,b)=>a+b,0)/finals.length;
  const sorted = finals.slice().sort((a,b)=>a-b);
  const lower95 = sorted[Math.floor(0.025*sorted.length)] || sorted[0];
  const upper95 = sorted[Math.floor(0.975*sorted.length)] || sorted[sorted.length-1];
  const prob_greater = target_k ? (finals.filter(v=>v>target_k).length / finals.length) : null;

  return {
    ticker,
    labels: outLabels,
    S0: base,
    history, future,
    historyPlusFuture: actualCombined,
    paths: simPaths,
    final_prices: finals,
    expected_final,
    lower95,
    upper95,
    p_jump: 0.02,
    mu: 0.001,
    sigma: 0.02,
    prob_greater,
    actual_series: actualCombined
  };
}
