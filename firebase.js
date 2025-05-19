// firebase.js
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/functions';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDxVBdgLuir-lYSXyY3THJfs4YSNFct_uc",
  authDomain: "medico-57cc8.firebaseapp.com",
  projectId: "medico-57cc8",
  storageBucket: "medico-57cc8.firebasestorage.app",
  messagingSenderId: "735788395976",
  appId: "1:735788395976:web:ad74fcca4be5c4ad96e4fd",
  measurementId: "G-CP77TCL8QY"
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
