const MAX_VISIBLE_ROUTES = 240;
const ROUTE_SAMPLE_COUNT = 14;
const MIN_ZOOM = 0.86;
const MAX_ZOOM = 5.2;
const REGIONAL_ZOOM = 1.18;
const CLOSE_REGIONAL_ZOOM = 2.05;
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
const controlPanel = document.querySelector(".control-panel");
const analysisPanel = document.querySelector(".analysis-panel");
const topbar = document.querySelector(".topbar");
const canvas = d3.select(mapElement).append("canvas").attr("class", "globe-canvas").node();
const context = canvas.getContext("2d");
const svg = d3.select(mapElement).append("svg")
  .attr("class", "globe-overlay")
  .attr("role", "img")
  .attr("aria-label", "U.S. airline network map showing hubs and selected route arcs");
const routeHitLayer = svg.append("g").attr("class", "route-hit-layer");
const routeHighlightLayer = svg.append("g").attr("class", "route-highlight-layer");
const hubLayer = svg.append("g").attr("class", "hub-layer");
const projection = d3.geoAlbersUsa().precision(0.3);
const canvasPath = d3.geoPath(projection, context);
const svgPath = d3.geoPath(projection);
const routeCurve = d3.line().curve(d3.curveBasis);
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
let baseTranslate;
let zoomFactor = 1;
let nation;
let stateBorders;
let stateFeatures;
let stateLoadPromise;
let routeFeatures = [];
let routeCollections = [];
let routeAirportCodes = new Set();
let hoveredHub;
let globeLayout;
let mapOffset = [0, 0];
const usaFitFeature = {
  type: "FeatureCollection",
  features: allRouteAirports.map((airport) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: airport.coordinates }
  }))
};

function visibleRect(element) {
  if (!element || getComputedStyle(element).display === "none") return undefined;
  const rect = element.getBoundingClientRect();
  return rect.width && rect.height ? rect : undefined;
}

function calculateGlobeLayout() {
  const mapRect = mapElement.getBoundingClientRect();
  const leftPanelRect = visibleRect(controlPanel);
  const rightPanelRect = visibleRect(analysisPanel);
  const topbarRect = visibleRect(topbar);
  const gutter = 18;
  const mobileSheet = window.innerWidth <= 700 && leftPanelRect;
  const left = leftPanelRect && !mobileSheet ? leftPanelRect.right - mapRect.left + gutter : 0;
  const right = rightPanelRect ? rightPanelRect.left - mapRect.left - gutter : width;
  const top = topbarRect ? topbarRect.bottom - mapRect.top : 0;
  const bottom = mobileSheet ? leftPanelRect.top - mapRect.top : height;
  const availableWidth = Math.max(1, right - left);
  const availableHeight = Math.max(1, bottom - top);
  return {
    left,
    right,
    top,
    bottom,
    centerX: left + availableWidth / 2,
    centerY: top + availableHeight / 2,
    availableWidth,
    availableHeight
  };
}

function routeKey(airline, origin, destination) {
  return `${airline}:${origin}:${destination}`;
}

