const MAX_VISIBLE_ROUTES = 240;
const ROUTE_SAMPLE_COUNT = 14;
const MIN_ZOOM = 0.72;
const MAX_ZOOM = 9.5;
const REGIONAL_ZOOM = 1.3;
const CLOSE_REGIONAL_ZOOM = 2.35;
const DEEP_REGIONAL_ZOOM = 4.8;
const passengerFormat = d3.format(".3~s");
const passengerLongFormat = d3.format(",");
const radiusScale = d3.scaleSqrt()
  .domain(d3.extent(HUBS, (hub) => hub.enplanements))
  .range([4.5, 12]);
const REFERENCE_LABELS = [
  { name: "United States", coordinates: [-100, 39], type: "country", priority: 10, maxZoom: 2.2 },
  { name: "Canada", coordinates: [-108, 57], type: "country", priority: 9, maxZoom: 2.2 },
  { name: "Mexico", coordinates: [-102, 23], type: "country", priority: 8, maxZoom: 2.2 },
  { name: "Greenland", coordinates: [-42, 72], type: "country", priority: 5, maxZoom: 2.2 },
  { name: "Iceland", coordinates: [-19, 65], type: "country", priority: 4, maxZoom: 2.2 },
  { name: "United Kingdom", coordinates: [-3, 55], type: "country", priority: 6, maxZoom: 2.2 },
  { name: "France", coordinates: [2, 46], type: "country", priority: 5, maxZoom: 2.2 },
  { name: "Germany", coordinates: [10, 51], type: "country", priority: 5, maxZoom: 2.2 },
  { name: "Spain", coordinates: [-4, 40], type: "country", priority: 4, maxZoom: 2.2 },
  { name: "Brazil", coordinates: [-52, -10], type: "country", priority: 7, maxZoom: 2.2 },
  { name: "Argentina", coordinates: [-64, -35], type: "country", priority: 5, maxZoom: 2.2 },
  { name: "Russia", coordinates: [90, 60], type: "country", priority: 7, maxZoom: 2.2 },
  { name: "China", coordinates: [104, 35], type: "country", priority: 8, maxZoom: 2.2 },
  { name: "Japan", coordinates: [138, 37], type: "country", priority: 6, maxZoom: 2.2 },
  { name: "India", coordinates: [79, 22], type: "country", priority: 7, maxZoom: 2.2 },
  { name: "Australia", coordinates: [134, -25], type: "country", priority: 7, maxZoom: 2.2 },
  { name: "New York", coordinates: [-74.01, 40.71], type: "city", priority: 8, minZoom: 1.15 },
  { name: "Chicago", coordinates: [-87.63, 41.88], type: "city", priority: 7, minZoom: 1.15 },
  { name: "Atlanta", coordinates: [-84.39, 33.75], type: "city", priority: 7, minZoom: 1.15 },
  { name: "Dallas", coordinates: [-96.8, 32.78], type: "city", priority: 6, minZoom: 1.15 },
  { name: "Los Angeles", coordinates: [-118.24, 34.05], type: "city", priority: 8, minZoom: 1.15 },
  { name: "Seattle", coordinates: [-122.33, 47.61], type: "city", priority: 6, minZoom: 1.15 },
  { name: "Denver", coordinates: [-104.99, 39.74], type: "city", priority: 6, minZoom: 1.15 },
  { name: "Miami", coordinates: [-80.19, 25.76], type: "city", priority: 6, minZoom: 1.15 },
  { name: "London", coordinates: [-0.13, 51.51], type: "city", priority: 6, minZoom: 1.15 },
  { name: "Paris", coordinates: [2.35, 48.86], type: "city", priority: 5, minZoom: 1.15 },
  { name: "Frankfurt", coordinates: [8.68, 50.11], type: "city", priority: 4, minZoom: 1.15 },
  { name: "Tokyo", coordinates: [139.69, 35.68], type: "city", priority: 6, minZoom: 1.15 },
  { name: "Beijing", coordinates: [116.41, 39.9], type: "city", priority: 5, minZoom: 1.15 },
  { name: "Shanghai", coordinates: [121.47, 31.23], type: "city", priority: 5, minZoom: 1.15 },
  { name: "Sydney", coordinates: [151.21, -33.87], type: "city", priority: 5, minZoom: 1.15 }
];
const US_METRO_LABELS = [
  { name: "Boston", coordinates: [-71.06, 42.36] },
  { name: "Washington", coordinates: [-77.04, 38.91] },
  { name: "Charlotte", coordinates: [-80.84, 35.23] },
  { name: "Detroit", coordinates: [-83.05, 42.33] },
  { name: "Minneapolis", coordinates: [-93.27, 44.98] },
  { name: "Houston", coordinates: [-95.37, 29.76] },
  { name: "Phoenix", coordinates: [-112.07, 33.45] },
  { name: "San Francisco", coordinates: [-122.42, 37.77] },
  { name: "Salt Lake City", coordinates: [-111.89, 40.76] },
  { name: "Las Vegas", coordinates: [-115.14, 36.17] }
];
const AIRLINE_STORIES = {
  Alaska: {
    name: "Alaska Airlines", primaryHub: "SEA", focusCities: ["PDX", "ANC", "SFO", "LAX"],
    pattern: "Alaska's network is strongly West Coast and Pacific Northwest oriented, with SEA acting as its main organizing hub."
  },
  American: {
    name: "American Airlines", primaryHub: "DFW", focusCities: ["CLT", "PHX", "MIA", "DCA"],
    pattern: "American's network uses DFW as a central connector while major eastern and southwestern hubs extend its national reach."
  },
  Delta: {
    name: "Delta Air Lines", primaryHub: "ATL", focusCities: ["MSP", "DTW", "SLC", "LAX", "JFK"],
    pattern: "Delta's network radiates from ATL and is reinforced by a distributed set of regional hubs across the country."
  },
  Frontier: {
    name: "Frontier Airlines", primaryHub: "DEN", focusCities: ["MCO", "LAS", "PHX", "ATL"],
    pattern: "Frontier's network is organized around DEN with leisure-oriented connections spreading toward large destination markets."
  },
  JetBlue: {
    name: "JetBlue Airways", primaryHub: "JFK", focusCities: ["BOS", "FLL", "MCO", "LAX"],
    pattern: "JetBlue's network is East Coast oriented, linking its New York base with Florida, Boston, and selected transcontinental markets."
  },
  Southwest: {
    name: "Southwest Airlines", primaryHub: "DAL", focusCities: ["BWI", "DEN", "LAS", "HOU", "MDW"],
    pattern: "Southwest's network is broadly distributed, using several strong operating bases rather than a single dominant connecting hub."
  },
  Spirit: {
    name: "Spirit Airlines", primaryHub: "FLL", focusCities: ["MCO", "LAS", "DFW", "DTW"],
    pattern: "Spirit's network is leisure-focused, with FLL and other large destination markets anchoring its point-to-point structure."
  },
  "Sun Country": {
    name: "Sun Country Airlines", primaryHub: "MSP", focusCities: ["LAS", "MCO", "PHX", "DFW"],
    pattern: "Sun Country's network is compact and MSP-centered, with spokes aimed primarily at leisure destinations."
  },
  United: {
    name: "United Airlines", primaryHub: "ORD", focusCities: ["DEN", "IAH", "EWR", "SFO", "IAD"],
    pattern: "United's network forms a national hub system, with ORD and DEN linking strong coastal and interior gateways."
  }
};

