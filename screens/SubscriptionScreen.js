// screens/SubscriptionScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { auth, firestore } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const plans = [
  {
    key: 'basic',
    title: 'Basic',
    price: '$4.99/mo',
    desc: 'Up to 10 AI chat messages per day and standard support.',
  },
  {
    key: 'premium',
    title: 'Premium',
    price: '$9.99/mo',
    desc: 'Unlimited AI messages, advanced insights, and priority support.',
  },
];

export default function SubscriptionScreen({ navigation }) {
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  // Fetch the user’s current subscription from Firestore
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const ref = doc(firestore, 'users', user.uid);
    getDoc(ref)
      .then(snapshot => {
        if (snapshot.exists() && snapshot.data().subscription) {
          setCurrentPlan(snapshot.data().subscription);
        }
      })
      .catch(err => {
        console.error(err);
        Alert.alert('Error', 'Could not load subscription.');
      })
      .finally(() => setLoading(false));
  }, [user]);

  const selectPlan = async planKey => {
    if (!user) {
      return Alert.alert(
        'Not signed in',
        'Please log in to select a subscription.'
      );
    }
    try {
      // Save subscription choice in Firestore under users/{uid}.subscription
      await setDoc(
        doc(firestore, 'users', user.uid),
        { subscription: planKey },
        { merge: true }
      );
      setCurrentPlan(planKey);
      Alert.alert(
        'Plan selected',
        `You have chosen the ${planKey.charAt(0).toUpperCase() + planKey.slice(1)} plan.`
      );
      // Now they can access the chatbot
      navigation.navigate('ChatBot');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not save your plan. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Choose Your Plan</Text>
      {plans.map(plan => (
        <TouchableOpacity
          key={plan.key}
          style={[
            styles.planCard,
            currentPlan === plan.key && styles.selectedCard,
          ]}
          onPress={() => navigation.navigate('BankPayment', { plan: plan.key })}
          activeOpacity={0.8}
        >
          <Text style={styles.planTitle}>{plan.title}</Text>
          <Text style={styles.planPrice}>{plan.price}</Text>
          <Text style={styles.planDesc}>{plan.desc}</Text>
          {currentPlan === plan.key && (
            <Text style={styles.currentBadge}>Current Plan</Text>
          )}
        </TouchableOpacity>
      ))}
      <Text style={styles.smallText}>
        All subscriptions auto-renew monthly. You can change or cancel anytime
        from your account settings.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fafafa' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  planCard: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginVertical: 8,
    elevation: 2,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  planTitle: { fontSize: 18, fontWeight: '500' },
  planPrice: { fontSize: 16, color: '#888', marginTop: 4 },
  planDesc: { fontSize: 14, color: '#555', marginTop: 8 },
  currentBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#007AFF',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
    overflow: 'hidden',
  },
  smallText: {
    marginTop: 16,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});
