const passengerFormat = d3.format(".3~s");
const passengerLongFormat = d3.format(",");
const radiusScale = d3.scaleSqrt()
  .domain(d3.extent(HUBS, (d) => d.enplanements))
  .range([10, 28]);

const filters = { role: "All", airlines: new Set(), query: "" };
const markers = new Map();
const hoverCard = document.querySelector("#hover-card");
const airportList = document.querySelector("#airport-list");
const allAirlines = Object.keys(ROUTE_NETWORKS);

const map = new maplibregl.Map({
  container: "map",
  style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  center: [-97.5, 38.1],
  zoom: 3.5,
  minZoom: 2.6,
  maxZoom: 10,
  attributionControl: false
});

map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
map.addControl(
  new maplibregl.AttributionControl({
    compact: true,
    customAttribution: "FAA CY 2024 · BTS TranStats"
  }),
  "bottom-right"
);

function interpolateRoute([startCode, endCode]) {
  const start = ROUTE_AIRPORTS[startCode].coordinates;
  const end = ROUTE_AIRPORTS[endCode].coordinates;
  const interpolate = d3.geoInterpolate(start, end);
  return d3.range(25).map((index) => interpolate(index / 24));
}

function activeAirlines() {
  return filters.airlines.size === 0 ? allAirlines : [...filters.airlines];
}

function selectedRouteFeatures() {
  return activeAirlines().flatMap((airline) =>
    ROUTE_NETWORKS[airline].map(([origin, destination]) => ({
      type: "Feature",
      properties: { airline, color: AIRLINE_COLORS[airline], origin, destination },
      geometry: { type: "LineString", coordinates: interpolateRoute([origin, destination]) }
    }))
  );
}

function refreshRoutes() {
  const features = selectedRouteFeatures();
  const source = map.getSource("airline-routes");
  if (source) source.setData({ type: "FeatureCollection", features });

  const airportCodes = new Set(features.flatMap((feature) => [
    feature.properties.origin,
    feature.properties.destination
  ]));
  const airportFeatures = Object.values(ROUTE_AIRPORTS)
    .filter((airport) => airportCodes.has(airport.code))
    .map((airport) => ({
      type: "Feature",
      properties: { code: airport.code },
      geometry: { type: "Point", coordinates: airport.coordinates }
    }));
  const airportSource = map.getSource("route-airports");
  if (airportSource) airportSource.setData({ type: "FeatureCollection", features: airportFeatures });

  const summary = document.querySelector("#route-summary");
  summary.hidden = false;
  document.querySelector("#route-count").textContent = `${features.length} ${features.length === 1 ? "route" : "routes"}`;
  document.querySelector("#route-key").innerHTML = activeAirlines()
    .map((airline) => `<span class="route-key-item" style="--route:${AIRLINE_COLORS[airline]}"><i></i>${airline}</span>`)
    .join("");
}

function airportMatches(hub) {
  const roleMatch = filters.role === "All" || hub.role === filters.role;
  const airlineMatch = filters.airlines.size === 0 || [...filters.airlines].some((airline) => hub.airlines.includes(airline));
  const haystack = `${hub.code} ${hub.city} ${hub.name}`.toLowerCase();
  return roleMatch && airlineMatch && haystack.includes(filters.query.toLowerCase());
}

function makeMarker(hub) {
  const element = document.createElement("button");
  const color = AIRLINE_COLORS[hub.anchor] || "#ffc857";
  element.type = "button";
  element.className = `hub-marker ${hub.role === "Focus city" ? "focus" : ""}`;
  element.style.setProperty("--size", `${radiusScale(hub.enplanements)}px`);
  element.style.setProperty("--color", color);
  element.setAttribute("aria-label", `${hub.code}, ${hub.name}`);
  element.innerHTML = `<span class="hub-dot"></span><span class="hub-label">${hub.code}</span>`;

  element.addEventListener("mouseenter", () => showHoverCard(hub, element));
  element.addEventListener("mouseleave", hideHoverCard);
  element.addEventListener("focus", () => showHoverCard(hub, element));
  element.addEventListener("blur", hideHoverCard);
  element.addEventListener("click", () => flyToHub(hub));

  new maplibregl.Marker({ element, anchor: "center" })
    .setLngLat(hub.coordinates)
    .addTo(map);

  markers.set(hub.code, element);
}

