/*
  Virtual BOE sample - FICTIONAL project data.
  Everything here is invented for demonstration. Rates are illustrative only
  and must not be used for estimating. Route and crossing locations are
  approximate and have not been checked against land tenure or real assets.

  How the data hangs together
  - controlPoints: the centreline in [longitude, latitude]. The viewer smooths
    it and computes chainage (KP) itself, so moving a point moves everything.
  - segments, crossings, facilities: located by KP (km from the start).
    Facilities can also carry an offset position (lon/lat) for off-ROW sites.
  - rates: unit rates the cost engine uses for every segment.
  - Money is CAD, 2026 dollars.
*/
window.BOE_DATA = {
  project: {
    name: "Foothills Lateral (sample)",
    client: "Fictional Midstream Co.",
    estimateClass: "AACE Class 4 style (illustrative)",
    basisDate: "November 2026",
    currency: "CAD",
    preparedBy: "Carson CAD & Consulting Ltd. - concept sample",
    disclaimer: "Fictional project. Route, crossings, quantities and rates are invented for demonstration and are not an estimate."
  },

  pipe: {
    nps: 36,
    od_mm: 914.4,
    wt_std_mm: 12.7,
    wt_hw_mm: 15.9,
    grade: "Grade 483 (X70), FBE coated",
    jointLength_m: 24.4,
    steelPrice_per_t: 2650,
    workingWidth_m: 45,
    permanentRow_m: 32,
    mop_kPa: 9930,
    product: "Sweet natural gas"
  },

  controlPoints: [
    [-114.330, 50.640], [-114.322, 50.655], [-114.318, 50.668], [-114.315, 50.690],
    [-114.320, 50.715], [-114.330, 50.740], [-114.338, 50.765], [-114.345, 50.795],
    [-114.352, 50.825], [-114.360, 50.855], [-114.372, 50.880], [-114.395, 50.900],
    [-114.430, 50.915], [-114.470, 50.928], [-114.520, 50.932], [-114.560, 50.930],
    [-114.600, 50.934], [-114.615, 50.945], [-114.620, 50.962], [-114.625, 50.990],
    [-114.628, 51.020], [-114.630, 51.050], [-114.632, 51.075], [-114.635, 51.095]
  ],

  spreads: [
    {
      id: "S1", name: "Spread 1 - Summer", season: "summer", kpStart: 0, kpEnd: 30.0,
      color: "#e07b24", window: "June to September 2027",
      crew: 360, days: 105,
      description: "Open cultivated land and rolling pasture. Topsoil salvage, two highway bores, two isolated creek crossings and the Fish Creek HDD."
    },
    {
      id: "S2", name: "Spread 2 - Winter", season: "winter", kpStart: 30.0, kpEnd: null,
      color: "#3f8fd6", window: "December 2027 to March 2028",
      crew: 420, days: 95,
      description: "Forested foothills, two wetlands built on frozen ground, the Elbow River HDD and a frozen open-cut at Jumpingpound Creek."
    }
  ],

  terrainClasses: {
    cultivated: { label: "Cultivated / flat",          color: "#c9b458" },
    rolling:    { label: "Rolling pasture",            color: "#8fae5b" },
    steep:      { label: "Steep slope / valley wall",  color: "#b5523b" },
    forest:     { label: "Forested foothills",         color: "#2f6b45" },
    wetland:    { label: "Wetland / organic soils",    color: "#4aa3a0" }
  },

  segments: [
    { id: "SEG-01", kpStart: 0.0,  kpEnd: 3.0,  terrain: "cultivated", note: "Start at meter station; cultivated quarter sections." },
    { id: "SEG-02", kpStart: 3.0,  kpEnd: 3.6,  terrain: "steep",      note: "Sheep River valley walls, both banks." },
    { id: "SEG-03", kpStart: 3.6,  kpEnd: 12.3, terrain: "rolling",    note: "Rolling native and tame pasture." },
    { id: "SEG-04", kpStart: 12.3, kpEnd: 13.0, terrain: "steep",      note: "Threepoint Creek valley." },
    { id: "SEG-05", kpStart: 13.0, kpEnd: 20.5, terrain: "cultivated", note: "Cultivated land; topsoil stripped full width." },
    { id: "SEG-06", kpStart: 20.5, kpEnd: 22.6, terrain: "rolling",    note: "Rolling pasture, scattered aspen." },
    { id: "SEG-07", kpStart: 22.6, kpEnd: 23.3, terrain: "steep",      note: "Fish Creek valley; HDD takes most of it." },
    { id: "SEG-08", kpStart: 23.3, kpEnd: 30.0, terrain: "rolling",    note: "Pasture to spread break at MLV-1." },
    { id: "SEG-09", kpStart: 30.0, kpEnd: 36.0, terrain: "forest",     note: "Mixed-wood forest; merchantable timber salvage." },
    { id: "SEG-10", kpStart: 36.0, kpEnd: 37.2, terrain: "wetland",    note: "Wetland W-1, built on frost-packed ground." },
    { id: "SEG-11", kpStart: 37.2, kpEnd: 44.6, terrain: "forest",     note: "Forest; side-hill cuts in places." },
    { id: "SEG-12", kpStart: 44.6, kpEnd: 45.8, terrain: "steep",      note: "Elbow River valley; HDD takes the crossing." },
    { id: "SEG-13", kpStart: 45.8, kpEnd: 52.0, terrain: "forest",     note: "Forest north of the Elbow." },
    { id: "SEG-14", kpStart: 52.0, kpEnd: 52.9, terrain: "wetland",    note: "Wetland W-2." },
    { id: "SEG-15", kpStart: 52.9, kpEnd: 58.3, terrain: "forest",     note: "Forest and cut blocks." },
    { id: "SEG-16", kpStart: 58.3, kpEnd: 59.2, terrain: "steep",      note: "Jumpingpound Creek valley." },
    { id: "SEG-17", kpStart: 59.2, kpEnd: null, terrain: "rolling",    note: "Pasture to the delivery station." }
  ],

  /* Unit rates, CAD per metre unless the unit says otherwise. */
  rates: {
    mainline: { cultivated: 2450, rolling: 2900, steep: 4800, forest: 3300, wetland: 3900 },
    winterProductivityFactor: 1.22,
    clearing:   { cultivated: 20, rolling: 35, steep: 90, forest: 160, wetland: 120 },
    topsoil:    { cultivated: 260, rolling: 140, steep: 90, forest: 90, wetland: 90 },
    reclamation:{ cultivated: 110, rolling: 110, steep: 420, forest: 150, wetland: 180 },
    snowManagement: 90,
    frostRipping: 150,
    weldNdePerWeld: 650,
    fieldJointCoatingPerJoint: 1150,
    hydrotest: 45,
    cathodicProtection: 18,
    surveyAsBuilt: 14
  },

  /* Crossings. method "trenchless" with a length replaces mainline over that span. */
  crossings: [
    { id: "X-01", kp: 0.545,   type: "road",      name: "Range road", method: "Open-cut", items: [
      { d: "Open-cut road crossing incl. traffic control", q: 1, u: "ea", r: 45000, cat: "crossings" } ] },
    { id: "X-02", kp: 3.101,  type: "water",     name: "Sheep River", method: "Isolated open-cut (dam and pump)", width_m: 40, items: [
      { d: "Isolation: dams, pumps, 24 h monitoring", q: 1, u: "ls", r: 385000, cat: "crossings" },
      { d: "Heavy wall pipe premium", q: 80, u: "m", r: 186, cat: "materials" },
      { d: "Concrete coating for buoyancy", q: 80, u: "m", r: 640, cat: "materials" },
      { d: "Bank restoration and riprap", q: 1, u: "ls", r: 145000, cat: "crossings" },
      { d: "Environmental monitor and fisheries salvage", q: 1, u: "ls", r: 38000, cat: "crossings" } ],
      note: "Inside the summer window, outside the restricted activity period (assumed)." },
    { id: "X-03", kp: 5.2,   type: "foreign",   name: "Foreign pipeline FP-1 (NPS 20 gas)", method: "Open-cut under existing line", items: [
      { d: "Hydrovac locate and expose, crossing agreement, owner inspector", q: 1, u: "ea", r: 95000, cat: "crossings" } ] },
    { id: "X-04", kp: 8.816,   type: "highway",   name: "Provincial highway", method: "Auger bore", length_m: 55, trenchless: true, items: [
      { d: "Auger bore NPS 36", q: 55, u: "m", r: 3400, cat: "crossings" },
      { d: "Bore and receiving pits", q: 1, u: "ls", r: 120000, cat: "crossings" },
      { d: "Heavy wall pipe", q: 55, u: "m", r: 934, cat: "materials" },
      { d: "Traffic accommodation and permits", q: 1, u: "ls", r: 30000, cat: "crossings" } ] },
    { id: "X-05", kp: 9.8,   type: "road",      name: "Range road", method: "Open-cut", items: [
      { d: "Open-cut road crossing incl. traffic control", q: 1, u: "ea", r: 45000, cat: "crossings" } ] },
    { id: "X-06", kp: 12.666, type: "water",     name: "Threepoint Creek", method: "Isolated open-cut (flume)", width_m: 22, items: [
      { d: "Isolation: flume and dams", q: 1, u: "ls", r: 210000, cat: "crossings" },
      { d: "Heavy wall pipe premium", q: 50, u: "m", r: 186, cat: "materials" },
      { d: "Concrete coating for buoyancy", q: 50, u: "m", r: 640, cat: "materials" },
      { d: "Bank restoration", q: 1, u: "ls", r: 90000, cat: "crossings" } ] },
    { id: "X-07", kp: 13.640,  type: "power",     name: "Overhead powerline (240 kV)", method: "Cross under, matting and grounding", items: [
      { d: "Grounding, goal posts, owner supervision", q: 1, u: "ea", r: 32000, cat: "crossings" } ] },
    { id: "X-08", kp: 17.029,  type: "road",      name: "Range road", method: "Open-cut", items: [
      { d: "Open-cut road crossing incl. traffic control", q: 1, u: "ea", r: 45000, cat: "crossings" } ] },
    { id: "X-09", kp: 13.592,  type: "highway",   name: "Provincial highway", method: "Auger bore", length_m: 60, trenchless: true, items: [
      { d: "Auger bore NPS 36", q: 60, u: "m", r: 3400, cat: "crossings" },
      { d: "Bore and receiving pits", q: 1, u: "ls", r: 120000, cat: "crossings" },
      { d: "Heavy wall pipe", q: 60, u: "m", r: 934, cat: "materials" },
      { d: "Traffic accommodation and permits", q: 1, u: "ls", r: 30000, cat: "crossings" } ] },
    { id: "X-10", kp: 21.3,  type: "foreign",   name: "Foreign pipeline FP-2 (NPS 12 oil)", method: "Open-cut under existing line", items: [
      { d: "Hydrovac locate and expose, crossing agreement, owner inspector", q: 1, u: "ea", r: 95000, cat: "crossings" } ] },
    { id: "X-11", kp: 23.7,  type: "road",      name: "Range road", method: "Open-cut", items: [
      { d: "Open-cut road crossing incl. traffic control", q: 1, u: "ea", r: 45000, cat: "crossings" } ] },
    { id: "X-12", kp: 22.924, type: "hdd",       name: "Fish Creek", method: "Horizontal directional drill", length_m: 520, trenchless: true, items: [
      { d: "HDD NPS 36 (pilot, ream, pull back)", q: 520, u: "m", r: 5200, cat: "crossings" },
      { d: "HDD rig mobilization and pad construction", q: 1, u: "ls", r: 650000, cat: "crossings" },
      { d: "Heavy wall pipe with abrasion-resistant overcoat", q: 540, u: "m", r: 1114, cat: "materials" },
      { d: "Pullback section fabrication and testing", q: 1, u: "ls", r: 240000, cat: "crossings" },
      { d: "Drilling fluid management and disposal", q: 1, u: "ls", r: 160000, cat: "crossings" } ],
      note: "Steep valley and a sensitive fishery; HDD keeps work out of the channel." },
    { id: "X-13", kp: 31.5,  type: "road",      name: "Gravel resource road", method: "Open-cut", items: [
      { d: "Open-cut road crossing", q: 1, u: "ea", r: 38000, cat: "crossings" } ] },
    { id: "X-14", kp: 33.8,  type: "foreign",   name: "Foreign pipeline FP-3 (NPS 8 gas)", method: "Open-cut under existing line", items: [
      { d: "Hydrovac locate and expose, crossing agreement, owner inspector", q: 1, u: "ea", r: 95000, cat: "crossings" } ] },
    { id: "X-15", kp: 36.6,  type: "wetland",   name: "Wetland W-1", method: "Frozen-ground construction", length_m: 1200, items: [
      { d: "Frost packing and snow fill access", q: 1200, u: "m", r: 650, cat: "crossings" },
      { d: "Rig mats where frost is poor", q: 400, u: "m", r: 900, cat: "crossings" },
      { d: "Swamp weights / screw anchors", q: 100, u: "ea", r: 2800, cat: "materials" } ] },
    { id: "X-16", kp: 40.2,  type: "power",     name: "Overhead powerline (138 kV)", method: "Cross under, matting and grounding", items: [
      { d: "Grounding, goal posts, owner supervision", q: 1, u: "ea", r: 32000, cat: "crossings" } ] },
    { id: "X-17", kp: 42.504,  type: "highway",   name: "Provincial highway", method: "Auger bore", length_m: 60, trenchless: true, items: [
      { d: "Auger bore NPS 36 (frozen ground)", q: 60, u: "m", r: 3900, cat: "crossings" },
      { d: "Bore and receiving pits, hoarding and heat", q: 1, u: "ls", r: 165000, cat: "crossings" },
      { d: "Heavy wall pipe", q: 60, u: "m", r: 934, cat: "materials" },
      { d: "Traffic accommodation and permits", q: 1, u: "ls", r: 30000, cat: "crossings" } ] },
    { id: "X-18", kp: 45.193,  type: "hdd",       name: "Elbow River", method: "Horizontal directional drill", length_m: 780, trenchless: true, items: [
      { d: "HDD NPS 36 (pilot, ream, pull back), winter conditions", q: 780, u: "m", r: 5600, cat: "crossings" },
      { d: "HDD rig mobilization, pads, hoarding and heat", q: 1, u: "ls", r: 950000, cat: "crossings" },
      { d: "Heavy wall pipe with abrasion-resistant overcoat", q: 800, u: "m", r: 1114, cat: "materials" },
      { d: "Pullback section fabrication, roller stands, testing", q: 1, u: "ls", r: 380000, cat: "crossings" },
      { d: "Drilling fluid management, frac-out contingency plan", q: 1, u: "ls", r: 260000, cat: "crossings" },
      { d: "Geotechnical investigation (boreholes)", q: 1, u: "ls", r: 180000, cat: "crossings" } ],
      note: "Isolation valves MLV-2 and MLV-3 either side of the river." },
    { id: "X-19", kp: 49.5,  type: "road",      name: "Range road", method: "Open-cut", items: [
      { d: "Open-cut road crossing incl. traffic control", q: 1, u: "ea", r: 45000, cat: "crossings" } ] },
    { id: "X-20", kp: 52.45, type: "wetland",   name: "Wetland W-2", method: "Frozen-ground construction", length_m: 900, items: [
      { d: "Frost packing and snow fill access", q: 900, u: "m", r: 650, cat: "crossings" },
      { d: "Rig mats where frost is poor", q: 300, u: "m", r: 900, cat: "crossings" },
      { d: "Swamp weights / screw anchors", q: 75, u: "ea", r: 2800, cat: "materials" } ] },
    { id: "X-21", kp: 55.4,  type: "highway",   name: "Provincial highway", method: "Auger bore", length_m: 60, trenchless: true, items: [
      { d: "Auger bore NPS 36 (frozen ground)", q: 60, u: "m", r: 3900, cat: "crossings" },
      { d: "Bore and receiving pits, hoarding and heat", q: 1, u: "ls", r: 165000, cat: "crossings" },
      { d: "Heavy wall pipe", q: 60, u: "m", r: 934, cat: "materials" },
      { d: "Traffic accommodation and permits", q: 1, u: "ls", r: 30000, cat: "crossings" } ] },
    { id: "X-22", kp: 58.75, type: "water",     name: "Jumpingpound Creek", method: "Isolated open-cut, frozen (dam and pump)", width_m: 28, items: [
      { d: "Isolation: dams and heated pumps", q: 1, u: "ls", r: 290000, cat: "crossings" },
      { d: "Ice and frozen-bank removal", q: 1, u: "ls", r: 85000, cat: "crossings" },
      { d: "Heavy wall pipe premium", q: 60, u: "m", r: 186, cat: "materials" },
      { d: "Concrete coating for buoyancy", q: 60, u: "m", r: 640, cat: "materials" },
      { d: "Bank stabilization (restoration in spring)", q: 1, u: "ls", r: 120000, cat: "crossings" } ] },
    { id: "X-23", kp: 61.0,  type: "foreign",   name: "Foreign pipeline FP-4 (NPS 24 gas)", method: "Open-cut under existing line", items: [
      { d: "Hydrovac locate and expose, crossing agreement, owner inspector", q: 1, u: "ea", r: 95000, cat: "crossings" } ] },
    { id: "X-24", kp: 62.3,  type: "road",      name: "Range road", method: "Open-cut", items: [
      { d: "Open-cut road crossing incl. traffic control", q: 1, u: "ea", r: 45000, cat: "crossings" } ] }
  ],

  crossingTypes: {
    water:   { label: "Watercourse",       glyph: "W", color: "#2b7bd8" },
    hdd:     { label: "HDD",               glyph: "H", color: "#7a3fd6" },
    highway: { label: "Highway bore",      glyph: "B", color: "#d23f3f" },
    road:    { label: "Road (open-cut)",   glyph: "R", color: "#6b6b6b" },
    foreign: { label: "Foreign pipeline",  glyph: "F", color: "#e0a000" },
    power:   { label: "Powerline",         glyph: "P", color: "#d06a00" },
    wetland: { label: "Wetland",           glyph: "M", color: "#2f9c94" }
  },

  facilities: [
    { id: "F-01", kp: 0.0, type: "station", name: "Sheep River Meter and Launcher Station", items: [
      { d: "Meter station, launcher, site works (allowance)", q: 1, u: "ls", r: 9500000, cat: "facilities" } ] },
    { id: "F-02", kp: 30.0, type: "valve", name: "MLV-1 Block valve (spread break)", items: [
      { d: "Mainline block valve site, NPS 36", q: 1, u: "ea", r: 2400000, cat: "facilities" } ] },
    { id: "F-03", kp: 44.6, type: "valve", name: "MLV-2 Elbow River south isolation valve", items: [
      { d: "Mainline block valve site, NPS 36, remote actuated", q: 1, u: "ea", r: 2650000, cat: "facilities" } ] },
    { id: "F-04", kp: 45.8, type: "valve", name: "MLV-3 Elbow River north isolation valve", items: [
      { d: "Mainline block valve site, NPS 36, remote actuated", q: 1, u: "ea", r: 2650000, cat: "facilities" } ] },
    { id: "F-05", kp: null, type: "station", name: "Jumpingpound Receiver and Delivery Station", items: [
      { d: "Receiver, delivery meter, site works (allowance)", q: 1, u: "ls", r: 8700000, cat: "facilities" } ] },
    { id: "F-06", kp: 12.0, offset: [-114.312, 50.752], type: "yard", name: "Laydown yard LY-1 (Spread 1)", spread: "S1", items: [
      { d: "Yard lease, gravel, fencing, reclamation", q: 1, u: "ls", r: 450000, cat: "indirects" } ] },
    { id: "F-07", kp: 43.0, offset: [-114.548, 50.918], type: "camp", name: "Winter camp and laydown LY-2 (Spread 2)", spread: "S2", items: [
      { d: "Camp pad, utilities, reclamation", q: 1, u: "ls", r: 1400000, cat: "indirects" },
      { d: "Laydown yard lease and gravel", q: 1, u: "ls", r: 520000, cat: "indirects" },
      { d: "Temporary winter access roads", q: 8.0, u: "km", r: 180000, cat: "indirects" } ] }
  ],

  facilityTypes: {
    station: { label: "Station",       glyph: "S", color: "#16181a" },
    valve:   { label: "Block valve",   glyph: "V", color: "#16181a" },
    yard:    { label: "Laydown yard",  glyph: "L", color: "#5b5b5b" },
    camp:    { label: "Camp",          glyph: "C", color: "#5b5b5b" }
  },

  /* Spread indirects. pct items are a percent of that spread's directs. */
  spreadIndirects: {
    S1: [
      { d: "Mobilization and demobilization", q: 1, u: "ls", r: 5800000, cat: "indirects" },
      { d: "Living-out allowance (360 crew x 105 days)", q: 37800, u: "crew-day", r: 175, cat: "indirects" },
      { d: "Construction management and inspection", pct: 7, cat: "indirects" }
    ],
    S2: [
      { d: "Mobilization and demobilization", q: 1, u: "ls", r: 6600000, cat: "indirects" },
      { d: "Camp operation (420 crew x 95 days)", q: 39900, u: "crew-day", r: 195, cat: "indirects" },
      { d: "Construction management and inspection", pct: 7, cat: "indirects" },
      { d: "Winter standby allowance (weather)", q: 6, u: "day", r: 310000, cat: "indirects" }
    ]
  },

  project_level: {
    engineeringPct: 5,
    contingencyPct: 15
  },

  categories: {
    materials:  { label: "Materials",            color: "#8a8f98" },
    mainline:   { label: "Mainline construction", color: "#e07b24" },
    crossings:  { label: "Crossings",            color: "#7a3fd6" },
    facilities: { label: "Facilities",           color: "#16181a" },
    indirects:  { label: "Spread indirects",     color: "#3f8fd6" },
    engineering:{ label: "Engineering and PM",   color: "#2f9c94" },
    contingency:{ label: "Contingency",          color: "#c9b458" }
  },

  assumptions: [
    "Pipe is NPS 36 x 12.7 mm WT Grade 483, FBE coated; 15.9 mm heavy wall at bores, HDDs and watercourses.",
    "Steel delivered to site at $2,650 per tonne, double-jointed to 24.4 m.",
    "Spread 1 is built June to September 2027; Spread 2 December 2027 to March 2028 on frozen ground.",
    "Winter mainline rates carry a 1.22 productivity factor plus snow management and frost ripping.",
    "Watercourse open-cuts are isolated and fall outside restricted activity periods.",
    "HDD lengths are from a concept profile; geotechnical work may change them.",
    "Construction management and inspection is 7% of spread directs; engineering is 5% of all directs.",
    "Contingency is 15% of directs, indirects and engineering."
  ],
  exclusions: [
    "Land, right-of-way acquisition and damages",
    "Regulatory, consultation and owner's costs",
    "Escalation beyond 2026 dollars",
    "GST and other taxes",
    "Compressor stations and upstream or downstream tie-ins",
    "Financing and interest during construction"
  ],

  bookmarks: [
    { id: "overview", label: "Whole line" },
    { id: "S1", label: "Summer spread", spread: "S1" },
    { id: "S2", label: "Winter spread", spread: "S2" },
    { id: "X-02", label: "Sheep River", target: "X-02" },
    { id: "X-12", label: "Fish Creek HDD", target: "X-12" },
    { id: "X-18", label: "Elbow River HDD", target: "X-18" }
  ]
};
