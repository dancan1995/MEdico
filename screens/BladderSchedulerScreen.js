// screens/BladderSchedulerScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
} from 'react-native';

export default function BladderSchedulerScreen() {
  const [timeInput, setTimeInput] = useState('');
  const [schedule, setSchedule] = useState([]);

  const addEntry = () => {
    if (!timeInput.trim()) return;
    setSchedule((prev) => [
      ...prev,
      { id: Date.now().toString(), time: timeInput.trim() },
    ]);
    setTimeInput('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Add Catheterization Time (e.g. 08:30 AM):</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter time"
        value={timeInput}
        onChangeText={setTimeInput}
      />
      <Button title="Add to Schedule" onPress={addEntry} />

      <Text style={styles.subheader}>Today's Schedule</Text>
      <FlatList
        data={schedule}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Text style={styles.item}>{item.time}</Text>
        )}
        ListEmptyComponent={<Text>No entries yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  label: { fontSize: 16, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    marginBottom: 12,
  },
  subheader: { marginTop: 24, fontSize: 18, fontWeight: '500' },
  item: { paddingVertical: 8, borderBottomWidth: 1 },
});
