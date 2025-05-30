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
  Keyboard,
  TouchableWithoutFeedback,
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

// Configure notification handler with new flags
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

  useEffect(() => {
    (async () => {
      // 1) Request permissions & create Android channel
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
        await Notifications.setNotificationChannelAsync(
          'pressure-reliefs',
          {
            name: 'Pressure Relief',
            importance: Notifications.AndroidImportance.HIGH,
            sound: 'default',
            vibrationPattern: [0, 250, 250, 250],
          }
        );
      }

      // 2) Load persisted timer state from Firestore
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
          const { intervalMins: mins, startedAt, isRunning } = snap.data();
          if (isRunning && mins && startedAt) {
            const elapsed = (Date.now() - startedAt.toMillis()) / 1000;
            const total = mins * 60;
            const remaining = total - (elapsed % total);
            startCountdownLoop(Math.floor(remaining), mins);
          }
        }
      }
    })();

    // cleanup timer only
    return () => clearInterval(timerRef.current);
  }, []);

  // Format seconds into MM:SS
  const formatCountdown = secs => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Start the in-app countdown loop
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

  // Schedule a repeating notification
  const scheduleNotification = async mins => {
    const trigger = {
      seconds: mins * 60,
      repeats: true,
      channelId: 'pressure-reliefs',
    };
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

  // Start button handler
  const startTimer = async () => {
    Keyboard.dismiss();
    const mins = parseInt(intervalMins, 10);
    if (!mins || mins <= 0) {
      return Alert.alert('Invalid interval', 'Enter a positive number.');
    }

    clearInterval(timerRef.current);
    if (notificationIdRef.current) {
      await Notifications.cancelScheduledNotificationAsync(
        notificationIdRef.current
      );
    }

    // Persist to Firestore
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

    startCountdownLoop(mins * 60, mins);
    notificationIdRef.current = await scheduleNotification(mins);
    Alert.alert('Started', `Every ${mins} minutes`);
  };

  // Stop button handler
  const stopTimer = async () => {
    Keyboard.dismiss();
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
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
    </TouchableWithoutFeedback>
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
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
