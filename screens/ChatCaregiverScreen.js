import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  Animated,
  Platform,
  Alert,
  TouchableWithoutFeedback,
  Easing,
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
import { Swipeable, RectButton } from 'react-native-gesture-handler';

const CAREGIVER_PHONE = '+19788008478';

export default function ChatCaregiverScreen() {
  const insets = useSafeAreaInsets();
  const [msg, setMsg] = useState('');
  const [messages, setMessages] = useState([]);
  const keyboardHeight = useRef(new Animated.Value(0)).current;
  const listRef = useRef(null);
  const uid = auth.currentUser?.uid;

  // Firestore subscription
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
      const raw = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(insertDateSeparators(raw));
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    });
  }, [uid]);

  // Keyboard height animation
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const subShow = Keyboard.addListener(showEvent, e => {
      Animated.timing(keyboardHeight, {
        toValue: e.endCoordinates.height,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();
    });
    const subHide = Keyboard.addListener(hideEvent, () => {
      Animated.timing(keyboardHeight, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

  // Send message
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
      { from: 'patient', text, ts: serverTimestamp() }
    );
    setMsg('');
  };

  // Delete message
  const deleteMessage = async id => {
    try {
      await deleteDoc(
        doc(
          firestore,
          'users',
          uid,
          'caregiverChats',
          CAREGIVER_PHONE,
          'messages',
          id
        )
      );
    } catch {
      Alert.alert('Error', 'Could not delete message.');
    }
  };

  // Insert date separators
  function insertDateSeparators(msgs) {
    const result = [];
    let lastDate = null;

    for (let m of msgs) {
      if (!m.ts) continue;
      const dateObj = m.ts.toDate();              // 📌 call toDate()
      const dateStr = dateObj.toDateString();

      if (dateStr !== lastDate) {
        result.push({ id: `date-${dateStr}`, type: 'date', date: dateObj });
        lastDate = dateStr;
      }
      result.push({ ...m, type: 'message' });
    }
    return result;
  }

  // Swipeable delete button
  const renderRightActions = (progress, dragX, messageId) => (
    <RectButton
      style={styles.deleteButton}
      onPress={() => deleteMessage(messageId)}
    >
      <Ionicons name="trash" size={24} color="#fff" />
    </RectButton>
  );

  // Render each item
  function renderItem({ item }) {
    if (item.type === 'date') {
      const today = new Date().toDateString();
      const label =
        item.date.toDateString() === today
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
    const dateObj = item.ts?.toDate();            // 📌 call toDate()
    const time = dateObj
      ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';
    const fullStamp = dateObj
      ? dateObj.toLocaleString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';

    return (
      <Swipeable
        renderRightActions={(p, d) => renderRightActions(p, d, item.id)}
      >
        <View style={[styles.bubbleContainer, isMine ? styles.right : styles.left]}>
          <View style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}>
            <Text style={isMine ? styles.myText : styles.theirText}>
              {item.text}
            </Text>
          </View>
        </View>

        {/* Timestamp below bubble */}
        {fullStamp ? (
          <Text style={[styles.timestamp, isMine ? styles.right : styles.left]}>
            {time}
          </Text>
        ) : null}
      </Swipeable>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <Animated.View style={[styles.container, { paddingBottom: keyboardHeight }]}>
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={i => i.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({ animated: true })
            }
          />

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Type your message…"
              placeholderTextColor="#888"
              value={msg}
              onChangeText={setMsg}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, !msg.trim() && styles.sendButtonDisabled]}
              onPress={send}
              disabled={!msg.trim()}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const PRIMARY = '#007aff';
const THEIR_BG = '#e8f0ff';
const MINE_BG = '#007aff';

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f7f9fc' },
  container: { flex: 1, backgroundColor: '#f7f9fc' },
  list: { padding: 16, paddingBottom: 8 },
  bubbleContainer: { marginBottom: 4, flexDirection: 'row' },
  right: { justifyContent: 'flex-end' },
  left: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 18 },
  myBubble: { backgroundColor: MINE_BG, borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: THEIR_BG, borderBottomLeftRadius: 4 },
  myText: { color: '#fff', fontSize: 15 },
  theirText: { color: '#222', fontSize: 15 },
  timestamp: {
    fontSize: 11,
    color: '#666',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  dateLine: { alignItems: 'center', marginVertical: 8 },
  dateText: {
    fontSize: 13,
    backgroundColor: '#d0d0d0',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
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
  sendButtonDisabled: { backgroundColor: '#aacfff' },
  deleteButton: {
    backgroundColor: '#e33057',
    justifyContent: 'center',
    alignItems: 'center',
    width: 64,
    marginVertical: 4,
    borderRadius: 8,
  },
});
