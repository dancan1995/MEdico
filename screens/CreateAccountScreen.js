import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, firestore } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function CreateAccountScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [signupError, setSignupError] = useState('');

  const checkEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSignup = async () => {
    setSignupError('');
    const e = email.trim().toLowerCase();
    if (!e || !password || !confirm) {
      return setSignupError('Please fill out all fields.');
    }
    if (!checkEmail(e)) {
      return setSignupError('Enter a valid email address.');
    }
    if (password !== confirm) {
      return setSignupError('Both passwords must match.');
    }
    if (!acceptedTerms) {
      return setSignupError('You must accept our Terms & Conditions to proceed.');
    }

    try {
      const { user } = await createUserWithEmailAndPassword(auth, e, password);

      await setDoc(doc(firestore, 'users', user.uid), {
        email: user.email,
        createdAt: serverTimestamp(),
      });

      Alert.alert(
        'Account Created',
        'Please log in using the email and password you just used. A verification link will be sent to your email.'
      );

      navigation.replace('ChatLogin', { fromSignup: true });
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setSignupError('This email is already in use.');
      } else {
        setSignupError(err.message);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Image source={require('../assets/images/logo.png')} style={styles.logo} />

        <Text style={styles.header}>Create Your Account</Text>

        {signupError ? <Text style={styles.errorText}>{signupError}</Text> : null}

        <TextInput
          style={[styles.input, styles.inputSpacing]}
          placeholder="Email address"
          placeholderTextColor="#888"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <View style={[styles.inputWrapper, styles.inputSpacing]}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Password"
            placeholderTextColor="#888"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(prev => !prev)}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#555"
            />
          </TouchableOpacity>
        </View>

        <View style={[styles.inputWrapper, styles.inputSpacing]}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Confirm Password"
            placeholderTextColor="#888"
            secureTextEntry={!showConfirm}
            value={confirm}
            onChangeText={setConfirm}
          />
          <TouchableOpacity onPress={() => setShowConfirm(prev => !prev)}>
            <Ionicons
              name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#555"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.termsRow}
          onPress={() => setAcceptedTerms(prev => !prev)}
          activeOpacity={0.7}
        >
          <View style={styles.checkboxBox}>
            {acceptedTerms && (
              <Ionicons name="checkmark" size={14} color="#007AFF" />
            )}
          </View>
          <Text style={styles.termsText}>
            I agree to the{' '}
            <Text style={styles.link} onPress={() => navigation.navigate('Terms')}>
              Terms & Conditions
            </Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, !acceptedTerms && styles.buttonDisabled]}
          onPress={handleSignup}
          disabled={!acceptedTerms}
        >
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ChatLogin')}>
            <Text style={styles.footerLink}> Log in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
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
    marginBottom: 16,
    color: '#333',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  inputSpacing: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: '#007AFF',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  termsText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    flexWrap: 'wrap',
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#333',
  },
  footerLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
});
