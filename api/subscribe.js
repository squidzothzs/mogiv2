export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { email } = req.body || {};

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Invalid email' });
    }

    const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.error('Missing Supabase env vars');
        return res.status(500).json({ error: 'Server misconfigured' });
    }

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/waitlist`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal',
            },
            body: JSON.stringify({
                email: email.toLowerCase().trim(),
                created_at: new Date().toISOString(),
            }),
        });

        if (response.status === 409) {
            // Duplicate email — treat as success
            return res.status(200).json({ success: true });
        }

        if (!response.ok) {
            const err = await response.text();
            console.error('Supabase error:', err);
            return res.status(500).json({ error: 'Failed to save' });
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('Fetch error:', err);
        return res.status(500).json({ error: 'Network error' });
    }
}
