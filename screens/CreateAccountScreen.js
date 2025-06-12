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
  Modal,
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
  const [signupError, setSignupError] = useState('');

  const checkEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const dateRegex = /^\d{2}-\d{2}-\d{4}$/;

  const formatDateMMDDYYYY = date => {
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${mm}-${dd}-${yyyy}`;
  };

  const onDateChange = (event, date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (date) {
      setSelectedDate(date);
      setDob(formatDateMMDDYYYY(date));
    }
  };

  const toggleDatePicker = () => {
    setShowPicker(prev => !prev);
  };

  const handleSignup = async () => {
    setSignupError('');
    const e = email.trim().toLowerCase();
    if (!e || !dob || !password || !confirm) {
      return setSignupError('Please fill out all fields.');
    }
    if (!checkEmail(e)) {
      return setSignupError('Enter a valid email address.');
    }
    if (!dateRegex.test(dob)) {
      return setSignupError('Date must be in MM-DD-YYYY format.');
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
        dateOfBirth: dob,
        createdAt: serverTimestamp(),
      });

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

        {/* Error Display */}
        {signupError ? <Text style={styles.errorText}>{signupError}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Email address"
          placeholderTextColor="#888"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <View style={styles.dobRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="MM-DD-YYYY"
            placeholderTextColor="#888"
            keyboardType="numbers-and-punctuation"
            value={dob}
            onChangeText={setDob}
          />
          <TouchableOpacity style={styles.dobButton} onPress={toggleDatePicker}>
            <Ionicons name="calendar-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {Platform.OS === 'android' && showPicker && (
          <Modal transparent animationType="fade" visible={showPicker}>
            <TouchableOpacity
              style={styles.modalBackground}
              onPress={toggleDatePicker}
              activeOpacity={1}
            >
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date()}
                  onChange={onDateChange}
                />
              </View>
            </TouchableOpacity>
          </Modal>
        )}

        {Platform.OS === 'ios' && showPicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="spinner"
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
    marginBottom: 16,
    fontSize: 16,
  },
  dobRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dobButton: {
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    padding: 12,
    marginLeft: 8,
    marginBottom: 16,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
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
  modalBackground: {
    flex: 1,
    backgroundColor: '#00000099',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
});
