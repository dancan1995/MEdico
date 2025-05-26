// functions/index.js

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Configuration, OpenAIApi } = require('openai');
const stripeLib = require('stripe');
const sgMail = require('@sendgrid/mail');

admin.initializeApp();

// ────── SendGrid setup ──────
// Set via: npx firebase functions:config:set sendgrid.key="SG.YOUR_KEY"
sgMail.setApiKey(functions.config().sendgrid.key);

// ────── OpenAI setup ──────
// Set via: npx firebase functions:config:set openai.key="YOUR_OPENAI_KEY"
const openai = new OpenAIApi(
  new Configuration({ apiKey: functions.config().openai.key })
);

// ────── Stripe setup ──────
// Set via: npx firebase functions:config:set stripe.secret="sk_live_…"
const stripe = stripeLib(functions.config().stripe.secret);

// ────── 1) Summarize Progress ──────
exports.summarizeProgress = functions
  .runWith({ memory: '256MB', timeoutSeconds: 60 })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be signed in to generate a summary.'
      );
    }
    const uid = context.auth.uid;
    const db = admin.firestore();

    try {
      // Fetch recent entries
      const [goalsSnap, bladderSnap, painSnap, mentalSnap] = await Promise.all([
        db.collection('users').doc(uid).collection('goals')
          .orderBy('createdAt','desc').limit(10).get(),
        db.collection('users').doc(uid).collection('bladderEntries')
          .orderBy('createdAt','desc').limit(10).get(),
        db.collection('users').doc(uid).collection('painLogs')
          .orderBy('createdAt','desc').limit(10).get(),
        db.collection('users').doc(uid).collection('mentalHealth')
          .orderBy('createdAt','desc').limit(10).get(),
      ]);

      // Serialize
      const goals = goalsSnap.docs.map(d => d.data().text).join('\n- ') || 'None';
      const bladder = bladderSnap.docs.map(d => d.data().time).join(', ') || 'None';
      const pain = painSnap.docs
        .map(d => `${d.data().type} at ${d.data().location} (rating ${d.data().rating})`)
        .join('; ') || 'None';
      const mental = mentalSnap.docs
        .map(d => `Mood ${d.data().mood}/10: "${d.data().journal}"`)
        .join('; ') || 'None';

      // Build prompt
      const prompt = `
You are a compassionate spinal cord injury recovery coach. Based on the user's recent data below:

Goals:
- ${goals}

Bladder entries: ${bladder}

Pain logs: ${pain}

Mental health entries: ${mental}

Please:
1. Summarize their overall progress and any trends (improving, stable, or needs attention).
2. Provide 3 actionable, empathetic recommendations for their next steps.
`;

      // Call OpenAI
      const aiResp = await openai.createCompletion({
        model: 'text-davinci-003',
        prompt,
        max_tokens: 400,
        temperature: 0.7,
      });

      const result = aiResp.data.choices?.[0]?.text?.trim();
      if (!result) throw new Error('OpenAI returned no content');

      return { result };
    } catch (err) {
      console.error('🛑 summarizeProgress error:', err);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to generate summary. ' + (err.message||'')
      );
    }
  });

// ────── 2) Stripe PaymentIntent ──────
exports.createPaymentIntent = functions.https.onRequest(async (req, res) => {
  try {
    const { plan, uid } = req.body;
    if (!plan || !uid) {
      return res.status(400).json({ error: 'Missing plan or uid' });
    }
    // Create or reuse customer
    const customer = await stripe.customers.create({
      metadata: { firebaseUID: uid },
    });
    const amount = plan === 'basic' ? 499 : 999;
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      customer: customer.id,
    });
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: '2022-11-15' }
    );
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

// ────── 3) Firestore → Send e-mail to caregiver ──────
const CAREGIVER_EMAIL = 'caregiver@example.com';
exports.notifyCaregiver = functions.firestore
  .document('users/{uid}/caregiverChats/{msgId}')
  .onCreate(async (snap, ctx) => {
    const msg = snap.data();
    if (msg.sender !== 'patient') return;  // only patient → caregiver
    const mail = {
      to: CAREGIVER_EMAIL,
      from: 'no-reply@medico.app',
      subject: `New message from patient ${ctx.params.uid}`,
      text: msg.text,
      headers: {
        'X-User-Id': ctx.params.uid,
        'X-Message-Id': ctx.params.msgId
      }
    };
    await sgMail.send(mail);
    console.log('Caregiver notified:', msg.text);
  });

// ────── 4) Inbound e-mail webhook → write back to Firestore ──────
exports.receiveCaregiverReply = functions.https.onRequest(async (req, res) => {
  try {
    const replyText = req.body.text || req.body.html || '';
    const uid = req.headers['x-user-id'];
    if (!uid) return res.status(400).send('Missing X-User-Id');
    const chatCol = admin.firestore()
      .collection('users').doc(uid)
      .collection('caregiverChats');
    await chatCol.add({
      text: replyText.trim(),
      sender: 'caregiver',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('Stored caregiver reply for user', uid);
    return res.status(200).send('OK');
  } catch (err) {
    console.error(err);
    return res.status(500).send('Error');
  }
});

exports.createBankPayment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be signed in to make a payment.'
    );
  }
  const uid = context.auth.uid;
  const {
    plan,
    name,
    cardNumber,
    expiry,
    cvc,
    receiptEmail,
  } = data;

  // Basic validation
  if (!plan || !name || !cardNumber || !expiry || !cvc || !receiptEmail) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing payment details.'
    );
  }

  // Record to Firestore under users/{uid}/payments
  await admin
    .firestore()
    .collection('users')
    .doc(uid)
    .collection('payments')
    .add({
      plan,
      name,
      cardNumber,
      expiry,
      cvc,
      receiptEmail,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

  // Return success
  return { status: 'success' };
});

// at the bottom of your existing functions/index.js…

// ────── 5) Score Chats with a Rubric ──────
exports.scoreChats = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be signed in to get a score.'
    );
  }
  // Expect: data.chats = [{ from: 'user'|'bot', text: string }, ...]
  const chats = data.chats;
  if (!Array.isArray(chats) || chats.length === 0) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'You must pass a non‐empty array of chat messages.'
    );
  }

  // Build the prompt
  let prompt = `You are a caring mental health coach.  
Based on the following conversation between a user and an AI assistant, please score the user's participation on a scale of 1–10 (10 best) for each of these criteria:
1. Clarity of expressing feelings  
2. Responsiveness to guidance  
3. Emotional insight  
4. Overall engagement  

Respond with JSON only, for example:
{"Clarity":8,"Responsiveness":7,"Insight":9,"Engagement":8}

Conversation:
`;
  chats.forEach(m => {
    const speaker = m.from === 'user' ? 'User' : 'AI';
    prompt += `${speaker}: ${m.text}\n`;
  });

  // Call OpenAI
  const aiResp = await openai.createCompletion({
    model: 'text-davinci-003',
    prompt,
    max_tokens: 150,
    temperature: 0.5,
  });

  const text = aiResp.data.choices[0].text.trim();
  let rubric;
  try {
    rubric = JSON.parse(text);
  } catch (e) {
    console.error('Failed to parse rubric JSON:', text);
    throw new functions.https.HttpsError(
      'internal',
      'Could not parse rubric from AI.'
    );
  }

  return { rubric };
});
