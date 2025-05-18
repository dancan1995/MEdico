// screens/SubscriptionScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const plans = [
  { key: 'basic', title: 'Basic', price: '$4.99/mo' },
  { key: 'premium', title: 'Premium', price: '$9.99/mo' },
];

export default function SubscriptionScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Choose Your Plan</Text>
      {plans.map((plan) => (
        <TouchableOpacity
          key={plan.key}
          style={styles.planCard}
          onPress={() => navigation.navigate('ChatBot')}
          activeOpacity={0.8}
        >
          <Text style={styles.planTitle}>{plan.title}</Text>
          <Text style={styles.planPrice}>{plan.price}</Text>
        </TouchableOpacity>
      ))}
      <Text style={styles.small}>All subscriptions auto-renew monthly.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  header: { fontSize: 22, fontWeight: '600', marginBottom: 24, textAlign: 'center' },
  planCard: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    elevation: 2,
    marginVertical: 8,
    alignItems: 'center',
  },
  planTitle: { fontSize: 18, fontWeight: '500' },
  planPrice: { fontSize: 16, color: '#888', marginTop: 4 },
  small: { marginTop: 16, fontSize: 12, color: '#666', textAlign: 'center' },
});
