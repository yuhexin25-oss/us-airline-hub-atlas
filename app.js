const MAX_VISIBLE_ROUTES = 240;
const ROUTE_SAMPLE_COUNT = 14;
const passengerFormat = d3.format(".3~s");
const passengerLongFormat = d3.format(",");
const radiusScale = d3.scaleSqrt()
  .domain(d3.extent(HUBS, (hub) => hub.enplanements))
  .range([4.5, 12]);

const filters = { role: "All", airlines: new Set(), query: "" };
const routeState = { visible: false, hubCode: undefined, hoveredRoute: undefined };
const markers = new Map();
const routeFeatureCache = new Map();
const hubsByCode = new Map(HUBS.map((hub) => [hub.code, hub]));
const allAirlines = Object.keys(ROUTE_NETWORKS);
const hoverCard = document.querySelector("#hover-card");
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
      updateRouteHighlight();
    })
    .on("mouseleave", () => {
      routeState.hoveredRoute = undefined;
      motion.hovering = false;
      updateRouteHighlight();
    });
  updateRouteHighlight();
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

function refreshRoutes() {
  routeFeatures = selectedRouteFeatures();
  if (!routeFeatures.includes(routeState.hoveredRoute)) {
    routeState.hoveredRoute = undefined;
    motion.hovering = false;
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
  const shouldRotate = !motion.reducedMotion && !motion.dragging && !motion.hovering && !hasRouteSelection();
  if (shouldRotate) {
    const speed = now < motion.resumeAt ? 0.0015 : 0.004;
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
