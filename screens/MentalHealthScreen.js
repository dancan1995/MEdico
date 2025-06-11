// screens/MentalHealthScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { auth, firestore } from '../firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';

export default function MentalHealthScreen() {
  const [mood, setMood] = useState('');
  const [journal, setJournal] = useState('');
  const [entries, setEntries] = useState([]);
  const [showChart, setShowChart] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(firestore, 'users', user.uid, 'mentalEntries'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setEntries(
        snap.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            mood: d.mood,
            journal: d.journal,
            createdAt: d.createdAt ? d.createdAt.toDate() : new Date(),
          };
        })
      );
    });
    return unsub;
  }, [user]);

  const saveEntry = async () => {
    if (!mood.trim() || !journal.trim()) {
      return Alert.alert('Missing fields', 'Enter both mood and journal.');
    }

    // Filter out entries created in the last 24 hours
    const now = new Date();
    const entriesInLast24Hours = entries.filter(entry => {
      const diffInMs = now - entry.createdAt;
      return diffInMs < 24 * 60 * 60 * 1000;
    });

    if (entriesInLast24Hours.length >= 2) {
      return Alert.alert(
        'Limit Reached',
        'You can only submit 2 entries per 24 hours.'
      );
    }

    const data = {
      mood: Number(mood),
      journal: journal.trim(),
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(
        collection(firestore, 'users', user.uid, 'mentalEntries'),
        data
      );
      setMood('');
      setJournal('');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not save entry.');
    }
  };

  const trend =
    entries.length > 1 ? entries[0].mood - entries[1].mood : 0;

  const recent = entries.slice(0, 7).reverse();
  const chartData = {
    labels: recent.map(e =>
      e.createdAt.toLocaleDateString().slice(0, 5)
    ),
    datasets: [{ data: recent.map(e => e.mood) }],
  };
  const screenWidth = Dimensions.get('window').width - 32;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.header}>Daily Mood & Journal</Text>

          {entries.length > 1 && (
            <View style={styles.trend}>
              <Ionicons
                name={trend >= 0 ? 'trending-up' : 'trending-down'}
                size={20}
                color={trend >= 0 ? '#4caf50' : '#f44336'}
              />
              <Text style={styles.trendText}>
                {Math.abs(trend)} point{Math.abs(trend) === 1 ? '' : 's'}{' '}
                {trend >= 0 ? 'higher' : 'lower'} than yesterday
              </Text>
            </View>
          )}

          <Text style={styles.label}>Mood (1–10):</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            placeholder="e.g. 7"
            value={mood}
            onChangeText={setMood}
          />

          <Text style={styles.label}>Journal:</Text>
          <TextInput
            style={[styles.input, styles.journal]}
            placeholder="How are you feeling?"
            multiline
            value={journal}
            onChangeText={setJournal}
          />

          <View style={{ marginVertical: 8 }}>
            <Button title="Save Entry" onPress={saveEntry} />
          </View>

          {entries.length > 1 && (
            <TouchableOpacity
              style={styles.chartToggle}
              onPress={() => setShowChart(v => !v)}
            >
              <Text style={styles.chartToggleText}>
                {showChart ? 'Hide Trends' : 'Show Trends'}
              </Text>
            </TouchableOpacity>
          )}

          {showChart && recent.length > 0 && (
            <LineChart
              data={chartData}
              width={screenWidth}
              height={180}
              chartConfig={{
                backgroundGradientFrom: '#fafafa',
                backgroundGradientTo: '#fafafa',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(0,122,255,${opacity})`,
                labelColor: () => '#333',
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: '#007AFF',
                },
              }}
              style={styles.chart}
              bezier
            />
          )}

          {entries.map(item => (
            <View key={item.id} style={styles.entry}>
              <Text style={styles.entryHeader}>
                {item.createdAt.toLocaleString()}
              </Text>
              <Text style={styles.entryMood}>Mood: {item.mood}/10</Text>
              <Text style={styles.entryText}>{item.journal}</Text>
            </View>
          ))}

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fafafa',
  },
  header: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  trend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  trendText: { marginLeft: 6, color: '#555' },
  label: { marginTop: 12, fontSize: 16, color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 6,
    padding: 8,
    marginTop: 4,
  },
  journal: {
    height: 80,
    textAlignVertical: 'top',
  },
  chartToggle: {
    marginVertical: 12,
    alignSelf: 'center',
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 4,
  },
  chartToggleText: {
    color: '#fff',
    fontWeight: '500',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 6,
  },
  entry: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
    marginVertical: 6,
    elevation: 1,
  },
  entryHeader: {
    fontSize: 12,
    color: '#666',
  },
  entryMood: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  entryText: {
    marginTop: 4,
    fontSize: 14,
    color: '#333',
  },
});
