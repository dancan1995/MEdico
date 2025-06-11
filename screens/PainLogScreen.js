import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
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
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { LineChart } from 'react-native-chart-kit';

export default function PainLogScreen() {
  const [type, setType] = useState('');
  const [location, setLocation] = useState('');
  const [rating, setRating] = useState('');
  const [logs, setLogs] = useState([]);
  const [showChart, setShowChart] = useState(false);
  const scrollRef = useRef(null);
  const user = auth.currentUser;

  // Fetch logs
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(firestore, 'users', user.uid, 'painLogs'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap =>
      setLogs(
        snap.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            type: d.type,
            location: d.location,
            rating: d.rating,
            createdAt: d.createdAt?.toDate() || new Date(),
          };
        })
      )
    );
    return unsub;
  }, [user]);

  // Add log
  const addLog = async () => {
    if (!type.trim() || !location.trim() || !rating.trim()) {
      return Alert.alert('Missing fields', 'Fill out all three fields.');
    }
    const entry = {
      type: type.trim(),
      location: location.trim(),
      rating: Number(rating),
      createdAt: serverTimestamp(),
    };
    try {
      if (user) {
        await addDoc(
          collection(firestore, 'users', user.uid, 'painLogs'),
          entry
        );
      } else {
        setLogs(prev => [
          { id: Date.now().toString(), createdAt: new Date(), ...entry },
          ...prev,
        ]);
      }
      setType('');
      setLocation('');
      setRating('');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not save entry.');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.logItem}>
      <Text style={styles.logText}>
        {item.type} / {item.location} / {item.rating}/10
      </Text>
      <Text style={styles.logTime}>
        {item.createdAt.toLocaleString()}
      </Text>
    </View>
  );

  const recentLogs = logs.slice().reverse().slice(-10);
  const chartData = {
    labels: recentLogs.map(l =>
      l.createdAt.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })
    ),
    datasets: [
      {
        data: recentLogs.map(l => l.rating),
      },
    ],
  };

  const chartWidth = Math.max(Dimensions.get('window').width - 32, recentLogs.length * 60);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Pain Type:</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Neuropathic"
          value={type}
          onChangeText={setType}
        />

        <Text style={styles.label}>Location:</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Lower back"
          value={location}
          onChangeText={setLocation}
        />

        <Text style={styles.label}>Intensity (1–10):</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 5"
          keyboardType="number-pad"
          value={rating}
          onChangeText={setRating}
        />

        <Button title="Add Entry" onPress={addLog} />

        <View style={styles.buttonsRow}>
          <Button
            title={showChart ? 'Hide Trends' : 'Show Trends'}
            onPress={() => {
              const next = !showChart;
              setShowChart(next);
              if (next) {
                setTimeout(() => {
                  scrollRef.current?.scrollToEnd({ animated: true });
                }, 300);
              }
            }}
          />
        </View>

        {showChart && recentLogs.length > 0 && (
          <View style={styles.chartRow}>
            <View style={styles.yAxisLabelContainer}>
              <Text style={styles.yAxisLabel}></Text>
            </View>
            <ScrollView
              horizontal
              ref={scrollRef}
              showsHorizontalScrollIndicator
              style={{ marginBottom: 16 }}
            >
              <LineChart
                data={chartData}
                width={chartWidth}
                height={220}
                fromZero
                yAxisInterval={1}
                yLabelsOffset={8}
                withInnerLines
                chartConfig={{
                  backgroundGradientFrom: '#fafafa',
                  backgroundGradientTo: '#fafafa',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                  labelColor: () => '#333',
                  propsForDots: {
                    r: '4',
                    strokeWidth: '2',
                    stroke: '#007AFF',
                  },
                }}
                bezier
                style={styles.chart}
              />
            </ScrollView>
          </View>
        )}

        <Text style={styles.subheader}>Logs</Text>
        <FlatList
          data={logs}
          keyExtractor={i => i.id}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.empty}>No logs yet.</Text>}
          scrollEnabled={false}
        />
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  label: { marginTop: 12, fontSize: 16, color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 4,
    padding: 8,
    marginTop: 4,
  },
  buttonsRow: {
    marginTop: 12,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  chart: {
    borderRadius: 8,
    marginVertical: 8,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  yAxisLabelContainer: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  yAxisLabel: {
    transform: [{ rotate: '90deg' }],
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  subheader: { marginTop: 16, fontSize: 18, fontWeight: '500' },
  logItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#EEE',
  },
  logText: { fontSize: 16 },
  logTime: { fontSize: 12, color: '#666', marginTop: 4 },
  empty: { textAlign: 'center', color: '#666', marginTop: 16 },
});
