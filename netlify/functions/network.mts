import type { Config } from '@netlify/functions';
import { loadNetworkData } from '../../db/index.js';
import { trends, investigate } from '../../db/analytics.js';

export async function respond(request: Request, load = loadNetworkData) {
  const path = new URL(request.url).pathname;
  const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'no-store' } });
  if (request.method !== 'GET') return json({ detail: 'Method not allowed' }, 405);
  try {
    const data = await load();
    if (path === '/api/health') return json({ status: 'healthy', app: 'TraceHarvest AI', timestamp: new Date().toISOString() });
    if (path === '/api/data') return json(data);
    if (path === '/api/trends') return json(trends(data));
    const match = path.match(/^\/api\/bullseye\/([^/]+)$/);
    if (match) {
      const result = investigate(data, decodeURIComponent(match[1]));
      return result ? json(result) : json({ detail: 'Batch not found' }, 404);
    }
    return json({ detail: 'Endpoint not found' }, 404);
  } catch {
    // Keep database details and credentials out of client responses and logs.
    return json({ detail: 'The data service is temporarily unavailable. Please retry.' }, 503);
  }
}

export default async (request: Request) => respond(request);
export const config: Config = { path: ['/api/data', '/api/health', '/api/trends', '/api/bullseye/:batchId'] };
