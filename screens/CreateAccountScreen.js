// screens/CreateAccountScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, firestore } from '../firebase';

export default function CreateAccountScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');       // "YYYY-MM-DD"
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const checkEmail = (e) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(e);
  };

  const handleSignup = async () => {
    const e = email.trim().toLowerCase();
    if (!e || !dob || !password || !confirm) {
      return Alert.alert('Missing fields', 'Please fill out all fields.');
    }
    if (!checkEmail(e)) {
      return Alert.alert('Invalid email', 'Please enter a valid email address.');
    }
    if (password !== confirm) {
      return Alert.alert('Password mismatch', 'Both passwords must match.');
    }
    try {
      const { user } = await createUserWithEmailAndPassword(auth, e, password);
      await setDoc(doc(firestore, 'users', user.uid), {
        email: user.email,
        dateOfBirth: dob,
        createdAt: serverTimestamp(),
      });
      navigation.replace('Subscription');
    } catch (err) {
      Alert.alert('Signup Error', err.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
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

      <TextInput
        style={styles.input}
        placeholder="Date of Birth (YYYY-MM-DD)"
        placeholderTextColor="#888"
        value={dob}
        onChangeText={setDob}
      />

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

      <TouchableOpacity style={styles.button} onPress={handleSignup}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
    color: '#333',
  },
  input: {
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