const filters = { role: "All", airlines: new Set(), query: "" };
const routeState = { visible: false, hubCode: undefined, hoveredRoute: undefined };
const markers = new Map();
const routeFeatureCache = new Map();
const hubsByCode = new Map(HUBS.map((hub) => [hub.code, hub]));
const allAirlines = Object.keys(ROUTE_NETWORKS);
const allRouteAirports = Object.values(ROUTE_AIRPORTS);
const ANALYTIC_ROUTES = allAirlines.flatMap((airline) =>
  ROUTE_NETWORKS[airline].map(([origin, destination]) => ({ airline, origin, destination }))
);
const hoverCard = document.querySelector("#hover-card");
const routeTooltip = document.querySelector("#route-tooltip");
const networkTooltip = document.querySelector("#network-tooltip");
const airlineStory = document.querySelector("#airline-story");
const airportList = document.querySelector("#airport-list");
const routeToggle = document.querySelector("#show-routes");
const hubRankingChart = d3.select("#hub-ranking-chart");
const airlineComparisonChart = d3.select("#airline-comparison-chart");
const networkChart = d3.select("#network-chart");
const hubDetail = document.querySelector("#hub-detail");
const mapElement = document.querySelector("#map");
const canvas = d3.select(mapElement).append("canvas").attr("class", "globe-canvas").node();
const context = canvas.getContext("2d");
const svg = d3.select(mapElement).append("svg")
  .attr("class", "globe-overlay")
  .attr("role", "img")
  .attr("aria-label", "Rotating globe showing U.S. airline hubs and selected route arcs");
const routeHitLayer = svg.append("g").attr("class", "route-hit-layer");
const routeHighlightLayer = svg.append("g").attr("class", "route-highlight-layer");
const hubLayer = svg.append("g").attr("class", "hub-layer");
const projection = d3.geoOrthographic().precision(0.6).rotate([98, -36, 0]);
const canvasPath = d3.geoPath(projection, context);
const svgPath = d3.geoPath(projection);
const graticule = d3.geoGraticule10();
const sphere = { type: "Sphere" };
const motion = {
  dragging: false,
  hovering: false,
  dirty: true,
  lastFrame: performance.now(),
  resumeAt: 0,
  reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches
};

let width;
let height;
let baseScale;
let zoomFactor = 1;
let land;
let countryBorders;
let stateBorders;
let stateLoadPromise;
let routeFeatures = [];
let routeCollections = [];
let routeAirportCodes = new Set();
let hoveredHub;
let responsiveResizeFrame;
let pinchDistance;

function responsiveWidth() {
  return mapElement.clientWidth || window.innerWidth;
}

function isPhoneLayout() {
  return responsiveWidth() < 768;
}

function visibleRouteLimit() {
  const currentWidth = responsiveWidth();
  if (currentWidth <= 390) return 90;
  if (currentWidth <= 480) return 120;
  if (currentWidth < 768) return 150;
  if (currentWidth <= 1024) return 200;
  return MAX_VISIBLE_ROUTES;
}

function networkConnectionLimit() {
  return responsiveWidth() <= 390 ? 14 : responsiveWidth() < 768 ? 18 : 24;
}

function routeKey(airline, origin, destination) {
  return `${airline}:${origin}:${destination}`;
}

function getRouteFeature(airline, origin, destination) {
  const key = routeKey(airline, origin, destination);
  if (!routeFeatureCache.has(key)) {
    const interpolate = d3.geoInterpolate(
      ROUTE_AIRPORTS[origin].coordinates,
      ROUTE_AIRPORTS[destination].coordinates
    );
    routeFeatureCache.set(key, {
      type: "Feature",
      properties: { key, airline, color: AIRLINE_COLORS[airline], origin, destination },
      geometry: {
        type: "LineString",
        coordinates: d3.range(ROUTE_SAMPLE_COUNT).map((index) => interpolate(index / (ROUTE_SAMPLE_COUNT - 1)))
      }
    });
  }
  return routeFeatureCache.get(key);
}

function hasRouteSelection() {
  return filters.airlines.size > 0 || Boolean(routeState.hubCode);
}

function selectedRouteFeatures() {
  if (!routeState.visible || !hasRouteSelection()) return [];
  const airlines = filters.airlines.size ? [...filters.airlines] : allAirlines;
  const hubCode = routeState.hubCode;
  const routes = airlines.flatMap((airline) =>
    ROUTE_NETWORKS[airline]
      .filter(([origin, destination]) => !hubCode || origin === hubCode || destination === hubCode)
      .map(([origin, destination]) => getRouteFeature(airline, origin, destination))
  );
  return routes
    .sort((a, b) => routePriority(b) - routePriority(a) || d3.ascending(a.properties.key, b.properties.key))
    .slice(0, visibleRouteLimit());
}

function routePriority(feature) {
  const { origin, destination } = feature.properties;
  return (hubsByCode.get(origin)?.enplanements || 0) + (hubsByCode.get(destination)?.enplanements || 0);
}

function analyticRoutePriority(route) {
  return (hubsByCode.get(route.origin)?.enplanements || 0) + (hubsByCode.get(route.destination)?.enplanements || 0);
}

function selectedAnalyticsRoutes() {
  if (!filters.airlines.size) return ANALYTIC_ROUTES;
  return ANALYTIC_ROUTES.filter((route) => filters.airlines.has(route.airline));
}

function airportStats(routes) {
  const stats = new Map();
  routes.forEach((route) => {
    [[route.origin, route.destination], [route.destination, route.origin]].forEach(([code, connectedCode]) => {
      if (!stats.has(code)) {
        const airport = ROUTE_AIRPORTS[code] || hubsByCode.get(code);
        stats.set(code, {
          code,
          city: airport?.city || code,
          routes: 0,
          airlines: new Set(),
          connections: new Set()
        });
      }
      const airport = stats.get(code);
      airport.routes += 1;
      airport.airlines.add(route.airline);
      airport.connections.add(connectedCode);
    });
  });
  return stats;
}

function airlineStats() {
  return allAirlines.map((airline) => {
    const routes = ANALYTIC_ROUTES.filter((route) => route.airline === airline);
    return {
      airline,
      routes: routes.length,
      airports: new Set(routes.flatMap((route) => [route.origin, route.destination])).size,
      primaryHub: AIRLINE_STORIES[airline]?.primaryHub || "—"
    };
  });
}

function highlightDashboardHub(code, active) {
  markers.get(code)?.classList.toggle("chart-hover", active);
}

function setSingleAirline(airline) {
  filters.airlines.clear();
  if (airline) filters.airlines.add(airline);
  routeState.hubCode = undefined;
  routeState.visible = Boolean(airline);
  renderFilters();
  refreshView();
}

function selectAirportCode(code) {
  routeState.hubCode = routeState.hubCode === code ? undefined : code;
  routeState.visible = Boolean(routeState.hubCode || filters.airlines.size);
  renderFilters();
  refreshView();
  const airport = ROUTE_AIRPORTS[code] || hubsByCode.get(code);
  if (airport) focusCoordinates(airport.coordinates, Math.max(zoomFactor, 1.35), 700);
}

function renderDashboard() {
  const routes = selectedAnalyticsRoutes();
  const stats = airportStats(routes);
  renderKpis(routes, stats);
  renderHubRanking(stats);
  renderAirlineComparison();
  renderHubDetail(stats);
  renderNetworkView(routes);
  ensureMobileCollapseButtons();
}

function renderKpis(routes, stats) {
  const globalStats = airportStats(ANALYTIC_ROUTES);
  const largestHub = [...globalStats.values()].sort((a, b) => d3.descending(a.routes, b.routes))[0];
  document.querySelector("#kpi-airports").textContent = Object.keys(ROUTE_AIRPORTS).length;
  document.querySelector("#kpi-routes").textContent = passengerLongFormat(ANALYTIC_ROUTES.length);
  document.querySelector("#kpi-airlines").textContent = allAirlines.length;
  document.querySelector("#kpi-largest-hub").textContent = largestHub?.code || "—";
  document.querySelector("#kpi-selected-routes").textContent = filters.airlines.size ? passengerLongFormat(routes.length) : "—";
  document.querySelector("#kpi-selected-airports").textContent = filters.airlines.size ? stats.size : "—";
}

