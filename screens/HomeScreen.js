// screens/HomeScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
  Entypo,
} from '@expo/vector-icons';
import Svg, { Defs, Path, Text as SvgText, TextPath } from 'react-native-svg';

const features = [
  {
    key: 'PressureRelief',
    title: 'Pressure Timer',
    icon: <MaterialCommunityIcons name="timer-sand" size={32} color="#fff" />,
    color: '#4caf50',
    desc: 'Set reminders to shift weight',
  },
  {
    key: 'BladderScheduler',
    title: 'Bladder Scheduler',
    icon: <Ionicons name="water-outline" size={32} color="#fff" />,
    color: '#2196f3',
    desc: 'Log catheter & fluid times',
  },
  {
    key: 'FunctionalGoals',
    title: 'Rehab Goals',
    icon: <FontAwesome5 name="running" size={32} color="#fff" />,
    color: '#ff9800',
    desc: 'Track PT/OT milestones',
  },
  {
    key: 'PainLog',
    title: 'Pain Log',
    icon: <Entypo name="emoji-sad" size={32} color="#fff" />,
    color: '#f44336',
    desc: 'Record pain type & rating',
  },
  {
    key: 'CaregiverPortal',
    title: 'Caregiver Portal',
    icon: <Ionicons name="people-circle-outline" size={32} color="#fff" />,
    color: '#9c27b0',
    desc: 'Share real-time updates',
  },
  {
    key: 'MentalHealth',
    title: 'Mental Journal',
    icon: <FontAwesome5 name="brain" size={32} color="#fff" />,
    color: '#3f51b5',
    desc: 'Log mood & reflections',
  },
];

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logo}
        />
        <Text style={styles.header}>Welcome to MEdico</Text>

        <View style={styles.grid}>
          {features.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.card, { backgroundColor: f.color }]}
              onPress={() => navigation.navigate(f.key)}
              activeOpacity={0.8}
            >
              {f.icon}
              <Text style={styles.cardTitle}>{f.title}</Text>
              <Text style={styles.cardDesc}>{f.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Floating Chat+AI Button */}
      <TouchableOpacity
        style={styles.chatFab}
        onPress={() => navigation.navigate('Subscription')}
        activeOpacity={0.7}
      >
        <Svg
          width={56}
          height={56}
          viewBox="0 0 56 56"
          style={StyleSheet.absoluteFill}
        >
          <Defs>
            <Path
              id="circlePath"
              d="M28,28 m-20,0 a20,20 0 1,1 40,0 a20,20 0 1,1 -40,0"
            />
          </Defs>
          <SvgText fill="#fff" fontSize="8" fontWeight="600">
            <TextPath href="#circlePath" startOffset="0%">
              MEdico AI • MEdico AI
            </TextPath>
          </SvgText>
        </Svg>
        <Ionicons name="chatbubble-ellipses" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    padding: 16,
    alignItems: 'center',
    paddingBottom: 100, // space for FAB
  },
  logo: {
    width: 100,
    height: 100,
    marginVertical: 16,
    resizeMode: 'contain',
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '47%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  cardDesc: {
    color: '#e0e0e0',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  chatFab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3f51b5',
    elevation: 5,
  },
});
