const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { items } = req.body;
    const subtotal = items.reduce((sum, item) => sum + item.price, 0);
    const totalInPence = Math.round(((subtotal + 0.30) / (1 - 0.029)) * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
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
      success_url: `${req.headers.origin}/success.html?status=success`, // FIXED URL
      cancel_url: `${req.headers.origin}/menu.html`,
    });

    return res.status(200).json({ id: session.id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
