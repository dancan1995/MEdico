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
  FlatList,
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

    const moodVal = Number(mood);
    if (
      isNaN(moodVal) ||
      moodVal < 1 ||
      moodVal > 10 ||
      !Number.isInteger(moodVal)
    ) {
      return Alert.alert('Invalid Mood', 'Mood must be a whole number between 1 and 10.');
    }

    const now = new Date();
    const entriesInLast24Hours = entries.filter(entry => {
      const diff = now - entry.createdAt;
      return diff < 24 * 60 * 60 * 1000;
    });

    if (entriesInLast24Hours.length >= 2) {
      return Alert.alert(
        'Limit Reached',
        'You can only submit 2 entries per 24 hours.'
      );
    }

    const data = {
      mood: moodVal,
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

  const renderTableItem = ({ item }) => (
    <View style={styles.tableRow}>
      <Text style={styles.tableCell}>
        {item.createdAt.toLocaleDateString()} {item.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
      <Text style={styles.tableCell}>{item.mood}/10</Text>
      <Text style={styles.tableCell}>{item.journal}</Text>
    </View>
  );

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

          <Text style={styles.tableHeader}>Entries</Text>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableCell, styles.bold]}>Date</Text>
            <Text style={[styles.tableCell, styles.bold]}>Mood</Text>
            <Text style={[styles.tableCell, styles.bold]}>Journal</Text>
          </View>

          <FlatList
            data={entries}
            keyExtractor={item => item.id}
            renderItem={renderTableItem}
            scrollEnabled={false}
            ListEmptyComponent={
              <Text style={{ textAlign: 'center', marginTop: 12, color: '#666' }}>
                No entries yet.
              </Text>
            }
          />

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
  tableHeader: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 6,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#999',
    paddingVertical: 6,
    backgroundColor: '#eee',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 8,
  },
  tableCell: {
    flex: 1,
    paddingHorizontal: 4,
    fontSize: 14,
  },
  bold: {
    fontWeight: 'bold',
  },
});
