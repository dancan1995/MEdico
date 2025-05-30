// utils/patientDataStore.js
import * as FileSystem from 'expo-file-system';
import { auth } from '../firebase';

const filePathForUser = (uid) =>
  FileSystem.documentDirectory + `patient-${uid}.json`;

const loadRaw = async (uid) => {
  const path = filePathForUser(uid);
  try {
    const str = await FileSystem.readAsStringAsync(path);
    return str ? JSON.parse(str) : {};
  } catch {
    return {};
  }
};

const flushRaw = async (uid, obj) => {
  const path = filePathForUser(uid);
  await FileSystem.writeAsStringAsync(path, JSON.stringify(obj, null, 2));
};

export const readData = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in.');
  return loadRaw(user.uid);
};

export const saveEntry = async (bucket, entryObj) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in.');

  const uid = user.uid;
  const data = await loadRaw(uid);

  if (!Array.isArray(data[bucket])) data[bucket] = [];
  data[bucket].push({
    createdAt: Date.now(),
    ...entryObj,
  });

  await flushRaw(uid, data);
};
