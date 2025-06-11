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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, firestore } from '../firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';

const CAREGIVER_PHONE = '+19788008478';

export default function ChatCaregiverScreen() {
  const insets = useSafeAreaInsets();
  const [msg, setMsg] = useState('');
  const [messages, setMessages] = useState([]);
  const listRef = useRef(null);
  const uid = auth.currentUser?.uid;

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

    return onSnapshot(q, (snap) => {
      const raw = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const withDates = insertDateSeparators(raw);
      setMessages(withDates);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    });
  }, [uid]);

  const send = async () => {
    const text = msg.trim();
    if (!text) return;

    await addDoc(
      collection(
        firestore,
        'users',
        uid,
        'caregiverChats',
        CAREGIVER_PHONE,
        'messages'
      ),
      {
        from: 'patient',
        text,
        ts: serverTimestamp(),
      }
    );
    setMsg('');
  };

  const deleteMessage = async (messageId) => {
    try {
      await deleteDoc(
        doc(
          firestore,
          'users',
          uid,
          'caregiverChats',
          CAREGIVER_PHONE,
          'messages',
          messageId
        )
      );
    } catch (err) {
      Alert.alert('Error', 'Could not delete message.');
    }
  };

  const insertDateSeparators = (msgs) => {
    let result = [];
    let lastDate = null;

    for (let msg of msgs) {
      if (!msg.ts?.toDate) continue;

      const dateObj = new Date(msg.ts.toDate());
      const dateStr = dateObj.toDateString();

      if (dateStr !== lastDate) {
        result.push({
          id: `date-${dateStr}`,
          type: 'date',
          date: dateObj,
        });
        lastDate = dateStr;
      }

      result.push({ ...msg, type: 'message' });
    }

    return result;
  };

  const renderItem = ({ item }) => {
    if (item.type === 'date') {
      const now = new Date();
      const todayStr = now.toDateString();
      const label = item.date.toDateString() === todayStr
        ? 'Today'
        : item.date.toLocaleDateString(undefined, {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });

      return (
        <View style={styles.dateLine}>
          <Text style={styles.dateText}>{label}</Text>
        </View>
      );
    }

    const isMine = item.from === 'patient';
    const time = item.ts?.toDate
      ? new Date(item.ts.toDate()).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '...';

    return (
      <View
        style={[
          styles.bubbleContainer,
          isMine ? styles.right : styles.left,
        ]}
      >
        <TouchableOpacity
          onLongPress={() => deleteMessage(item.id)}
          style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}
        >
          <Text style={isMine ? styles.myText : styles.theirText}>
            {item.text}
          </Text>
          <Text style={styles.timeInside}>{time}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={[styles.inputRow, { paddingBottom: 4 }]}>
          <TextInput
            style={styles.input}
            placeholder="Type your message…"
            placeholderTextColor="#888"
            value={msg}
            onChangeText={setMsg}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !msg.trim() && styles.sendButtonDisabled,
            ]}
            onPress={send}
            disabled={!msg.trim()}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ───── Styles ─────
const PRIMARY = '#007aff';
const THEIR_BG = '#e8f0ff';
const MINE_BG = '#007aff';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f9fc',
  },
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc',
  },
  list: {
    padding: 16,
    paddingBottom: 8,
  },
  bubbleContainer: {
    marginBottom: 12,
    flexDirection: 'row',
  },
  right: {
    justifyContent: 'flex-end',
  },
  left: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    position: 'relative',
  },
  myBubble: {
    alignSelf: 'flex-end',
    backgroundColor: MINE_BG,
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    alignSelf: 'flex-start',
    backgroundColor: THEIR_BG,
    borderBottomLeftRadius: 4,
  },
  myText: {
    color: '#fff',
    fontSize: 15,
  },
  theirText: {
    color: '#222',
    fontSize: 15,
  },
  timeInside: {
    fontSize: 11,
    color: '#ccc',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  dateLine: {
    alignItems: 'center',
    marginVertical: 8,
  },
  dateText: {
    fontSize: 13,
    backgroundColor: '#d0d0d0',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    overflow: 'hidden',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#fff',
    color: '#000',
  },
  sendButton: {
    marginLeft: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#aacfff',
  },
});
