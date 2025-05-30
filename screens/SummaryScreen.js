// screens/SummaryScreen.js
//
// Reads the local JSON file via patientDataStore, sends the JSON to OpenAI,
// then displays an overview + recommendations.

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

import { auth } from '../firebase';
import { readData } from '../utils/patientDataStore';
import { OPENAI_API_KEY } from '../config';

/* ─────────────────────────── OpenAI helper ────────────────────────── */
const summarizeWithOpenAI = async (patientData) => {
  const prompt = `
You are a clinical assistant. Using the structured JSON patient data below,
write:
1. A concise progress overview (≤120 words).
2. 5–7 bullet-point recommendations for the next two weeks.

JSON:
${JSON.stringify(patientData, null, 2)}
`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful healthcare assistant.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 512,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenAI error (${res.status}): ${txt}`);
  }
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? '';
};

/* ─────────────────────────── Component ───────────────────────────── */
export default function SummaryScreen() {
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState('');
  const [recommendations, setRecommendations] = useState([]);

  const generateSummary = async () => {
    if (!auth.currentUser) {
      Alert.alert('Not signed in', 'Please log in again.');
      return;
    }

    setLoading(true);
    setOverview('');
    setRecommendations([]);

    try {
      /* 1️⃣  Read local JSON */
      const patientData = await readData();

      /* 2️⃣  Summarize with OpenAI */
      const fullText = await summarizeWithOpenAI(patientData);

      /* 3️⃣  Split overview vs bullets */
      const ov = [];
      const recs = [];
      fullText.split('\n').forEach((line) => {
        const t = line.trim();
        if (/^(\d+\.|[-*•])\s/.test(t))
          recs.push(t.replace(/^(\d+\.|[-*•])\s*/, ''));
        else if (t) ov.push(t);
      });

      setOverview(ov.join(' '));
      setRecommendations(recs);
    } catch (err) {
      console.error(err);
      Alert.alert(
        'Summary Error',
        err.message || 'Unable to generate summary.'
      );
      setOverview('Error generating summary.');
    } finally {
      setLoading(false);
    }
  };

  /* ─────────────────────────── UI ──────────────────────────────── */
  return (
    <View style={styles.container}>
      <Button
        title="Generate Progress Summary"
        onPress={generateSummary}
        disabled={loading}
      />
      {loading && <ActivityIndicator style={{ margin: 16 }} />}

      {!!overview && (
        <ScrollView style={styles.resultBox}>
          <Text style={styles.heading}>Overview</Text>
          <Text style={styles.resultText}>{overview}</Text>
        </ScrollView>
      )}

      {recommendations.length > 0 && (
        <View style={styles.resultBox}>
          <Text style={styles.heading}>Recommendations</Text>
          {recommendations.map((r, i) => (
            <Text key={`rec-${i}`} style={styles.recItem}>
              • {r}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

/* ─────────────────────────── styles ────────────────────────────── */
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