function renderHubRanking(stats) {
  const width = hubRankingChart.node()?.clientWidth || 314;
  const height = hubRankingChart.node()?.clientHeight || 184;
  const margin = { top: 4, right: 30, bottom: 20, left: 40 };
  const ranked = HUBS
    .map((hub) => ({ ...hub, degree: stats.get(hub.code)?.routes || 0 }))
    .filter((hub) => hub.degree && airportMatches(hub))
    .sort((a, b) => d3.descending(a.degree, b.degree))
    .slice(0, responsiveWidth() <= 390 ? 6 : 8);
  const x = d3.scaleLinear().domain([0, d3.max(ranked, (hub) => hub.degree) || 1]).nice().range([margin.left, width - margin.right]);
  const y = d3.scaleBand().domain(ranked.map((hub) => hub.code)).range([margin.top, height - margin.bottom]).padding(0.26);
  hubRankingChart.attr("viewBox", `0 0 ${width} ${height}`).selectAll("*").remove();
  hubRankingChart.append("g").attr("class", "chart-axis").attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(4).tickSizeOuter(0));
  hubRankingChart.append("g").selectAll("rect").data(ranked).join("rect")
    .attr("class", "chart-bar")
    .attr("x", margin.left).attr("y", (hub) => y(hub.code)).attr("height", y.bandwidth())
    .attr("width", (hub) => x(hub.degree) - margin.left)
    .attr("rx", 2).attr("fill", (hub) => AIRLINE_COLORS[hub.anchor] || "#ffc857").attr("opacity", 0.7)
    .on("mouseenter", (_, hub) => highlightDashboardHub(hub.code, true))
    .on("mouseleave", (_, hub) => highlightDashboardHub(hub.code, false))
    .on("click", (_, hub) => selectAirportCode(hub.code));
  hubRankingChart.append("g").selectAll("text").data(ranked).join("text")
    .attr("class", "chart-label").attr("x", 0).attr("y", (hub) => y(hub.code) + y.bandwidth() / 2 + 3).text((hub) => hub.code);
  hubRankingChart.append("g").selectAll("text").data(ranked).join("text")
    .attr("class", "chart-value").attr("x", (hub) => x(hub.degree) + 4).attr("y", (hub) => y(hub.code) + y.bandwidth() / 2 + 3)
    .text((hub) => `${hub.degree} · ${passengerFormat(hub.enplanements)}`);
  document.querySelector("#ranking-context").textContent = filters.airlines.size ? [...filters.airlines].join(", ") : "All airlines";
}

function renderAirlineComparison() {
  const width = airlineComparisonChart.node()?.clientWidth || 314;
  const height = airlineComparisonChart.node()?.clientHeight || 184;
  const margin = { top: 4, right: 8, bottom: 35, left: 28 };
  const data = airlineStats().sort((a, b) => d3.descending(a.routes, b.routes));
  const x = d3.scaleBand().domain(data.map((item) => item.airline)).range([margin.left, width - margin.right]).padding(0.22);
  const subgroup = d3.scaleBand().domain(["routes", "airports"]).range([0, x.bandwidth()]).padding(0.12);
  const y = d3.scaleLinear().domain([0, d3.max(data, (item) => item.routes)]).nice().range([height - margin.bottom, margin.top]);
  airlineComparisonChart.attr("viewBox", `0 0 ${width} ${height}`).selectAll("*").remove();
  airlineComparisonChart.append("g").attr("class", "chart-axis").attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(4).tickSizeOuter(0));
  const groups = airlineComparisonChart.append("g").selectAll("g").data(data).join("g")
    .attr("transform", (item) => `translate(${x(item.airline)},0)`)
    .attr("class", "chart-bar")
    .on("click", (_, item) => setSingleAirline(filters.airlines.has(item.airline) ? undefined : item.airline));
  groups.append("rect").attr("x", subgroup("routes")).attr("y", (item) => y(item.routes))
    .attr("width", subgroup.bandwidth()).attr("height", (item) => y(0) - y(item.routes))
    .attr("fill", (item) => AIRLINE_COLORS[item.airline]).attr("opacity", (item) => filters.airlines.size && !filters.airlines.has(item.airline) ? 0.22 : 0.82);
  groups.append("rect").attr("x", subgroup("airports")).attr("y", (item) => y(item.airports))
    .attr("width", subgroup.bandwidth()).attr("height", (item) => y(0) - y(item.airports))
    .attr("fill", "#d6dee7").attr("opacity", 0.34);
  groups.append("text").attr("class", "comparison-hub").attr("text-anchor", "middle")
    .attr("x", x.bandwidth() / 2).attr("y", height - 20).text((item) => item.airline.slice(0, 2).toUpperCase());
  groups.append("text").attr("class", "comparison-hub").attr("text-anchor", "middle")
    .attr("x", x.bandwidth() / 2).attr("y", height - 9).text((item) => item.primaryHub);
}

function renderHubDetail(stats) {
  const detailStats = routeState.hubCode && !stats.has(routeState.hubCode) ? airportStats(ANALYTIC_ROUTES) : stats;
  const selected = routeState.hubCode && detailStats.get(routeState.hubCode);
  if (!selected) {
    hubDetail.innerHTML = `
      <p class="eyebrow">Airport detail</p>
      <h2>Select a hub</h2>
      <p class="detail-copy">Choose a globe marker, ranking bar, or network node to inspect its role in the filtered network.</p>
    `;
    return;
  }
  const ranked = [...detailStats.values()].sort((a, b) => d3.descending(a.routes, b.routes));
  const majorConnections = [...selected.connections]
    .sort((a, b) => d3.descending(hubsByCode.get(a)?.enplanements || 0, hubsByCode.get(b)?.enplanements || 0))
    .slice(0, 7);
  hubDetail.innerHTML = `
    <p class="eyebrow">Airport detail</p>
    <h2>${selected.code}</h2>
    <p class="detail-city">${selected.city}</p>
    <div class="detail-grid">
      <span>Routes<b>${selected.routes}</b></span>
      <span>Hub rank<b>#${ranked.findIndex((airport) => airport.code === selected.code) + 1}</b></span>
      <span>Airlines<b>${selected.airlines.size}</b></span>
      <span>Connections<b>${selected.connections.size}</b></span>
    </div>
    <p class="detail-copy"><b>Airlines served:</b> ${[...selected.airlines].join(", ")}</p>
    <p class="detail-copy"><b>Connected major airports:</b> ${majorConnections.join(", ") || "No major hub connections in this view"}</p>
  `;
}

