const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // 1. Handle pre-flight browser checks (CORS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { items } = req.body;
    
    // 3. Calculation Logic
    const subtotal = items.reduce((sum, item) => sum + item.price, 0);
    // Stripe fee: (Subtotal + 30p) / (1 - 2.9%)
    const totalInPence = Math.round(((subtotal + 0.30) / (1 - 0.029)) * 100);

    // 4. Create Stripe Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'], // Apple/Google Pay shows up automatically if set in Stripe Dashboard
      line_items: [{
        price_data: {
          currency: 'gbp',
          product_data: { 
            name: 'ChipsAnd Order',
            description: items.map(i => i.name).join(', ')
          },
          unit_amount: totalInPence,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${req.headers.origin}/index.html?status=success`,
      cancel_url: `${req.headers.origin}/menu.html`,
    });

    // 5. Send back the ID
    return res.status(200).json({ id: session.id });

  } catch (err) {
    console.error("STRIPE ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
};
