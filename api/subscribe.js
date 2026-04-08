export default async function handler(req, res) {
    // CORS — same origin only in production
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { email } = req.body || {};

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Invalid email' });
    }

    const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME } = process.env;

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_NAME) {
        console.error('Missing Airtable env vars');
        return res.status(500).json({ error: 'Server misconfigured' });
    }

    try {
        const response = await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fields: {
                        Email: email.toLowerCase().trim(),
                        'Signed Up': new Date().toISOString(),
                    },
                }),
            }
        );

        if (!response.ok) {
            const err = await response.text();
            console.error('Airtable error:', err);
            return res.status(500).json({ error: 'Failed to save' });
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('Fetch error:', err);
        return res.status(500).json({ error: 'Network error' });
    }
}
