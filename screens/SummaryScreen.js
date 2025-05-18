// screens/SummaryScreen.js
import React, { useState } from 'react';
import {
  View, Text, Button, ActivityIndicator, ScrollView, StyleSheet
} from 'react-native';
import { functions } from '../firebase';

export default function SummaryScreen() {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const call = functions.httpsCallable('summarizeProgress');
      const { data } = await call();
      setSummary(data.result);
    } catch (err) {
      console.error(err);
      setSummary('Error generating summary.');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Button title="Generate Progress Summary" onPress={fetchSummary} />
      {loading && <ActivityIndicator style={{ margin: 16 }} />}
      {summary ? (
        <ScrollView style={styles.resultBox}>
          <Text style={styles.resultText}>{summary}</Text>
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  resultBox: {
    marginTop: 16,
    padding: 12,
    borderWidth: 1,
    borderRadius: 4,
  },
  resultText: { fontSize: 14, lineHeight: 20 },
});
