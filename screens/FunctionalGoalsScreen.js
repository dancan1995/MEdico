// screens/FunctionalGoalsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { firestore, auth } from '../firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  deleteDoc,
} from 'firebase/firestore';

export default function FunctionalGoalsScreen() {
  const [goalInput, setGoalInput] = useState('');
  const [goals, setGoals] = useState([]);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      // if you prefer local-only when not signed in, skip subscribing
      return;
    }
    const q = query(
      collection(firestore, 'users', user.uid, 'goals'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setGoals(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsub;
  }, [user]);

  const addGoal = async () => {
    const text = goalInput.trim();
    if (!text) return Alert.alert('Enter a goal first');
    if (!user) {
      // fallback: local-only
      setGoals(prev => [{ id: Date.now().toString(), text }, ...prev]);
      setGoalInput('');
      return;
    }
    try {
      await addDoc(collection(firestore, 'users', user.uid, 'goals'), {
        text,
        createdAt: serverTimestamp(),
      });
      setGoalInput('');
    } catch (err) {
      Alert.alert('Error adding goal', err.message);
    }
  };

  const removeGoal = (id) => {
    if (!user) {
      setGoals(prev => prev.filter(g => g.id !== id));
      return;
    }
    Alert.alert('Delete this goal?', '', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(firestore, 'users', user.uid, 'goals', id));
          } catch (err) {
            Alert.alert('Error deleting', err.message);
          }
        },
      },
    ]);
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
        keyExtractor={item => item.id}
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