function renderNetworkView(routes) {
  const width = networkChart.node()?.clientWidth || 314;
  const height = networkChart.node()?.clientHeight || 258;
  const selectedAirline = filters.airlines.size === 1 ? [...filters.airlines][0] : undefined;
  const stats = airportStats(routes);
  const fallbackHub = selectedAirline
    ? AIRLINE_STORIES[selectedAirline]?.primaryHub
    : [...stats.values()].sort((a, b) => d3.descending(a.routes, b.routes))[0]?.code;
  const centerCode = routeState.hubCode && stats.has(routeState.hubCode) ? routeState.hubCode : fallbackHub;
  const centerAirport = stats.get(centerCode);
  networkChart.on("click.dismiss-tooltip", () => hideNetworkTooltip(true));
  if (!centerAirport) {
    networkChart.selectAll("*").remove();
    document.querySelector("#network-context").textContent = "No connections";
    document.querySelector("#network-metrics").innerHTML = `<p class="network-empty">Select an airline or hub to inspect its strongest connections.</p>`;
    return;
  }

  const connections = new Map();
  routes.forEach((route) => {
    const connectedCode = route.origin === centerCode
      ? route.destination
      : route.destination === centerCode ? route.origin : undefined;
    if (!connectedCode) return;
    const key = connectedCode;
    if (!connections.has(key)) connections.set(key, { code: connectedCode, strength: 0, routes: [], airlines: new Set() });
    connections.get(key).strength += 1;
    connections.get(key).routes.push(route);
    connections.get(key).airlines.add(route.airline);
  });
  const strongestConnections = [...connections.values()]
    .sort((a, b) => d3.descending(a.strength, b.strength) || d3.descending(stats.get(a.code)?.routes || 0, stats.get(b.code)?.routes || 0))
    .slice(0, networkConnectionLimit());
  const totalStrength = d3.sum(strongestConnections, (connection) => connection.strength);
  const concentration = totalStrength
    ? d3.sum(strongestConnections, (connection) => (connection.strength / totalStrength) ** 2)
    : 0;
  const strongest = strongestConnections[0];
  document.querySelector("#network-context").textContent = `${centerCode} centered`;
  document.querySelector("#network-metrics").innerHTML = `
    <span>Visible links<b>${strongestConnections.length}</b></span>
    <span>Strongest<b>${strongest ? `${strongest.code} · ${strongest.strength}` : "—"}</b></span>
    <span>Airline<b>${selectedAirline || "All"}</b></span>
    <span>Concentration<b>${d3.format(".2f")(concentration)}</b></span>
  `;

  const importance = (code) => stats.get(code)?.routes || hubsByCode.get(code)?.enplanements / 1000000 || 1;
  const nodes = [
    { id: centerCode, center: true, importance: importance(centerCode), role: networkNodeRole(centerCode) },
    ...strongestConnections.map((connection) => ({
      id: connection.code,
      center: false,
      importance: importance(connection.code),
      role: networkNodeRole(connection.code),
      strength: connection.strength,
      connection
    }))
  ];
  const links = strongestConnections.map((connection) => ({
    source: centerCode,
    target: connection.code,
    strength: connection.strength,
    routes: connection.routes,
    airlines: [...connection.airlines]
  }));
  const radius = d3.scaleSqrt().domain(d3.extent(nodes, (node) => node.importance)).range([3.2, 10]);
  const linkWidth = d3.scaleLinear().domain([1, d3.max(links, (link) => link.strength) || 1]).range([0.7, 3]);
  const linkDistance = d3.scaleLinear().domain([1, d3.max(links, (link) => link.strength) || 1]).range([100, 42]);
  networkChart.attr("viewBox", `0 0 ${width} ${height}`).selectAll("*").remove();
  const centerX = width / 2;
  const centerY = height / 2;
  nodes[0].fx = centerX;
  nodes[0].fy = centerY;
  const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id((node) => node.id).distance((link) => linkDistance(link.strength)).strength(0.8))
    .force("charge", d3.forceManyBody().strength(-46))
    .force("x", d3.forceX(centerX).strength(0.035))
    .force("y", d3.forceY(centerY).strength(0.035))
    .force("collide", d3.forceCollide((node) => radius(node.importance) + 8))
    .stop();
  for (let index = 0; index < 150; index += 1) simulation.tick();
  const topLabelIds = new Set([centerCode, ...strongestConnections.slice(0, 5).map((connection) => connection.code)]);
  positionNetworkLabels(nodes, topLabelIds, radius);
  networkChart.append("g").selectAll("line").data(links).join("line")
    .attr("class", "network-link")
    .attr("stroke-width", (link) => linkWidth(link.strength))
    .attr("x1", (link) => link.source.x).attr("y1", (link) => link.source.y)
    .attr("x2", (link) => link.target.x).attr("y2", (link) => link.target.y)
    .on("mouseenter", function (event, link) {
      d3.select(this).classed("hovered", true);
      highlightGlobeConnection(link.routes);
      showNetworkTooltip(event, centerCode, link.target.id, link.airlines, link.strength);
    })
    .on("mousemove", (event) => positionNetworkTooltip(event))
    .on("mouseleave", function () {
      d3.select(this).classed("hovered", false);
      clearGlobeConnectionHighlight();
      hideNetworkTooltip();
    })
    .on("click", (event, link) => {
      event.stopPropagation();
      showNetworkTooltip(event, centerCode, link.target.id, link.airlines, link.strength);
    });
  networkChart.append("g").selectAll("circle").data(nodes).join("circle")
    .attr("class", (node) => `network-node ${node.center ? "selected" : ""}`)
    .attr("cx", (node) => node.x).attr("cy", (node) => node.y).attr("r", (node) => radius(node.importance))
    .attr("fill", (node) => networkRoleColor(node.role))
    .on("mouseenter", function (event, node) {
      highlightDashboardHub(node.id, true);
      d3.select(this.parentNode.parentNode).selectAll(".network-label")
        .filter((label) => label.id === node.id)
        .classed("hovered", true);
      showNetworkNodeTooltip(event, centerCode, node);
    })
    .on("mouseleave", function (_, node) {
      highlightDashboardHub(node.id, false);
      d3.select(this.parentNode.parentNode).selectAll(".network-label")
        .filter((label) => label.id === node.id)
        .classed("hovered", false);
      hideNetworkTooltip();
    })
    .on("click", (event, node) => {
      event.stopPropagation();
      showNetworkNodeTooltip(event, centerCode, node);
      selectAirportCode(node.id);
    });
  const badgeNodes = nodes
    .filter((node) => !node.center && topLabelIds.has(node.id))
    .flatMap((node) => [...node.connection.airlines].slice(0, 3).map((airline, index) => ({ node, airline, index })));
  networkChart.append("g").attr("class", "network-airline-badges").selectAll("circle").data(badgeNodes).join("circle")
    .attr("class", "network-airline-dot")
    .attr("cx", ({ node, index }) => node.labelX + 3 + index * 6)
    .attr("cy", ({ node }) => node.labelY + 7)
    .attr("r", 2)
    .attr("fill", ({ airline }) => AIRLINE_COLORS[airline] || "#ffc857");
  networkChart.append("g").selectAll("text").data(nodes).join("text")
    .attr("class", (node) => `network-label ${topLabelIds.has(node.id) ? "always-visible" : ""}`)
    .attr("x", (node) => node.labelX).attr("y", (node) => node.labelY).text((node) => node.id);
}

function positionNetworkLabels(nodes, visibleIds, radius) {
  const occupied = [];
  nodes.forEach((node) => {
    const nodeRadius = radius(node.importance);
    const candidates = [
      [node.x + nodeRadius + 4, node.y + 2],
      [node.x - nodeRadius - 22, node.y + 2],
      [node.x - 9, node.y - nodeRadius - 5],
      [node.x - 9, node.y + nodeRadius + 10]
    ];
    const selected = candidates.find(([x, y]) => {
      const box = { left: x - 2, right: x + 21, top: y - 8, bottom: y + 3 };
      const overlaps = occupied.some((other) =>
        box.left < other.right && box.right > other.left &&
        box.top < other.bottom && box.bottom > other.top
      );
      if (!overlaps && visibleIds.has(node.id)) occupied.push(box);
      return !overlaps;
    }) || candidates[0];
    [node.labelX, node.labelY] = selected;
  });
}

function networkNodeRole(code) {
  const hub = hubsByCode.get(code);
  return hub?.role === "Primary hub" ? "primary" : hub?.role === "Focus city" ? "focus" : "connected";
}

function networkRoleColor(role) {
  return role === "primary" ? "#ffc857" : role === "focus" ? "#70c79b" : "#73808d";
}

function showNetworkNodeTooltip(event, centerCode, node) {
  if (node.center) {
    const stats = airportStats(selectedAnalyticsRoutes()).get(node.id);
    showNetworkTooltip(event, node.id, undefined, [...(stats?.airlines || [])], stats?.connections.size || 0, true);
    return;
  }
  showNetworkTooltip(event, centerCode, node.id, [...node.connection.airlines], node.connection.strength);
}

