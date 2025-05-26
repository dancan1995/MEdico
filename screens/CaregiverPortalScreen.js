// screens/CaregiverPortalScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Button,
  Linking,
  Platform,
} from 'react-native';
import { auth, firestore } from '../firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  getDocs,
} from 'firebase/firestore';
import * as Notifications from 'expo-notifications';
import * as FileSystem from 'expo-file-system';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Ionicons } from '@expo/vector-icons';

export default function CaregiverPortalScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    // Request permissions once
    Notifications.requestPermissionsAsync().catch(()=>{});

    const q = query(
      collection(firestore, 'users', user.uid, 'events'),
      orderBy('timestamp', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      snap.docChanges().forEach(async change => {
        const data = change.doc.data();
        if (
          change.type === 'added' &&
          data.type === 'Missed' &&
          !data.notified
        ) {
          // only schedule if API is available
          if (Notifications.scheduleNotificationAsync) {
            try {
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: 'Missed Pressure Relief',
                  body: data.text,
                },
                trigger: null,
              });
              await updateDoc(
                doc(firestore, 'users', user.uid, 'events', change.doc.id),
                { notified: true }
              );
            } catch (e) {
              console.warn('Notification error:', e);
            }
          }
        }
      });
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [user]);

  const acknowledge = async id => {
    try {
      await updateDoc(
        doc(firestore, 'users', user.uid, 'events', id),
        { acknowledged: true }
      );
    } catch {
      Alert.alert('Error', 'Could not acknowledge.');
    }
  };

  const exportPdf = async () => {
    try {
      const snap = await getDocs(
        collection(firestore, 'users', user.uid, 'events')
      );
      const list = snap.docs.map(d => d.data());

      const pdf = await PDFDocument.create();
      const page = pdf.addPage([600, 800]);
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      let y = page.getHeight() - 40;

      page.drawText('Caregiver Summary', {
        x: 40, y, font, size: 24, color: rgb(0, 0, 0),
      });
      y -= 32;

      for (let evt of list) {
        const time = evt.timestamp
          ? evt.timestamp.toDate().toLocaleString()
          : '';
        const line = `• [${evt.type}] ${evt.text} @ ${time}`;
        page.drawText(line, {
          x: 40, y, font, size: 12, color: rgb(0.1, 0.1, 0.1),
        });
        y -= 18;
        if (y < 40) {
          y = page.getHeight() - 40;
          pdf.addPage([600, 800]);
        }
      }

      const pdfBytes = await pdf.save();
      const path = `${FileSystem.documentDirectory}caregiver_summary.pdf`;

      await FileSystem.writeAsStringAsync(path, pdfBytes, {
        encoding: FileSystem.EncodingType.Base64,
      });

      Alert.alert('PDF exported', `Saved to ${path}`);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not export PDF.');
    }
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, item.acknowledged && styles.acknowledged]}>
      <Ionicons
        name={item.type === 'Missed' ? 'alert-circle' : 'checkmark-circle'}
        size={24}
        color={item.type === 'Missed' ? '#f44336' : '#4caf50'}
      />
      <View style={styles.textContainer}>
        <Text style={styles.text}>{item.text}</Text>
        {item.timestamp?.toDate && (
          <Text style={styles.time}>
            {item.timestamp.toDate().toLocaleString()}
          </Text>
        )}
      </View>
      {!item.acknowledged && (
        <TouchableOpacity onPress={() => acknowledge(item.id)}>
          <Text style={styles.ackButton}>Ack</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Caregiver Updates</Text>

      <View style={styles.buttonRow}>
        <Button
          title="Chat"
          onPress={() => navigation.navigate('ChatCA')}
        />
        <Button title="Export PDF" onPress={exportPdf} />
      </View>

      <FlatList
        data={events}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.empty}>No updates yet.</Text>
        }
      />

      <TouchableOpacity
        style={styles.emergency}
        onPress={() => Linking.openURL('tel:16162407246')}
      >
        <Ionicons name="call" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa', padding: 16 },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 12, textAlign: 'center' },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    elevation: 1,
  },
  acknowledged: { opacity: 0.5 },
  textContainer: { flex: 1, marginHorizontal: 8 },
  text: { fontSize: 16 },
  time: { fontSize: 12, color: '#666', marginTop: 4 },
  ackButton: { color: '#007AFF', fontWeight: '600' },
  empty: { textAlign: 'center', color: '#666', marginTop: 24 },
  emergency: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    backgroundColor: '#f44336',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: Platform.OS === 'android' ? 4 : 0,
  },
});
