import { geolocation, ipAddress } from '@vercel/functions';

export const config = {
    runtime: 'edge',
};

export default function handler(request) {
    const details = geolocation(request);
    const ip = ipAddress(request);

    return new Response(
        JSON.stringify({
            ip: ip,
            city: details.city || "Unknown",
            country: details.country || "Unknown",
            latitude: details.latitude || 0,
            longitude: details.longitude || 0,
        }),
        {
            status: 200,
            headers: { 'content-type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'CDN-Cache-Control': 'no-store',
            'Vercel-CDN-Cache-Control': 'no-store'
            },
        }
    );
}