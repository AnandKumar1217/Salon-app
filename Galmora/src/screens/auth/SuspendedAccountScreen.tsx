import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { colors, typography, spacing, borderRadius } from '../../constants/theme';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SuspendedAccount'>;
  route: RouteProp<RootStackParamList, 'SuspendedAccount'>;
};

export const SuspendedAccountScreen: React.FC<Props> = ({ navigation, route }) => {
  const { user, logout } = useAuth();
  const reason =
    route.params?.reason ||
    user?.rejectionReason ||
    'Your salon account has been temporarily suspended due to repeated unhonored bookings or policy violations.';

  const handleContactSupport = () => {
    Linking.openURL('mailto:merchants@glamora.example?subject=Salon%20Account%20Appeal');
  };

  const handleLogout = async () => {
    await logout();
    navigation.replace('RoleSelection');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Graphic */}
        <View style={styles.iconCircle}>
          <Ionicons name="lock-closed" size={44} color="#D32F2F" />
        </View>

        <Text style={styles.title}>Salon Account Suspended</Text>
        <Text style={styles.subtitle}>
          Operational access to the Glamora Salon Owner portal for this account has been disabled.
        </Text>

        {/* Reason Card */}
        <View style={styles.reasonCard}>
          <Text style={styles.reasonHeading}>Notice & Findings</Text>
          <Text style={styles.reasonText}>{reason}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionBlock}>
          <Button
            title="Contact Merchant Compliance Support"
            onPress={handleContactSupport}
            size="lg"
            leftIcon="mail"
            style={styles.actionBtn}
          />

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Log Out of Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.huge + 20,
    paddingBottom: spacing.huge,
    alignItems: 'center',
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.sm + 1,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  reasonCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: '#D32F2F',
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.xxl,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  reasonHeading: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: '#D32F2F',
    marginBottom: spacing.xs,
  },
  reasonText: {
    fontSize: typography.fontSize.sm + 1,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  actionBlock: {
    width: '100%',
    alignItems: 'center',
  },
  actionBtn: {
    width: '100%',
    marginBottom: spacing.md,
  },
  logoutBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  logoutText: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    fontWeight: '600',
  },
});

