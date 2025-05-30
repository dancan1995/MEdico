"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.incomingSms = exports.relayToCaregiver = void 0;
// functions/src/index.ts
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const twilio_1 = __importDefault(require("twilio"));
admin.initializeApp();
const db = admin.firestore();
// Twilio creds come from:  firebase functions:config:set twilio.sid=… token=… number=…
const tw = (0, twilio_1.default)(functions.config().twilio.sid, functions.config().twilio.token);
const FROM_NUMBER = functions.config().twilio.number; // "+16162407246"
/* ───── Patient ➜ SMS ───────────────────────────────────────────── */
exports.relayToCaregiver = functions.firestore
    .document('users/{uid}/caregiverChats/{phone}/messages/{msgId}')
    .onCreate(async (snap, ctx) => {
    const d = snap.data();
    if (d.from !== 'patient')
        return; // ignore caregiver→patient
    await tw.messages.create({
        body: d.text,
        from: FROM_NUMBER,
        to: ctx.params.phone, // {phone} is already E.164
    });
});
/* ───── SMS ➜ Firestore (Twilio webhook) ───────────────────────── */
exports.incomingSms = functions.https.onRequest(async (req, res) => {
    const from = req.body.From; // "+1…"
    const body = req.body.Body.trim();
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
    const patientUid = p.docs[0].ref.parent.parent.id;
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
