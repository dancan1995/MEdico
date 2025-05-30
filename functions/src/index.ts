// functions/src/index.ts
import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import twilio from 'twilio';

admin.initializeApp();
const db = admin.firestore();

// Twilio creds come from:  firebase functions:config:set twilio.sid=… token=… number=…
const tw = twilio(
  functions.config().twilio.sid,
  functions.config().twilio.token
);
const FROM_NUMBER = functions.config().twilio.number; // "+19788008478"

/* ───── Patient ➜ SMS ───────────────────────────────────────────── */
export const relayToCaregiver = functions.firestore
  .document('users/{uid}/caregiverChats/{phone}/messages/{msgId}')
  .onCreate(async (snap, ctx) => {
    const d = snap.data();
    if (d.from !== 'patient') return;           // ignore caregiver→patient
    await tw.messages.create({
      body: d.text,
      from: FROM_NUMBER,
      to: ctx.params.phone,                    // {phone} is already E.164
    });
  });

/* ───── SMS ➜ Firestore (Twilio webhook) ───────────────────────── */
export const incomingSms = functions.https.onRequest(async (req, res) => {
  const from = req.body.From as string;              // "+1…"
  const body = (req.body.Body as string).trim();

  // find the patient that has caregiverPhone == from
  const p = await db
    .collectionGroup('profile')
    .where('caregiverPhone', '==', from)
    .limit(1)
    .get();

  if (p.empty) {
    res.status(404).send('patient not found');
    return;
  }

  const patientUid = p.docs[0].ref.parent.parent!.id;

  await db
    .collection('users')
    .doc(patientUid)
    .collection('caregiverChats')
    .doc(from)
    .collection('messages')
    .add({
      from: 'caregiver',
      text: body,
      ts: admin.firestore.FieldValue.serverTimestamp(),
    });

  res.set('Content-Type', 'text/xml').send('<Response></Response>');
});
