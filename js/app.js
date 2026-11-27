/* Visual BOE viewer: Cesium scene, panel and elevation profile. */
(function () {
  "use strict";
  var D = window.BOE_DATA, C = window.BOE_CONFIG || {};
  if (!D || !window.BOE) {
    document.getElementById("body").innerHTML = '<p><strong>The data file did not load.</strong></p><p>js/data.js most likely has a typing error from the last edit. The red message on the map says which line.</p>';
    return;
  }
  var E = BOE.estimate(D), route = E.route, kpL = BOE.kpLabel;

  /* ---------- helpers ---------- */
  function $(s) { return document.querySelector(s); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function num(v, d) { d = d || 0; return Number(v).toLocaleString("en-CA", { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function money(v) { return "$" + num(Math.round(v)); }
  function mM(v) { return "$" + num(v / 1e6, v >= 1e8 ? 1 : 2) + "M"; }
  var noticeTimer = null;
  function notice(msg, sticky) {
    var n = $("#notice"); n.textContent = msg + "  (click to close)"; n.hidden = false;
    clearTimeout(noticeTimer); if (!sticky) noticeTimer = setTimeout(function () { n.hidden = true; }, 9000);
  }
  $("#notice").addEventListener("click", function () { this.hidden = true; });

  var spreadById = {}; D.spreads.forEach(function (s) { spreadById[s.id] = s; });
  var byId = {}; E.segments.concat(E.crossings, E.facilities).forEach(function (o) { byId[o.id] = o; });
  var segMin = Math.min.apply(null, E.segments.map(function (s) { return s.perMetre; }));
  var segMax = Math.max.apply(null, E.segments.map(function (s) { return s.perMetre; }));

  function spanOf(o) {
    if (o.kind === "segment") return [o.kpStart, o.kpEnd];
    if (o.length_m) return [o.kp - o.length_m / 2000, o.kp + o.length_m / 2000];
    return null;
  }
  function itemName(o) { return o.kind === "segment" ? o.id + " " + D.terrainClasses[o.terrain].label : o.name; }
  function itemKP(o) { return o.kind === "segment" ? kpL(o.kpStart) + " to " + kpL(o.kpEnd) : kpL(o.kp); }

  /* ---------- header ---------- */
  $("#pjClient").textContent = D.project.client + " - " + D.project.estimateClass;
  $("#pjName").textContent = D.project.name;
  $("#pjTotal").textContent = mM(E.total);
  $("#pjSub").textContent = num(E.length_km, 1) + " km, NPS " + D.pipe.nps + ", " + mM(E.perKm) + " per km";
  $("#pjFlag").textContent = D.project.disclaimer;

  /* ---------- panel ---------- */
  var tab = "summary", filter = "all", selected = null;

  function catRows() {
    var keys = Object.keys(D.categories);
    var bar = keys.map(function (k) {
      return '<span style="width:' + (E.categories[k] / E.total * 100).toFixed(2) + '%;background:' + D.categories[k].color + '" title="' + esc(D.categories[k].label) + '"></span>';
    }).join("");
    var rows = keys.map(function (k) {
      return '<tr><td><span class="dot" style="background:' + D.categories[k].color + '"></span>' + esc(D.categories[k].label) +
        '</td><td class="n">' + mM(E.categories[k]) + '</td><td class="n muted">' + num(E.categories[k] / E.total * 100, 1) + "%</td></tr>";
    }).join("");
    return '<div class="stackbar" aria-hidden="true">' + bar + '</div><table class="rows"><tbody>' + rows +
      '</tbody><tfoot><tr><td>Total estimate</td><td class="n">' + mM(E.total) + '</td><td class="n">100%</td></tr></tfoot></table>';
  }

  function spreadCards() {
    return '<div class="cards">' + D.spreads.map(function (d) {
      var s = E.spreads[d.id];
      return '<button type="button" class="card" data-spread="' + d.id + '"><span class="sw" style="background:' + d.color + '"></span>' +
        "<strong>" + esc(d.name) + '</strong><span class="amt">' + mM(s.total) + "</span><small>" +
        kpL(s.kpStart) + " to " + kpL(s.kpEnd) + "</small><small>" + num(s.length_m / 1000, 1) + " km, " +
        mM(s.total / (s.length_m / 1000)) + " per km</small><small>" + esc(d.window) + "</small></button>";
    }).join("") + "</div>";
  }

  function itemRow(o) {
    return '<tr class="click" data-id="' + o.id + '"><td>' + esc(itemName(o)) + '<span class="sub">' + itemKP(o) +
      (o.method ? ", " + esc(o.method) : "") + '</span></td><td class="n">' + mM(o.total) + "</td></tr>";
  }

  function renderSummary() {
    var top = E.segments.concat(E.crossings, E.facilities).slice().sort(function (a, b) { return b.total - a.total; }).slice(0, 6);
    return "<h2>Where the money goes</h2>" + catRows() +
      "<h2>Spreads</h2>" + spreadCards() +
      "<h2>Biggest single items</h2><table class=\"rows\"><tbody>" + top.map(itemRow).join("") + "</tbody></table>" +
      '<p class="small" style="margin-top:12px">Click the line, a crossing or a facility on the map to open its breakdown.</p>';
  }

  function renderSpreads() {
    return D.spreads.map(function (d) {
      var s = E.spreads[d.id];
      var segs = s.segments.map(function (o) {
        return '<tr class="click" data-id="' + o.id + '"><td><span class="dot" style="background:' + D.terrainClasses[o.terrain].color + '"></span>' +
          kpL(o.kpStart) + " to " + kpL(o.kpEnd) + '<span class="sub">' + esc(D.terrainClasses[o.terrain].label) + ", " + num(o.length_m) +
          ' m</span></td><td class="n">' + mM(o.total) + '<span class="sub">' + money(o.perMetre) + "/m</span></td></tr>";
      }).join("");
      var fac = s.facilities.map(itemRow).join("");
      var ind = s.indirects.map(function (it) {
        return "<tr><td>" + esc(it.d) + (it.pct !== undefined ? '<span class="sub">' + it.pct + "% of " + mM(it.base) + "</span>" : "") +
          '</td><td class="n">' + mM(it.amount) + "</td></tr>";
      }).join("");
      return '<h2><span class="pill" style="background:' + d.color + '">' + esc(d.season) + "</span> " + esc(d.name) + "</h2>" +
        "<p>" + esc(d.description) + '</p><p class="small">' + esc(d.window) + ", " + d.crew + " crew, " + d.days + " working days</p>" +
        '<table class="rows"><thead><tr><th>Mainline segments</th><th class="n">Cost</th></tr></thead><tbody>' + segs + "</tbody></table>" +
        '<table class="rows" style="margin-top:10px"><thead><tr><th>Crossings in this spread</th><th class="n">Cost</th></tr></thead><tbody><tr class="click" data-tab-go="crossings"><td>' +
        s.crossings.length + ' crossings<span class="sub">Open the Crossings tab for the list</span></td><td class="n">' +
        mM(s.crossings.reduce(function (t, x) { return t + x.total; }, 0)) + "</td></tr></tbody></table>" +
        (fac ? '<table class="rows" style="margin-top:10px"><thead><tr><th>Facilities and sites</th><th class="n">Cost</th></tr></thead><tbody>' + fac + "</tbody></table>" : "") +
        '<table class="rows" style="margin-top:10px"><thead><tr><th>Spread indirects</th><th class="n">Cost</th></tr></thead><tbody>' + ind +
        '</tbody><tfoot><tr><td>Spread total</td><td class="n">' + mM(s.total) + "</td></tr></tfoot></table>";
    }).join("") + '<p class="small" style="margin-top:12px">Engineering (' + D.project_level.engineeringPct + "%) and contingency (" +
      D.project_level.contingencyPct + "%) are carried at project level, not in the spread totals.</p>";
  }

  function glyph(t) { var c = D.crossingTypes[t] || D.facilityTypes[t]; return '<span class="glyph" style="background:' + c.color + '">' + c.glyph + "</span>"; }

  function renderCrossings() {
    var types = Object.keys(D.crossingTypes).filter(function (t) { return E.crossings.some(function (x) { return x.type === t; }); });
    var chips = '<div class="chips"><button type="button" class="chip' + (filter === "all" ? " on" : "") + '" data-filter="all">All ' + E.crossings.length + "</button>" +
      types.map(function (t) {
        var n = E.crossings.filter(function (x) { return x.type === t; }).length;
        return '<button type="button" class="chip' + (filter === t ? " on" : "") + '" data-filter="' + t + '">' + glyph(t) + esc(D.crossingTypes[t].label) + " " + n + "</button>";
      }).join("") + "</div>";
    var list = E.crossings.filter(function (x) { return filter === "all" || x.type === filter; });
    var sum = list.reduce(function (t, x) { return t + x.total; }, 0);
    return chips + '<table class="rows"><tbody>' + list.map(function (x) {
      return '<tr class="click" data-id="' + x.id + '"><td>' + glyph(x.type) + " " + esc(x.name) + '<span class="sub">' + kpL(x.kp) + ", " + esc(x.method) +
        (x.length_m ? ", " + num(x.length_m) + " m" : "") + '</span></td><td class="n">' + mM(x.total) + "</td></tr>";
    }).join("") + '</tbody><tfoot><tr><td>' + list.length + ' shown</td><td class="n">' + mM(sum) + "</td></tr></tfoot></table>";
  }

  function renderBasis() {
    var P = D.pipe, R = D.rates;
    var terr = Object.keys(D.terrainClasses).map(function (t) {
      return "<tr><td>" + esc(D.terrainClasses[t].label) + '</td><td class="n">' + money(R.mainline[t]) + '</td><td class="n">' +
        money(R.mainline[t] * R.winterProductivityFactor) + "</td></tr>";
    }).join("");
    return "<h2>Pipe</h2><table class=\"rows\"><tbody>" +
      "<tr><td>Size</td><td class=\"n\">NPS " + P.nps + " (" + P.od_mm + " mm OD)</td></tr>" +
      "<tr><td>Wall thickness</td><td class=\"n\">" + P.wt_std_mm + " mm std, " + P.wt_hw_mm + " mm heavy wall</td></tr>" +
      "<tr><td>Material</td><td class=\"n\">" + esc(P.grade) + "</td></tr>" +
      "<tr><td>Mass, std wall</td><td class=\"n\">" + num(E.massStd, 1) + " kg/m</td></tr>" +
      "<tr><td>Line pipe delivered</td><td class=\"n\">" + money(E.pipeStdRate) + "/m</td></tr>" +
      "<tr><td>Working width / permanent ROW</td><td class=\"n\">" + P.workingWidth_m + " m / " + P.permanentRow_m + " m</td></tr>" +
      "<tr><td>Product, MOP</td><td class=\"n\">" + esc(P.product) + ", " + num(P.mop_kPa) + " kPa</td></tr></tbody></table>" +
      "<h2>Mainline install rates</h2><table class=\"rows\"><thead><tr><th>Terrain</th><th class=\"n\">Summer $/m</th><th class=\"n\">Winter $/m</th></tr></thead><tbody>" + terr + "</tbody></table>" +
      "<h2>Assumptions</h2><ul class=\"plain\">" + D.assumptions.map(function (a) { return "<li>" + esc(a) + "</li>"; }).join("") + "</ul>" +
      "<h2>Exclusions</h2><ul class=\"plain\">" + D.exclusions.map(function (a) { return "<li>" + esc(a) + "</li>"; }).join("") + "</ul>" +
      "<h2>Data</h2><p class=\"small\">Export the centreline, KPs, crossings and facilities as GeoJSON to check them in Civil 3D or QGIS.</p>" +
      '<div class="btns"><button type="button" class="btn ghost" id="exportBtn">Export GeoJSON</button></div>' +
      '<p class="small">' + esc(D.project.preparedBy) + ", basis " + esc(D.project.basisDate) + ". " + esc(D.project.disclaimer) + "</p>";
  }

  function renderDetail(o) {
    var sp = spreadById[o.spread], kind = o.kind === "segment" ? "Mainline segment" : o.kind === "crossing" ? D.crossingTypes[o.type].label : D.facilityTypes[o.type].label;
    var meta = ['<span class="pill" style="background:' + sp.color + '">' + esc(sp.name) + "</span>", itemKP(o)];
    if (o.kind === "segment") meta.push(num(o.length_m) + " m");
    if (o.method) meta.push(o.method);
    if (o.length_m && o.kind !== "segment") meta.push(num(o.length_m) + " m long");
    if (o.width_m) meta.push(o.width_m + " m channel");
    var rows = o.items.map(function (it) {
      var qty = it.pct !== undefined ? it.pct + "% of " + mM(it.base) : num(it.q, it.q % 1 ? 1 : 0) + " " + esc(it.u) + " at " + money(it.r);
      return "<tr><td>" + esc(it.d) + '<span class="sub">' + qty + " - " + esc(D.categories[it.cat].label) + '</span></td><td class="n">' + money(it.amount) + "</td></tr>";
    }).join("");
    var extra = "";
    if (o.kind === "segment") {
      extra = '<p class="small">' + money(o.perMetre) + " per metre all in." + (o.trenchless_m ? " " + num(o.trenchless_m) + " m is trenchless and priced under the crossing." : "") + "</p>";
    }
    return '<div class="detail"><button type="button" class="back" data-back>Back to ' + esc(tab) + "</button>" +
      '<p class="kicker">' + esc(kind) + " - " + esc(o.id) + "</p><h2>" + esc(itemName(o)) + '</h2><div class="meta">' +
      meta.map(function (m, i) { return i ? "<span>" + esc(m) + "</span>" : m; }).join("") + "</div>" +
      '<div class="amt">' + money(o.total) + "</div>" + extra +
      (o.note ? "<p>" + esc(o.note) + "</p>" : "") +
      '<table class="rows items"><thead><tr><th>Line item</th><th class="n">Amount</th></tr></thead><tbody>' + rows +
      '</tbody><tfoot><tr><td>Total</td><td class="n">' + money(o.total) + "</td></tr></tfoot></table>" +
      '<div class="btns"><button type="button" class="btn" data-fly="' + o.id + '">Fly to it</button>' +
      '<button type="button" class="btn ghost" data-copy="' + o.id + '">Copy link</button></div>' +
      '<p class="small">Direct cost only. Spread indirects, engineering and contingency are added on top.</p></div>';
  }

  function renderPanel() {
    var b = $("#body");
    b.innerHTML = selected ? renderDetail(selected) :
      tab === "summary" ? renderSummary() : tab === "spreads" ? renderSpreads() : tab === "crossings" ? renderCrossings() : renderBasis();
    b.scrollTop = 0;
    document.querySelectorAll(".tabs button").forEach(function (t) { t.classList.toggle("on", t.dataset.tab === tab); });
  }

  /* ---------- Cesium ---------- */
  var hasToken = !!(C.ionToken && C.ionToken.length > 20);
  var viewer = null, scene = null, terrain = null;
  try {
    if (hasToken) Cesium.Ion.defaultAccessToken = C.ionToken;
    var opts = { animation: false, timeline: false, baseLayerPicker: false, geocoder: false, homeButton: false, sceneModePicker: false,
      navigationHelpButton: false, fullscreenButton: false, infoBox: false, selectionIndicator: false };
    if (hasToken) {
      terrain = Cesium.Terrain.fromWorldTerrain({ requestVertexNormals: true });
      opts.terrain = terrain;
      opts.baseLayer = Cesium.ImageryLayer.fromWorldImagery({});
    } else {
      opts.baseLayer = new Cesium.ImageryLayer(new Cesium.OpenStreetMapImageryProvider({ url: "https://tile.openstreetmap.org/" }));
      notice("No Cesium ion token in js/config.js, so the globe is flat with street-map imagery.");
    }
    viewer = new Cesium.Viewer("map", opts);
    scene = viewer.scene;
    scene.globe.depthTestAgainstTerrain = true;
    if (hasToken) scene.verticalExaggeration = C.terrainExaggeration || 1;
    if (terrain) terrain.errorEvent.addEventListener(function () { notice("Terrain did not load. Check the Cesium ion token and its allowed URLs."); });
  } catch (err) {
    notice("The 3D view could not start: " + (err && err.message ? err.message : err) + ". The estimate panel still works.");
  }

  var C3 = window.Cesium, segEnts = {}, hl = null, hoverPt = null, pickPin = null, mode = "spread", heights = null;

  function col(css) { return C3.Color.fromCssColorString(css); }
  function cart(pts, h) { var a = []; pts.forEach(function (p) { a.push(p[0], p[1], h || 0); }); return C3.Cartesian3.fromDegreesArrayHeights(a); }

  function ramp(t) {
    var st = [[255, 236, 160], [244, 163, 64], [204, 64, 44], [110, 20, 44]];
    t = Math.max(0, Math.min(1, t)) * (st.length - 1);
    var i = Math.min(Math.floor(t), st.length - 2), f = t - i;
    var c = st[i].map(function (v, j) { return Math.round(v + (st[i + 1][j] - v) * f); });
    return "rgb(" + c.join(",") + ")";
  }
  function segColor(s) {
    if (mode === "terrain") return D.terrainClasses[s.terrain].color;
    if (mode === "cost") return ramp((s.perMetre - segMin) / ((segMax - segMin) || 1));
    return spreadById[s.spread].color;
  }

  function icon(g, color, square) {
    var s = 64, c = document.createElement("canvas"); c.width = c.height = s;
    var x = c.getContext("2d");
    x.fillStyle = "#ffffff"; x.beginPath();
    if (square) x.rect(4, 4, s - 8, s - 8); else x.arc(s / 2, s / 2, s / 2 - 3, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = color; x.beginPath();
    if (square) x.rect(10, 10, s - 20, s - 20); else x.arc(s / 2, s / 2, s / 2 - 9, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = "#ffffff"; x.font = "600 28px 'IBM Plex Sans', sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
    x.fillText(g, s / 2, s / 2 + 1);
    return c;
  }

  function label(text, far, size) {
    return { text: text, font: (size || "12px") + " 'IBM Plex Sans', sans-serif", fillColor: C3.Color.WHITE, outlineColor: C3.Color.BLACK,
      outlineWidth: 3, style: C3.LabelStyle.FILL_AND_OUTLINE, horizontalOrigin: C3.HorizontalOrigin.LEFT, pixelOffset: new C3.Cartesian2(16, 0),
      heightReference: C3.HeightReference.CLAMP_TO_GROUND, disableDepthTestDistance: Number.POSITIVE_INFINITY,
      distanceDisplayCondition: new C3.DistanceDisplayCondition(0, far) };
  }

  function buildScene() {
    var ents = viewer.entities;
    Object.keys(E.spreads).forEach(function (id) {
      var s = E.spreads[id];
      ents.add({ corridor: { positions: cart(route.slice(s.kpStart, s.kpEnd)), width: D.pipe.workingWidth_m,
        material: col(s.def.color).withAlpha(0.22), classificationType: C3.ClassificationType.TERRAIN } });
    });
    hl = ents.add({ show: false, polyline: { positions: cart(route.slice(0, 0.1)), width: 15, clampToGround: true, material: col("#ffd400"), zIndex: 0 } });
    E.segments.forEach(function (s) {
      segEnts[s.id] = ents.add({ id: s.id, polyline: { positions: cart(route.slice(s.kpStart, s.kpEnd)), width: 6, clampToGround: true,
        material: col(segColor(s)), zIndex: 1 } });
    });
    for (var k = 0; k <= Math.floor(route.length_km); k++) {
      var p = route.at(k), major = k % 5 === 0;
      ents.add({ id: "kp-" + k, position: C3.Cartesian3.fromDegrees(p.lon, p.lat),
        point: { pixelSize: major ? 7 : 5, color: C3.Color.WHITE, outlineColor: C3.Color.BLACK, outlineWidth: 1,
          heightReference: C3.HeightReference.CLAMP_TO_GROUND, disableDepthTestDistance: Number.POSITIVE_INFINITY,
          distanceDisplayCondition: new C3.DistanceDisplayCondition(0, major ? 250000 : 30000) },
        label: (function (l) { l.pixelOffset = new C3.Cartesian2(-9, 0); l.horizontalOrigin = C3.HorizontalOrigin.RIGHT; return l; })(label("KP " + k, major ? 150000 : 14000, major ? "600 13px" : "12px")) });
    }
    E.crossings.forEach(function (x) {
      var t = D.crossingTypes[x.type], p = route.at(x.kp);
      if (x.length_m) {
        ents.add({ id: x.id + "-span", polyline: { positions: cart(route.slice(x.kp - x.length_m / 2000, x.kp + x.length_m / 2000)), width: 5, clampToGround: true,
          material: new C3.PolylineDashMaterialProperty({ color: col(t.color), gapColor: C3.Color.WHITE, dashLength: 14 }), zIndex: 2 } });
      }
      ents.add({ id: x.id, position: C3.Cartesian3.fromDegrees(p.lon, p.lat),
        billboard: { image: icon(t.glyph, t.color), width: 26, height: 26, heightReference: C3.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY, scaleByDistance: new C3.NearFarScalar(2000, 1.1, 150000, 0.55) },
        label: label(x.name, 10000) });
    });
    E.facilities.forEach(function (f) {
      var t = D.facilityTypes[f.type], p = route.at(f.kp), at = f.offset ? { lon: f.offset[0], lat: f.offset[1] } : p;
      if (f.offset) ents.add({ polyline: { positions: cart([[p.lon, p.lat], f.offset]), width: 2, clampToGround: true,
        material: new C3.PolylineDashMaterialProperty({ color: C3.Color.WHITE, dashLength: 10 }), zIndex: 2 } });
      ents.add({ id: f.id, position: C3.Cartesian3.fromDegrees(at.lon, at.lat),
        billboard: { image: icon(t.glyph, t.color, true), width: 24, height: 24, heightReference: C3.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY, scaleByDistance: new C3.NearFarScalar(2000, 1.1, 150000, 0.6) },
        label: label(f.name, 20000, "600 12px") });
    });
    hoverPt = ents.add({ show: false, position: C3.Cartesian3.fromDegrees(route.pts[0][0], route.pts[0][1]),
      point: { pixelSize: 11, color: col("#ffd400"), outlineColor: C3.Color.BLACK, outlineWidth: 2,
        heightReference: C3.HeightReference.CLAMP_TO_GROUND, disableDepthTestDistance: Number.POSITIVE_INFINITY } });
    pickPin = ents.add({ show: false, position: C3.Cartesian3.fromDegrees(route.pts[0][0], route.pts[0][1]),
      point: { pixelSize: 9, color: C3.Color.WHITE, outlineColor: col("#d23f3f"), outlineWidth: 3,
        heightReference: C3.HeightReference.CLAMP_TO_GROUND, disableDepthTestDistance: Number.POSITIVE_INFINITY } });
  }

  function applyColors() {
    E.segments.forEach(function (s) { if (segEnts[s.id]) segEnts[s.id].polyline.material = col(segColor(s)); });
    var L = $("#legend");
    if (mode === "cost") {
      L.innerHTML = "<strong>Segment cost per metre</strong>" +
        '<div class="ramp" style="background:linear-gradient(90deg,' + [0, 0.33, 0.66, 1].map(ramp).join(",") + ')"></div>' +
        '<div class="ends"><span>' + money(segMin) + "</span><span>" + money(segMax) + "</span></div>";
    } else {
      var src = mode === "terrain" ? D.terrainClasses : null;
      L.innerHTML = (mode === "terrain" ? "<strong>Terrain</strong>" : "<strong>Spread</strong>") +
        (src ? Object.keys(src).map(function (k) { return '<div class="row"><i style="background:' + src[k].color + '"></i>' + esc(src[k].label) + "</div>"; }).join("")
          : D.spreads.map(function (s) { return '<div class="row"><i style="background:' + s.color + '"></i>' + esc(s.name) + "</div>"; }).join("")) +
        '<div class="row" style="margin-top:4px"><i style="background:repeating-linear-gradient(90deg,#7a3fd6 0 6px,#fff 6px 10px)"></i>Trenchless or wetland span</div>';
    }
  }

  /* ---------- camera ---------- */
  function hAt(kp) {
    if (!heights) return hasToken ? 1250 : 0;
    var i = Math.round(kp * 1000 / (C.profileSampleSpacing_m || 100));
    return heights[Math.max(0, Math.min(heights.length - 1, i))].h;
  }
  function ex() { return (scene && scene.verticalExaggeration) || 1; }

  function flyRange(a, b, heading, pitchDeg, mult) {
    if (!viewer) return;
    var pts = route.slice(a, b), h = (hAt(a) + hAt(b) + hAt((a + b) / 2)) / 3 * ex();
    var sphere = C3.BoundingSphere.fromPoints(cart(pts, h));
    sphere.radius = Math.max(sphere.radius, 350);
    viewer.camera.flyToBoundingSphere(sphere, { duration: 1.6,
      offset: new C3.HeadingPitchRange(heading, C3.Math.toRadians(pitchDeg), sphere.radius * (mult || 2.2)) });
  }
  function flyOverview() { flyRange(0, route.length_km, C3.Math.toRadians(-62), -42, 2.3); }
  function flySpread(id) { var s = E.spreads[id]; flyRange(s.kpStart, s.kpEnd, C3.Math.toRadians(-62), -40, 2.6); }
  function flyItem(o) {
    var span = spanOf(o) || [o.kp - 0.3, o.kp + 0.3];
    if (o.offset) {
      if (!viewer) return;
      var c = C3.Cartesian3.fromDegrees(o.offset[0], o.offset[1], hAt(o.kp) * ex());
      viewer.camera.flyToBoundingSphere(new C3.BoundingSphere(c, 500), { duration: 1.6, offset: new C3.HeadingPitchRange(0, C3.Math.toRadians(-40), 1800) });
      return;
    }
    var mid = (span[0] + span[1]) / 2, brg = route.at(mid).bearing;
    flyRange(span[0], span[1], brg - Math.PI / 2, o.kind === "segment" ? -38 : -28, o.kind === "segment" ? 2.0 : 2.8);
  }

  /* ---------- selection ---------- */
  function select(id, fly) {
    var o = byId[id]; if (!o) return;
    selected = o;
    var span = spanOf(o);
    if (hl) {
      if (span) { hl.polyline.positions = cart(route.slice(span[0], span[1])); hl.show = true; } else hl.show = false;
    }
    renderPanel(); drawProfile();
    if (fly) flyItem(o);
    try { history.replaceState(null, "", "#" + id); } catch (e) { /* ignore */ }
  }
  function clearSel() {
    selected = null; if (hl) hl.show = false; renderPanel(); drawProfile();
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { /* ignore */ }
  }

  /* ---------- map interaction ---------- */
  var picking = false, tip = $("#tip");
  function groundAt(pos) {
    var ray = viewer.camera.getPickRay(pos); if (!ray) return null;
    var c = scene.globe.pick(ray, scene); if (!c) return null;
    var g = C3.Cartographic.fromCartesian(c);
    return { lon: C3.Math.toDegrees(g.longitude), lat: C3.Math.toDegrees(g.latitude), h: g.height / ex(), cart: c };
  }
  function pickText(g) {
    var n = route.nearest(g.lon, g.lat);
    return kpL(n.kp) + ", " + num(n.offset_m) + " m " + n.side + " of CL, " + g.lat.toFixed(5) + ", " + g.lon.toFixed(5) +
      (hasToken ? ", " + num(g.h) + " m" : "");
  }
  function showTip(pos, html) { tip.innerHTML = html; tip.style.left = pos.x + "px"; tip.style.top = pos.y + "px"; tip.hidden = false; }

  function wireMap() {
    var h = new C3.ScreenSpaceEventHandler(scene.canvas), pending = null;
    h.setInputAction(function (ev) {
      if (picking) {
        var g = groundAt(ev.position); if (!g) return;
        var txt = pickText(g), kpVal = route.nearest(g.lon, g.lat).kp.toFixed(3);
        pickPin.position = C3.Cartesian3.fromDegrees(g.lon, g.lat); pickPin.show = true;
        try { navigator.clipboard.writeText(kpVal); notice(txt + ". Copied " + kpVal + ", ready to paste as kp: " + kpVal, true); }
        catch (e) { notice(txt + ". Use kp: " + kpVal, true); }
        return;
      }
      var p = scene.pick(ev.position), id = p && p.id && p.id.id;
      if (id && /-span$/.test(id)) id = id.replace(/-span$/, "");
      if (id && byId[id]) select(id, false);
    }, C3.ScreenSpaceEventType.LEFT_CLICK);
    h.setInputAction(function (ev) {
      pending = ev.endPosition;
      requestAnimationFrame(function () {
        if (!pending) return;
        var pos = pending; pending = null;
        if (picking) { var g = groundAt(pos); if (g) showTip(pos, pickText(g)); else tip.hidden = true; return; }
        var p = scene.pick(pos), id = p && p.id && p.id.id;
        if (id && /-span$/.test(id)) id = id.replace(/-span$/, "");
        var o = id && byId[id];
        scene.canvas.style.cursor = o ? "pointer" : "";
        if (o) showTip(pos, "<b>" + esc(itemName(o)) + "</b> " + mM(o.total) + "<br>" + itemKP(o)); else tip.hidden = true;
      });
    }, C3.ScreenSpaceEventType.MOUSE_MOVE);
  }

  /* ---------- elevation profile ---------- */
  var svg = $("#profileSvg"), geom = null;
  function drawProfile() {
    var W = svg.clientWidth, H = svg.clientHeight; if (!W || !H) return;
    if (!heights) {
      svg.innerHTML = '<text x="14" y="' + (H / 2) + '">' + (hasToken ? "Sampling terrain along the route..." : "Add a Cesium ion token in js/config.js to see the profile.") + "</text>";
      geom = null; return;
    }
    var narrow = W < 520, pL = narrow ? 18 : 52, pR = 12, pT = 26, pB = 18, L = route.length_km;
    var lo = Infinity, hi = -Infinity; heights.forEach(function (p) { lo = Math.min(lo, p.h); hi = Math.max(hi, p.h); });
    lo = Math.floor(lo / 50) * 50 - 50; hi = Math.ceil(hi / 50) * 50;
    function X(k) { return pL + k / L * (W - pL - pR); }
    function Y(h) { return pT + (1 - (h - lo) / (hi - lo)) * (H - pT - pB); }
    geom = { X: X, Y: Y, pL: pL, pR: pR, W: W };
    var out = [];
    D.spreads.forEach(function (d) {
      var s = E.spreads[d.id];
      out.push('<rect x="' + X(s.kpStart) + '" y="' + pT + '" width="' + (X(s.kpEnd) - X(s.kpStart)) + '" height="' + (H - pT - pB) + '" fill="' + d.color + '" opacity="0.09"/>');
    });
    var sp = selected && spanOf(selected);
    if (selected) {
      var a = sp ? sp[0] : selected.kp - 0.15, b = sp ? sp[1] : selected.kp + 0.15;
      out.push('<rect x="' + X(a) + '" y="' + pT + '" width="' + Math.max(3, X(b) - X(a)) + '" height="' + (H - pT - pB) + '" fill="#ffd400" opacity="0.55"/>');
    }
    var line = heights.map(function (p, i) { return (i ? "L" : "M") + X(p.kp).toFixed(1) + " " + Y(p.h).toFixed(1); }).join("");
    out.push('<path d="' + line + "L" + X(L) + " " + (H - pB) + "L" + X(0) + " " + (H - pB) + 'Z" fill="#d7dad6"/>');
    out.push('<path d="' + line + '" fill="none" stroke="#16181a" stroke-width="1.3"/>');
    if (!narrow) {
      [lo + 50, (lo + hi) / 2, hi].forEach(function (v) {
        v = Math.round(v / 50) * 50;
        out.push('<text x="' + (pL - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end">' + num(v) + " m</text>");
        out.push('<line x1="' + pL + '" x2="' + (W - pR) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="#16181a" stroke-opacity="0.08"/>');
      });
    }
    var step = narrow ? 20 : W < 900 ? 10 : 5;
    for (var k = 0; k <= L; k += step) out.push('<text x="' + X(k) + '" y="' + (H - 4) + '" text-anchor="middle">KP ' + k + "</text>");
    E.crossings.forEach(function (x) {
      var t = D.crossingTypes[x.type], cx = X(x.kp);
      out.push('<line x1="' + cx + '" x2="' + cx + '" y1="' + (pT - 3) + '" y2="' + Y(hAt(x.kp)) + '" stroke="' + t.color + '" stroke-opacity="0.55" stroke-dasharray="2 2"/>');
      out.push('<g data-x="' + x.id + '" style="cursor:pointer"><circle cx="' + cx + '" cy="12" r="7" fill="' + t.color + '"/>' +
        '<text x="' + cx + '" y="15.5" text-anchor="middle" style="fill:#fff;font-size:9px;font-weight:600">' + t.glyph + "</text></g>");
    });
    out.push('<line id="pfHover" x1="0" x2="0" y1="' + pT + '" y2="' + (H - pB) + '" stroke="#16181a" stroke-width="1" visibility="hidden"/>');
    svg.innerHTML = out.join("");
  }

  function kpFromEvent(ev) {
    if (!geom) return null;
    var r = svg.getBoundingClientRect(), x = ev.clientX - r.left;
    return Math.max(0, Math.min(route.length_km, (x - geom.pL) / (geom.W - geom.pL - geom.pR) * route.length_km));
  }
  svg.addEventListener("mousemove", function (ev) {
    var k = kpFromEvent(ev); if (k === null) return;
    var hv = document.getElementById("pfHover"); hv.setAttribute("x1", geom.X(k)); hv.setAttribute("x2", geom.X(k)); hv.setAttribute("visibility", "visible");
    var seg = E.segments.filter(function (s) { return k >= s.kpStart && k <= s.kpEnd; })[0];
    $("#profileRead").textContent = kpL(k) + ", " + num(hAt(k)) + " m" + (seg ? ", " + spreadById[seg.spread].name + ", " + D.terrainClasses[seg.terrain].label : "");
    if (hoverPt) { var p = route.at(k); hoverPt.position = C3.Cartesian3.fromDegrees(p.lon, p.lat); hoverPt.show = true; }
  });
  svg.addEventListener("mouseleave", function () {
    var hv = document.getElementById("pfHover"); if (hv) hv.setAttribute("visibility", "hidden");
    if (hoverPt) hoverPt.show = false;
    $("#profileRead").textContent = "Hover to read, click to fly there";
  });
  svg.addEventListener("click", function (ev) {
    var g = ev.target.closest && ev.target.closest("[data-x]");
    if (g) { select(g.getAttribute("data-x"), true); return; }
    var k = kpFromEvent(ev); if (k === null) return;
    var seg = E.segments.filter(function (s) { return k >= s.kpStart && k <= s.kpEnd; })[0];
    if (seg) select(seg.id, true);
  });
  var pfObs = new ResizeObserver(function () { drawProfile(); });
  pfObs.observe($("#profileFig"));

  function sampleProfile(tp) {
    var sp = C.profileSampleSpacing_m || 100, kps = [];
    for (var m = 0; m < route.length_m; m += sp) kps.push(m / 1000);
    kps.push(route.length_km);
    var carts = kps.map(function (k) { var p = route.at(k); return C3.Cartographic.fromDegrees(p.lon, p.lat); });
    return C3.sampleTerrainMostDetailed(tp, carts).then(function (res) {
      heights = kps.map(function (k, i) { return { kp: k, h: res[i].height || 0 }; });
      drawProfile();
    });
  }

  /* ---------- export ---------- */
  function exportGeoJSON() {
    var f = [{ type: "Feature", properties: { name: D.project.name, kind: "centreline", length_km: +E.length_km.toFixed(3) },
      geometry: { type: "LineString", coordinates: route.pts.map(function (p) { return [+p[0].toFixed(7), +p[1].toFixed(7)]; }) } }];
    for (var k = 0; k <= Math.floor(route.length_km); k++) {
      var p = route.at(k);
      f.push({ type: "Feature", properties: { kind: "kp", kp: k, label: kpL(k) }, geometry: { type: "Point", coordinates: [+p.lon.toFixed(7), +p.lat.toFixed(7)] } });
    }
    E.crossings.concat(E.facilities).forEach(function (o) {
      var p = o.offset ? { lon: o.offset[0], lat: o.offset[1] } : route.at(o.kp);
      f.push({ type: "Feature", properties: { kind: o.kind, id: o.id, name: o.name, type: o.type, kp: +o.kp.toFixed(3), method: o.method || null, cost: o.total },
        geometry: { type: "Point", coordinates: [+p.lon.toFixed(7), +p.lat.toFixed(7)] } });
    });
    var blob = new Blob([JSON.stringify({ type: "FeatureCollection", features: f }, null, 1)], { type: "application/geo+json" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "foothills-lateral.geojson";
    document.body.appendChild(a); a.click(); a.remove();
  }

  /* ---------- wiring ---------- */
  document.querySelector(".tabs").addEventListener("click", function (ev) {
    var b = ev.target.closest("button[data-tab]"); if (!b) return;
    tab = b.dataset.tab; selected = null; if (hl) hl.show = false; renderPanel(); drawProfile();
  });
  $("#body").addEventListener("click", function (ev) {
    var t = ev.target.closest("[data-id],[data-spread],[data-filter],[data-back],[data-fly],[data-copy],[data-tab-go],#exportBtn");
    if (!t) return;
    if (t.id === "exportBtn") exportGeoJSON();
    else if (t.dataset.id) select(t.dataset.id, true);
    else if (t.dataset.spread) { tab = "spreads"; selected = null; renderPanel(); flySpread(t.dataset.spread); }
    else if (t.dataset.filter) { filter = t.dataset.filter; renderPanel(); }
    else if (t.hasAttribute("data-back")) clearSel();
    else if (t.dataset.fly) flyItem(byId[t.dataset.fly]);
    else if (t.dataset.tabGo) { tab = t.dataset.tabGo; selected = null; renderPanel(); }
    else if (t.dataset.copy) {
      var url = location.href.split("#")[0] + "#" + t.dataset.copy;
      try { navigator.clipboard.writeText(url).then(function () { t.textContent = "Link copied"; }, function () { t.textContent = url; }); }
      catch (e) { t.textContent = url; }
    }
  });
  $("#colorMode").addEventListener("click", function (ev) {
    var b = ev.target.closest("button[data-mode]"); if (!b) return;
    mode = b.dataset.mode;
    document.querySelectorAll("#colorMode button").forEach(function (x) { x.classList.toggle("on", x === b); });
    applyColors();
  });
  $("#views").insertAdjacentHTML("beforeend", D.bookmarks.map(function (b) { return '<button type="button" data-view="' + b.id + '">' + esc(b.label) + "</button>"; }).join(""));
  $("#views").addEventListener("click", function (ev) {
    var b = ev.target.closest("button[data-view]"); if (!b) return;
    var bm = D.bookmarks.filter(function (x) { return x.id === b.dataset.view; })[0];
    if (bm.target) select(bm.target, true); else if (bm.spread) flySpread(bm.spread); else { clearSel(); flyOverview(); }
  });
  $("#pickBtn").addEventListener("click", function () {
    picking = !picking; this.setAttribute("aria-pressed", String(picking));
    tip.hidden = true; if (!picking && pickPin) pickPin.show = false;
    if (picking) notice("Pick KP is on: hover to read KP and offset, click to copy it."); else $("#notice").hidden = true;
  });

  renderPanel();
  applyColors();
  if (viewer) {
    buildScene();
    applyColors();
    wireMap();
    var startId = decodeURIComponent((location.hash || "").slice(1));
    viewer.camera.flyToBoundingSphere(C3.BoundingSphere.fromPoints(cart(route.pts, 1250 * ex())), { duration: 0,
      offset: new C3.HeadingPitchRange(C3.Math.toRadians(-62), C3.Math.toRadians(-38), 60000) });
    if (terrain) {
      terrain.readyEvent.addEventListener(function (tp) {
        sampleProfile(tp).then(function () { if (byId[startId]) select(startId, true); else flyOverview(); })
          .catch(function () { notice("Could not sample terrain for the profile."); });
      });
    } else if (byId[startId]) select(startId, true); else flyOverview();
  }
  drawProfile();
  window.VBOE = { estimate: E, select: select, viewer: viewer, setHeights: function (h) { heights = h; drawProfile(); } };
})();
