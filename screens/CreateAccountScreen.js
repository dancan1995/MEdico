// screens/CreateAccountScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, firestore } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function CreateAccountScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');           
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const checkEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const onDateChange = (event, date) => {
    setShowPicker(false);
    if (date) {
      setSelectedDate(date);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      setDob(`${y}-${m}-${d}`);
    }
  };

  const handleSignup = async () => {
    const e = email.trim().toLowerCase();
    if (!e || !dob || !password || !confirm) {
      return Alert.alert('Missing fields', 'Please fill out all fields.');
    }
    if (!checkEmail(e)) {
      return Alert.alert('Invalid email', 'Enter a valid email address.');
    }
    if (password !== confirm) {
      return Alert.alert('Password mismatch', 'Both passwords must match.');
    }
    if (!acceptedTerms) {
      return Alert.alert('Terms & Conditions', 'You must accept our Terms & Conditions to proceed.');
    }
    try {
      const { user } = await createUserWithEmailAndPassword(auth, e, password);
      await setDoc(doc(firestore, 'users', user.uid), {
        email: user.email,
        dateOfBirth: dob,
        createdAt: serverTimestamp(),
      });
      navigation.replace('ChatLogin', { fromSignup: true });
    } catch (err) {
      Alert.alert('Signup Error', err.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <Image source={require('../assets/images/logo.png')} style={styles.logo} />

      <Text style={styles.header}>Create Your Account</Text>

      <TextInput
        style={styles.input}
        placeholder="Email address"
        placeholderTextColor="#888"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TouchableOpacity
        style={styles.input}
        onPress={() => setShowPicker(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="calendar-outline" size={20} color="#555" style={{ marginRight: 8 }} />
        <Text style={[styles.dobText, !dob && { color: '#888' }]}>
          {dob || 'Date of Birth'}
        </Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'android' ? 'calendar' : 'spinner'}
          maximumDate={new Date()}
          onChange={onDateChange}
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#888"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        placeholderTextColor="#888"
        secureTextEntry
        value={confirm}
        onChangeText={setConfirm}
      />

      {/* Terms & Conditions acceptance */}
      <TouchableOpacity
        style={styles.termsRow}
        onPress={() => setAcceptedTerms(prev => !prev)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={acceptedTerms ? 'checkbox' : 'checkbox-outline'}
          size={20}
          color={acceptedTerms ? '#007AFF' : '#555'}
          style={{ marginRight: 8 }}
        />
        <Text style={styles.termsText}>
          I agree to the{' '}
          <Text
            style={styles.link}
            onPress={() => navigation.navigate('Terms')}
          >
            Terms & Conditions
          </Text>
        </Text>
      </TouchableOpacity>

      {/* Sign Up button */}
      <TouchableOpacity
        style={[styles.button, !acceptedTerms && styles.buttonDisabled]}
        onPress={handleSignup}
        disabled={!acceptedTerms}
      >
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'stretch',
  },
  logo: {
    width: 80,
    height: 80,
    alignSelf: 'center',
    marginBottom: 16,
    resizeMode: 'contain',
  },
  header: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
    color: '#333',
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  dobText: {
    fontSize: 16,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  termsText: {
    fontSize: 14,
    color: '#333',
    flexWrap: 'wrap',
    flex: 1,
  },
  link: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#aacfff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
