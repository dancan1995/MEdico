// screens/ChatCaregiverScreen.js
//
// A sleeker, WhatsApp-style chat screen.
//  • Rounded coloured bubbles
//  • “Send” button with icon, disabled until text is entered
//  • Keyboard-aware footer so the input never hides
//  • Auto–scroll to bottom on new messages
//

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, firestore } from '../firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';

const CAREGIVER_PHONE = '+19788008478'; // pull from profile in production

export default function ChatCaregiverScreen() {
  const [msg, setMsg] = useState('');
  const [messages, setMessages] = useState([]);
  const listRef = useRef(null);
  const uid = auth.currentUser?.uid;

  /* ───── realtime listener ───── */
  useEffect(() => {
    if (!uid) return;
    const col = collection(
      firestore,
      'users',
      uid,
      'caregiverChats',
      CAREGIVER_PHONE,
      'messages'
    );
    const q = query(col, orderBy('ts', 'asc'));
    return onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      // auto scroll next frame
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    });
  }, [uid]);

  /* ───── send handler ───── */
  const send = async () => {
    if (!msg.trim()) return;
    await addDoc(
      collection(
        firestore,
        'users',
        uid,
        'caregiverChats',
        CAREGIVER_PHONE,
        'messages'
      ),
      { from: 'patient', text: msg.trim(), ts: serverTimestamp() }
    );
    setMsg('');
  };

  /* ───── message bubble ───── */
  const renderItem = ({ item }) => {
    const mine = item.from === 'patient';
    return (
      <View
        style={[
          styles.bubble,
          mine ? styles.meBubble : styles.themBubble,
        ]}
      >
        <Text style={mine ? styles.meText : styles.themText}>{item.text}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={msg}
          onChangeText={setMsg}
          placeholder="Type a message…"
          placeholderTextColor="#999"
          multiline
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            !msg.trim() && styles.sendBtnDisabled,
          ]}
          onPress={send}
          disabled={!msg.trim()}
        >
          <Ionicons
            name="send"
            size={22}
            color="#fff"
            style={{ marginLeft: 1 }}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ───── styles ───── */
const PRIMARY = '#007aff';
const LIGHT_BG = '#f0f4ff';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  list: { padding: 14, paddingBottom: 4 },
  /* bubbles */
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    marginBottom: 10,
  },
  meBubble: {
    backgroundColor: PRIMARY,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  themBubble: {
    backgroundColor: LIGHT_BG,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  meText: { color: '#fff', fontSize: 15 },
  themText: { color: '#222', fontSize: 15 },
  /* input row */
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
  },
  input: {
    flex: 1,
    maxHeight: 120,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  sendBtn: {
    marginLeft: 8,
    backgroundColor: PRIMARY,
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  sendBtnDisabled: {
    backgroundColor: '#a3c4ff',
  },
});
