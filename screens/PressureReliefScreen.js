// screens/PressureReliefScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

import { auth, firestore } from '../firebase';
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';

// Use modern flags for the notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function PressureReliefScreen() {
  const [intervalMins, setIntervalMins] = useState('30');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [running, setRunning] = useState(false);

  const timerRef = useRef(null);
  const notificationIdRef = useRef(null);
  const user = auth.currentUser;

  // 1️⃣ On mount: permissions, channel, AND load Firestore state
  useEffect(() => {
    (async () => {
      // Permissions & channel (same as before)…
      if (Constants.isDevice) {
        let { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          ({ status } = await Notifications.requestPermissionsAsync());
        }
        if (status !== 'granted') {
          Alert.alert(
            'Notifications required',
            'Enable notifications to get reminders.'
          );
        }
      }
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('pressure-reliefs', {
          name: 'Pressure Relief',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
          vibrationPattern: [0, 250, 250, 250],
        });
      }

      // 🔄 Load persisted timer state
      if (user) {
        const ref = doc(
          firestore,
          'users',
          user.uid,
          'settings',
          'pressureTimer'
        );
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          const { intervalMins: mins, startedAt, isRunning } = data;
          if (isRunning && mins && startedAt) {
            // compute elapsed seconds
            const elapsed = (Date.now() - startedAt.toMillis()) / 1000;
            const total = mins * 60;
            const remaining = total - (elapsed % total);
            setSecondsLeft(Math.floor(remaining));
            startCountdownLoop(Math.floor(remaining), mins);
          }
        }
      }
    })();

    // cleanup only timers, NOT notifications or Firestore state
    return () => {
      clearInterval(timerRef.current);
    };
  }, []);

  // format MM:SS
  const formatCountdown = secs => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // reusable loop starter
  const startCountdownLoop = (initialSecs, mins) => {
    setRunning(true);
    setSecondsLeft(initialSecs);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          Vibration.vibrate(1000);
          Alert.alert('Reminder', 'Time to shift your weight!');
          return mins * 60;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const scheduleNotification = async mins => {
    const trigger = { seconds: mins * 60, repeats: true, channelId: 'pressure-reliefs' };
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Pressure Relief Reminder',
        body: 'Time to shift your weight!',
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger,
    });
    return id;
  };

  // 2️⃣ Start: write to Firestore and kick off countdown + notification
  const startTimer = async () => {
    const mins = parseInt(intervalMins, 10);
    if (!mins || mins <= 0) {
      return Alert.alert('Invalid interval', 'Enter a positive number.');
    }

    // stop existing
    clearInterval(timerRef.current);
    if (notificationIdRef.current) {
      await Notifications.cancelScheduledNotificationAsync(
        notificationIdRef.current
      );
    }

    // persist settings
    if (user) {
      await setDoc(
        doc(firestore, 'users', user.uid, 'settings', 'pressureTimer'),
        {
          intervalMins: mins,
          startedAt: serverTimestamp(),
          isRunning: true,
        }
      );
    }

    // in-app countdown & notif
    startCountdownLoop(mins * 60, mins);
    notificationIdRef.current = await scheduleNotification(mins);

    Alert.alert('Started', `Every ${mins} minutes`);
  };

  // 3️⃣ Stop: clear interval, cancel notification, update Firestore
  const stopTimer = async () => {
    clearInterval(timerRef.current);
    setRunning(false);
    setSecondsLeft(0);
    if (notificationIdRef.current) {
      await Notifications.cancelScheduledNotificationAsync(
        notificationIdRef.current
      );
      notificationIdRef.current = null;
    }
    if (user) {
      await setDoc(
        doc(firestore, 'users', user.uid, 'settings', 'pressureTimer'),
        { isRunning: false },
        { merge: true }
      );
    }
    Alert.alert('Stopped', 'Reminders canceled');
  };

  return (
    <View style={styles.container}>
      <Ionicons
        name="hourglass-outline"
        size={48}
        color="#007AFF"
        style={styles.icon}
      />
      <Text style={styles.countdown}>
        {running ? formatCountdown(secondsLeft) : '00:00'}
      </Text>

      <Text style={styles.label}>Interval (minutes)</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={intervalMins}
        onChangeText={setIntervalMins}
      />

      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.button, running && styles.disabled]}
          onPress={startTimer}
          disabled={running}
        >
          <Text style={styles.buttonText}>Start</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            styles.stopButton,
            !running && styles.disabled,
          ]}
          onPress={stopTimer}
          disabled={!running}
        >
          <Text style={styles.buttonText}>Stop</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  icon: { marginBottom: 12 },
  countdown: {
    fontSize: 36,
    fontWeight: '600',
    color: '#000',
    marginBottom: 24,
  },
  label: { fontSize: 16, marginBottom: 8 },
  input: {
    width: 80,
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 4,
    padding: 8,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttons: {
    flexDirection: 'row',
    width: '60%',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  stopButton: { backgroundColor: '#f44336' },
  disabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
