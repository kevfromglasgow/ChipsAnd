const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    // Only allow POST requests (sending data)
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { items } = req.body;

        // Calculate the subtotal from the items sent by the menu
        const subtotal = items.reduce((sum, item) => sum + item.price, 0);
        
        // Calculate total with Stripe fees (2.9% + 30p)
        // We multiply by 100 because Stripe calculates in Pence/Cents
        const totalInPence = Math.round(((subtotal + 0.30) / (1 - 0.029)) * 100);

        // Create a Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'apple_pay', 'google_pay'],
            line_items: [{
                price_data: {
                    currency: 'gbp',
                    product_data: {
                        name: 'Food Truck Order',
                        description: items.map(i => i.name).join(', '),
                    },
                    unit_amount: totalInPence,
                },
                quantity: 1,
            }],
            mode: 'payment',
            // After payment, Stripe sends them here:
            success_url: `${req.headers.origin}/index.html?status=success`, 
            cancel_url: `${req.headers.origin}/menu.html`,
        });

        // Send the Session ID back to the menu.html
        res.status(200).json({ id: session.id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
}
