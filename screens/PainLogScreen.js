// screens/PainLogScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
} from 'react-native';

export default function PainLogScreen() {
  const [type, setType] = useState('');
  const [location, setLocation] = useState('');
  const [rating, setRating] = useState('');
  const [logs, setLogs] = useState([]);

  const addLog = () => {
    if (!type || !location || !rating) return;
    setLogs((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type,
        location,
        rating,
      },
    ]);
    setType('');
    setLocation('');
    setRating('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Pain Type (e.g. Neuropathic):</Text>
      <TextInput
        style={styles.input}
        value={type}
        onChangeText={setType}
      />

      <Text style={styles.label}>Location (e.g. Lower back):</Text>
      <TextInput
        style={styles.input}
        value={location}
        onChangeText={setLocation}
      />

      <Text style={styles.label}>Intensity (1–10):</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={rating}
        onChangeText={setRating}
      />

      <Button title="Add Entry" onPress={addLog} />

      <Text style={styles.subheader}>Logs</Text>
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Text style={styles.logItem}>
            {item.type} / {item.location} / {item.rating}/10
          </Text>
        )}
        ListEmptyComponent={<Text>No logs yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  label: { marginTop: 12, fontSize: 16 },
  input: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    marginVertical: 4,
  },
  subheader: { marginTop: 24, fontSize: 18, fontWeight: '500' },
  logItem: { paddingVertical: 6, borderBottomWidth: 1 },
});
