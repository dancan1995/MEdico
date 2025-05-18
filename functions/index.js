const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Configuration, OpenAIApi } = require('openai');

admin.initializeApp();

const config = new Configuration({ apiKey: functions.config().openai.key });
const openai = new OpenAIApi(config);

exports.summarizeProgress = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated');
  const uid = context.auth.uid;

  // Fetch goals
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
