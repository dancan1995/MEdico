// screens/ChatBotScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';

export default function ChatBotScreen() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { id: '1', from: 'bot', text: 'Hi! How can I help today?' },
  ]);

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages((m) => [...m, { id: Date.now().toString(), from: 'user', text: input }]);
    setInput('');
    // TODO: call AI API, then append bot response
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.msgBubble,
              item.from === 'user' ? styles.userBubble : styles.botBubble,
            ]}
          >
            <Text style={styles.msgText}>{item.text}</Text>
          </View>
        )}
        contentContainerStyle={{ paddingVertical: 12 }}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={input}
          onChangeText={setInput}
        />
        <Button title="Send" onPress={sendMessage} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  msgBubble: {
    marginVertical: 4,
    padding: 10,
    borderRadius: 8,
    maxWidth: '80%',
  },
  userBubble: {
    backgroundColor: '#DCF8C6',
    alignSelf: 'flex-end',
  },
  botBubble: {
    backgroundColor: '#ECECEC',
    alignSelf: 'flex-start',
  },
  msgText: { fontSize: 14 },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 20,
    paddingHorizontal: 12,
    marginRight: 8,
    height: 40,
  },
});
