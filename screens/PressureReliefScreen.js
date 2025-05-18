// screens/PressureReliefScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Vibration,
  Alert,
} from 'react-native';

export default function PressureReliefScreen() {
  const [intervalMins, setIntervalMins] = useState('30');
  const timerRef = useRef(null);

  const startTimer = () => {
    const mins = parseInt(intervalMins, 10);
    if (!mins || mins <= 0) {
      return Alert.alert('Invalid interval', 'Enter a positive number');
    }
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      Vibration.vibrate(1000);
      Alert.alert('Reminder', `Time to shift weight! (${mins} min)`);
    }, mins * 60 * 1000);

    Alert.alert('Started', `Every ${mins} minutes`);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      Alert.alert('Stopped');
    }
  };

  useEffect(() => {
    return () => stopTimer();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Interval (minutes)</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={intervalMins}
        onChangeText={setIntervalMins}
      />

      <View style={styles.buttons}>
        <Button title="Start" onPress={startTimer} />
        <Button title="Stop" color="red" onPress={stopTimer} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  label: { fontSize: 16, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    marginBottom: 16,
  },
  buttons: { flexDirection: 'row', justifyContent: 'space-between' },
});
