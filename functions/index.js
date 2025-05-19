// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Configuration, OpenAIApi } = require('openai');
const stripeLib = require('stripe');

admin.initializeApp();

// —––––––––––––––– OpenAI setup –––––––––––––––—
const openaiConfig = new Configuration({
  apiKey: functions.config().openai.key,
});
const openai = new OpenAIApi(openaiConfig);

exports.summarizeProgress = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be signed in');
  }
  const uid = context.auth.uid;
  const snap = await admin
    .firestore()
    .collection('users')
    .doc(uid)
    .collection('goals')
    .orderBy('createdAt', 'desc')
    .get();
  const goals = snap.docs.map(d => d.data().text).join('\n- ');
  const prompt = `
You are a rehabilitation assistant. The user’s current goals are:
- ${goals}

Please:
1. Summarize their overall progress.
2. Provide 3 actionable recommendations to improve their rehab.
  `;
  const resp = await openai.createCompletion({
    model: 'text-davinci-003',
    prompt,
    max_tokens: 300,
  });
  return { result: resp.data.choices[0].text.trim() };
});

// —––––––––––––––– Stripe setup –––––––––––––––—
// Make sure you’ve set your Stripe secret key via:
//   npx firebase functions:config:set stripe.secret="sk_live_…" 
const stripe = stripeLib(functions.config().stripe.secret);

/**
 * HTTP function to create a PaymentIntent + Ephemeral Key + Customer
 * Client will receive exactly:
 * {
 *   paymentIntent: "<client_secret>",
 *   ephemeralKey: "<ephemeral_key_secret>",
 *   customer: "<customer_id>"
 * }
 */
exports.createPaymentIntent = functions.https.onRequest(async (req, res) => {
  try {
    const { plan, uid } = req.body;
    if (!plan || !uid) {
      return res.status(400).json({ error: 'Missing plan or uid' });
    }

    // 1) Create (or retrieve) a Stripe Customer for this Firebase UID
    //    You might cache `customer.id` in Firestore under users/{uid}/stripeCustomer
    const customer = await stripe.customers.create({
      metadata: { firebaseUID: uid },
    });

    // 2) Determine amount in cents
    const amount = plan === 'basic' ? 499 : 999;

    // 3) Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      customer: customer.id,
    });

    // 4) Create an Ephemeral Key
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: '2022-11-15' }
    );

    // 5) Return exactly the JSON your mobile client expects
    res.json({
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
    });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: err.message });
  }
});
