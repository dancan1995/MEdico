// screens/ChatLoginScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

import { auth } from '../firebase';
import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';

WebBrowser.maybeCompleteAuthSession();

export default function ChatLoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Configure your OAuth client IDs from Firebase console → Project Settings → OAuth 2.0
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: 'YOUR_EXPO_CLIENT_ID',
    iosClientId:   'YOUR_IOS_CLIENT_ID',
    androidClientId:'YOUR_ANDROID_CLIENT_ID',
    webClientId:   'YOUR_WEB_CLIENT_ID',
  });

  // Handle Google sign-in response
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then(() => navigation.replace('Subscription'))
        .catch(err => {
          console.error(err);
          Alert.alert('Google Sign-In Error', err.message);
        });
    }
  }, [response]);

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigation.replace('Subscription');
    } catch (err) {
      Alert.alert('Login Error', err.message);
    }
  };

  const handleCreateAccount = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      navigation.replace('Subscription');
    } catch (err) {
      Alert.alert('Signup Error', err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Sign in to MEdico AI Therapist</Text>

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
        placeholder="Password"
        placeholderTextColor="#888"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.buttonPrimary} onPress={handleLogin}>
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.buttonSecondary}
        onPress={handleCreateAccount}
      >
        <Text style={styles.buttonText}>Create Account</Text>
      </TouchableOpacity>

      <Text style={styles.or}>— or —</Text>

      <TouchableOpacity
        style={[
          styles.buttonGoogle,
          { opacity: request ? 1 : 0.5 },
        ]}
        onPress={() => promptAsync()}
        disabled={!request}
      >
        <Text style={styles.buttonText}>Continue with Google</Text>
      </TouchableOpacity>

      <Text style={styles.small}>
        You’ll need an account and subscription to chat.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  buttonPrimary: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#005BB5',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  buttonGoogle: {
    backgroundColor: '#DB4437',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 24,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  or: {
    textAlign: 'center',
    marginVertical: 12,
    color: '#666',
  },
  small: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
  },
});
