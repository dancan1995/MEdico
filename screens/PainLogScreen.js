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

    const ratingNum = Number(rating);
    if (
      isNaN(ratingNum) ||
      ratingNum < 1 ||
      ratingNum > 10 ||
      !Number.isInteger(ratingNum)
    ) {
      return Alert.alert('Invalid Intensity', 'Please enter a whole number between 1 and 10.');
    }

    const entry = {
      type: type.trim(),
      location: location.trim(),
      rating: ratingNum,
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
    <View style={styles.logRow}>
      <Text style={styles.logCell}>
        {item.createdAt.toLocaleDateString()} {item.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
      <Text style={styles.logCell}>{item.type}</Text>
      <Text style={styles.logCell}>{item.location}</Text>
      <Text style={styles.logCell}>{item.rating}/10</Text>
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
        <View style={styles.logHeaderRow}>
          <Text style={[styles.logCell, styles.logHeader]}>Date</Text>
          <Text style={[styles.logCell, styles.logHeader]}>Type</Text>
          <Text style={[styles.logCell, styles.logHeader]}>Location</Text>
          <Text style={[styles.logCell, styles.logHeader]}>Intensity</Text>
        </View>

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
  logHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#999',
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
  },
  logRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#EEE',
    paddingVertical: 8,
  },
  logCell: {
    flex: 1,
    fontSize: 14,
    textAlign: 'left',
    paddingHorizontal: 4,
  },
  logHeader: {
    fontWeight: 'bold',
  },
  empty: { textAlign: 'center', color: '#666', marginTop: 16 },
});
