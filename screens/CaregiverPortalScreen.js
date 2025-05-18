// screens/CaregiverPortalScreen.js
import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

export default function CaregiverPortalScreen() {
  // placeholder: in real app you'd fetch this from server or context
  const [events] = useState([
    { id: '1', text: 'Missed pressure relief at 10:30 AM' },
    { id: '2', text: 'Bladder routine completed at 2:00 PM' },
  ]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Caregiver Updates</Text>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text style={styles.item}>• {item.text}</Text>}
        ListEmptyComponent={<Text>No updates yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  item: { marginVertical: 4 },
});
