import React, { useState, useRef, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../firebase';
import { OPENAI_API_KEY } from '../config';

export default function ChatBotScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={async () => {
            try {
              await auth.signOut();
              navigation.reset({
                index: 0,
                routes: [{ name: 'ChatLogin' }],
              });
            } catch (err) {
              Alert.alert('Logout Error', err.message);
            }
          }}
          style={{ marginRight: 16 }}
        >
          <Ionicons name="log-out-outline" size={24} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'bot-1',
      from: 'bot',
      type: 'text',
      text: 'Hi there! I’m here to listen. What’s on your mind today?',
    },
  ]);
  const [sending, setSending] = useState(false);
  const flatRef = useRef();

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    const userMsg = {
      id: `user-${Date.now()}`,
      from: 'user',
      type: 'text',
      text,
    };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setSending(true);

    const apiMessages = [
      { role: 'system', content: 'You are a caring, empathetic mental health assistant.' },
      ...messages.map((m) => ({
        role: m.from === 'user' ? 'user' : 'assistant',
        content: m.type === 'text' ? m.text : '[voice message]',
      })),
      { role: 'user', content: text },
    ];

    try {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: apiMessages,
          temperature: 0.7,
          max_tokens: 400,
        }),
      });
      const data = await resp.json();
      const botText = data.choices[0].message.content.trim();
      const botMsg = {
        id: `bot-${Date.now()}`,
        from: 'bot',
        type: 'text',
        text: botText,
      };
      setMessages((m) => [...m, botMsg]);
    } catch (err) {
      console.error(err);
      setMessages((m) => [
        ...m,
        {
          id: `bot-${Date.now()}`,
          from: 'bot',
          type: 'text',
          text: 'Sorry, something went wrong. Please try again.',
        },
      ]);
    } finally {
      setSending(false);
      flatRef.current?.scrollToEnd({ animated: true });
    }
  };

  const renderItem = ({ item }) => (
    <View
      style={[
        styles.bubble,
        item.from === 'user' ? styles.userBubble : styles.botBubble,
      ]}
    >
      <Text style={styles.bubbleText}>{item.text}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.select({ ios: 'padding', android: 'height' })}
        keyboardVerticalOffset={Platform.select({ ios: 90, android: 80 })}
      >
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.chatContainer}
        />

        {sending && (
          <View style={styles.loading}>
            <ActivityIndicator size="small" color="#555" />
          </View>
        )}

        <View style={[styles.inputRow, { paddingBottom: Platform.OS === 'ios' ? 12 : 35 }]}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            placeholderTextColor="#999"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Ionicons name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f6f6f6',
  },
  container: {
    flex: 1,
    backgroundColor: '#f6f6f6',
  },
  chatContainer: {
    padding: 12,
    paddingBottom: 16,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    padding: 12,
    borderRadius: 16,
    maxWidth: '80%',
  },
  userBubble: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 0,
  },
  botBubble: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 0,
  },
  bubbleText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#eee',
    fontSize: 16,
    color: '#000',
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loading: {
    position: 'absolute',
    top: 8,
    right: 16,
  },
});
