/*
  Route geometry and cost engine. No Cesium dependency, so it also runs in Node
  for checking the numbers:  node js/estimate.js
*/
(function (root) {
  "use strict";
  var R_EARTH = 6371008.8;

  function rad(d) { return d * Math.PI / 180; }

  function haversine(a, b) {
    var p1 = rad(a[1]), p2 = rad(b[1]);
    var h = Math.pow(Math.sin((p2 - p1) / 2), 2) +
      Math.cos(p1) * Math.cos(p2) * Math.pow(Math.sin(rad(b[0] - a[0]) / 2), 2);
    return 2 * R_EARTH * Math.asin(Math.sqrt(h));
  }

  /* Catmull-Rom smoothing through the control points. */
  function densify(cp, n) {
    n = n || 16;
    var pts = [];
    for (var i = 0; i < cp.length - 1; i++) {
      var p0 = cp[Math.max(i - 1, 0)], p1 = cp[i], p2 = cp[i + 1], p3 = cp[Math.min(i + 2, cp.length - 1)];
      for (var k = 0; k < n; k++) {
        var t = k / n, t2 = t * t, t3 = t2 * t, q = [];
        for (var j = 0; j < 2; j++) {
          q.push(0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t +
            (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 +
            (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3));
        }
        pts.push(q);
      }
    }
    pts.push(cp[cp.length - 1].slice());
    return pts;
  }

  function Route(controlPoints) {
    this.pts = densify(controlPoints, 16);
    this.ch = [0];
    for (var i = 1; i < this.pts.length; i++) this.ch.push(this.ch[i - 1] + haversine(this.pts[i - 1], this.pts[i]));
    this.length_m = this.ch[this.ch.length - 1];
    this.length_km = this.length_m / 1000;
  }

  Route.prototype.clampKP = function (kp) {
    if (kp === null || kp === undefined) return this.length_km;
    return Math.max(0, Math.min(this.length_km, kp));
  };

  Route.prototype.at = function (kp) {
    var m = this.clampKP(kp) * 1000, ch = this.ch, lo = 0, hi = ch.length - 1;
    while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (ch[mid] <= m) lo = mid; else hi = mid; }
    var seg = ch[hi] - ch[lo] || 1, f = (m - ch[lo]) / seg, a = this.pts[lo], b = this.pts[hi];
    return { lon: a[0] + (b[0] - a[0]) * f, lat: a[1] + (b[1] - a[1]) * f, index: lo,
      bearing: Math.atan2((b[0] - a[0]) * Math.cos(rad(a[1])), b[1] - a[1]) };
  };

  /* Points from kpA to kpB, including the interior vertices. */
  Route.prototype.slice = function (kpA, kpB) {
    var a = this.at(kpA), b = this.at(kpB), out = [[a.lon, a.lat]];
    var mA = this.clampKP(kpA) * 1000, mB = this.clampKP(kpB) * 1000;
    for (var i = 0; i < this.pts.length; i++) if (this.ch[i] > mA && this.ch[i] < mB) out.push(this.pts[i]);
    out.push([b.lon, b.lat]);
    return out;
  };

  /* Nearest chainage to a picked point; returns KP and offset from centreline. */
  Route.prototype.nearest = function (lon, lat) {
    var best = { d: Infinity }, kx = Math.cos(rad(lat)) * 111320, ky = 110540;
    for (var i = 0; i < this.pts.length - 1; i++) {
      var a = this.pts[i], b = this.pts[i + 1];
      var ax = (a[0] - lon) * kx, ay = (a[1] - lat) * ky, bx = (b[0] - lon) * kx, by = (b[1] - lat) * ky;
      var dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1;
      var t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / L2));
      var px = ax + t * dx, py = ay + t * dy, d = Math.sqrt(px * px + py * py);
      if (d < best.d) best = { d: d, kp: (this.ch[i] + t * (this.ch[i + 1] - this.ch[i])) / 1000,
        side: (dx * (-ay) - dy * (-ax)) > 0 ? "left" : "right" };
    }
    return { kp: best.kp, offset_m: best.d, side: best.side };
  };

  function kpLabel(kp) {
    var m = Math.round(kp * 1000), km = Math.floor(m / 1000), r = m - km * 1000;
    return "KP " + km + "+" + ("00" + r).slice(-3);
  }

  function itemAmount(it, base) {
    if (it.pct !== undefined) return Math.round((base || 0) * it.pct / 100);
    return Math.round(it.q * it.r);
  }

  function priced(items, base) {
    var total = 0;
    var out = items.map(function (it) {
      var o = {}; for (var k in it) o[k] = it[k];
      o.amount = itemAmount(it, base);
      if (it.pct !== undefined) o.base = base;
      total += o.amount;
      return o;
    });
    return { items: out, total: total };
  }

  function spreadAt(data, route, kp) {
    for (var i = 0; i < data.spreads.length; i++) {
      var s = data.spreads[i], a = s.kpStart, b = route.clampKP(s.kpEnd);
      if (kp >= a && (kp < b || (i === data.spreads.length - 1 && kp <= b + 1e-9))) return s;
    }
    return data.spreads[data.spreads.length - 1];
  }

  function estimate(data) {
    var route = new Route(data.controlPoints);
    var P = data.pipe, R = data.rates;
    var massStd = (P.od_mm - P.wt_std_mm) * P.wt_std_mm * 0.0246615; // kg/m
    var pipeStdRate = Math.round(massStd * P.steelPrice_per_t / 1000);
    var cats = {}; Object.keys(data.categories).forEach(function (c) { cats[c] = 0; });
    function addCats(items) { items.forEach(function (it) { cats[it.cat] = (cats[it.cat] || 0) + it.amount; }); }

    var trenchless = data.crossings.filter(function (x) { return x.trenchless && x.length_m; }).map(function (x) {
      return { a: x.kp - x.length_m / 2000, b: x.kp + x.length_m / 2000 };
    });

    var spreads = {}; data.spreads.forEach(function (s) {
      spreads[s.id] = { def: s, kpStart: s.kpStart, kpEnd: route.clampKP(s.kpEnd), construction: 0,
        segments: [], crossings: [], facilities: [], total: 0 };
    });

    var segments = data.segments.map(function (s) {
      var a = s.kpStart, b = route.clampKP(s.kpEnd), L = Math.round((b - a) * 1000);
      var tr = 0; trenchless.forEach(function (t) { tr += Math.max(0, Math.min(b, t.b) - Math.max(a, t.a)); });
      var Ltr = Math.round(tr * 1000), Lml = L - Ltr;
      var sp = spreadAt(data, route, (a + b) / 2), winter = sp.season === "winter", T = s.terrain;
      var joints = Math.ceil(Lml / P.jointLength_m);
      var items = [
        { d: "Line pipe NPS 36 x " + P.wt_std_mm + " mm (" + massStd.toFixed(1) + " kg/m)", q: Lml, u: "m", r: pipeStdRate, cat: "materials" },
        { d: "Clearing and grubbing", q: L, u: "m", r: R.clearing[T], cat: "mainline" },
        { d: "Topsoil and soil salvage", q: L, u: "m", r: R.topsoil[T], cat: "mainline" },
        { d: "Mainline install: grade, string, bend, weld, ditch, lower-in, backfill" + (winter ? " (winter x" + R.winterProductivityFactor + ")" : ""),
          q: Lml, u: "m", r: Math.round(R.mainline[T] * (winter ? R.winterProductivityFactor : 1)), cat: "mainline" },
        { d: "Weld NDE (AUT)", q: joints, u: "weld", r: R.weldNdePerWeld, cat: "mainline" },
        { d: "Field joint coating", q: joints, u: "joint", r: R.fieldJointCoatingPerJoint, cat: "mainline" }
      ];
      if (winter) {
        items.push({ d: "Snow management", q: L, u: "m", r: R.snowManagement, cat: "mainline" });
        if (T !== "wetland") items.push({ d: "Frost ripping", q: Lml, u: "m", r: R.frostRipping, cat: "mainline" });
      }
      items.push(
        { d: "Hydrotest, caliper and drying", q: L, u: "m", r: R.hydrotest, cat: "mainline" },
        { d: "Cathodic protection", q: L, u: "m", r: R.cathodicProtection, cat: "mainline" },
        { d: "Survey and as-builts", q: L, u: "m", r: R.surveyAsBuilt, cat: "mainline" },
        { d: "Clean-up, erosion control and reclamation", q: L, u: "m", r: R.reclamation[T], cat: "mainline" }
      );
      var pr = priced(items);
      addCats(pr.items);
      var o = { id: s.id, kind: "segment", kpStart: a, kpEnd: b, length_m: L, trenchless_m: Ltr, terrain: T,
        spread: sp.id, season: sp.season, note: s.note, items: pr.items, total: pr.total, perMetre: pr.total / L };
      spreads[sp.id].segments.push(o); spreads[sp.id].construction += pr.total;
      return o;
    });

    var crossings = data.crossings.map(function (x) {
      var sp = spreadAt(data, route, x.kp), pr = priced(x.items);
      addCats(pr.items);
      var o = {}; for (var k in x) o[k] = x[k];
      o.kind = "crossing"; o.spread = sp.id; o.items = pr.items; o.total = pr.total;
      spreads[sp.id].crossings.push(o); spreads[sp.id].construction += pr.total;
      return o;
    });

    var facilities = data.facilities.map(function (f) {
      var kp = route.clampKP(f.kp), sp = f.spread ? spreads[f.spread].def : spreadAt(data, route, kp), pr = priced(f.items);
      addCats(pr.items);
      var o = {}; for (var k in f) o[k] = f[k];
      o.kind = "facility"; o.kp = kp; o.spread = sp.id; o.items = pr.items; o.total = pr.total;
      spreads[sp.id].facilities.push(o);
      return o;
    });

    var indirectTotal = 0;
    Object.keys(spreads).forEach(function (id) {
      var s = spreads[id], pr = priced(data.spreadIndirects[id] || [], s.construction);
      addCats(pr.items);
      s.indirects = pr.items; s.indirectTotal = pr.total; indirectTotal += pr.total;
      s.total = s.construction + pr.total + s.facilities.reduce(function (t, f) { return t + f.total; }, 0);
      s.length_m = Math.round((s.kpEnd - s.kpStart) * 1000);
    });

    var directs = cats.materials + cats.mainline + cats.crossings + cats.facilities;
    var engineering = Math.round(directs * data.project_level.engineeringPct / 100);
    cats.engineering = engineering;
    var beforeCont = directs + cats.indirects + engineering;
    var contingency = Math.round(beforeCont * data.project_level.contingencyPct / 100);
    cats.contingency = contingency;
    var total = beforeCont + contingency;

    return {
      route: route, length_km: route.length_km, pipeStdRate: pipeStdRate, massStd: massStd,
      segments: segments, crossings: crossings, facilities: facilities, spreads: spreads,
      categories: cats, directs: directs, indirects: cats.indirects, engineering: engineering,
      contingency: contingency, total: total, perKm: total / route.length_km
    };
  }

  var api = { Route: Route, estimate: estimate, kpLabel: kpLabel, haversine: haversine };
  root.BOE = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;

  if (typeof require !== "undefined" && typeof module !== "undefined" && require.main === module) {
    global.window = {};
    require("./data.js");
    var e = estimate(global.window.BOE_DATA);
    var M = function (v) { return "$" + (v / 1e6).toFixed(2) + "M"; };
    console.log("Length", e.length_km.toFixed(3), "km  pipe $/m", e.pipeStdRate);
    Object.keys(e.categories).forEach(function (c) { console.log(c.padEnd(12), M(e.categories[c])); });
    Object.keys(e.spreads).forEach(function (id) { var s = e.spreads[id];
      console.log(id, "construction", M(s.construction), "indirects", M(s.indirectTotal), "total", M(s.total)); });
    console.log("TOTAL", M(e.total), " per km", M(e.perKm));
    var sum = Object.keys(e.categories).reduce(function (t, c) { return t + e.categories[c]; }, 0);
    console.log("category sum matches total:", sum === e.total);
    e.crossings.forEach(function (x) { console.log(x.id, kpLabel(x.kp), x.name.padEnd(36), M(x.total), x.spread); });
  }
})(typeof window !== "undefined" ? window : globalThis);
