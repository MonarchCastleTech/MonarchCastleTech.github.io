export const ODBL = 'https://opendatacommons.org/licenses/odbl/1-0/';
export function normalizeCalendar(countries, elections) {
  if (!Array.isArray(countries) || countries.length < 150 || !Array.isArray(elections) || elections.length < 100) throw new Error('Incomplete calendar response');
  const codes = new Set(countries.map(c => c.iso3));
  const conflicts = elections.filter(e=>e.iso3==='SDN' && /South Sudan/i.test(e.name));
  const excluded = new Set(conflicts.map(e=>e.slug));
  const rows = [...new Map(elections.filter(e => codes.has(e.iso3) && e.scope === 'national' && !excluded.has(e.slug)).map(e => [e.slug, {
    id: e.slug, country: e.iso3, name: e.name, kind: e.kind, date: e.held_on || null,
    year: e.held_on?.slice(0,4) || e.name.match(/^\d{4}/)?.[0] || null,
    precision: e.date_precision, status: e.date_status, evidence: e.evidence?.date || 'unsupported',
    phase: e.phase, indirect: Boolean(e.indirect || e.electing_body), round: e.round, verified: e.last_verified_at,
    url: `https://elekt.io/elections/${encodeURIComponent(e.slug)}`,
    api: `https://elekt.io/elekt/api/v1/elections/${encodeURIComponent(e.slug)}`
  }])).values()];
  return {countries: countries.map(c => ({code:c.iso3,iso2:c.iso2,name:c.name,region:c.region,capital:c.capital})), elections:rows, excludedRecords:conflicts.map(e=>({id:e.slug,reason:'Upstream country/name conflict: assigned to Sudan but names South Sudan.'}))};
}
export function normalizeGermany(data, today) {
  if (!data.Surveys || !data.Parliaments || !data.Parties) throw new Error('Invalid DAWUM response');
  const cutoff = new Date(Date.parse(today) - 180*864e5).toISOString().slice(0,10);
  const polls = Object.entries(data.Surveys).filter(([,s]) => s.Date >= cutoff && s.Date <= today).map(([id,s]) => ({
    id, group: String(s.Parliament_ID), pollster: data.Institutes[s.Institute_ID]?.Name || 'Unknown institute',
    published:s.Date,start:s.Survey_Period?.Date_Start,end:s.Survey_Period?.Date_End,
    n:Number(s.Surveyed_Persons)||null,method:data.Methods?.[s.Method_ID]?.Name||null,
    sponsor:data.Taskers?.[s.Tasker_ID]?.Name||null,url:'https://dawum.de/',
    results:Object.entries(s.Results).filter(([,v]) => Number.isFinite(v) && v>=0 && v<=100).map(([id,pct])=>({name:data.Parties[id]?.Shortcut||id,party:id,pct}))
  })).filter(p=>p.results.length>=2).sort((a,b)=>b.published.localeCompare(a.published));
  if (!polls.length) throw new Error('No recent German polls');
  return {updated:data.Database?.Last_Update,groups:Object.entries(data.Parliaments).map(([id,p])=>({id,name:p.Name})),polls,credit:'Data: dawum.de',license:ODBL,licenseName:'ODbL 1.0'};
}
export function normalizeUS(rows, today) {
  if (!Array.isArray(rows) || rows.length<10) throw new Error('Incomplete US response');
  const polls = rows.filter(p=>p.end && p.end<=today && !p.dates_backwards).map(p=>({
    id:p.id,group:p.race,pollster:p.pollster,published:p.added||p.end,start:p.start,end:p.end,n:p.n,
    method:p.population,sponsor:p.sponsors?.join(', ')||null,url:p.source_url,
    state:p.state,type:p.poll_type,internal:p.internal,results:(p.results||[]).filter(r=>Number.isFinite(r.pct)&&r.pct>=0&&r.pct<=100).map(r=>({name:r.candidate,party:r.party,pct:r.pct}))
  })).filter(p=>p.results.length>=2).sort((a,b)=>b.end.localeCompare(a.end)||b.published.localeCompare(a.published));
  return {groups:[...new Set(polls.map(p=>p.group))].sort().map(id=>({id,name:id.replaceAll('-',' ')})),polls,credit:'VoteHub / Election Wrld',license:'https://creativecommons.org/licenses/by/4.0/',licenseName:'CC BY 4.0'};
}
export function preciseDate(e) { return Boolean(e.precision==='day' && e.date && ['confirmed','scheduled','snap'].includes(e.status) && e.evidence==='confirmed'); }
