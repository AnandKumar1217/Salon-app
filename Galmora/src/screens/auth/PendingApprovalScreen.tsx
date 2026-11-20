import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { colors, typography, spacing, borderRadius, STATUS_BAR_HEIGHT } from '../../constants/theme';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useHardwareBackHandler } from '../../utils/navigationUtils';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PendingApproval'>;
};

export const PendingApprovalScreen: React.FC<Props> = ({ navigation }) => {
  const { user, ownerApplication, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigation.replace('RoleSelection');
  };

  useHardwareBackHandler(() => {
    navigation.replace('RoleSelection');
    return true;
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Graphic */}
        <View style={styles.iconCircle}>
          <Ionicons name="time" size={48} color={colors.warning} />
        </View>

        <Text style={styles.title}>Salon Verification in Progress</Text>
        <Text style={styles.subtitle}>
          Your salon registration for{' '}
          <Text style={styles.bold}>{ownerApplication?.salonName || 'your salon'}</Text> has been
          submitted and is currently under review by our merchant onboarding team.
        </Text>

        {/* Verification Checkpoints Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Verification Steps</Text>

          <View style={styles.stepRow}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <View style={styles.stepTextCol}>
              <Text style={styles.stepTitle}>Application Submitted</Text>
              <Text style={styles.stepDesc}>Details and documents received.</Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <Ionicons name="ellipsis-horizontal-circle" size={20} color={colors.warning} />
            <View style={styles.stepTextCol}>
              <Text style={styles.stepTitle}>Business & Location Verification</Text>
              <Text style={styles.stepDesc}>Verifying trade license and physical salon address.</Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <Ionicons name="radio-button-off" size={20} color={colors.textTertiary} />
            <View style={styles.stepTextCol}>
              <Text style={styles.stepTitle}>Live Dashboard Activation</Text>
              <Text style={styles.stepDesc}>Access your calendar, walk-in queue, and public link.</Text>
            </View>
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            Verification typically takes 24–48 business hours. You will receive an SMS and email notification upon approval.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionBlock}>
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
    backgroundColor: '#FAF8F5',
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: STATUS_BAR_HEIGHT + 14,
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
    backgroundColor: colors.warningLight,
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
  bold: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardHeader: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  stepTextCol: {
    marginLeft: spacing.md,
    flex: 1,
  },
  stepTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  stepDesc: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.primaryMuted,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.xs + 1,
    color: colors.primaryDark,
    marginLeft: spacing.sm,
    lineHeight: 18,
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

