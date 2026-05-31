// FAA CY 2024 enplanements provide the passenger scale. Airline lists are
// concise operating summaries informed by BTS TranStats airport profiles.
const HUBS = [
  { code: "ATL", city: "Atlanta", name: "Hartsfield-Jackson Atlanta International", coordinates: [-84.4277, 33.6407], enplanements: 52511402, role: "Primary hub", anchor: "Delta", airlines: ["Delta", "Southwest", "Frontier", "Spirit"] },
  { code: "DFW", city: "Dallas-Fort Worth", name: "Dallas Fort Worth International", coordinates: [-97.0403, 32.8998], enplanements: 42351316, role: "Primary hub", anchor: "American", airlines: ["American", "Spirit", "Frontier", "United"] },
  { code: "DEN", city: "Denver", name: "Denver International", coordinates: [-104.6737, 39.8561], enplanements: 40012895, role: "Primary hub", anchor: "United", airlines: ["United", "Southwest", "Frontier", "American"] },
  { code: "ORD", city: "Chicago", name: "Chicago O'Hare International", coordinates: [-87.9073, 41.9742], enplanements: 38575693, role: "Primary hub", anchor: "United", airlines: ["United", "American", "Spirit", "Delta"] },
  { code: "LAX", city: "Los Angeles", name: "Los Angeles International", coordinates: [-118.4085, 33.9416], enplanements: 37760834, role: "Primary hub", anchor: "Delta", airlines: ["Delta", "American", "United", "Southwest", "Alaska"] },
  { code: "JFK", city: "New York", name: "John F. Kennedy International", coordinates: [-73.7781, 40.6413], enplanements: 31466102, role: "Primary hub", anchor: "JetBlue", airlines: ["JetBlue", "Delta", "American", "Alaska"] },
  { code: "CLT", city: "Charlotte", name: "Charlotte Douglas International", coordinates: [-80.9431, 35.214], enplanements: 28523822, role: "Primary hub", anchor: "American", airlines: ["American", "Spirit", "Delta", "Southwest"] },
  { code: "LAS", city: "Las Vegas", name: "Harry Reid International", coordinates: [-115.1523, 36.084], enplanements: 28244966, role: "Focus city", anchor: "Southwest", airlines: ["Southwest", "Spirit", "Frontier", "Delta"] },
  { code: "MCO", city: "Orlando", name: "Orlando International", coordinates: [-81.3081, 28.4312], enplanements: 27859783, role: "Focus city", anchor: "Southwest", airlines: ["Southwest", "Spirit", "Frontier", "JetBlue"] },
  { code: "MIA", city: "Miami", name: "Miami International", coordinates: [-80.287, 25.7959], enplanements: 26588002, role: "Primary hub", anchor: "American", airlines: ["American", "Delta", "Spirit", "Southwest"] },
  { code: "PHX", city: "Phoenix", name: "Phoenix Sky Harbor International", coordinates: [-112.0116, 33.4342], enplanements: 25595723, role: "Primary hub", anchor: "American", airlines: ["American", "Southwest", "Frontier", "Delta"] },
  { code: "SEA", city: "Seattle", name: "Seattle-Tacoma International", coordinates: [-122.3088, 47.4502], enplanements: 25414592, role: "Primary hub", anchor: "Alaska", airlines: ["Alaska", "Delta", "Southwest", "United"] },
  { code: "SFO", city: "San Francisco", name: "San Francisco International", coordinates: [-122.379, 37.6213], enplanements: 25078968, role: "Primary hub", anchor: "United", airlines: ["United", "Alaska", "Delta", "American"] },
  { code: "EWR", city: "Newark", name: "Newark Liberty International", coordinates: [-74.1745, 40.6895], enplanements: 24544320, role: "Primary hub", anchor: "United", airlines: ["United", "Spirit", "American", "Delta"] },
  { code: "IAH", city: "Houston", name: "George Bush Intercontinental", coordinates: [-95.3414, 29.9902], enplanements: 23349157, role: "Primary hub", anchor: "United", airlines: ["United", "Spirit", "American", "Delta"] },
  { code: "BOS", city: "Boston", name: "Logan International", coordinates: [-71.0096, 42.3656], enplanements: 21090721, role: "Focus city", anchor: "JetBlue", airlines: ["JetBlue", "Delta", "American", "United"] },
  { code: "MSP", city: "Minneapolis", name: "Minneapolis-Saint Paul International", coordinates: [-93.2218, 44.8848], enplanements: 18054481, role: "Primary hub", anchor: "Delta", airlines: ["Delta", "Sun Country", "Southwest", "United"] },
  { code: "FLL", city: "Fort Lauderdale", name: "Fort Lauderdale-Hollywood International", coordinates: [-80.1527, 26.0742], enplanements: 17096131, role: "Focus city", anchor: "Spirit", airlines: ["Spirit", "JetBlue", "Southwest", "Delta"] },
  { code: "LGA", city: "New York", name: "LaGuardia", coordinates: [-73.874, 40.7769], enplanements: 16715567, role: "Primary hub", anchor: "Delta", airlines: ["Delta", "American", "Southwest", "United"] },
  { code: "DTW", city: "Detroit", name: "Detroit Metropolitan Wayne County", coordinates: [-83.3534, 42.2162], enplanements: 16110696, role: "Primary hub", anchor: "Delta", airlines: ["Delta", "Spirit", "Southwest", "American"] },
  { code: "PHL", city: "Philadelphia", name: "Philadelphia International", coordinates: [-75.2424, 39.8744], enplanements: 15102261, role: "Primary hub", anchor: "American", airlines: ["American", "Frontier", "Spirit", "Delta"] },
  { code: "SLC", city: "Salt Lake City", name: "Salt Lake City International", coordinates: [-111.9778, 40.7899], enplanements: 13543570, role: "Primary hub", anchor: "Delta", airlines: ["Delta", "Southwest", "American", "United"] },
  { code: "BWI", city: "Baltimore", name: "Baltimore/Washington International", coordinates: [-76.6684, 39.1774], enplanements: 13221461, role: "Focus city", anchor: "Southwest", airlines: ["Southwest", "Spirit", "Delta", "American"] },
  { code: "IAD", city: "Washington", name: "Washington Dulles International", coordinates: [-77.4565, 38.9531], enplanements: 13003234, role: "Primary hub", anchor: "United", airlines: ["United", "Delta", "American", "Southwest"] },
  { code: "DCA", city: "Washington", name: "Ronald Reagan Washington National", coordinates: [-77.0377, 38.8512], enplanements: 12750892, role: "Primary hub", anchor: "American", airlines: ["American", "Delta", "Southwest", "JetBlue"] },
  { code: "BNA", city: "Nashville", name: "Nashville International", coordinates: [-86.6782, 36.1263], enplanements: 12058688, role: "Focus city", anchor: "Southwest", airlines: ["Southwest", "American", "Delta", "Spirit"] },
  { code: "DAL", city: "Dallas", name: "Dallas Love Field", coordinates: [-96.8517, 32.8471], enplanements: 8654991, role: "Focus city", anchor: "Southwest", airlines: ["Southwest", "Delta", "Alaska"] },
  { code: "STL", city: "St. Louis", name: "St. Louis Lambert International", coordinates: [-90.37, 38.7487], enplanements: 8150842, role: "Focus city", anchor: "Southwest", airlines: ["Southwest", "American", "Delta", "United"] },
  { code: "HOU", city: "Houston", name: "William P. Hobby", coordinates: [-95.2789, 29.6454], enplanements: 7438169, role: "Focus city", anchor: "Southwest", airlines: ["Southwest", "American", "Delta", "Frontier"] },
  { code: "MCI", city: "Kansas City", name: "Kansas City International", coordinates: [-94.7139, 39.2976], enplanements: 6058126, role: "Focus city", anchor: "Southwest", airlines: ["Southwest", "Delta", "American", "United"] },
  { code: "OAK", city: "Oakland", name: "San Francisco Bay Oakland International", coordinates: [-122.221, 37.7126], enplanements: 5620310, role: "Focus city", anchor: "Southwest", airlines: ["Southwest", "Spirit", "Alaska", "Delta"] }
];

const AIRLINE_COLORS = {
  "Alaska": "#45b7ff",
  "American": "#f26b67",
  "Delta": "#df4f83",
  "Frontier": "#70c79b",
  "JetBlue": "#5c8eff",
  "Southwest": "#ffc857",
  "Spirit": "#ffe768",
  "Sun Country": "#ff9a5a",
  "United": "#6f91ff"
};