function showNetworkTooltip(event, origin, destination, airlines, strength, center = false) {
  const airport = ROUTE_AIRPORTS[destination || origin] || hubsByCode.get(destination || origin);
  const airlineBadges = airlines
    .map((airline) => `<span class="network-airline-pill" style="--pill:${AIRLINE_COLORS[airline] || "#ffc857"}">${airline}</span>`)
    .join("");
  networkTooltip.innerHTML = `
    <strong>${center ? origin : `${origin} → ${destination}`}</strong>
    <span>${airport?.city || destination || origin}</span>
    <p>Operating airlines: ${airlines.join(", ") || "No airline detail"}</p>
    <p>${center ? "Connected airports" : "Connection strength"}: <b>${strength}</b>${center ? "" : " routes"}</p>
    <div>${airlineBadges}</div>
  `;
  positionNetworkTooltip(event);
  networkTooltip.classList.add("visible");
}

function positionNetworkTooltip(event) {
  const left = Math.min(event.clientX + 14, window.innerWidth - 252);
  const top = Math.min(event.clientY + 14, window.innerHeight - 142);
  networkTooltip.style.left = `${Math.max(8, left)}px`;
  networkTooltip.style.top = `${Math.max(8, top)}px`;
}

function hideNetworkTooltip(force = false) {
  if (!force && window.matchMedia("(pointer: coarse)").matches) return;
  networkTooltip.classList.remove("visible");
}

function highlightGlobeConnection(routes) {
  const features = routes.map(({ airline, origin, destination }) => getRouteFeature(airline, origin, destination));
  const route = features.find((feature) => routeFeatures.includes(feature)) || features[0];
  if (!route) return;
  routeState.hoveredRoute = route;
  updateRouteHighlight();
}

function clearGlobeConnectionHighlight() {
  routeState.hoveredRoute = undefined;
  updateRouteHighlight();
}

function isVisible(coordinates, center = projection.invert(projection.translate())) {
  return d3.geoDistance(coordinates, center) < Math.PI / 2;
}

function drawPath(feature, fill, stroke, lineWidth, alpha = 1) {
  context.beginPath();
  canvasPath(feature);
  if (fill) {
    context.fillStyle = fill;
    context.globalAlpha = alpha;
    context.fill();
  }
  if (stroke) {
    context.strokeStyle = stroke;
    context.lineWidth = lineWidth;
    context.globalAlpha = alpha;
    context.stroke();
  }
}

function drawGlobe() {
  context.clearRect(0, 0, width, height);
  drawPath(sphere, "#111923", "#55606d", 0.7, 1);
  drawPath(graticule, null, "#718090", 0.35, 0.08);
  if (land) drawPath(land, "#202b36", "#6d7986", 0.4, 0.54);
  if (countryBorders) drawPath(countryBorders, null, "#78838f", 0.38, zoomFactor < REGIONAL_ZOOM ? 0.22 : 0.12);
  if (zoomFactor >= REGIONAL_ZOOM && stateBorders) drawPath(stateBorders, null, "#8b96a2", 0.5, 0.24);
  drawReferenceLabels();
  if (zoomFactor >= REGIONAL_ZOOM) drawRegionalAirports();

  if (routeCollections.length) {
    context.save();
    context.globalCompositeOperation = "lighter";
    routeCollections.forEach((collection) => {
      drawPath(collection, null, collection.properties.color, 3, 0.045);
      drawPath(collection, null, collection.properties.color, 0.85, 0.54);
    });
    context.restore();

    routeAirportCodes.forEach((code) => {
      const airport = ROUTE_AIRPORTS[code];
      if (!isVisible(airport.coordinates)) return;
      const [x, y] = projection(airport.coordinates);
      context.beginPath();
      context.arc(x, y, 1.1, 0, Math.PI * 2);
      context.fillStyle = "#d8e0e8";
      context.globalAlpha = 0.28;
      context.fill();
    });
  }
  if (zoomFactor >= CLOSE_REGIONAL_ZOOM) drawAirportCodes();
  context.globalAlpha = 1;
}

function updateRouteOverlays() {
  routeHitLayer.selectAll(".route-hit")
    .attr("d", svgPath);
  routeHighlightLayer.selectAll(".route-highlight")
    .attr("d", svgPath);
}

function drawReferenceLabels() {
  const center = projection.invert(projection.translate());
  const occupied = [];
  const labels = zoomFactor >= CLOSE_REGIONAL_ZOOM
    ? [...REFERENCE_LABELS, ...US_METRO_LABELS.map((label) => ({ ...label, type: "metro", priority: 4, minZoom: CLOSE_REGIONAL_ZOOM }))]
    : REFERENCE_LABELS;
  const visibleLabels = labels
    .map((label) => {
      const distance = d3.geoDistance(label.coordinates, center);
      const edgeOpacity = Math.max(0, Math.min(1, (Math.cos(distance) - 0.12) / 0.6));
      const [x, y] = projection(label.coordinates);
      const fontSize = label.type === "country" ? 8 : 7;
      const width = label.name.length * fontSize * 0.62;
      return { ...label, x, y, edgeOpacity, width, height: fontSize + 3 };
    })
    .filter((label) =>
      label.edgeOpacity > 0 &&
      zoomFactor >= (label.minZoom || MIN_ZOOM) &&
      zoomFactor <= (label.type === "country" ? Math.min(label.maxZoom || MAX_ZOOM, 1.55) : (label.maxZoom || MAX_ZOOM)) &&
      (!isPhoneLayout() || label.priority >= (responsiveWidth() <= 390 ? 9 : 8))
    )
    .sort((a, b) => d3.descending(a.priority, b.priority) || d3.ascending(a.type, b.type))
    .slice(0, isPhoneLayout() ? (responsiveWidth() <= 390 ? 3 : 6) : labels.length);

  visibleLabels.forEach((label) => {
    const box = {
      left: label.x - label.width / 2 - 3,
      right: label.x + label.width / 2 + 3,
      top: label.y - label.height / 2 - 2,
      bottom: label.y + label.height / 2 + 2
    };
    const overlaps = occupied.some((other) =>
      box.left < other.right && box.right > other.left &&
      box.top < other.bottom && box.bottom > other.top
    );
    if (!overlaps) {
      occupied.push(box);
      context.globalAlpha = label.edgeOpacity * (label.type === "country" ? 0.62 : 0.52);
      context.fillStyle = label.type === "country" ? "#737b85" : "#656d77";
      context.font = `400 ${label.type === "country" ? 8 : 7}px "DM Mono", monospace`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(label.type === "country" ? label.name.toUpperCase() : label.name, label.x, label.y);
    }
  });
  context.globalAlpha = 1;
}

function drawRegionalAirports() {
  const center = projection.invert(projection.translate());
  context.fillStyle = "#8e99a5";
  context.globalAlpha = zoomFactor >= CLOSE_REGIONAL_ZOOM ? 0.2 : 0.12;
  const airports = isPhoneLayout() && zoomFactor < DEEP_REGIONAL_ZOOM
    ? allRouteAirports.filter((_, index) => index % 2 === 0)
    : allRouteAirports;
  airports.forEach((airport) => {
    if (!isVisible(airport.coordinates, center)) return;
    const [x, y] = projection(airport.coordinates);
    context.beginPath();
    context.arc(x, y, zoomFactor >= CLOSE_REGIONAL_ZOOM ? 1 : 0.7, 0, Math.PI * 2);
    context.fill();
  });
  context.globalAlpha = 1;
}

