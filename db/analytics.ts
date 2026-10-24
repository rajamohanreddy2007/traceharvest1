import context from './trend-context.json' with { type: 'json' };
type Data = Record<string, any[]>;

export function trends(data: Data) {
  const { batches, inspections, anomalies, coldChainLogs, recalls } = data;
  const rate = (n: number, total: number) => total ? Math.round(n / total * 1000) / 10 : 0;
  const highRisk = (b: any) => ['High', 'Critical'].includes(b.riskLevel);
  const cropRisk: Record<string, any> = {};
  const regionIncidents: Record<string, number> = {};
  for (const batch of batches) {
    const risk = cropRisk[batch.crop] ??= { total: 0, highRisk: 0, quantityKg: 0 };
    risk.total++;
    risk.quantityKg += batch.quantityKg;
    if (highRisk(batch)) risk.highRisk++;
  }
  for (const anomaly of anomalies) {
    const location = anomaly.location || '';
    const region = /Guntur|Tenali/.test(location) ? 'Guntur' : /Krishna|Nuzvid|Vijayawada/.test(location) ? 'Krishna'
      : /Kurnool|Adoni/.test(location) ? 'Kurnool' : /Chittoor|Tirupati/.test(location) ? 'Chittoor'
      : /Eluru|NH-16/.test(location) ? 'Godavari / NH-16' : 'Other AP Hubs';
    regionIncidents[region] = (regionIncidents[region] || 0) + 1;
  }
  return { ...context, cropRisk, regionIncidents, metrics: {
    totalBatches: batches.length, totalIncidents: anomalies.length + recalls.length,
    qualityFailureRate: rate(inspections.filter(i => i.status === 'FAILED').length, inspections.length),
    missingRecordRate: rate(batches.filter(b => b.dataCompleteness < 80).length, batches.length),
    transportExceptionRate: rate(coldChainLogs.filter(c => c.status.includes('Excursion')).length, coldChainLogs.length),
    batchesUnderInvestigation: batches.filter(b => highRisk(b) || b.recallStatus === 'RECALLED').length,
    recurringRiskPatternsCount: context.patterns.length, repeatedIncidentCorridorsCount: 2,
  } };
}

export function investigate(data: Data, batchId: string) {
  const batch = data.batches.find(b => b.id.toLowerCase() === batchId.toLowerCase());
  if (!batch) return null;
  const linked = (collection: string) => data[collection].filter(r => r.batchId.toLowerCase() === batch.id.toLowerCase());
  const transfers = linked('transfers'), inspections = linked('inspections'), anomalies = linked('anomalies');
  const coldLogs = linked('coldChainLogs'), recall = linked('recalls')[0] || null;
  const farm = data.farms.find(f => f.id === batch.farmId);
  const excursions = coldLogs.filter(c => c.tempC > 10);
  const scoreBreakdown: any[] = [];
  let score = 15;
  const add = (factor: string, points: number, detail: string) => {
    score += points;
    scoreBreakdown.push({ factor, points: `+${points}`, detail });
  };
  if (inspections.some(i => i.status === 'FAILED')) add('Lab Quality Failure', 35, 'Exceeded legal chemical MRL limit');
  else if (!inspections.length) add('Missing Mandatory Inspection', 15, 'No certified lab documentation attached');
  if (excursions.length) add('Severe Temperature Excursion', 30, `Peak ${Math.max(...excursions.map(c => c.tempC))}°C in reefer transit`);
  if (anomalies.length) add('AI Detective Anomalies', Math.min(anomalies.length * 10, 20), `${anomalies.length} suspicious pattern(s) identified`);
  const destinations = [...new Map(transfers.map(t => [t.toLocation, t])).values()].map(t => ({
    name: t.toLocation.split(',')[0], fullLocation: t.toLocation,
    type: /Bazaar|Basket|Retail/.test(t.toLocation) ? 'Retail Shelf Point' : 'Transit Distribution Hub',
    receivedKg: t.receivedQuantityKg ?? t.dispatchedQuantityKg,
    status: batch.recallStatus === 'RECALLED' ? 'Quarantined' : 'Potentially Exposed',
  }));
  if (destinations.length >= 2) add('Multi-tier Downstream Exposure', 10, `${destinations.length} downstream facilities reached`);
  const riskScore = Math.min(score, 100);
  return { batch, riskScore, scoreBreakdown, raw: { transfers, inspections, anomalies, coldLogs, recall }, bullseye: {
    center: { id: batch.id, title: `${batch.crop} (${batch.variety})`, farm: batch.farmName,
      quantityKg: batch.quantityKg, severity: batch.riskLevel, status: batch.status,
      recallStatus: batch.recallStatus, riskScore },
    ring1_evidence: [
      ...inspections.map(i => ({ id: i.id, type: 'Laboratory Inspection', status: i.status,
        label: `Lab Report: ${i.docReference}`, detail: i.verdict, date: i.date, severity: i.status === 'FAILED' ? 'Critical' : 'Low' })),
      ...anomalies.map(a => ({ id: a.id, type: 'AI Detective Finding', status: a.severity,
        label: a.title, detail: a.reason, date: a.detectedAt, severity: a.severity })),
      ...excursions.slice(0, 2).map(c => ({ id: `EXC-${c.id}`, type: 'IoT Sensor Telemetry', status: 'Excursion',
        label: `Sensor Alert: ${c.tempC}°C`, detail: `Breach recorded along ${c.route} on vehicle ${c.vehicleNo}`, date: c.timestamp, severity: 'Critical' })),
    ],
    ring2_supplyChain: [
      ...(farm ? [{ id: farm.id, type: 'Origin Farm', name: farm.name, owner: farm.owner, location: farm.region, certifications: farm.certifications }] : []),
      ...transfers.map(t => ({ id: t.id, type: 'Logistics Carrier', transporter: t.transporter, vehicle: t.vehicleNo,
        from: t.fromLocation.split(',')[0], to: t.toLocation.split(',')[0], condition: t.condition, dispatchedKg: t.dispatchedQuantityKg })),
    ],
    ring3_destinations: destinations,
    outerRing_context: [{ id: 'CTX-1', title: 'Regional Agrochemical Risk Corridor', description: `District surveillance in ${batch.region.split(',')[0]} shows elevated monitoring this harvest cycle.` },
      { id: 'CTX-2', title: 'Cold-Chain Fleet Telemetry Reliability', description: 'FastTrack ColdTrans fleet AP-07 series has 2 flagged thermal spikes in the last 72 hours.' },
      { id: 'CTX-3', title: 'FSSAI Mandatory Traceability Compliance', description: 'Standard compliance protocol requires all tier-1 handlers to acknowledge notice within 120 minutes.' }],
  } };
}
