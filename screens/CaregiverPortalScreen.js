// screens/CaregiverPortalScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
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
} from 'firebase/firestore';
import * as Notifications from 'expo-notifications';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';

export default function CaregiverPortalScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    Notifications.requestPermissionsAsync().catch(() => {});

    const q = query(
      collection(firestore, 'users', user.uid, 'events'),
      orderBy('timestamp', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      snap.docChanges().forEach(async (change) => {
        const data = change.doc.data();
        if (
          change.type === 'added' &&
          data.type === 'Missed' &&
          !data.notified
        ) {
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
      });
      setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [user]);

  const acknowledge = async (id) => {
    try {
      await updateDoc(doc(firestore, 'users', user.uid, 'events', id), {
        acknowledged: true,
      });
    } catch {
      Alert.alert('Error', 'Could not acknowledge.');
    }
  };

  const sendEmergencyEmail = (type) => {
    const messages = {
      Fall: 'Patient has experienced a fall.',
      'Breathing Issue': 'Patient is having difficulty breathing.',
      Unresponsive: 'Patient is unresponsive.',
      'Severe Pain': 'Patient reports severe pain.',
      Seizure: 'Patient has had a seizure.',
      Stroke: 'Possible stroke symptoms observed.',
      HeartAttack: 'Possible heart attack symptoms.',
    };
    const subject = encodeURIComponent(`Emergency Alert: ${type}`);
    const body = encodeURIComponent(messages[type] || 'Please check on the patient.');
    const mailto = `mailto:support@medico.app?subject=${subject}&body=${body}`;
    Linking.openURL(mailto);
  };

  const sendViaWhatsApp = () => {
    const message = encodeURIComponent('Emergency! Please respond immediately.');
    const phone = '+16162407246';
    const url = `whatsapp://send?text=${message}&phone=${phone}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'WhatsApp is not installed.');
    });
  };

  const sendViaSMS = () => {
    const phone = '16162407246';
    const message = encodeURIComponent('Emergency! Please respond immediately.');
    const separator = Platform.OS === 'ios' ? '&' : '?';
    const smsUrl = `sms:${phone}${separator}body=${message}`;
    Linking.openURL(smsUrl).catch(() => {
      Alert.alert('Error', 'Could not open SMS app.');
    });
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
          <Text style={styles.time}>{item.timestamp.toDate().toLocaleString()}</Text>
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

      <Text style={styles.subtitle}>Quick Emergency Actions</Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#007aff' }]} onPress={() => navigation.navigate('ChatCA')}>
          <Ionicons name="chatbubbles" size={24} color="#fff" />
          <Text style={styles.btnText}>Caregiver Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#f44336' }]} onPress={() => sendEmergencyEmail('Fall')}>
          <MaterialIcons name="local-hospital" size={24} color="#fff" />
          <Text style={styles.btnText}>Fall</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#ff9800' }]} onPress={() => sendEmergencyEmail('Breathing Issue')}>
          <Ionicons name="medkit" size={24} color="#fff" />
          <Text style={styles.btnText}>Breathing</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#9c27b0' }]} onPress={() => sendEmergencyEmail('Seizure')}>
          <Ionicons name="flash" size={24} color="#fff" />
          <Text style={styles.btnText}>Seizure</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#d32f2f' }]} onPress={() => sendEmergencyEmail('HeartAttack')}>
          <Ionicons name="heart" size={24} color="#fff" />
          <Text style={styles.btnText}>Heart Attack</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#388e3c' }]} onPress={() => sendEmergencyEmail('Stroke')}>
          <MaterialIcons name="sick" size={24} color="#fff" />
          <Text style={styles.btnText}>Stroke</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#25D366' }]} onPress={sendViaWhatsApp}>
          <FontAwesome name="whatsapp" size={24} color="#fff" />
          <Text style={styles.btnText}>WhatsApp</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#2196f3' }]} onPress={sendViaSMS}>
          <Ionicons name="chatbox-ellipses" size={24} color="#fff" />
          <Text style={styles.btnText}>SMS</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={events}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}></Text>}
      />

      <View style={styles.emergencyWrapper}>
        <Text style={styles.emergencyText}>Click for emergencies only</Text>
        <TouchableOpacity
          style={styles.emergency}
          onPress={() => Linking.openURL('tel:16162407246')}
        >
          <Ionicons name="call" size={30} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa', padding: 16 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
    color: '#555',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 2,
  },
  acknowledged: { opacity: 0.5 },
  textContainer: { flex: 1, marginHorizontal: 10 },
  text: { fontSize: 16 },
  time: { fontSize: 12, color: '#666', marginTop: 4 },
  ackButton: { color: '#007AFF', fontWeight: '600' },
  empty: { textAlign: 'center', color: '#666', marginTop: 24 },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginVertical: 6,
    width: '48%',
    justifyContent: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  emergencyWrapper: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 12,
  },
  emergencyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#c00',
    marginBottom: 6,
  },
  emergency: {
    backgroundColor: '#f44336',
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: Platform.OS === 'android' ? 4 : 0,
  },
});