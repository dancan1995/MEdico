// screens/ChatCaregiverScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, firestore } from '../firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';

export default function ChatCaregiverScreen() {
  const [msg, setMsg] = useState('');
  const [chat, setChat] = useState([]);
  const flatRef = useRef();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(firestore, 'users', user.uid, 'caregiverChats'),
      orderBy('createdAt', 'asc')
    );
    return onSnapshot(q, snap =>
      setChat(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, [user]);

  const send = async () => {
    if (!msg.trim()) return;
    await addDoc(
      collection(firestore, 'users', user.uid, 'caregiverChats'),
      {
        text: msg.trim(),
        sender: 'patient',
        createdAt: serverTimestamp(),
      }
    );
    setMsg('');
  };

  const renderItem = ({ item }) => (
    <View
      style={[
        styles.bubble,
        item.sender === 'patient' ? styles.mine : styles.theirs,
      ]}
    >
      <Text style={styles.bubbleText}>{item.text}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.select({ ios: 90, android: 0 })}
      >
        <FlatList
          ref={flatRef}
          data={chat}
          keyExtractor={i => i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.chatContainer}
          onContentSizeChange={() =>
            flatRef.current?.scrollToEnd({ animated: true })
          }
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={msg}
            onChangeText={setMsg}
            placeholder="Type your message..."
            placeholderTextColor="#777"
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <TouchableOpacity onPress={send} style={styles.sendBtn}>
            <Ionicons name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: '#E0F7FA',
  },
  header: {
    height: 56,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  headerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  chatContainer: {
    padding: 12,
    paddingBottom: 80, // leave room for input
  },
  bubble: {
    marginVertical: 4,
    padding: 12,
    borderRadius: 16,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  mine: {
    backgroundColor: '#3F51B5',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 0,
  },
  theirs: {
    backgroundColor: '#9C27B0',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 0,
  },
  bubbleText: {
    color: '#fff',
    fontSize: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderColor: '#B2EBF2',
    backgroundColor: '#E0F7FA',
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#81D4FA',
  },
  sendBtn: {
    marginLeft: 8,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    padding: 12,
    elevation: 2,
  },
});
