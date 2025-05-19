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
import { auth, firestore } from '../firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc as docRef,
  deleteDoc,
} from 'firebase/firestore';

export default function FunctionalGoalsScreen() {
  const [goalInput, setGoalInput] = useState('');
  const [goals, setGoals] = useState([]);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      // No user signed in → skip Firestore subscription
      return;
    }
    const goalsQuery = query(
      collection(firestore, 'users', user.uid, 'goals'),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(goalsQuery, snapshot => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setGoals(list);
    }, error => {
      console.error('Failed to load goals:', error);
      Alert.alert('Error', 'Could not load goals.');
    });
    return unsubscribe;
  }, [user]);

  const addGoal = async () => {
    const text = goalInput.trim();
    if (!text) {
      return Alert.alert('Enter a goal first');
    }
    if (!user) {
      // Local fallback for guests
      setGoals(prev => [{ id: Date.now().toString(), text }, ...prev]);
      setGoalInput('');
      return;
    }
    try {
      await addDoc(
        collection(firestore, 'users', user.uid, 'goals'),
        {
          text,
          createdAt: serverTimestamp(),
        }
      );
      setGoalInput('');
    } catch (err) {
      console.error('Add goal error:', err);
      Alert.alert('Error adding goal', err.message);
    }
  };

  const removeGoal = id => {
    if (!user) {
      // Local-only removal
      setGoals(prev => prev.filter(g => g.id !== id));
      return;
    }
    Alert.alert(
      'Delete this goal?',
      'This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(
                docRef(firestore, 'users', user.uid, 'goals', id)
              );
            } catch (err) {
              console.error('Delete goal error:', err);
              Alert.alert('Error deleting goal', err.message);
            }
          }
        }
      ]
    );
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
    borderColor: '#CCC',
    borderRadius: 4,
    padding: 8,
    marginBottom: 12,
  },
  subheader: { marginTop: 24, fontSize: 18, fontWeight: '500' },
  goalItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#EEE',
  },
});
