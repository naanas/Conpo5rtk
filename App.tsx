// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import komponen LoginScreen Anda
import LoginScreen from './src/LoginScreen';
// Import komponen DashboardScreen yang baru dibuat
import DashboardScreen from './src/DashboardScreen'; // Sesuaikan path jika DashboardScreen.js berada di lokasi lain

// Buat Stack Navigator
const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        {/* Layar Login */}
        <Stack.Screen name="Login" component={LoginScreen} />

        {/* Layar Dashboard yang akan dituju setelah login berhasil */}
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;