function drawAirportCodes() {
  const occupied = [];
  const center = projection.invert(projection.translate());
  const airports = routeAirportCodes.size
    ? [...routeAirportCodes].map((code) => ROUTE_AIRPORTS[code])
    : HUBS.map((hub) => ({ code: hub.code, coordinates: hub.coordinates }));
  const deepRegional = zoomFactor >= DEEP_REGIONAL_ZOOM;
  const fontSize = deepRegional ? 8 : 7;
  context.font = `500 ${fontSize}px "DM Mono", monospace`;
  context.textAlign = "left";
  context.textBaseline = "middle";
  context.fillStyle = "#929ca7";
  airports
    .filter((airport) => isVisible(airport.coordinates, center))
    .slice(0, deepRegional ? (isPhoneLayout() ? 52 : 150) : (isPhoneLayout() ? 28 : 90))
    .forEach((airport) => {
      const [x, y] = projection(airport.coordinates);
      const label = deepRegional && airport.city ? `${airport.code} · ${airport.city}` : airport.code;
      const labelWidth = label.length * fontSize * 0.6;
      const box = { left: x + 5, right: x + labelWidth + 7, top: y - 7, bottom: y + 5 };
      const overlaps = occupied.some((other) =>
        box.left < other.right && box.right > other.left &&
        box.top < other.bottom && box.bottom > other.top
      );
      if (!overlaps) {
        occupied.push(box);
        context.globalAlpha = deepRegional ? 0.66 : 0.52;
        context.fillText(label, x + 5, y - 2);
      }
    });
  context.globalAlpha = 1;
}

function ensureStateBorders() {
  if (stateBorders || stateLoadPromise) return;
  stateLoadPromise = d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json")
    .then((us) => {
      stateBorders = topojson.mesh(us, us.objects.states, (a, b) => a !== b);
      requestRender();
    })
    .catch(() => {
      stateLoadPromise = undefined;
    });
}

function updateHubPositions() {
  hubLayer.selectAll(".hub-marker")
    .attr("transform", (hub) => {
      const [x, y] = projection(hub.coordinates);
      return `translate(${x},${y})`;
    })
    .classed("off-globe", (hub) => !isVisible(hub.coordinates))
    .classed("lod-hidden", (hub) => zoomFactor < REGIONAL_ZOOM && hub.role !== "Primary hub");

  if (hoveredHub) {
    if (isVisible(hoveredHub.coordinates)) {
      positionHoverCard(hoveredHub);
    } else {
      hideHoverCard();
    }
  }
}

function renderGlobe() {
  drawGlobe();
  updateRouteOverlays();
  updateHubPositions();
}

function requestRender() {
  motion.dirty = true;
}

function updateHubStyles() {
  hubLayer.selectAll(".hub-marker")
    .classed("network-active", () => routeFeatures.length > 0)
    .classed("network-member", (hub) => routeAirportCodes.has(hub.code))
    .classed("route-selected", (hub) => hub.code === routeState.hubCode);
}

function bindRouteHover() {
  routeHitLayer.selectAll(".route-hit")
    .data(routeFeatures, (feature) => feature.properties.key)
    .join("path")
    .attr("class", "route-hit")
    .attr("d", svgPath)
    .on("mouseenter", (event, feature) => {
      routeState.hoveredRoute = feature;
      motion.hovering = true;
      pauseRotation();
      showRouteTooltip(event, feature);
      updateRouteHighlight();
    })
    .on("mousemove", (event) => positionRouteTooltip(event))
    .on("click", (event, feature) => {
      if (!window.matchMedia("(pointer: coarse)").matches) return;
      event.stopPropagation();
      routeState.hoveredRoute = feature;
      pauseRotation(3200);
      showRouteTooltip(event, feature);
      updateRouteHighlight();
    })
    .on("mouseleave", () => {
      routeState.hoveredRoute = undefined;
      motion.hovering = false;
      hideRouteTooltip();
      updateRouteHighlight();
    });
  updateRouteHighlight();
}

function showRouteTooltip(event, feature) {
  const { origin, destination } = feature.properties;
  routeTooltip.textContent = `${origin}-${destination}`;
  positionRouteTooltip(event);
  routeTooltip.classList.add("visible");
}

function positionRouteTooltip(event) {
  routeTooltip.style.left = `${event.clientX + 14}px`;
  routeTooltip.style.top = `${event.clientY + 14}px`;
}

function hideRouteTooltip() {
  routeTooltip.classList.remove("visible");
}

function updateRouteHighlight() {
  routeHighlightLayer.selectAll(".route-highlight")
    .data(routeState.hoveredRoute ? [routeState.hoveredRoute] : [], (feature) => feature.properties.key)
    .join("path")
    .attr("class", "route-highlight")
    .attr("stroke", (feature) => feature.properties.color)
    .attr("d", svgPath);
  requestRender();
}

function updateRouteControls() {
  const hasSelection = hasRouteSelection();
  const routeLimit = visibleRouteLimit();
  routeToggle.disabled = !hasSelection;
  routeToggle.checked = routeState.visible && hasSelection;
  document.querySelector("#route-note").textContent = hasSelection
    ? `Toggle the selected network on or off. The foreground is capped at ${routeLimit} routes for clarity.`
    : `Select an airline or hub to enable a focused network of up to ${routeLimit} routes.`;
}

function renderAirlineStory() {
  const selectedAirlines = [...filters.airlines];
  if (selectedAirlines.length === 0) {
    const context = routeState.hubCode
      ? `Showing routes connected to ${routeState.hubCode}. Select an airline to explore its broader hub structure.`
      : "Select an airline to explore how its hubs and focus cities organize the visible route network.";
    airlineStory.innerHTML = `
      <p class="eyebrow">Network story</p>
      <h3>Explore an airline</h3>
      <p class="story-empty">${context}</p>
    `;
    return;
  }
  if (selectedAirlines.length > 1) {
    airlineStory.innerHTML = `
      <p class="eyebrow">Network comparison</p>
      <h3>${selectedAirlines.length} airlines selected</h3>
      <div class="story-stats">
        <span><b>${routeFeatures.length}</b> Visible routes</span>
        <span><b>${routeAirportCodes.size}</b> Airports served</span>
      </div>
      <p class="story-pattern">Compare the shared reach and contrasting hub patterns of ${selectedAirlines.join(", ")}.</p>
    `;
    return;
  }

  const story = AIRLINE_STORIES[selectedAirlines[0]];
  airlineStory.innerHTML = `
    <p class="eyebrow">Selected airline</p>
    <h3>${story.name}</h3>
    <dl>
      <div><dt>Primary hub</dt><dd>${story.primaryHub}</dd></div>
      <div><dt>Focus cities</dt><dd>${story.focusCities.join(", ")}</dd></div>
    </dl>
    <div class="story-stats">
      <span><b>${routeFeatures.length}</b> Visible routes</span>
      <span><b>${routeAirportCodes.size}</b> Airports served</span>
    </div>
    <p class="story-pattern"><b>Network pattern:</b> ${story.pattern}</p>
  `;
}

function refreshRoutes() {
  routeFeatures = selectedRouteFeatures();
  if (!routeFeatures.includes(routeState.hoveredRoute)) {
    routeState.hoveredRoute = undefined;
    motion.hovering = false;
    hideRouteTooltip();
  }
  const airlines = [...new Set(routeFeatures.map((feature) => feature.properties.airline))];
  routeCollections = airlines.map((airline) => ({
    type: "FeatureCollection",
    properties: { color: AIRLINE_COLORS[airline] },
    features: routeFeatures.filter((feature) => feature.properties.airline === airline)
  }));
  routeAirportCodes = new Set(routeFeatures.flatMap((feature) => [
    feature.properties.origin,
    feature.properties.destination
  ]));

  const summary = document.querySelector("#route-summary");
  summary.hidden = routeFeatures.length === 0;
  document.querySelector("#route-count").textContent = `${routeFeatures.length} ${routeFeatures.length === 1 ? "route" : "routes"}`;
  document.querySelector("#route-key").innerHTML = airlines
    .map((airline) => `<span class="route-key-item" style="--route:${AIRLINE_COLORS[airline]}"><i></i>${airline}</span>`)
    .join("");
  bindRouteHover();
  updateRouteControls();
  renderAirlineStory();
  updateHubStyles();
  renderDashboard();
  requestRender();
}

