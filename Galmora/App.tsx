import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import { OwnerSalonProvider } from './src/context/OwnerSalonContext';
import { LocationProvider } from './src/context/LocationContext';
import { BookingsProvider } from './src/context/BookingsContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AuthProvider>
          <OwnerSalonProvider>
            <LocationProvider>
              <BookingsProvider>
                <StatusBar style="dark" />
                <RootNavigator />
              </BookingsProvider>
            </LocationProvider>
          </OwnerSalonProvider>
        </AuthProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
