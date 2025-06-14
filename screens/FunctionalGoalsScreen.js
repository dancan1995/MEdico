// screens/FunctionalGoalsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Button,
  Platform,
  LayoutAnimation,
  UIManager,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { auth, firestore } from '../firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  doc as docRef,
  Timestamp,
} from 'firebase/firestore';

// Enable LayoutAnimation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function FunctionalGoalsScreen() {
  const [goals, setGoals] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newText, setNewText] = useState('');
  const [newDate, setNewDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const insets = useSafeAreaInsets();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(firestore, 'users', user.uid, 'goals'),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(
      q,
      snap => {
        const list = snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            text: data.text,
            completed: data.completed || false,
            dueDate: data.dueDate?.toDate(),
          };
        });
        setGoals(list);
      },
      err => {
        console.error(err);
        Alert.alert('Error', 'Could not load goals.');
      }
    );
    return unsubscribe;
  }, [user]);

  const animate = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  const saveGoal = async () => {
    const text = newText.trim();
    if (!text) {
      return Alert.alert('Missing text', 'Please enter a goal.');
    }
    animate();
    try {
      if (user) {
        await addDoc(
          collection(firestore, 'users', user.uid, 'goals'),
          {
            text,
            completed: false,
            createdAt: serverTimestamp(),
            dueDate: Timestamp.fromDate(newDate),
          }
        );
      } else {
        setGoals(prev => [
          { id: Date.now().toString(), text, completed: false, dueDate: newDate },
          ...prev,
        ]);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not save goal.');
    }
    setModalVisible(false);
    setNewText('');
    setNewDate(new Date());
  };

  const toggleDone = async goal => {
    animate();
    try {
      if (user) {
        await updateDoc(
          docRef(firestore, 'users', user.uid, 'goals', goal.id),
          { completed: !goal.completed, updatedAt: serverTimestamp() }
        );
      } else {
        setGoals(prev =>
          prev.map(g =>
            g.id === goal.id ? { ...g, completed: !g.completed } : g
          )
        );
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not update goal.');
    }
  };

  const removeGoal = id => {
    Alert.alert(
      'Delete goal?',
      'This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            animate();
            try {
              if (user) {
                await deleteDoc(
                  docRef(firestore, 'users', user.uid, 'goals', id)
                );
              } else {
                setGoals(prev => prev.filter(g => g.id !== id));
              }
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Could not delete.');
            }
          },
        },
      ]
    );
  };

  const fmtDate = date => date ? date.toLocaleDateString() : '';
  const total = goals.length;
  const doneCount = goals.filter(g => g.completed).length;
  const progress = total ? doneCount / total : 0;

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.goalItem, item.completed && styles.completedItem]}
      onPress={() => toggleDone(item)}
      onLongPress={() => removeGoal(item.id)}
      activeOpacity={0.7}
    >
      <Ionicons
        name={item.completed ? 'checkmark-circle' : 'ellipse-outline'}
        size={24}
        color={item.completed ? '#4caf50' : '#007AFF'}
      />
      <View style={styles.goalTextContainer}>
        <Text style={[styles.goalText, item.completed && styles.goalTextDone]}>
          {item.text}
        </Text>
        <Text style={styles.goalDate}>Due: {fmtDate(item.dueDate)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Rehab Goals</Text>
      <View style={styles.statsRow}>
        <Text style={styles.statsText}>
          Completed {doneCount} of {total}
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { flex: progress }]} />
          <View style={[styles.progressEmpty, { flex: 1 - progress }]} />
        </View>
      </View>
      <FlatList
        data={goals.sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0))}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No goals yet, tap + to add one.
          </Text>
        }
        contentContainerStyle={{ paddingBottom: 80 }}
      />
      <TouchableOpacity
        style={styles.addFab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add-circle" size={56} color="#007AFF" />
      </TouchableOpacity>

      {/* Modal with scrollable content */}
      <Modal visible={modalVisible} animationType="slide">
        <SafeAreaView style={[styles.modal, { paddingTop: insets.top }]}>
          <ScrollView>
            <Text style={styles.modalHeader}>New Goal</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter goal..."
              value={newText}
              onChangeText={setNewText}
            />
            <TouchableOpacity
              onPress={() => setShowPicker(true)}
              style={styles.dateButton}
            >
              <Text style={styles.dateButtonText}>
                Due Date: {fmtDate(newDate)}
              </Text>
            </TouchableOpacity>
            {showPicker && (
              <DateTimePicker
                value={newDate}
                mode="date"
                display="default"
                onChange={(e, date) => {
                  setShowPicker(false);
                  if (date) setNewDate(date);
                }}
              />
            )}
            <View style={styles.modalActions}>
              <Button title="Save" onPress={saveGoal} />
              <Button
                title="Cancel"
                color="#888"
                onPress={() => {
                  setModalVisible(false);
                  setNewText('');
                  setShowPicker(false);
                }}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fafafa' },
  header: { fontSize: 24, fontWeight: '600', marginBottom: 12, textAlign: 'center' },
  statsRow: { marginBottom: 12 },
  statsText: { fontSize: 16, marginBottom: 4, textAlign: 'center' },
  progressBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 32,
  },
  progressFill: { backgroundColor: '#4caf50' },
  progressEmpty: { backgroundColor: '#ddd' },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 6,
    marginBottom: 8,
  },
  completedItem: { opacity: 0.6 },
  goalTextContainer: { marginLeft: 12, flex: 1 },
  goalText: { fontSize: 16 },
  goalTextDone: { textDecorationLine: 'line-through', color: '#888' },
  goalDate: { fontSize: 12, color: '#666', marginTop: 4 },
  emptyText: { textAlign: 'center', color: '#666', marginTop: 32 },
  addFab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
  },
  modal: { flex: 1, padding: 16, backgroundColor: '#fff' },
  modalHeader: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
  },
  dateButton: {
    padding: 12,
    backgroundColor: '#f2f2f2',
    borderRadius: 6,
    marginBottom: 12,
  },
  dateButtonText: { fontSize: 16 },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
  },
});
