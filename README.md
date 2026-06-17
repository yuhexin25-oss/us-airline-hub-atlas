# U.S. Airline Network Dashboard

An interactive D3.js U.S. airline network atlas using an Albers USA projection
with Alaska and Hawaii insets. It combines airport markers, selected route arcs,
ranking charts, airline comparisons, hub details, and a compact network view.
Hover over an airport to see its major operating airlines, or use the panel to
search, filter, and compare route networks.

## Run locally

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Data sources

- [FAA passenger boarding data](https://www.faa.gov/airports/planning_capacity/passenger_allcargo_stats/passenger)
- [BTS TranStats airport profiles](https://www.transtats.bts.gov/airports.asp)
- [BTS TranStats data index](https://www.transtats.bts.gov/DataIndex.asp)
- [TopoJSON U.S. Atlas](https://github.com/topojson/us-atlas) for lazy-loaded state boundaries

FAA CY 2024 enplanements provide the passenger scale. Airline lists are concise
operating summaries informed by BTS TranStats airport profiles.

Route lines are generated from a static [OpenFlights](https://openflights.org/data.php)
snapshot of non-stop U.S. segments. They include destinations beyond the
labeled hubs, but are not a live flight schedule.

To regenerate `route-data.js`, download `airports.dat` and `routes.dat` from
OpenFlights into `/tmp`, then run:

```bash
python3 scripts/generate-route-data.py
```
