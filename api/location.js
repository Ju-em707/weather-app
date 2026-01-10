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
            region: details.region,
            latitude: details.latitude,
            longitude: details.longitude,
            postalCode: details.postalCode
        }),
        {
            status: 200,
            headers: { 'content-type': 'application/json'},
        }
    );
}