function airportMatches(hub) {
  const roleMatch = filters.role === "All" || hub.role === filters.role;
  const airlineMatch = filters.airlines.size === 0 || [...filters.airlines].some((airline) => hub.airlines.includes(airline));
  const haystack = `${hub.code} ${hub.city} ${hub.name}`.toLowerCase();
  return roleMatch && airlineMatch && haystack.includes(filters.query.toLowerCase());
}

function renderMarkers() {
  const marker = hubLayer.selectAll(".hub-marker")
    .data(HUBS, (hub) => hub.code)
    .join((enter) => {
      const group = enter.append("g")
        .attr("class", (hub) => `hub-marker ${hub.role === "Focus city" ? "focus" : ""}`)
        .attr("tabindex", "0")
        .attr("role", "button")
        .attr("aria-label", (hub) => `${hub.code}, ${hub.name}`)
        .on("mouseenter focus", function (event, hub) { showHoverCard(hub, this); })
        .on("mouseleave blur", hideHoverCard)
        .on("click", (event, hub) => {
          if (event.detail > 1) return;
          event.stopPropagation();
          if (window.matchMedia("(pointer: coarse)").matches) showHoverCard(hub, event.currentTarget);
          selectHub(hub);
        })
        .on("dblclick", (event, hub) => {
          event.preventDefault();
          event.stopPropagation();
          focusCoordinates(hub.coordinates, Math.max(zoomFactor, 2.65));
        });
      group.append("circle")
        .attr("class", "hub-halo")
        .attr("r", (hub) => radiusScale(hub.enplanements) + 4);
      group.append("circle")
        .attr("class", "hub-dot")
        .attr("r", (hub) => radiusScale(hub.enplanements))
        .attr("fill", (hub) => AIRLINE_COLORS[hub.anchor] || "#ffc857");
      group.append("text")
        .attr("class", "hub-label")
        .attr("x", (hub) => radiusScale(hub.enplanements) + 5)
        .attr("y", -5)
        .text((hub) => hub.code);
      return group;
    });
  marker.each(function (hub) { markers.set(hub.code, this); });
  updateHubPositions();
}

function showHoverCard(hub, element) {
  hoveredHub = hub;
  motion.hovering = true;
  pauseRotation();
  markers.forEach((marker) => marker.classList.toggle("dimmed", marker !== element));
  element.classList.add("selected");
  const airlinePills = hub.airlines
    .map((airline) => `<span class="airline-pill" style="--pill:${AIRLINE_COLORS[airline] || "#ffc857"}">${airline}</span>`)
    .join("");
  hoverCard.innerHTML = `
    <div class="hover-title"><strong>${hub.code}</strong><span>${hub.role}</span></div>
    <h3>${hub.name}</h3>
    <p class="hover-stat"><b>${passengerLongFormat(hub.enplanements)}</b> passenger boardings · CY 2024</p>
    <h4>Major operating airlines</h4>
    <div class="airline-list">${airlinePills}</div>
  `;
  positionHoverCard(hub);
  hoverCard.classList.add("visible");
}

function positionHoverCard(hub) {
  const [x, y] = projection(hub.coordinates);
  const cardWidth = 248;
  const leftPanelEdge = window.innerWidth > 700 ? 344 : 10;
  let left = x + 22;
  let top = y - 46;
  if (left + cardWidth > window.innerWidth - 14) left = x - cardWidth - 22;
  if (left < leftPanelEdge) left = leftPanelEdge;
  if (top < 96) top = 96;
  if (top + 190 > window.innerHeight) top = window.innerHeight - 204;
  hoverCard.style.left = `${left}px`;
  hoverCard.style.top = `${top}px`;
}

function hideHoverCard() {
  hoveredHub = undefined;
  motion.hovering = false;
  hoverCard.classList.remove("visible");
  markers.forEach((marker) => marker.classList.remove("dimmed", "selected"));
}

function pauseRotation(duration = 2200) {
  motion.resumeAt = performance.now() + duration;
}

function selectHub(hub) {
  selectAirportCode(hub.code);
}

function renderList() {
  const visible = HUBS.filter(airportMatches).sort((a, b) => d3.descending(a.enplanements, b.enplanements));
  document.querySelector("#visible-count").textContent = `${visible.length} shown`;
  airportList.innerHTML = visible.length
    ? visible.map((hub) => `
      <button class="airport-row ${hub.code === routeState.hubCode ? "active" : ""}" type="button" data-code="${hub.code}">
        <span class="airport-code">${hub.code}</span>
        <span><span class="airport-city">${hub.city}</span><span class="airport-role">${hub.role} · ${hub.anchor}</span></span>
        <span class="airport-volume">${passengerFormat(hub.enplanements)}</span>
      </button>`).join("")
    : `<p class="empty-state">No airports match these filters. Try resetting the view.</p>`;

  airportList.querySelectorAll(".airport-row").forEach((row) => {
    row.addEventListener("click", () => selectHub(hubsByCode.get(row.dataset.code)));
  });
}

function refreshView() {
  markers.forEach((element, code) => {
    element.classList.toggle("hidden", !airportMatches(hubsByCode.get(code)));
  });
  renderList();
  refreshRoutes();
}

function renderFilters() {
  const roles = ["All", "Primary hub", "Focus city"];
  document.querySelector("#role-filters").innerHTML = roles
    .map((role) => `<button class="filter-chip ${role === filters.role ? "active" : ""}" type="button" data-role="${role}">${role}</button>`)
    .join("");
  document.querySelectorAll("[data-role]").forEach((button) => {
    button.addEventListener("click", () => {
      filters.role = button.dataset.role;
      renderFilters();
      refreshView();
    });
  });

  const airlines = ["All", ...new Set(HUBS.flatMap((hub) => hub.airlines))].sort((a, b) => a === "All" ? -1 : b === "All" ? 1 : d3.ascending(a, b));
  document.querySelector("#airline-filters").innerHTML = airlines
    .map((airline) => {
      const isActive = airline === "All" ? filters.airlines.size === 0 && !routeState.hubCode : filters.airlines.has(airline);
      return `<button class="filter-chip airline-chip ${isActive ? "active" : ""}" style="--chip:${AIRLINE_COLORS[airline] || "#ffc857"}" type="button" data-airline="${airline}">${airline}</button>`;
    })
    .join("");
  document.querySelectorAll("[data-airline]").forEach((button) => {
    button.addEventListener("click", () => {
      const airline = button.dataset.airline;
      routeState.hubCode = undefined;
      if (airline === "All") {
        filters.airlines.clear();
        routeState.visible = false;
      } else if (filters.airlines.has(airline)) {
        filters.airlines.delete(airline);
        if (!filters.airlines.size) routeState.visible = false;
      } else {
        filters.airlines.add(airline);
        routeState.visible = true;
      }
      renderFilters();
      refreshView();
    });
  });
}

function ensureMobileCollapseButtons() {
  document.querySelectorAll(".analysis-card").forEach((card) => {
    let button = card.querySelector(":scope > .mobile-card-toggle");
    if (!button) {
      button = document.createElement("button");
      button.className = "mobile-card-toggle";
      button.type = "button";
      button.textContent = card.dataset.mobileTitle || "Analysis";
      card.prepend(button);
      button.addEventListener("click", () => {
        card.classList.toggle("mobile-collapsed");
        button.setAttribute("aria-expanded", String(!card.classList.contains("mobile-collapsed")));
        scheduleResponsiveResize();
      });
    }
    if (!card.dataset.collapseInitialized) {
      card.dataset.collapseInitialized = "true";
      card.classList.toggle("mobile-collapsed", isPhoneLayout());
    }
    button.setAttribute("aria-expanded", String(!card.classList.contains("mobile-collapsed")));
  });
}

