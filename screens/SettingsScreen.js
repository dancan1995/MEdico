import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

export default function SettingsScreen({ navigation }) {
  // Send password reset link
  const handleResetPassword = () => {
    const email = auth.currentUser?.email;
    if (!email) return Alert.alert('Error', 'No email found.');
    sendPasswordResetEmail(auth, email)
      .then(() => Alert.alert('Email Sent', `Password reset link sent to ${email}`))
      .catch(err => Alert.alert('Error', err.message));
  };

  // Logout and reset navigation
  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'ChatLogin' }],
      });
    } catch (err) {
      Alert.alert('Logout failed', err.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Settings</Text>

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

      {/* About App */}
      <TouchableOpacity
        style={styles.fullRow}
        onPress={() =>
          Alert.alert('About MEdico', 'Version 1.0.0\n© 2025 MEdico Inc.')
        }
      >
        <Text style={styles.fullLabel}>About App</Text>
      </TouchableOpacity>

      {/* Educational Resources */}
      <Text style={styles.sectionHeader}>Spinal Injury Resources</Text>

      <TouchableOpacity
        style={styles.resourceRow}
        onPress={() => Linking.openURL('https://www.christopherreeve.org/living-with-paralysis/health/spinal-cord-injury')}
      >
        <Text style={styles.resourceText}>Understanding Spinal Cord Injury</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.resourceRow}
        onPress={() => Linking.openURL('https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9090985/')}
      >
        <Text style={styles.resourceText}>Research Articles on SCI Recovery</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.resourceRow}
        onPress={() => Linking.openURL('https://www.spinalcord.com/blog')}
      >
        <Text style={styles.resourceText}>SCI Blog: News & Advice</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.resourceRow}
        onPress={() => Linking.openURL('https://www.spinalinjury101.org/')}
      >
        <Text style={styles.resourceText}>SpinalInjury101.org</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.resourceRow}
        onPress={() => Linking.openURL('https://unitedspinal.org/')}
      >
        <Text style={styles.resourceText}>United Spinal Association</Text>
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
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 32,
    marginBottom: 16,
    color: '#444',
  },
  resourceRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#EEE',
  },
  resourceText: {
    fontSize: 15,
    color: '#007AFF',
  },
  logoutBtn: {
    marginTop: 32,
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
