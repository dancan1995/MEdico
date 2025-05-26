// screens/ChatLoginScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { auth } from '../firebase';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';

export default function ChatLoginScreen({ navigation, route }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Only auto-redirect on mount if NOT coming from signup flow
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => {
      if (user && !route.params?.fromSignup) {
        navigation.replace('Home');
      }
    });
    return unsub;
  }, [navigation, route.params]);

  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert(
        'Missing fields',
        'Please enter both your email and password.'
      );
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigation.replace('Home');
    } catch (err) {
      Alert.alert('Login Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = () => {
    if (!email) {
      return Alert.alert(
        'Enter email',
        'Please enter your email address to reset your password.'
      );
    }
    sendPasswordResetEmail(auth, email.trim())
      .then(() =>
        Alert.alert(
          'Reset Email Sent',
          'Check your inbox for a password reset link.'
        )
      )
      .catch(err => Alert.alert('Error', err.message));
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logo}
        />

        <Text style={styles.header}>Welcome back to MEdico</Text>

        {/* Email Input */}
        <View style={styles.inputWrapper}>
          <Ionicons name="mail-outline" size={20} color="#555" />
          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor="#888"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed-outline" size={20} color="#555" />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Password"
            placeholderTextColor="#888"
            secureTextEntry={!showPass}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPass(v => !v)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showPass ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#555"
            />
          </TouchableOpacity>
        </View>

        {/* Forgot Password */}
        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.forgot}>Forgot password?</Text>
        </TouchableOpacity>

        {/* Login Button */}
        <TouchableOpacity
          style={styles.buttonPrimary}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Log In</Text>
          )}
        </TouchableOpacity>

        {/* Create Account */}
        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={() =>
            // indicate to ChatLoginScreen we came from signup
            navigation.replace('CreateAccount', { fromLogin: true })
          }
        >
          <Text style={styles.buttonText}>Create Account</Text>
        </TouchableOpacity>

        <Text style={styles.smallText}>
          You need an account and subscription to chat with MEdico AI.
        </Text>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    justifyContent: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    marginBottom: 24,
    resizeMode: 'contain',
  },
  header: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
    color: '#333',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  input: {
    marginLeft: 8,
    fontSize: 16,
    color: '#000',
    height: 40,
  },
  eyeIcon: {
    padding: 4,
  },
  forgot: {
    textAlign: 'right',
    color: '#007AFF',
    marginBottom: 24,
    fontSize: 14,
  },
  buttonPrimary: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonSecondary: {
    backgroundColor: '#005BB5',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  smallText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
  },
});