function resize() {
  const devicePixelRatio = window.devicePixelRatio || 1;
  width = mapElement.clientWidth;
  height = mapElement.clientHeight;
  if (!width || !height) return;
  baseScale = Math.min(width * (isPhoneLayout() ? 0.43 : 0.34), height * 0.44);
  canvas.width = width * devicePixelRatio;
  canvas.height = height * devicePixelRatio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  svg.attr("viewBox", `0 0 ${width} ${height}`);
  projection
    .translate([width * (isPhoneLayout() ? 0.5 : 0.61), height * (isPhoneLayout() ? 0.48 : 0.55)])
    .scale(baseScale * zoomFactor);
  if (zoomFactor >= REGIONAL_ZOOM) ensureStateBorders();
  requestRender();
  renderDashboard();
}

function scheduleResponsiveResize() {
  cancelAnimationFrame(responsiveResizeFrame);
  responsiveResizeFrame = requestAnimationFrame(() => {
    resize();
    refreshRoutes();
  });
}

svg.call(d3.drag()
  .on("start", (event) => {
    if (event.sourceEvent?.touches?.length > 1) return;
    d3.select(mapElement).interrupt("globe-view");
    motion.dragging = true;
    pauseRotation();
  })
  .on("drag", (event) => {
    if (event.sourceEvent?.touches?.length > 1) return;
    const sensitivity = 75 / projection.scale();
    const rotation = projection.rotate();
    projection.rotate([
      rotation[0] + event.dx * sensitivity,
      Math.max(-80, Math.min(80, rotation[1] - event.dy * sensitivity)),
      rotation[2]
    ]);
    requestRender();
  })
  .on("end", () => {
    motion.dragging = false;
    pauseRotation();
  }));

svg.on("wheel", (event) => {
  event.preventDefault();
  d3.select(mapElement).interrupt("globe-view");
  pauseRotation();
  setZoomFactor(zoomFactor * Math.exp(-event.deltaY * 0.0009));
}, { passive: false });

svg.node().addEventListener("touchstart", (event) => {
  if (event.touches.length !== 2) return;
  d3.select(mapElement).interrupt("globe-view");
  pinchDistance = touchDistance(event.touches);
  motion.dragging = true;
  pauseRotation(3000);
}, { passive: false });

svg.node().addEventListener("touchmove", (event) => {
  if (event.touches.length !== 2 || !pinchDistance) return;
  event.preventDefault();
  const nextDistance = touchDistance(event.touches);
  setZoomFactor(zoomFactor * (nextDistance / pinchDistance));
  pinchDistance = nextDistance;
  pauseRotation(3000);
}, { passive: false });

svg.node().addEventListener("touchend", (event) => {
  if (event.touches.length >= 2) return;
  pinchDistance = undefined;
  motion.dragging = false;
  pauseRotation(2400);
}, { passive: false });

function touchDistance(touches) {
  return Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
}

svg.on("dblclick", (event) => {
  event.preventDefault();
  const point = d3.pointer(event, svg.node());
  const [centerX, centerY] = projection.translate();
  if (Math.hypot(point[0] - centerX, point[1] - centerY) > projection.scale()) return;
  focusCoordinates(projection.invert(point), Math.max(REGIONAL_ZOOM, zoomFactor * 1.55));
});

svg.on("click.dismiss-details", () => {
  if (!window.matchMedia("(pointer: coarse)").matches) return;
  hideHoverCard();
  hideRouteTooltip();
  hideNetworkTooltip(true);
  routeState.hoveredRoute = undefined;
  updateRouteHighlight();
});

function setZoomFactor(nextZoom) {
  zoomFactor = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoom));
  projection.scale(baseScale * zoomFactor);
  if (zoomFactor >= REGIONAL_ZOOM) ensureStateBorders();
  requestRender();
}

function focusCoordinates(coordinates, targetZoom, duration = 760) {
  pauseRotation(duration + 1400);
  const startRotation = projection.rotate();
  const targetRotation = [-coordinates[0], -coordinates[1], 0];
  const startZoom = zoomFactor;
  const endZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, targetZoom));
  d3.select(mapElement)
    .interrupt("globe-view")
    .transition("globe-view")
    .duration(duration)
    .ease(d3.easeCubicInOut)
    .tween("view", () => {
      const interpolateRotation = d3.interpolate(startRotation, targetRotation);
      const interpolateZoom = d3.interpolateNumber(Math.log(startZoom), Math.log(endZoom));
      return (time) => {
        projection.rotate(interpolateRotation(time));
        setZoomFactor(Math.exp(interpolateZoom(time)));
      };
    });
}

function resetGlobe() {
  focusCoordinates([-98, 36], 1, 820);
}

function animate(now) {
  const elapsed = Math.min(now - motion.lastFrame, 80);
  motion.lastFrame = now;
  const shouldRotate = !motion.reducedMotion && !motion.dragging && !motion.hovering && !routeState.hubCode;
  if (shouldRotate) {
    const speed = (now < motion.resumeAt ? 0.00035 : 0.001) * (isPhoneLayout() ? 0.62 : 1);
    const rotation = projection.rotate();
    projection.rotate([rotation[0] + elapsed * speed, rotation[1], rotation[2]]);
    requestRender();
  }
  if (motion.dirty) {
    renderGlobe();
    motion.dirty = false;
  }
  requestAnimationFrame(animate);
}

renderMarkers();
document.querySelector("#airport-count").textContent = HUBS.length;
document.querySelector("#enplanement-total").textContent = `${d3.format(".3~s")(d3.sum(HUBS, (hub) => hub.enplanements))}`;
renderFilters();
resize();
refreshView();
requestAnimationFrame(animate);

d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
  .then((world) => {
    land = topojson.feature(world, world.objects.land);
    countryBorders = topojson.mesh(world, world.objects.countries, (a, b) => a !== b);
    requestRender();
  })
  .catch(() => {
    document.querySelector(".map-tip").textContent = "Scroll or pinch to zoom · Drag to rotate · Base layer unavailable";
  });

routeToggle.addEventListener("change", (event) => {
  routeState.visible = event.target.checked;
  refreshRoutes();
});
document.querySelector("#airport-search").addEventListener("input", (event) => {
  filters.query = event.target.value.trim();
  refreshView();
});
document.querySelector("#reset-filters").addEventListener("click", () => {
  filters.role = "All";
  filters.airlines.clear();
  filters.query = "";
  routeState.visible = false;
  routeState.hubCode = undefined;
  pauseRotation();
  document.querySelector("#airport-search").value = "";
  renderFilters();
  refreshView();
  resetGlobe();
});
document.querySelector("#zoom-in").addEventListener("click", () => focusCoordinates(projection.invert(projection.translate()), zoomFactor * 1.34, 420));
document.querySelector("#zoom-out").addEventListener("click", () => focusCoordinates(projection.invert(projection.translate()), zoomFactor / 1.34, 420));
document.querySelector("#reset-globe").addEventListener("click", resetGlobe);
document.querySelector(".mobile-panel-toggle").addEventListener("click", (event) => {
  const panel = document.querySelector(".control-panel");
  panel.classList.toggle("mobile-collapsed");
  event.currentTarget.setAttribute("aria-expanded", String(!panel.classList.contains("mobile-collapsed")));
  scheduleResponsiveResize();
});

const modalBackdrop = document.querySelector("#modal-backdrop");
document.querySelector("#about-button").addEventListener("click", () => { modalBackdrop.hidden = false; });
document.querySelector("#close-modal").addEventListener("click", () => { modalBackdrop.hidden = true; });
modalBackdrop.addEventListener("click", (event) => {
  if (event.target === modalBackdrop) modalBackdrop.hidden = true;
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") modalBackdrop.hidden = true;
});
if ("ResizeObserver" in window) {
  const dashboardResizeObserver = new ResizeObserver(scheduleResponsiveResize);
  [mapElement, hubRankingChart.node(), airlineComparisonChart.node(), networkChart.node()]
    .forEach((element) => dashboardResizeObserver.observe(element));
}
window.addEventListener("resize", scheduleResponsiveResize);
