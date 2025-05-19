// App.js
import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import HomeScreen from './screens/HomeScreen';
import SummaryScreen from './screens/SummaryScreen';
import PressureReliefScreen from './screens/PressureReliefScreen';
import BladderSchedulerScreen from './screens/BladderSchedulerScreen';
import FunctionalGoalsScreen from './screens/FunctionalGoalsScreen';
import PainLogScreen from './screens/PainLogScreen';
import CaregiverPortalScreen from './screens/CaregiverPortalScreen';
import MentalHealthScreen from './screens/MentalHealthScreen';

import ChatLoginScreen from './screens/ChatLoginScreen';
import CreateAccountScreen from './screens/CreateAccountScreen';  // ← import added
import SubscriptionScreen from './screens/SubscriptionScreen';
import ChatBotScreen from './screens/ChatBotScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: '#007AFF' },
          headerTintColor: '#fff',
          headerBackTitleVisible: true,
          headerBackTitle: 'Back',
        }}
      >
        {/* Main dashboard */}
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'MEdico' }}
        />
        <Stack.Screen
          name="Summary"
          component={SummaryScreen}
          options={{ title: 'Progress Summary' }}
        />
        <Stack.Screen
          name="PressureRelief"
          component={PressureReliefScreen}
          options={{ title: 'Pressure-Relief Timer',
            unmountOnBlur: false, // Reset timer when navigating away
           }}
        />
        <Stack.Screen
          name="BladderScheduler"
          component={BladderSchedulerScreen}
          options={{ title: 'Bladder Scheduler' }}
        />
        <Stack.Screen
          name="FunctionalGoals"
          component={FunctionalGoalsScreen}
          options={{ title: 'Functional Goals' }}
        />
        <Stack.Screen
          name="PainLog"
          component={PainLogScreen}
          options={{ title: 'Pain Log' }}
        />
        <Stack.Screen
          name="CaregiverPortal"
          component={CaregiverPortalScreen}
          options={{ title: 'Caregiver Portal' }}
        />
        <Stack.Screen
          name="MentalHealth"
          component={MentalHealthScreen}
          options={{ title: 'Mental Health & Journal' }}
        />
        {/* Chat flow (triggered only via the FAB) */}
        <Stack.Screen
          name="ChatLogin"
          component={ChatLoginScreen}
          options={{ title: 'Sign In to Chat' }}
        />
        <Stack.Screen
          name="CreateAccount"
          component={CreateAccountScreen}
          options={{ title: 'Create Account' }}
        />
        <Stack.Screen
          name="Subscription"
          component={SubscriptionScreen}
          options={{ title: 'Subscription Plans' }}
        />
        <Stack.Screen
          name="ChatBot"
          component={ChatBotScreen}
          options={{ title: 'Therapy Chat' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
