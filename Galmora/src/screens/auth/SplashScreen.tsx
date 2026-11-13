import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors, typography, spacing } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Splash'>;
};

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const { isLoading, isOnboarded, isAuthenticated, user, isOwnerAuthorized } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        if (!isOnboarded) {
          navigation.replace('Onboarding');
        } else if (!isAuthenticated) {
          navigation.replace('RoleSelection');
        } else if (user?.activeMode === 'OWNER') {
          if (isOwnerAuthorized) {
            navigation.replace('OwnerTabs', { screen: 'DashboardTab' });
          } else if (user.applicationStatus === 'PENDING_APPROVAL') {
            navigation.replace('PendingApproval');
          } else if (user.applicationStatus === 'REJECTED') {
            navigation.replace('RejectedApplication', { reason: user.rejectionReason });
          } else if (user.applicationStatus === 'SUSPENDED') {
            navigation.replace('SuspendedAccount', { reason: user.rejectionReason });
          } else {
            navigation.replace('OwnerRegistrationWizard');
          }
        } else {
          navigation.replace('MainTabs', { screen: 'HomeTab' });
        }
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isOnboarded, isAuthenticated, user, isOwnerAuthorized]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.logoContainer}>
        <View style={styles.brandIcon}>
          <Text style={styles.brandLetter}>G</Text>
        </View>
        <Text style={styles.brandName}>Glamora</Text>
        <Text style={styles.tagline}>Curated Salons & Seamless Bookings</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.versionText}>Version 1.0.0 • Production</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.huge,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    elevation: 4,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  brandLetter: {
    fontSize: 38,
    fontWeight: '700',
    color: '#FAF7F2',
    fontStyle: 'italic',
  },
  brandName: {
    fontSize: typography.fontSize.xxl + 4,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1.5,
  },
  tagline: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    letterSpacing: 0.4,
  },
  footer: {
    alignItems: 'center',
  },
  versionText: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  },
});
