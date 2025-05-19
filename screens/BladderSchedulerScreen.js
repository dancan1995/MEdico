// screens/BladderSchedulerScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, Alert, Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

import { auth, firestore } from '../firebase';
import {
  collection, query, orderBy, onSnapshot,
  addDoc, serverTimestamp, doc, updateDoc,
  deleteDoc
} from 'firebase/firestore';

// Make sure notifications show in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function BladderSchedulerScreen() {
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [entries, setEntries] = useState([]);
  const user = auth.currentUser;

  // 1) Permissions + Android channel setup
  useEffect(() => {
    (async () => {
      if (Constants.isDevice) {
        const { status: existing } = await Notifications.getPermissionsAsync();
        let finalStatus = existing;
        if (existing !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          Alert.alert(
            'Permission required',
            'You must enable notifications to get bladder reminders.'
          );
        }
      }
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('bladder-reminders', {
          name: 'Bladder Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
          vibrationPattern: [0, 250, 250, 250],
        });
      }
    })();
  }, []);

  // 2) Firestore subscription
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(firestore, 'users', user.uid, 'bladderEntries'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => {
      console.error(err);
      Alert.alert('Error', 'Could not load schedule.');
    });
    return unsub;
  }, [user]);

  const formatTime = date =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const showTimepicker = () => setShowPicker(true);

  const onTimeChange = (event, date) => {
    setShowPicker(false);
    if (date) setSelectedTime(date);
  };

  // 3) Schedule local notification and save its ID
  async function scheduleNotification(timeString) {
    // parse back into hours/minutes
    const [hm, period] = timeString.split(' ');
    let [hour, minute] = hm.split(':').map(Number);
    if (period === 'PM' && hour < 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;

    // schedule daily repeating
    const trigger = { hour, minute, repeats: true };
    return Notifications.scheduleNotificationAsync({
      content: {
        title: "Bladder Reminder",
        body: `It's ${timeString}: time for your bladder routine.`,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger,
      channelId: 'bladder-reminders',
    });
  }

  const addEntry = async () => {
    const time = formatTime(selectedTime);
    if (!user) {
      setEntries(prev => [{ id: Date.now().toString(), time, completed:false }, ...prev]);
      return;
    }
    try {
      const notifId = await scheduleNotification(time);
      await addDoc(
        collection(firestore, 'users', user.uid, 'bladderEntries'),
        { time, completed: false, createdAt: serverTimestamp(), notifId }
      );
    } catch (err) {
      console.error(err);
      Alert.alert('Error adding entry', err.message);
    }
  };

  const toggleCompleted = async item => {
    if (!user) {
      setEntries(prev =>
        prev.map(e => e.id === item.id ? { ...e, completed: !e.completed } : e)
      );
      return;
    }
    try {
      await updateDoc(
        doc(firestore, 'users', user.uid, 'bladderEntries', item.id),
        { completed: !item.completed }
      );
    } catch {
      Alert.alert('Error updating entry');
    }
  };

  const deleteEntry = async item => {
    if (!user) {
      setEntries(prev => prev.filter(e => e.id !== item.id));
      return;
    }
    Alert.alert('Delete this entry?', item.time, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            if (item.notifId) {
              await Notifications.cancelScheduledNotificationAsync(item.notifId);
            }
            await deleteDoc(
              doc(firestore, 'users', user.uid, 'bladderEntries', item.id)
            );
          } catch {
            Alert.alert('Error deleting entry');
          }
        }
      }
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.entryRow}>
      <TouchableOpacity onPress={() => toggleCompleted(item)}>
        <Ionicons
          name={item.completed ? 'checkbox' : 'square-outline'}
          size={24}
          color={item.completed ? '#4caf50' : '#888'}
        />
      </TouchableOpacity>
      <Text style={[styles.entryText, item.completed && styles.completedText]}>
        {item.time}
      </Text>
      <TouchableOpacity onPress={() => deleteEntry(item)}>
        <Ionicons name="trash-outline" size={24} color="#f44336" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select Time:</Text>
      <TouchableOpacity style={styles.timeDisplay} onPress={showTimepicker}>
        <Text style={styles.timeText}>{formatTime(selectedTime)}</Text>
        <Ionicons name="time-outline" size={24} color="#007AFF" />
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          is24Hour={false}
          display="spinner"
          onChange={onTimeChange}
          textColor="#000"
          style={styles.picker}
        />
      )}

      <TouchableOpacity style={styles.addButton} onPress={addEntry}>
        <Ionicons name="add-circle" size={48} color="#007AFF" />
      </TouchableOpacity>

      <Text style={styles.subheader}>Today's Schedule</Text>
      <FlatList
        data={entries}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>No entries yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  label: { fontSize: 16, marginBottom: 8 },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 4,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  timeText: { fontSize: 18, color: '#000' },
  picker: { height: 150, marginBottom: 16 },
  addButton: { alignSelf: 'center', marginBottom: 24 },
  subheader: { fontSize: 18, fontWeight: '500', marginBottom: 8 },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#EEE',
  },
  entryText: { flex: 1, marginHorizontal: 12, fontSize: 16 },
  completedText: { textDecorationLine: 'line-through', color: '#888' },
  empty: { textAlign: 'center', color: '#666', marginTop: 16 },
});
