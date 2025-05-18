// firebase.js
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/functions';

// — your Firebase config —
const firebaseConfig = {
  apiKey: 'AIzaSy…',
  authDomain: 'medico-57cc8.firebaseapp.com',
  projectId: 'medico-57cc8',
  storageBucket: 'medico-57cc8.appspot.com',
  messagingSenderId: '735788395976',
  appId: '1:735788395976:web:ad74fcca4be5c4ad96e4fd',
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const auth      = firebase.auth();
export const firestore = firebase.firestore();
export const functions = firebase.app().functions('us-central1');

// In dev, point functions at your emulator:
if (__DEV__) {
  functions.useEmulator('localhost', 5001);
}

// Wrap your callable:
export const summarizeProgress = (data) =>
  functions.httpsCallable('summarizeProgress')(data);

export default firebase;
