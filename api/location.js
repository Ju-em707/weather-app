import { geolocation, ipAddress } from '@vercel/functions';

export const config = {
    runtime: 'edge',
};

export default function handler(request) {
    let details = geolocation(request);
    const ip = ipAddress(request);

    if (!details.city) {
        details = {
            city: "New York",
            country: "United States",
            latitude: 40.71278,
            longitude: -74.00594
        };
    }

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