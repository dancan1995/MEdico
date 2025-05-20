// screens/PainLogScreen.js
import React, { useState, useEffect } from 'react';
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
  const user = auth.currentUser;

  // Subscribe to Firestore on mount
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

  // prepare data for chart
  const chartData = {
    labels: logs
      .map(l => l.createdAt.toLocaleDateString())
      .reverse()
      .slice(0, 10), // last 10 entries
    datasets: [
      {
        data: logs.map(l => l.rating).reverse().slice(0, 10),
      },
    ],
  };

  const screenWidth = Dimensions.get('window').width - 32;

  return (
    <View style={styles.container}>
      {/* input form */}
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
          onPress={() => setShowChart(v => !v)}
        />
      </View>

      {showChart && logs.length > 0 && (
        <LineChart
          data={chartData}
          width={screenWidth}
          height={220}
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fafafa',
            backgroundGradientTo: '#fafafa',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
            style: { borderRadius: 8 },
            propsForDots: { r: '4', strokeWidth: '2', stroke: '#007AFF' },
          }}
          style={{ marginVertical: 16, borderRadius: 8 }}
        />
      )}

      <Text style={styles.subheader}>Logs</Text>
      <FlatList
        data={logs}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>No logs yet.</Text>}
      />
    </View>
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
