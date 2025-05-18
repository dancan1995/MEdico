// App.js
import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import HomeScreen from './screens/HomeScreen';
import PressureReliefScreen from './screens/PressureReliefScreen';
import BladderSchedulerScreen from './screens/BladderSchedulerScreen';
import FunctionalGoalsScreen from './screens/FunctionalGoalsScreen';
import PainLogScreen from './screens/PainLogScreen';
import CaregiverPortalScreen from './screens/CaregiverPortalScreen';
import MentalHealthScreen from './screens/MentalHealthScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'MEdico' }}
        />
        <Stack.Screen
          name="PressureRelief"
          component={PressureReliefScreen}
          options={{ title: 'Pressure-Relief Timer' }}
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
