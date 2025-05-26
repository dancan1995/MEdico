// screens/MentalHealthScreen.js
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
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { auth, firestore } from '../firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';

export default function MentalHealthScreen() {
  const [mood, setMood] = useState('');
  const [journal, setJournal] = useState('');
  const [entries, setEntries] = useState([]);
  const [showChart, setShowChart] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(firestore, 'users', user.uid, 'mentalEntries'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setEntries(
        snap.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            mood: d.mood,
            journal: d.journal,
            createdAt: d.createdAt ? d.createdAt.toDate() : new Date(),
          };
        })
      );
    });
    return unsub;
  }, [user]);

  const saveEntry = async () => {
    if (!mood.trim() || !journal.trim()) {
      return Alert.alert('Missing fields', 'Enter both mood and journal.');
    }
    const data = {
      mood: Number(mood),
      journal: journal.trim(),
      createdAt: serverTimestamp(),
    };
    try {
      if (user) {
        await addDoc(
          collection(firestore, 'users', user.uid, 'mentalEntries'),
          data
        );
      } else {
        setEntries(prev => [
          { id: Date.now().toString(), createdAt: new Date(), ...data },
          ...prev,
        ]);
      }
      setMood('');
      setJournal('');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not save entry.');
    }
  };

  // Trend vs yesterday
  const trend =
    entries.length > 1 ? entries[0].mood - entries[1].mood : 0;

  // Chart data (last 7)
  const recent = entries.slice(0, 7).reverse();
  const chartData = {
    labels: recent.map(e =>
      e.createdAt.toLocaleDateString().slice(0,5)
    ),
    datasets: [{ data: recent.map(e => e.mood) }],
  };
  const screenWidth = Dimensions.get('window').width - 32;

  const renderItem = ({ item }) => (
    <View style={styles.entry}>
      <Text style={styles.entryHeader}>
        {item.createdAt.toLocaleString()}
      </Text>
      <Text style={styles.entryMood}>Mood: {item.mood}/10</Text>
      <Text style={styles.entryText}>{item.journal}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Form & Chart Toggle */}
      <Text style={styles.header}>Daily Mood & Journal</Text>

      {entries.length > 1 && (
        <View style={styles.trend}>
          <Ionicons
            name={trend >= 0 ? 'trending-up' : 'trending-down'}
            size={20}
            color={trend >= 0 ? '#4caf50' : '#f44336'}
          />
          <Text style={styles.trendText}>
            {Math.abs(trend)} point{Math.abs(trend)===1?'':'s'}{' '}
            {trend >= 0 ? 'higher' : 'lower'} than yesterday
          </Text>
        </View>
      )}

      <Text style={styles.label}>Mood (1–10):</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        placeholder="e.g. 7"
        value={mood}
        onChangeText={setMood}
      />

      <Text style={styles.label}>Journal:</Text>
      <TextInput
        style={[styles.input, styles.journal]}
        placeholder="How are you feeling?"
        multiline
        value={journal}
        onChangeText={setJournal}
      />

      <Button title="Save Entry" onPress={saveEntry} />

      {entries.length > 1 && (
        <TouchableOpacity
          style={styles.chartToggle}
          onPress={() => setShowChart(v => !v)}
        >
          <Text style={styles.chartToggleText}>
            {showChart ? 'Hide Trends' : 'Show Trends'}
          </Text>
        </TouchableOpacity>
      )}

      {showChart && recent.length > 0 && (
        <LineChart
          data={chartData}
          width={screenWidth}
          height={180}
          chartConfig={{
            backgroundGradientFrom: '#fafafa',
            backgroundGradientTo: '#fafafa',
            decimalPlaces: 0,
            color: (opacity=1) => `rgba(0,122,255,${opacity})`,
            labelColor: () => '#333',
            propsForDots: { r:'4', strokeWidth:'2', stroke:'#007AFF' },
          }}
          style={styles.chart}
          bezier
        />
      )}

      {/* Past Entries List */}
      <FlatList
        data={entries}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#fafafa', padding:16 },
  header:{ fontSize:22, fontWeight:'600', textAlign:'center'},
  trend:{ flexDirection:'row', alignItems:'center',justifyContent:'center',marginVertical:8},
  trendText:{ marginLeft:6, color:'#555' },
  label:{ marginTop:12, fontSize:16, color:'#333'},
  input:{ borderWidth:1,borderColor:'#CCC',borderRadius:6,padding:8,marginTop:4 },
  journal:{ height:80, textAlignVertical:'top' },
  chartToggle:{ marginVertical:12, alignSelf:'center', backgroundColor:'#007AFF', padding:8, borderRadius:4},
  chartToggleText:{ color:'#fff', fontWeight:'500'},
  chart:{ marginVertical:8, borderRadius:6 },
  entry:{ backgroundColor:'#fff', padding:12, borderRadius:6, marginVertical:6, elevation:1 },
  entryHeader:{ fontSize:12, color:'#666' },
  entryMood:{ fontSize:16, fontWeight:'600', marginTop:4 },
  entryText:{ marginTop:4, fontSize:14, color:'#333' },
});
