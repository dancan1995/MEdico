// screens/BankPaymentScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { functions } from '../firebase';

export default function BankPaymentScreen({ navigation, route }) {
  const { plan } = route.params; // 'basic' or 'premium'
  const [name, setName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuthorize = async () => {
    setLoading(true);
    try {
      // Fire off the dummy function (all fields optional)
      const createPay = functions.httpsCallable('createBankPayment');
      await createPay({
        plan,
        name: name || 'Test User',
        cardNumber: cardNumber || '0000000000000000',
        expiry: expiry || '01/30',
        cvc: cvc || '000',
        receiptEmail: email || 'test@example.com',
      });
    } catch (err) {
      // we ignore errors in testing
      console.warn('Payment stub error (ignored)', err);
    } finally {
      setLoading(false);
      // go straight into the AI chat
      navigation.replace('ChatBot');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.header}>
            Authorize {plan === 'basic' ? 'Basic' : 'Premium'} Plan
          </Text>

          <Text style={styles.label}>Account Holder Name</Text>
          <TextInput
            style={styles.input}
            placeholder="(optional for test)"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Card Number</Text>
          <TextInput
            style={styles.input}
            placeholder="(optional for test)"
            keyboardType="number-pad"
            value={cardNumber}
            onChangeText={setCardNumber}
          />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>Expiry (MM/YY)</Text>
              <TextInput
                style={styles.input}
                placeholder="(opt)"
                keyboardType="number-pad"
                value={expiry}
                onChangeText={setExpiry}
                maxLength={5}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.label}>CVC</Text>
              <TextInput
                style={styles.input}
                placeholder="(opt)"
                keyboardType="number-pad"
                secureTextEntry
                value={cvc}
                onChangeText={setCvc}
                maxLength={4}
              />
            </View>
          </View>

          <Text style={styles.label}>Receipt Email</Text>
          <TextInput
            style={styles.input}
            placeholder="(optional for test)"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.6 }]}
            onPress={handleAuthorize}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Authorize &amp; Pay</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    marginTop: 12,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 32,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
