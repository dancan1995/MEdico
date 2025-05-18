// screens/FunctionalGoalsScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

export default function FunctionalGoalsScreen() {
  const [goalInput, setGoalInput] = useState('');
  const [goals, setGoals] = useState([]);

  const addGoal = () => {
    if (!goalInput.trim()) return;
    setGoals((prev) => [
      ...prev,
      { id: Date.now().toString(), text: goalInput.trim() },
    ]);
    setGoalInput('');
  };

  const removeGoal = (id) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>New Rehab Goal:</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 10 transfers independently"
        value={goalInput}
        onChangeText={setGoalInput}
      />
      <Button title="Add Goal" onPress={addGoal} />

      <Text style={styles.subheader}>Your Goals</Text>
      <FlatList
        data={goals}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onLongPress={() => removeGoal(item.id)}
            style={styles.goalItem}
          >
            <Text>{item.text}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text>No goals yet.</Text>}
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
  goalItem: {
    padding: 12,
    borderBottomWidth: 1,
  },
});
