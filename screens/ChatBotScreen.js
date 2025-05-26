// screens/ChatBotScreen.js
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { auth } from '../firebase';
import { OPENAI_API_KEY } from '../config';

export default function ChatBotScreen({ navigation }) {
  // add logout to header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={async () => {
            try {
              await auth.signOut();
              navigation.replace('ChatLogin');
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
  const [recording, setRecording] = useState(null);
  const [playingUri, setPlayingUri] = useState(null);
  const flatRef = useRef();

  // text message send
  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    const userMsg = {
      id: `user-${Date.now()}`,
      from: 'user',
      type: 'text',
      text,
    };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setSending(true);
    // prepare OpenAI payload
    const apiMessages = [
      { role: 'system', content: 'You are a caring, empathetic mental health assistant.' },
      ...messages.map(m => ({
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
      setMessages(m => [...m, botMsg]);
    } catch (err) {
      console.error(err);
      setMessages(m => [
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

  // record audio
  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Microphone access is required.');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await rec.startAsync();
      setRecording(rec);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };
  const stopRecording = async () => {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      // add voice message bubble
      const voiceMsg = {
        id: `user-voice-${Date.now()}`,
        from: 'user',
        type: 'audio',
        uri,
      };
      setMessages(m => [...m, voiceMsg]);
      // TODO: forward URI to backend or AI if desired
    } catch (err) {
      console.error('Failed to stop recording', err);
    } finally {
      flatRef.current?.scrollToEnd({ animated: true });
    }
  };

  // play a voice bubble
  const playAudio = async uri => {
    try {
      setPlayingUri(uri);
      const { sound } = await Audio.Sound.createAsync({ uri });
      await sound.playAsync();
      // unload after playback
      sound.setOnPlaybackStatusUpdate(status => {
        if (status.didJustFinish) {
          sound.unloadAsync();
          setPlayingUri(null);
        }
      });
    } catch (err) {
      console.error('Playback error', err);
    }
  };

  // render text or audio bubble
  const renderItem = ({ item }) => {
    if (item.type === 'audio') {
      return (
        <TouchableOpacity
          style={[styles.bubble, item.from === 'user' ? styles.userBubble : styles.botBubble]}
          onPress={() => playAudio(item.uri)}
        >
          <Ionicons
            name={playingUri === item.uri ? 'pause' : 'play'}
            size={24}
            color={item.from === 'user' ? '#fff' : '#333'}
          />
          <Text style={[styles.bubbleText, { marginLeft: 8 }]}>
            Voice Message
          </Text>
        </TouchableOpacity>
      );
    }
    return (
      <View style={[styles.bubble, item.from === 'user' ? styles.userBubble : styles.botBubble]}>
        <Text style={styles.bubbleText}>{item.text}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: 'padding', android: null })}
      keyboardVerticalOffset={Platform.select({ ios: 90, android: 0 })}
    >
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.chatContainer}
      />

      {sending && (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color="#555" />
        </View>
      )}

      <View style={styles.inputRow}>
        {/* mic button: hold to record */}
        <TouchableOpacity
          onPressIn={startRecording}
          onPressOut={stopRecording}
          style={styles.micButton}
        >
          <Ionicons
            name={recording ? 'mic-off-outline' : 'mic-outline'}
            size={24}
            color={recording ? '#f44336' : '#007AFF'}
          />
        </TouchableOpacity>

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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f6f6' },
  chatContainer: { padding: 12, paddingBottom: 24 },
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
  bubbleText: { fontSize: 16, lineHeight: 22, color: '#333' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  micButton: {
    padding: 8,
    marginRight: 4,
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
