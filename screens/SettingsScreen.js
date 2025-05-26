// screens/SettingsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, firestore } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';

export default function SettingsScreen({ navigation }) {
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [currentPlan, setCurrentPlan] = useState('—');
  const [notificationTone, setNotificationTone] = useState('Default');

  // load settings & subscription on mount
  useEffect(() => {
    (async () => {
      const re = await AsyncStorage.getItem('enableReminders');
      setRemindersEnabled(re !== 'false');

      const tone = await AsyncStorage.getItem('notificationTone');
      if (tone) setNotificationTone(tone);

      const uid = auth.currentUser?.uid;
      if (uid) {
        const snap = await getDoc(doc(firestore, 'users', uid));
        if (snap.exists()) {
          setCurrentPlan(snap.data().subscriptionPlan || 'Basic');
        }
      }
    })();
  }, []);

  // toggle reminders on/off
  const toggleReminders = async (value) => {
    setRemindersEnabled(value);
    await AsyncStorage.setItem('enableReminders', value.toString());
    Alert.alert('Reminders', value ? 'Enabled' : 'Disabled');
  };

  // choose notification tone
  const changeTone = () => {
    Alert.alert(
      'Select Notification Tone',
      null,
      [
        { text: 'Default', onPress: () => saveTone('Default') },
        { text: 'Chime', onPress: () => saveTone('Chime') },
        { text: 'Bell', onPress: () => saveTone('Bell') },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const saveTone = async (tone) => {
    setNotificationTone(tone);
    await AsyncStorage.setItem('notificationTone', tone);
    Alert.alert('Notification Tone', `Set to "${tone}"`);
  };

  // send password reset link
  const handleResetPassword = () => {
    const email = auth.currentUser?.email;
    if (!email) return Alert.alert('Error', 'No email found.');
    sendPasswordResetEmail(auth, email)
      .then(() => Alert.alert('Email Sent', `Password reset link sent to ${email}`))
      .catch(err => Alert.alert('Error', err.message));
  };

  // export user data (placeholder)
  const handleExportData = () => {
    Alert.alert('Export Data', 'Your data export will be emailed to you shortly.');
    // Implementation would call a Cloud Function to package & email.
  };

  // clear local app data
  const handleClearData = async () => {
    Alert.alert(
      'Clear all local data?',
      'This will reset your app preferences.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            setRemindersEnabled(true);
            setNotificationTone('Default');
            Alert.alert('Done', 'Local data cleared.');
          },
        },
      ]
    );
  };

  // logout
  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigation.replace('ChatLogin');
    } catch (err) {
      Alert.alert('Logout failed', err.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Settings</Text>

      {/* Reminders toggle */}
      <View style={styles.row}>
        <Text style={styles.label}>Bladder & Pressure Reminders</Text>
        <Switch
          value={remindersEnabled}
          onValueChange={toggleReminders}
        />
      </View>

      {/* Notification tone */}
      <TouchableOpacity style={styles.row} onPress={changeTone}>
        <Text style={styles.label}>Notification Tone</Text>
        <Text style={styles.value}>{notificationTone} ▸</Text>
      </TouchableOpacity>

      {/* Subscription plan */}
      <TouchableOpacity
        style={styles.row}
        onPress={() => navigation.navigate('Subscription')}
      >
        <Text style={styles.label}>Current Plan</Text>
        <Text style={styles.value}>{currentPlan} ▸</Text>
      </TouchableOpacity>

      {/* Reset password */}
      <View style={styles.row}>
        <Text style={styles.label}>Reset Password</Text>
        <TouchableOpacity onPress={handleResetPassword}>
          <Text style={styles.link}>Send Link</Text>
        </TouchableOpacity>
      </View>

      {/* Privacy Policy */}
      <View style={styles.row}>
        <Text style={styles.label}>Privacy Policy</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Terms')}>
          <Text style={styles.link}>View</Text>
        </TouchableOpacity>
      </View>

      {/* Contact Support */}
      <View style={styles.row}>
        <Text style={styles.label}>Contact Support</Text>
        <TouchableOpacity onPress={() => Linking.openURL('mailto:support@medico.app')}>
          <Text style={styles.link}>Email Us</Text>
        </TouchableOpacity>
      </View>

      {/* Export data */}
      <TouchableOpacity style={styles.fullRow} onPress={handleExportData}>
        <Text style={styles.fullLabel}>Export My Data</Text>
      </TouchableOpacity>

      {/* About */}
      <TouchableOpacity
        style={styles.fullRow}
        onPress={() => Alert.alert('About MEdico', 'Version 1.0.0\n© 2025 MEdico Inc.')}
      >
        <Text style={styles.fullLabel}>About App</Text>
      </TouchableOpacity>

      {/* Clear local storage */}
      <TouchableOpacity style={styles.clearBtn} onPress={handleClearData}>
        <Text style={styles.clearText}>Clear Local Data</Text>
      </TouchableOpacity>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#EEE',
  },
  label: {
    fontSize: 16,
    color: '#333',
  },
  value: {
    fontSize: 16,
    color: '#555',
  },
  link: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  fullRow: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#EEE',
  },
  fullLabel: {
    fontSize: 16,
    color: '#007AFF',
  },
  clearBtn: {
    marginTop: 32,
    backgroundColor: '#FFC107',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutBtn: {
    marginTop: 16,
    backgroundColor: '#f44336',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