function getRouteFeature(airline, origin, destination) {
  const key = routeKey(airline, origin, destination);
  if (!routeFeatureCache.has(key)) {
    routeFeatureCache.set(key, {
      type: "Feature",
      properties: { key, airline, color: AIRLINE_COLORS[airline], origin, destination }
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
    .slice(0, MAX_VISIBLE_ROUTES);
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
  renderSelectedSummary();
  renderInsights(routes, stats);
  renderHubRanking(stats);
  renderAirlineComparison();
  renderHubDetail(routes, stats);
  renderNetworkView(routes);
}

function renderSelectedSummary() {
  const visibleHubs = HUBS.filter(airportMatches);
  document.querySelector("#airport-count").textContent = visibleHubs.length;
  document.querySelector("#enplanement-total").textContent = passengerFormat(d3.sum(visibleHubs, (hub) => hub.enplanements));
}

function updateModalMetadata() {
  const globalStats = airportStats(ANALYTIC_ROUTES);
  const largestHub = [...globalStats.values()].sort((a, b) => d3.descending(a.routes, b.routes))[0];
  document.querySelector("#modal-airports").textContent = Object.keys(ROUTE_AIRPORTS).length;
  document.querySelector("#modal-routes").textContent = passengerLongFormat(ANALYTIC_ROUTES.length);
  document.querySelector("#modal-airlines").textContent = allAirlines.length;
  document.querySelector("#modal-largest-hub").textContent = largestHub?.code || "—";
}

function renderInsights(routes, stats) {
  const hubStats = HUBS
    .map((hub) => ({
      ...hub,
      routes: stats.get(hub.code)?.routes || 0,
      connections: stats.get(hub.code)?.connections.size || 0
    }))
    .filter((hub) => hub.routes && airportMatches(hub))
    .sort((a, b) => d3.descending(a.routes, b.routes));
  const largestRouteHub = hubStats[0];
  const mostConnectedHub = [...hubStats].sort((a, b) =>
    d3.descending(a.connections, b.connections) || d3.descending(a.routes, b.routes)
  )[0];
  const topFiveRoutes = d3.sum(hubStats.slice(0, 5), (hub) => hub.routes);
  const totalHubRoutes = d3.sum(hubStats, (hub) => hub.routes);
  const topFiveShare = totalHubRoutes ? d3.format(".0%")(topFiveRoutes / totalHubRoutes) : "—";
  const passengerLeader = [...HUBS].filter(airportMatches).sort((a, b) => d3.descending(a.enplanements, b.enplanements))[0];
  const selectedAirlines = [...filters.airlines];
  const topCodes = hubStats.slice(0, 5).map((hub) => hub.code);
  const leadAirline = selectedAirlines.length === 1 ? selectedAirlines[0] : undefined;
  const concentration = totalHubRoutes && topFiveRoutes ? topFiveRoutes / totalHubRoutes : 0;
  const leadSummary = leadAirline && topCodes.length
    ? concentration >= 0.48
      ? `${leadAirline}'s visible network is concentrated around ${topCodes.slice(0, 3).join(", ")}.`
      : `${leadAirline}'s visible network is distributed across ${topCodes.join(", ")}.`
    : largestRouteHub
      ? `Largest hub: ${largestRouteHub.code} leads the visible network with ${largestRouteHub.routes} route incidences.`
      : "No route activity matches the current filters.";
  const connectedSummary = mostConnectedHub
    ? `Most connected hub: ${mostConnectedHub.code} reaches ${mostConnectedHub.connections} distinct airports.`
    : "Most connected hub: not available for this filter.";
  const volumeSummary = passengerLeader
    ? `Highest passenger volume: ${passengerLeader.code} with ${passengerFormat(passengerLeader.enplanements)} annual enplanements.`
    : "Highest passenger volume: no visible airport volume available.";
  const shareSummary = totalHubRoutes
    ? `Top 5 hubs account for ${topFiveShare} of visible route activity.`
    : "Top 5 hub share: not available until routes are visible.";
  const roleSummary = filters.role !== "All"
    ? `Role filter active: analysis is limited to ${filters.role.toLowerCase()} airports.`
    : selectedAirlines.length > 1
      ? `Carrier comparison: ${selectedAirlines.join(", ")} share strongest activity at ${topCodes.slice(0, 3).join(", ") || "visible hubs"}.`
      : undefined;

  document.querySelector("#key-insights").innerHTML = [
    leadSummary,
    connectedSummary,
    volumeSummary,
    shareSummary,
    roleSummary
  ].filter(Boolean).slice(0, 5).map((copy) => `
    <li>${copy}</li>
  `).join("");
}

function renderHubRanking(stats) {
  const width = hubRankingChart.node()?.clientWidth || 314;
  const height = 148;
  const margin = { top: 4, right: 30, bottom: 20, left: 40 };
  const ranked = HUBS
    .map((hub) => ({ ...hub, degree: stats.get(hub.code)?.routes || 0 }))
    .filter((hub) => hub.degree && airportMatches(hub))
    .sort((a, b) => d3.descending(a.degree, b.degree))
    .slice(0, 8);
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
  const height = 148;
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

function renderHubDetail(routes, stats) {
  if (!routeState.hubCode) {
    hubDetail.innerHTML = `
      <p class="eyebrow">Airport intelligence</p>
      <h2>Click an airport</h2>
      <p class="detail-copy">Click an airport to inspect its network role.</p>
    `;
    return;
  }

  const code = routeState.hubCode;
  const airport = hubsByCode.get(code) || ROUTE_AIRPORTS[code];
  const detailRoutes = routes.some((route) => route.origin === code || route.destination === code)
    ? routes
    : ANALYTIC_ROUTES;
  const detailStats = airportStats(detailRoutes);
  const selected = detailStats.get(code) || {
    code,
    city: airport?.city || code,
    routes: 0,
    airlines: new Set(),
    connections: new Set()
  };
  const visibleCodes = new Set(HUBS.filter(airportMatches).map((hub) => hub.code));
  if (!visibleCodes.has(code)) visibleCodes.add(code);
  const ranked = [...detailStats.values()]
    .filter((item) => visibleCodes.has(item.code))
    .sort((a, b) => d3.descending(a.routes, b.routes) || d3.ascending(a.code, b.code));
  const rankIndex = ranked.findIndex((item) => item.code === code);
  const connectedRoutes = detailRoutes.filter((route) => route.origin === code || route.destination === code);
  const destinationCounts = d3.rollups(
    connectedRoutes,
    (items) => items.length,
    (route) => route.origin === code ? route.destination : route.origin
  ).sort((a, b) => d3.descending(a[1], b[1]) || d3.ascending(a[0], b[0]));
  const airlineCounts = d3.rollups(
    connectedRoutes,
    (items) => items.length,
    (route) => route.airline
  ).sort((a, b) => d3.descending(a[1], b[1]) || d3.ascending(a[0], b[0]));
  const dominantAirline = airlineCounts[0]?.[0] || hubsByCode.get(code)?.anchor || "—";
  const selectedAirlines = [...filters.airlines];
  const selectedAirlineRoutes = selectedAirlines.length
    ? connectedRoutes.filter((route) => selectedAirlines.includes(route.airline)).length
    : undefined;
  const selectedRelevance = selectedAirlines.length
    ? `${selectedAirlineRoutes} routes in ${selectedAirlines.join(", ")} view`
    : "All-airline context";
  const role = hubsByCode.get(code)?.role || "Other airport";
  const enplanements = hubsByCode.get(code)?.enplanements;
  const topDestinations = destinationCounts.slice(0, 5).map(([destination]) => destination);

  hubDetail.innerHTML = `
    <p class="eyebrow">Airport intelligence</p>
    <h2>${code}</h2>
    <p class="detail-city">${airport?.name || `${selected.city} airport`}</p>
    <p class="detail-copy">${selected.city || airport?.city || "Unknown city"}</p>
    <div class="detail-grid intelligence-grid">
      <span>Role<b>${role}</b></span>
      <span>Routes<b>${selected.routes}</b></span>
      <span>Connectivity rank<b>${rankIndex >= 0 ? `#${rankIndex + 1}` : "—"}</b></span>
      <span>Enplanements<b>${enplanements ? passengerFormat(enplanements) : "—"}</b></span>
      <span>Dominant airline<b>${dominantAirline}</b></span>
      <span>Airline relevance<b>${selectedRelevance}</b></span>
    </div>
    <p class="detail-copy"><b>Top connected destinations:</b> ${topDestinations.join(" · ") || "No connected destinations in this view"}</p>
  `;
}

function renderNetworkView(routes) {
  const width = networkChart.node()?.clientWidth || 314;
  const height = 258;
  const selectedAirline = filters.airlines.size === 1 ? [...filters.airlines][0] : undefined;
  const stats = airportStats(routes);
  const fallbackHub = selectedAirline
    ? AIRLINE_STORIES[selectedAirline]?.primaryHub
    : [...stats.values()].sort((a, b) => d3.descending(a.routes, b.routes))[0]?.code;
  const centerCode = routeState.hubCode && stats.has(routeState.hubCode) ? routeState.hubCode : fallbackHub;
  const centerAirport = stats.get(centerCode);
  if (!centerAirport) {
    networkChart.selectAll("*").remove();
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
    .slice(0, 24);
  const totalStrength = d3.sum(strongestConnections, (connection) => connection.strength);
  const concentration = totalStrength
    ? d3.sum(strongestConnections, (connection) => (connection.strength / totalStrength) ** 2)
    : 0;
  const strongest = strongestConnections[0];
  document.querySelector("#network-context").textContent = `${centerCode} centered`;
  document.querySelector("#network-metrics").innerHTML = `
    <span>Degree<b>${connections.size}</b></span>
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
      strength: connection.strength
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
  const linkLayer = networkChart.append("g").attr("class", "network-links");
  const nodeLayer = networkChart.append("g").attr("class", "network-nodes");
  linkLayer.selectAll(".network-link").data(links).join("line")
    .attr("class", "network-link")
    .attr("stroke-width", (link) => linkWidth(link.strength))
    .attr("x1", (link) => link.source.x).attr("y1", (link) => link.source.y)
    .attr("x2", (link) => link.target.x).attr("y2", (link) => link.target.y);
  linkLayer.selectAll(".network-link-hit").data(links).join("line")
    .attr("class", "network-link-hit")
    .attr("x1", (link) => link.source.x).attr("y1", (link) => link.source.y)
    .attr("x2", (link) => link.target.x).attr("y2", (link) => link.target.y)
    .on("mouseenter", function (event, link) {
      highlightNetworkLink(this, linkLayer, nodeLayer, link, true);
      highlightGlobeConnection(link.routes);
      showNetworkTooltip(event, link);
    })
    .on("mousemove", (event) => positionNetworkTooltip(event))
    .on("mouseleave", function (_, link) {
      highlightNetworkLink(this, linkLayer, nodeLayer, link, false);
      clearGlobeConnectionHighlight();
      hideNetworkTooltip();
    })
    .on("click", function (event, link) {
      event.stopPropagation();
      highlightNetworkLink(this, linkLayer, nodeLayer, link, true);
      highlightGlobeConnection(link.routes);
      showNetworkTooltip(event, link);
    });
  networkChart.on("click.dismiss-tooltip", () => {
    linkLayer.classed("hover-active", false).selectAll(".network-link").classed("hovered", false);
    nodeLayer.selectAll(".network-node").classed("link-endpoint", false);
    clearGlobeConnectionHighlight();
    hideNetworkTooltip(true);
  });
  nodeLayer.selectAll("circle").data(nodes).join("circle")
    .attr("class", (node) => `network-node ${node.center ? "selected" : ""}`)
    .attr("cx", (node) => node.x).attr("cy", (node) => node.y).attr("r", (node) => radius(node.importance))
    .attr("fill", (node) => networkRoleColor(node.role))
    .on("mouseenter", function (_, node) {
      highlightDashboardHub(node.id, true);
      d3.select(this.parentNode.parentNode).selectAll(".network-label")
        .filter((label) => label.id === node.id)
        .classed("hovered", true);
    })
    .on("mouseleave", function (_, node) {
      highlightDashboardHub(node.id, false);
      d3.select(this.parentNode.parentNode).selectAll(".network-label")
        .filter((label) => label.id === node.id)
        .classed("hovered", false);
    })
    .on("click", (_, node) => selectAirportCode(node.id));
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

function highlightNetworkLink(element, linkLayer, nodeLayer, link, active) {
  linkLayer.classed("hover-active", active);
  linkLayer.selectAll(".network-link").classed("hovered", false);
  if (active) linkLayer.selectAll(".network-link").filter((candidate) => candidate === link).classed("hovered", true);
  const endpointIds = new Set([link.source.id, link.target.id]);
  nodeLayer.selectAll(".network-node").classed("link-endpoint", (node) => active && endpointIds.has(node.id));
}

function showNetworkTooltip(event, link) {
  networkTooltip.innerHTML = `
    <strong>${link.source.id}–${link.target.id}</strong>
    <p>Strength: <b>${link.strength}</b></p>
  `;
  positionNetworkTooltip(event);
  networkTooltip.classList.add("visible");
}

function positionNetworkTooltip(event) {
  networkTooltip.style.left = `${Math.max(8, Math.min(event.clientX + 12, window.innerWidth - 244))}px`;
  networkTooltip.style.top = `${Math.max(8, Math.min(event.clientY + 12, window.innerHeight - 104))}px`;
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

function projectedPoint(coordinates) {
  const point = projection(coordinates);
  return point && Number.isFinite(point[0]) && Number.isFinite(point[1]) ? point : undefined;
}

function isVisible(coordinates) {
  return Boolean(projectedPoint(coordinates));
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

function routeArcPoints(feature) {
  const origin = ROUTE_AIRPORTS[feature.properties.origin];
  const destination = ROUTE_AIRPORTS[feature.properties.destination];
  if (!origin || !destination) return undefined;
  const start = projectedPoint(origin.coordinates);
  const end = projectedPoint(destination.coordinates);
  if (!start || !end) return undefined;
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const distance = Math.hypot(dx, dy);
  if (!distance) return [start, end];
  const curve = Math.min(78, Math.max(16, distance * 0.18));
  const direction = start[0] < end[0] ? -1 : 1;
  const midpoint = [
    (start[0] + end[0]) / 2 + (-dy / distance) * curve * direction,
    (start[1] + end[1]) / 2 + (dx / distance) * curve * direction
  ];
  return [start, midpoint, end];
}

function routePath(feature) {
  const points = routeArcPoints(feature);
  return points ? routeCurve(points) : undefined;
}

function drawRouteArc(feature, stroke, lineWidth, alpha) {
  const path = routePath(feature);
  if (!path) return;
  const routePath2d = new Path2D(path);
  context.strokeStyle = stroke;
  context.lineWidth = lineWidth;
  context.globalAlpha = alpha;
  context.stroke(routePath2d);
}

function drawMap() {
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#0f161f";
  context.fillRect(0, 0, width, height);

  if (nation) {
    drawPath(nation, "#1e2a35", "#6c7886", 0.7, 0.88);
  }
  if (stateBorders) {
    drawPath(stateBorders, null, "#8a96a3", zoomFactor >= REGIONAL_ZOOM ? 0.55 : 0.42, zoomFactor >= REGIONAL_ZOOM ? 0.34 : 0.22);
  }
  drawRegionalLabels();
  drawRegionalAirports();

  if (routeCollections.length) {
    context.save();
    context.globalCompositeOperation = "lighter";
    routeCollections.forEach((collection) => {
      collection.features.forEach((feature) => {
        drawRouteArc(feature, collection.properties.color, 3.4, 0.035);
        drawRouteArc(feature, collection.properties.color, 0.9, 0.56);
      });
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
    .attr("d", routePath);
  routeHighlightLayer.selectAll(".route-highlight")
    .attr("d", routePath);
}

function drawRegionalLabels() {
  const occupied = [];
  const labels = [
    { name: "United States", coordinates: [-98, 39], type: "country", priority: 10 },
    { name: "Alaska", coordinates: [-151, 64], type: "inset", priority: 6 },
    { name: "Hawaii", coordinates: [-157.5, 20.6], type: "inset", priority: 6 },
    ...US_METRO_LABELS.map((label) => ({ ...label, type: "metro", priority: 4, minZoom: REGIONAL_ZOOM }))
  ];
  const visibleLabels = labels
    .map((label) => {
      const point = projectedPoint(label.coordinates);
      if (!point) return undefined;
      const [x, y] = point;
      const fontSize = label.type === "country" ? 8 : 7;
      const width = label.name.length * fontSize * 0.62;
      return { ...label, x, y, width, height: fontSize + 3 };
    })
    .filter((label) => label && zoomFactor >= (label.minZoom || MIN_ZOOM))
    .sort((a, b) => d3.descending(a.priority, b.priority) || d3.ascending(a.type, b.type));

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
      context.globalAlpha = label.type === "country" ? 0.58 : 0.46;
      context.fillStyle = label.type === "country" ? "#737f8b" : "#69737f";
      context.font = `400 ${label.type === "country" ? 8 : 7}px "DM Mono", monospace`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(label.name.toUpperCase(), label.x, label.y);
    }
  });
  context.globalAlpha = 1;
}

function drawRegionalAirports() {
  context.fillStyle = "#8e99a5";
  context.globalAlpha = zoomFactor >= CLOSE_REGIONAL_ZOOM ? 0.2 : 0.12;
  allRouteAirports.forEach((airport) => {
    const point = projectedPoint(airport.coordinates);
    if (!point) return;
    const [x, y] = point;
    context.beginPath();
    context.arc(x, y, zoomFactor >= CLOSE_REGIONAL_ZOOM ? 1 : 0.7, 0, Math.PI * 2);
    context.fill();
  });
  context.globalAlpha = 1;
}

function drawAirportCodes() {
  const occupied = [];
  const airports = routeAirportCodes.size
    ? [...routeAirportCodes].map((code) => ROUTE_AIRPORTS[code])
    : HUBS.map((hub) => ({ code: hub.code, coordinates: hub.coordinates }));
  context.font = '500 7px "DM Mono", monospace';
  context.textAlign = "left";
  context.textBaseline = "middle";
  context.fillStyle = "#929ca7";
  airports
    .filter((airport) => isVisible(airport.coordinates))
    .slice(0, 90)
    .forEach((airport) => {
      const [x, y] = projectedPoint(airport.coordinates);
      const box = { left: x + 4, right: x + 25, top: y - 6, bottom: y + 4 };
      const overlaps = occupied.some((other) =>
        box.left < other.right && box.right > other.left &&
        box.top < other.bottom && box.bottom > other.top
      );
      if (!overlaps) {
        occupied.push(box);
        context.globalAlpha = 0.52;
        context.fillText(airport.code, x + 4, y - 2);
      }
    });
  context.globalAlpha = 1;
}

function ensureStateBorders() {
  if (stateBorders || stateLoadPromise) return;
  stateLoadPromise = d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json")
    .then((us) => {
      nation = topojson.feature(us, us.objects.nation);
      stateFeatures = topojson.feature(us, us.objects.states);
      stateBorders = topojson.mesh(us, us.objects.states, (a, b) => a !== b);
      resize();
      requestRender();
    })
    .catch(() => {
      stateLoadPromise = undefined;
    });
}

function northeastOffset(code) {
  const offsets = {
    BOS: [12, -18],
    JFK: [18, 12],
    LGA: [-18, -11],
    EWR: [-25, 11],
    PHL: [-6, 19],
    DCA: [16, 18],
    IAD: [-18, 16],
    BWI: [10, -17]
  };
  const offset = offsets[code];
  if (!offset) return [0, 0];
  const strength = Math.max(0.55, Math.min(1.25, zoomFactor * 0.62));
  return [offset[0] * strength, offset[1] * strength];
}

function displayPointForAirport(airport) {
  const point = projectedPoint(airport.coordinates);
  if (!point) return undefined;
  const [dx, dy] = northeastOffset(airport.code);
  return [point[0] + dx, point[1] + dy];
}

function updateHubPositions() {
  hubLayer.selectAll(".hub-marker")
    .attr("transform", (hub) => {
      const [x, y] = displayPointForAirport(hub) || [0, 0];
      return `translate(${x},${y})`;
    })
    .classed("off-globe", (hub) => !isVisible(hub.coordinates))
    .classed("lod-hidden", () => false);

  if (hoveredHub) {
    if (isVisible(hoveredHub.coordinates)) {
      positionHoverCard(hoveredHub);
    } else {
      hideHoverCard();
    }
  }
}

function renderGlobe() {
  drawMap();
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
    .attr("d", routePath)
    .on("mouseenter", (event, feature) => {
      routeState.hoveredRoute = feature;
      motion.hovering = true;
      pauseRotation();
      showRouteTooltip(event, feature);
      updateRouteHighlight();
    })
    .on("mousemove", (event) => positionRouteTooltip(event))
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
    .attr("stroke", "#ffc857")
    .attr("d", routePath);
  requestRender();
}

function updateRouteControls() {
  const hasSelection = hasRouteSelection();
  routeToggle.disabled = !hasSelection;
  routeToggle.checked = routeState.visible && hasSelection;
  document.querySelector("#route-note").textContent = hasSelection
    ? "Toggle the selected network on or off. The foreground is capped at 240 routes for clarity."
    : "Select an airline or hub to enable a focused network of up to 240 routes.";
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
  const [x, y] = displayPointForAirport(hub) || projectedPoint(hub.coordinates) || [0, 0];
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
      const swatch = airline === "All" ? "" : `<i aria-hidden="true"></i>`;
      return `<button class="filter-chip airline-chip ${isActive ? "active" : ""}" style="--chip:${AIRLINE_COLORS[airline] || "#ffc857"}" type="button" data-airline="${airline}">${swatch}<span>${airline}</span></button>`;
    })
    .join("");
  document.querySelectorAll("[data-airline]").forEach((button) => {
    button.addEventListener("click", () => {
      const airline = button.dataset.airline;
      if (airline === "All") {
        filters.airlines.clear();
        routeState.visible = false;
        routeState.hubCode = undefined;
      } else if (filters.airlines.has(airline)) {
        filters.airlines.delete(airline);
        routeState.visible = Boolean(filters.airlines.size || routeState.hubCode);
      } else {
        filters.airlines.add(airline);
        routeState.visible = true;
      }
      renderFilters();
      refreshView();
    });
  });
}

function resize() {
  const devicePixelRatio = window.devicePixelRatio || 1;
  width = mapElement.clientWidth;
  height = mapElement.clientHeight;
  globeLayout = calculateGlobeLayout();
  canvas.width = width * devicePixelRatio;
  canvas.height = height * devicePixelRatio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  svg.attr("viewBox", `0 0 ${width} ${height}`);
  const fitFeature = nation || usaFitFeature;
  projection.fitExtent(
    [
      [globeLayout.left + 22, globeLayout.top + 78],
      [globeLayout.right - 22, globeLayout.bottom - 26]
    ],
    fitFeature
  );
  baseScale = projection.scale();
  baseTranslate = projection.translate();
  projection
    .scale(baseScale * zoomFactor)
    .translate([
      baseTranslate[0] + mapOffset[0],
      baseTranslate[1] + mapOffset[1]
    ]);
  updateGlobeDebugOverlay();
  ensureStateBorders();
  requestRender();
  renderDashboard();
}

function updateGlobeDebugOverlay() {
  const enabled = new URLSearchParams(window.location.search).has("debugGlobe");
  const debugLayer = svg.selectAll(".globe-layout-debug").data(enabled && globeLayout ? [globeLayout] : []).join("g")
    .attr("class", "globe-layout-debug");
  debugLayer.selectAll("rect").data((layout) => [layout]).join("rect")
    .attr("x", (layout) => layout.left)
    .attr("y", (layout) => layout.top)
    .attr("width", (layout) => layout.availableWidth)
    .attr("height", (layout) => layout.availableHeight);
  debugLayer.selectAll("circle").data((layout) => [layout]).join("circle")
    .attr("cx", (layout) => layout.centerX)
    .attr("cy", (layout) => layout.centerY)
    .attr("r", 5);
}

svg.call(d3.drag()
  .on("start", () => {
    d3.select(mapElement).interrupt("globe-view");
    motion.dragging = true;
    pauseRotation();
  })
  .on("drag", (event) => {
    mapOffset[0] += event.dx;
    mapOffset[1] += event.dy;
    projection.translate([
      baseTranslate[0] + mapOffset[0],
      baseTranslate[1] + mapOffset[1]
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
  setZoomFactor(zoomFactor * Math.exp(-event.deltaY * 0.0012));
}, { passive: false });

svg.on("dblclick", (event) => {
  event.preventDefault();
  const coordinates = projection.invert(d3.pointer(event, svg.node()));
  if (coordinates) focusCoordinates(coordinates, Math.max(REGIONAL_ZOOM, zoomFactor * 1.55));
});

function setZoomFactor(nextZoom) {
  const previousZoom = zoomFactor;
  zoomFactor = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoom));
  if (baseTranslate) {
    const ratio = zoomFactor / previousZoom;
    mapOffset = [mapOffset[0] * ratio, mapOffset[1] * ratio];
    projection
      .scale(baseScale * zoomFactor)
      .translate([
        baseTranslate[0] + mapOffset[0],
        baseTranslate[1] + mapOffset[1]
      ]);
  }
  ensureStateBorders();
  requestRender();
}

function focusCoordinates(coordinates, targetZoom, duration = 760) {
  pauseRotation(duration + 1400);
  const startZoom = zoomFactor;
  const endZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, targetZoom));
  const startOffset = [...mapOffset];
  d3.select(mapElement)
    .interrupt("globe-view")
    .transition("globe-view")
    .duration(duration)
    .ease(d3.easeCubicInOut)
    .tween("view", () => {
      const interpolateZoom = d3.interpolateNumber(startZoom, endZoom);
      const targetProjection = d3.geoAlbersUsa()
        .fitExtent(
          [
            [globeLayout.left + 22, globeLayout.top + 78],
            [globeLayout.right - 22, globeLayout.bottom - 26]
          ],
          nation || usaFitFeature
        );
      const basePoint = targetProjection.scale(targetProjection.scale() * endZoom)(coordinates);
      const targetOffset = basePoint
        ? [globeLayout.centerX - basePoint[0], globeLayout.centerY - basePoint[1]]
        : [0, 0];
      const interpolateOffset = d3.interpolateArray(startOffset, targetOffset);
      return (time) => {
        zoomFactor = interpolateZoom(time);
        mapOffset = interpolateOffset(time);
        projection
          .scale(baseScale * zoomFactor)
          .translate([
            baseTranslate[0] + mapOffset[0],
            baseTranslate[1] + mapOffset[1]
          ]);
        requestRender();
      };
    });
}

function resetGlobe() {
  pauseRotation(1200);
  const startZoom = zoomFactor;
  const startOffset = [...mapOffset];
  d3.select(mapElement)
    .interrupt("globe-view")
    .transition("globe-view")
    .duration(620)
    .ease(d3.easeCubicInOut)
    .tween("view", () => {
      const interpolateZoom = d3.interpolateNumber(startZoom, 1);
      const interpolateOffset = d3.interpolateArray(startOffset, [0, 0]);
      return (time) => {
        zoomFactor = interpolateZoom(time);
        mapOffset = interpolateOffset(time);
        projection
          .scale(baseScale * zoomFactor)
          .translate([
            baseTranslate[0] + mapOffset[0],
            baseTranslate[1] + mapOffset[1]
          ]);
        requestRender();
      };
    });
}

function viewportCenterCoordinates() {
  return projection.invert([globeLayout.centerX, globeLayout.centerY]) || [-98, 39];
}

function animate(now) {
  const elapsed = Math.min(now - motion.lastFrame, 80);
  motion.lastFrame = now;
  if (motion.dirty) {
    renderGlobe();
    motion.dirty = false;
  }
  requestAnimationFrame(animate);
}

renderMarkers();
document.querySelector("#airport-count").textContent = HUBS.length;
document.querySelector("#enplanement-total").textContent = `${d3.format(".3~s")(d3.sum(HUBS, (hub) => hub.enplanements))}`;
updateModalMetadata();
renderFilters();
resize();
refreshView();
requestAnimationFrame(animate);

ensureStateBorders();

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
document.querySelector("#zoom-in").addEventListener("click", () => focusCoordinates(viewportCenterCoordinates(), zoomFactor * 1.45, 420));
document.querySelector("#zoom-out").addEventListener("click", () => focusCoordinates(viewportCenterCoordinates(), zoomFactor / 1.45, 420));
document.querySelector("#reset-globe").addEventListener("click", resetGlobe);

const modalBackdrop = document.querySelector("#modal-backdrop");
document.querySelector("#about-button").addEventListener("click", () => { modalBackdrop.hidden = false; });
document.querySelector("#close-modal").addEventListener("click", () => { modalBackdrop.hidden = true; });
modalBackdrop.addEventListener("click", (event) => {
  if (event.target === modalBackdrop) modalBackdrop.hidden = true;
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") modalBackdrop.hidden = true;
});

const welcomeBackdrop = document.querySelector("#welcome-backdrop");
const welcomeDismiss = document.querySelector("#welcome-dismiss");
const welcomeStorageKey = "airlineHubAtlas.hideWelcome";
if (localStorage.getItem(welcomeStorageKey) !== "true") {
  welcomeBackdrop.hidden = false;
}
document.querySelector("#welcome-start").addEventListener("click", () => {
  if (welcomeDismiss.checked) localStorage.setItem(welcomeStorageKey, "true");
  welcomeBackdrop.hidden = true;
});
window.addEventListener("resize", resize);
