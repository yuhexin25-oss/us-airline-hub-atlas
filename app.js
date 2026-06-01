const MAX_VISIBLE_ROUTES = 240;
const ROUTE_SAMPLE_COUNT = 14;
const passengerFormat = d3.format(".3~s");
const passengerLongFormat = d3.format(",");
const radiusScale = d3.scaleSqrt()
  .domain(d3.extent(HUBS, (hub) => hub.enplanements))
  .range([4.5, 12]);
const REFERENCE_LABELS = [
  { name: "United States", coordinates: [-100, 39], type: "country", priority: 10 },
  { name: "Canada", coordinates: [-108, 57], type: "country", priority: 9 },
  { name: "Mexico", coordinates: [-102, 23], type: "country", priority: 8 },
  { name: "Greenland", coordinates: [-42, 72], type: "country", priority: 5 },
  { name: "Iceland", coordinates: [-19, 65], type: "country", priority: 4 },
  { name: "United Kingdom", coordinates: [-3, 55], type: "country", priority: 6 },
  { name: "France", coordinates: [2, 46], type: "country", priority: 5 },
  { name: "Germany", coordinates: [10, 51], type: "country", priority: 5 },
  { name: "Spain", coordinates: [-4, 40], type: "country", priority: 4 },
  { name: "Brazil", coordinates: [-52, -10], type: "country", priority: 7 },
  { name: "Argentina", coordinates: [-64, -35], type: "country", priority: 5 },
  { name: "Russia", coordinates: [90, 60], type: "country", priority: 7 },
  { name: "China", coordinates: [104, 35], type: "country", priority: 8 },
  { name: "Japan", coordinates: [138, 37], type: "country", priority: 6 },
  { name: "India", coordinates: [79, 22], type: "country", priority: 7 },
  { name: "Australia", coordinates: [134, -25], type: "country", priority: 7 },
  { name: "New York", coordinates: [-74.01, 40.71], type: "city", priority: 6 },
  { name: "Chicago", coordinates: [-87.63, 41.88], type: "city", priority: 5 },
  { name: "Atlanta", coordinates: [-84.39, 33.75], type: "city", priority: 5 },
  { name: "Dallas", coordinates: [-96.8, 32.78], type: "city", priority: 4 },
  { name: "Los Angeles", coordinates: [-118.24, 34.05], type: "city", priority: 6 },
  { name: "Seattle", coordinates: [-122.33, 47.61], type: "city", priority: 4 },
  { name: "Denver", coordinates: [-104.99, 39.74], type: "city", priority: 4 },
  { name: "Miami", coordinates: [-80.19, 25.76], type: "city", priority: 4 },
  { name: "London", coordinates: [-0.13, 51.51], type: "city", priority: 6 },
  { name: "Paris", coordinates: [2.35, 48.86], type: "city", priority: 5 },
  { name: "Frankfurt", coordinates: [8.68, 50.11], type: "city", priority: 4 },
  { name: "Tokyo", coordinates: [139.69, 35.68], type: "city", priority: 6 },
  { name: "Beijing", coordinates: [116.41, 39.9], type: "city", priority: 5 },
  { name: "Shanghai", coordinates: [121.47, 31.23], type: "city", priority: 5 },
  { name: "Sydney", coordinates: [151.21, -33.87], type: "city", priority: 5 }
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
const hoverCard = document.querySelector("#hover-card");
const routeTooltip = document.querySelector("#route-tooltip");
const airlineStory = document.querySelector("#airline-story");
const airportList = document.querySelector("#airport-list");
const routeToggle = document.querySelector("#show-routes");
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
let routeFeatures = [];
let routeCollections = [];
let routeAirportCodes = new Set();
let hoveredHub;

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
    .slice(0, MAX_VISIBLE_ROUTES);
}

function routePriority(feature) {
  const { origin, destination } = feature.properties;
  return (hubsByCode.get(origin)?.enplanements || 0) + (hubsByCode.get(destination)?.enplanements || 0);
}

function isVisible(coordinates) {
  const center = projection.invert(projection.translate());
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
  drawReferenceLabels();

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
  const visibleLabels = REFERENCE_LABELS
    .map((label) => {
      const distance = d3.geoDistance(label.coordinates, center);
      const edgeOpacity = Math.max(0, Math.min(1, (Math.cos(distance) - 0.12) / 0.6));
      const [x, y] = projection(label.coordinates);
      const fontSize = label.type === "country" ? 8 : 7;
      const width = label.name.length * fontSize * 0.62;
      return { ...label, x, y, edgeOpacity, width, height: fontSize + 3 };
    })
    .filter((label) => label.edgeOpacity > 0)
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

function updateHubPositions() {
  hubLayer.selectAll(".hub-marker")
    .attr("transform", (hub) => {
      const [x, y] = projection(hub.coordinates);
      return `translate(${x},${y})`;
    })
    .classed("off-globe", (hub) => !isVisible(hub.coordinates));

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
          event.stopPropagation();
          selectHub(hub);
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
  routeState.hubCode = routeState.hubCode === hub.code ? undefined : hub.code;
  filters.airlines.clear();
  routeState.visible = Boolean(routeState.hubCode);
  renderFilters();
  refreshView();
  rotateToHub(hub);
}

function rotateToHub(hub) {
  pauseRotation(3200);
  const start = projection.rotate();
  const target = [-hub.coordinates[0], -hub.coordinates[1], 0];
  d3.transition()
    .duration(850)
    .ease(d3.easeCubicInOut)
    .tween("rotate", () => {
      const interpolate = d3.interpolate(start, target);
      return (time) => {
        projection.rotate(interpolate(time));
        requestRender();
      };
    });
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

function resize() {
  const devicePixelRatio = window.devicePixelRatio || 1;
  width = mapElement.clientWidth;
  height = mapElement.clientHeight;
  baseScale = Math.min(width * (window.innerWidth > 700 ? 0.34 : 0.43), height * 0.44);
  canvas.width = width * devicePixelRatio;
  canvas.height = height * devicePixelRatio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  svg.attr("viewBox", `0 0 ${width} ${height}`);
  projection
    .translate([width * (window.innerWidth > 700 ? 0.61 : 0.5), height * (window.innerWidth > 700 ? 0.55 : 0.38)])
    .scale(baseScale * zoomFactor);
  requestRender();
}

svg.call(d3.drag()
  .on("start", () => {
    motion.dragging = true;
    pauseRotation();
  })
  .on("drag", (event) => {
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
  pauseRotation();
  zoomFactor = Math.max(0.72, Math.min(1.85, zoomFactor * Math.exp(-event.deltaY * 0.001)));
  projection.scale(baseScale * zoomFactor);
  requestRender();
}, { passive: false });

function animate(now) {
  const elapsed = Math.min(now - motion.lastFrame, 80);
  motion.lastFrame = now;
  const shouldRotate = !motion.reducedMotion && !motion.dragging && !motion.hovering && !routeState.hubCode;
  if (shouldRotate) {
    const speed = now < motion.resumeAt ? 0.00035 : 0.001;
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
    requestRender();
  })
  .catch(() => {
    document.querySelector(".map-tip").textContent = "Drag to rotate · Scroll to zoom · Base layer unavailable";
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
  zoomFactor = 1;
  projection.rotate([98, -36, 0]).scale(baseScale);
  pauseRotation();
  document.querySelector("#airport-search").value = "";
  renderFilters();
  refreshView();
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
window.addEventListener("resize", resize);
