// screens/TermsScreen.js
import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';

export default function TermsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Terms &amp; Conditions</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Introduction</Text>
        <Text style={styles.paragraph}>
          Welcome to MEdico (“we,” “our,” or “us”). These Terms &amp; Conditions govern your use of our mobile application and services (“the App”). By downloading, installing, or using any part of the App, you agree to be bound by these terms. If you do not agree, please do not use the App.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Eligibility</Text>
        <Text style={styles.paragraph}>
          You must be at least 18 years old and capable of forming a binding contract to use the App. By using the App, you represent and warrant that you meet these requirements.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Account &amp; Security</Text>
        <Text style={styles.paragraph}>
          To access certain features (e.g., AI chat, progress sync), you must create an account. You agree to:
        </Text>
        <Text style={styles.bullet}>• Provide accurate, current, and complete information.</Text>
        <Text style={styles.bullet}>• Maintain and promptly update your account information.</Text>
        <Text style={styles.bullet}>• Keep your password and login credentials confidential.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. Subscriptions &amp; Payment</Text>
        <Text style={styles.paragraph}>
          Some App features require a paid subscription (Basic or Premium). Billing is handled via Stripe. You authorize us to charge your chosen payment method and agree to the displayed subscription fees. All fees are non-refundable, except as required by law.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>5. Privacy &amp; Data</Text>
        <Text style={styles.paragraph}>
          We collect and store personal and health-related data (e.g., goals, logs) to provide services. Your data is encrypted in transit and at rest. See our Privacy Policy for full details on collection, use, sharing, and deletion of your data.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>6. User Content</Text>
        <Text style={styles.paragraph}>
          You retain ownership of all information you submit (e.g., journal entries). By sharing with caregivers or in-app AI, you grant us a limited license to use, process, and store that content solely to provide App functionality.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>7. Acceptable Use</Text>
        <Text style={styles.paragraph}>
          You agree not to use the App to:
        </Text>
        <Text style={styles.bullet}>• Violate any law or infringe third-party rights.</Text>
        <Text style={styles.bullet}>• Transmit harmful or offensive content.</Text>
        <Text style={styles.bullet}>• Reverse engineer or otherwise misuse our systems.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>8. Disclaimer of Warranties</Text>
        <Text style={styles.paragraph}>
          THE APP IS PROVIDED “AS IS” AND “AS AVAILABLE” WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE APP WILL BE UNINTERRUPTED OR ERROR-FREE.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>9. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          TO THE FULLEST EXTENT PERMITTED BY LAW, IN NO EVENT WILL WE BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE APP.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>10. Modifications</Text>
        <Text style={styles.paragraph}>
          We may update these Terms from time to time. We will notify you of material changes via the App or by email. Continued use after changes constitutes acceptance.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>11. Governing Law</Text>
        <Text style={styles.paragraph}>
          These Terms are governed by the laws of your jurisdiction. Any dispute shall be resolved in a court of competent jurisdiction in your location.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>12. Account Deletion Policy</Text>
        <Text style={styles.paragraph}>
          You may request deletion of your account and all related data at any time. To do so, please:
        </Text>
        <Text style={styles.bullet}>• Open the MEdico app</Text>
        <Text style={styles.bullet}>• Navigate to the Settings screen</Text>
        <Text style={styles.bullet}>• Tap "Delete My Account"</Text>

        <Text style={styles.paragraph}>
          Alternatively, email us at <Text style={styles.link}>confam8@gmail.com</Text> with the subject line “Delete My Account”.
        </Text>

        <Text style={styles.paragraph}>Once your request is confirmed:</Text>
        <Text style={styles.bullet}>• Your profile and personal health logs will be permanently deleted</Text>
        <Text style={styles.bullet}>• We do not retain any user data beyond 30 days after deletion</Text>
        <Text style={styles.bullet}>• Some logs (e.g., error reports) may remain anonymized for security auditing</Text>

        <Text style={styles.paragraph}>
          For further help, contact: <Text style={styles.link}>confam8@gmail.com</Text>
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.paragraph}>
          If you have any questions, please contact us at support@medico.app.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
    marginLeft: 12,
    marginBottom: 4,
  },
  link: {
    color: '#007bff',
  },
});
