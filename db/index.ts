import { drizzle } from 'drizzle-orm/netlify-db';
import { asc } from 'drizzle-orm';
import { networkRecords } from './schema.js';
import seed from './seed.json' with { type: 'json' };

export function seedRecords() {
  return Object.entries(seed).flatMap(([collection, records]) =>
    records.map((payload, index) => ({ collection, id: 'id' in payload ? payload.id : `seed-${index}`,
      position: String(index).padStart(8, '0'), payload })));
}

export async function loadNetworkData() {
  const db = drizzle();
  // One statement seeds missing records safely across simultaneous cold starts.
  const initial = seedRecords();
  await db.insert(networkRecords).values(initial).onConflictDoNothing();
  const rows = await db.select().from(networkRecords).orderBy(asc(networkRecords.position));
  const data: Record<string, any[]> = Object.fromEntries(Object.keys(seed).map(key => [key, []]));
  for (const row of rows) (data[row.collection] ??= []).push(row.payload);
  return data;
}
