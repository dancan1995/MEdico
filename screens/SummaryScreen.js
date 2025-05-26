// screens/SummaryScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  Button,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { functions } from '../firebase';

export default function SummaryScreen() {
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState('');
  const [recommendations, setRecommendations] = useState([]);

  const fetchSummary = async () => {
    setLoading(true);
    setOverview('');
    setRecommendations([]);

    try {
      const call = functions.httpsCallable('summarizeProgress');
      const { data } = await call();
      const fullText = data.result || '';

      // Split into overview vs numbered recommendations
      const lines = fullText.split('\n');
      const ov = [];
      const recs = [];
      let inRecs = false;

      lines.forEach(line => {
        const trimmed = line.trim();
        if (/^\d+\.\s*/.test(trimmed)) {
          inRecs = true;
          recs.push(trimmed.replace(/^\d+\.\s*/, ''));
        } else if (inRecs && trimmed) {
          // continuation of a recommendation
          recs.push(trimmed);
        } else if (!inRecs && trimmed) {
          ov.push(trimmed);
        }
      });

      setOverview(ov.join(' '));
      setRecommendations(recs);
    } catch (err) {
      console.error('summarizeProgress failed:', err);
      Alert.alert(
        'Summary Error',
        err.message || 'An unexpected error occurred while generating the summary.'
      );
      setOverview('Error generating summary.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Button
        title="Generate Progress Summary"
        onPress={fetchSummary}
        disabled={loading}
      />
      {loading && <ActivityIndicator style={{ margin: 16 }} />}

      {overview ? (
        <ScrollView style={styles.resultBox}>
          <Text style={styles.heading}>Overview</Text>
          <Text style={styles.resultText}>{overview}</Text>
        </ScrollView>
      ) : null}

      {recommendations.length > 0 && (
        <View style={styles.resultBox}>
          <Text style={styles.heading}>Recommendations</Text>
          {recommendations.map((r, i) => (
            <Text key={i} style={styles.recItem}>
              • {r}
            </Text>
          ))}
        </View>
      )}
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
    borderColor: '#CCC',
    backgroundColor: '#FAFAFA',
  },
  heading: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  resultText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#444',
  },
  recItem: {
    fontSize: 14,
    lineHeight: 20,
    marginVertical: 2,
    color: '#555',
  },
});