function showHoverCard(hub, element) {
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
  const point = map.project(hub.coordinates);
  const cardWidth = 248;
  const leftPanelEdge = window.innerWidth > 700 ? 344 : 10;
  let left = point.x + 22;
  let top = point.y - 46;
  if (left + cardWidth > window.innerWidth - 14) left = point.x - cardWidth - 22;
  if (left < leftPanelEdge) left = leftPanelEdge;
  if (top < 96) top = 96;
  if (top + 190 > window.innerHeight) top = window.innerHeight - 204;
  hoverCard.style.left = `${left}px`;
  hoverCard.style.top = `${top}px`;
}

function hideHoverCard() {
  hoverCard.classList.remove("visible");
  markers.forEach((marker) => marker.classList.remove("dimmed", "selected"));
}

function flyToHub(hub) {
  map.flyTo({ center: hub.coordinates, zoom: 6.2, duration: 950 });
}

function renderList() {
  const visible = HUBS.filter(airportMatches).sort((a, b) => d3.descending(a.enplanements, b.enplanements));
  document.querySelector("#visible-count").textContent = `${visible.length} shown`;
  airportList.innerHTML = visible.length
    ? visible.map((hub) => `
      <button class="airport-row" type="button" data-code="${hub.code}">
        <span class="airport-code">${hub.code}</span>
        <span><span class="airport-city">${hub.city}</span><span class="airport-role">${hub.role} · ${hub.anchor}</span></span>
        <span class="airport-volume">${passengerFormat(hub.enplanements)}</span>
      </button>`).join("")
    : `<p class="empty-state">No airports match these filters. Try resetting the view.</p>`;

  airportList.querySelectorAll(".airport-row").forEach((row) => {
    row.addEventListener("click", () => flyToHub(HUBS.find((hub) => hub.code === row.dataset.code)));
  });
}

function refreshView() {
  markers.forEach((element, code) => {
    element.classList.toggle("hidden", !airportMatches(HUBS.find((hub) => hub.code === code)));
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
      const isActive = airline === "All" ? filters.airlines.size === 0 : filters.airlines.has(airline);
      return `<button class="filter-chip airline-chip ${isActive ? "active" : ""}" style="--chip:${AIRLINE_COLORS[airline] || "#ffc857"}" type="button" data-airline="${airline}">${airline}</button>`;
    })
    .join("");
  document.querySelectorAll("[data-airline]").forEach((button) => {
    button.addEventListener("click", () => {
      const airline = button.dataset.airline;
      if (airline === "All") {
        filters.airlines.clear();
      } else if (filters.airlines.has(airline)) {
        filters.airlines.delete(airline);
      } else {
        filters.airlines.add(airline);
      }
      renderFilters();
      refreshView();
    });
  });
}

map.on("load", () => {
  map.addSource("airline-routes", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] }
  });
  map.addLayer({
    id: "airline-routes-glow",
    type: "line",
    source: "airline-routes",
    paint: {
      "line-color": ["get", "color"],
      "line-width": 5,
      "line-opacity": 0.12,
      "line-blur": 4
    }
  });
  map.addLayer({
    id: "airline-routes",
    type: "line",
    source: "airline-routes",
    paint: {
      "line-color": ["get", "color"],
      "line-width": 1.65,
      "line-opacity": 0.72
    }
  });
  map.addSource("route-airports", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] }
  });
  map.addLayer({
    id: "route-airports",
    type: "circle",
    source: "route-airports",
    paint: {
      "circle-radius": 2.2,
      "circle-color": "#e8edf4",
      "circle-opacity": 0.68,
      "circle-stroke-color": "#101722",
      "circle-stroke-width": 0.8
    }
  });
  refreshRoutes();
});

HUBS.forEach(makeMarker);
document.querySelector("#airport-count").textContent = HUBS.length;
document.querySelector("#enplanement-total").textContent = `${d3.format(".3~s")(d3.sum(HUBS, (d) => d.enplanements))}`;
renderFilters();
refreshView();

document.querySelector("#airport-search").addEventListener("input", (event) => {
  filters.query = event.target.value.trim();
  refreshView();
});
document.querySelector("#reset-filters").addEventListener("click", () => {
  filters.role = "All";
  filters.airlines.clear();
  filters.query = "";
  document.querySelector("#airport-search").value = "";
  renderFilters();
  refreshView();
  map.flyTo({ center: [-97.5, 38.1], zoom: 3.5, duration: 900 });
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
map.on("move", () => {
  const selected = HUBS.find((hub) => markers.get(hub.code)?.classList.contains("selected"));
  if (selected) positionHoverCard(selected);
});
