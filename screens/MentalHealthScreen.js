// screens/MentalHealthScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
} from 'react-native';

export default function MentalHealthScreen() {
  const [mood, setMood] = useState('');
  const [journal, setJournal] = useState('');
  const [entries, setEntries] = useState([]);

  const saveEntry = () => {
    if (!mood || !journal) return;
    setEntries((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        mood,
        journal,
      },
    ]);
    setMood('');
    setJournal('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Mood (1–10):</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={mood}
        onChangeText={setMood}
      />

      <Text style={styles.label}>Journal Entry:</Text>
      <TextInput
        style={[styles.input, { height: 100 }]}
        multiline
        value={journal}
        onChangeText={setJournal}
      />

      <Button title="Save Entry" onPress={saveEntry} />

      <Text style={styles.subheader}>Past Entries</Text>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.entry}>
            <Text style={styles.entryMood}>Mood: {item.mood}/10</Text>
            <Text>{item.journal}</Text>
          </View>
        )}
        ListEmptyComponent={<Text>No entries yet.</Text>}
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
  entry: { paddingVertical: 8, borderBottomWidth: 1 },
  entryMood: { fontWeight: '600' },
});
