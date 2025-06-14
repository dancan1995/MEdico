import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  ScrollView,
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
  const [error, setError] = useState('');
  const [emailValid, setEmailValid] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => {
      if (user && !route.params?.fromSignup) {
        navigation.replace('Home');
      }
    });
    return unsub;
  }, [navigation, route.params]);

  const validateEmail = (value) => {
    const regex = /^\S+@\S+\.\S+$/;
    return regex.test(value);
  };

  const handleLogin = async () => {
    setError('');
    const isEmailValid = validateEmail(email.trim());
    setEmailValid(isEmailValid);

    if (!email || !password) {
      setError('Please enter both your email and password.');
      return;
    }

    if (!isEmailValid) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);

      if (!user.emailVerified) {
        await auth.currentUser.sendEmailVerification();
        await auth.signOut();
        setError('A verification link has been sent to your email. Please verify before logging in.');
        return;
      }

      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (err) {
      setError('Incorrect email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = () => {
    setError('');
    if (!email) {
      setError('Enter your email address to reset your password.');
      return;
    }

    sendPasswordResetEmail(auth, email.trim())
      .then(() => {
        setError('');
        alert('Check your inbox for a password reset link.');
      })
      .catch(err => setError(err.message));
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logo}
          />

          <Text style={styles.header}>Welcome back to MEdico</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

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
              onChangeText={text => {
                setEmail(text);
                setEmailValid(true);
              }}
              editable={true}
              focusable={true}
            />
          </View>
          {!emailValid && (
            <Text style={styles.errorText}>Invalid email format</Text>
          )}

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
          <TouchableOpacity onPress={handlePasswordReset}>
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
              navigation.replace('CreateAccount', { fromLogin: true })
            }
          >
            <Text style={styles.buttonText}>Create Account</Text>
          </TouchableOpacity>

          <Text style={styles.smallText}></Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
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
    marginBottom: 16,
    color: '#333',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
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
    flex: 1,
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
    marginBottom: 16,
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
