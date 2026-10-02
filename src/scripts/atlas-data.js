export function countryCentre(feature) {
  const ring = [...feature.rings].sort((a, b) => b.length - a.length)[0];
  if (!ring?.length) return null;
  let x = 0, y = 0, z = 0;
  for (const [lon, lat] of ring) { const phi = lat * Math.PI / 180, theta = lon * Math.PI / 180; x += Math.cos(phi) * Math.cos(theta); y += Math.sin(phi); z += Math.cos(phi) * Math.sin(theta); }
  return [Math.atan2(z, x) * 180 / Math.PI, Math.atan2(y, Math.hypot(x, z)) * 180 / Math.PI];
}
const aliases = { "United States": "United States of America", "Türkiye": "Turkey", "Turkiye": "Turkey", "Czechia": "Czech Republic", "Democratic Republic of the Congo": "Dem. Rep. Congo", "South Sudan": "S. Sudan", "Ivory Coast": "Côte d'Ivoire", "Dominican Republic": "Dominican Rep.", "Bosnia and Herzegovina": "Bosnia and Herz.", "Central African Republic": "Central African Rep.", "Equatorial Guinea": "Eq. Guinea", "North Macedonia": "Macedonia" };
export function matchGeography(record, geography) { const name = aliases[record.name] ?? record.name; return geography.find(feature => feature.name.toLowerCase() === name.toLowerCase()); }
