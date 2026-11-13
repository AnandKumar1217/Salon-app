import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';

// Auth & Common screens
import { SplashScreen } from '../screens/auth/SplashScreen';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { RoleSelectionScreen } from '../screens/auth/RoleSelectionScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { OtpVerificationScreen } from '../screens/auth/OtpVerificationScreen';
import { ProfileSetupScreen } from '../screens/auth/ProfileSetupScreen';

// Owner Auth & Status screens
import { OwnerRegistrationWizard } from '../screens/auth/OwnerRegistrationWizard';
import { PendingApprovalScreen } from '../screens/auth/PendingApprovalScreen';
import { RejectedApplicationScreen } from '../screens/auth/RejectedApplicationScreen';
import { SuspendedAccountScreen } from '../screens/auth/SuspendedAccountScreen';

// Customer Mode Navigators & Screens
import { BottomTabNavigator } from './BottomTabNavigator';
import { SalonDetailScreen } from '../screens/discovery/SalonDetailScreen';
import { BookingFlowScreen } from '../screens/booking/BookingFlowScreen';
import { BookingConfirmationScreen } from '../screens/booking/BookingConfirmationScreen';
import { AppointmentDetailScreen } from '../screens/appointments/AppointmentDetailScreen';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { SavedSalonsScreen } from '../screens/profile/SavedSalonsScreen';
import { HelpSupportScreen } from '../screens/profile/HelpSupportScreen';
import { TermsPrivacyScreen } from '../screens/profile/TermsPrivacyScreen';

// Owner Mode Navigators & Screens
import { OwnerTabNavigator } from './OwnerTabNavigator';
import { SalonProfileEditScreen } from '../screens/owner/more/SalonProfileEditScreen';
import { SalonQrCodeScreen } from '../screens/owner/more/SalonQrCodeScreen';
import { OwnerReportsScreen } from '../screens/owner/more/OwnerReportsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {/* 1. Splash, Onboarding & Role Selection */}
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />

      {/* 2. Authentication & Profile Setup */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />

      {/* 3. Owner Status & Onboarding Wizard */}
      <Stack.Screen name="OwnerRegistrationWizard" component={OwnerRegistrationWizard} />
      <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
      <Stack.Screen name="RejectedApplication" component={RejectedApplicationScreen} />
      <Stack.Screen name="SuspendedAccount" component={SuspendedAccountScreen} />

      {/* 4. Customer Mode Bottom Tabs & Detail Screens */}
      <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
      <Stack.Screen name="SalonDetail" component={SalonDetailScreen} />
      <Stack.Screen name="BookingFlow" component={BookingFlowScreen} />
      <Stack.Screen name="BookingConfirmation" component={BookingConfirmationScreen} />
      <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="SavedSalons" component={SavedSalonsScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="TermsPrivacy" component={TermsPrivacyScreen} />

      {/* 5. Salon Owner Mode Bottom Tabs & Sub-screens */}
      <Stack.Screen name="OwnerTabs" component={OwnerTabNavigator} />
      <Stack.Screen name="SalonProfileEdit" component={SalonProfileEditScreen} />
      <Stack.Screen name="SalonQrCode" component={SalonQrCodeScreen} />
      <Stack.Screen name="OwnerReports" component={OwnerReportsScreen} />
    </Stack.Navigator>
  );
};
