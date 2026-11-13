import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { colors, typography, spacing, borderRadius } from '../../constants/theme';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'RejectedApplication'>;
  route: RouteProp<RootStackParamList, 'RejectedApplication'>;
};

export const RejectedApplicationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { user, logout } = useAuth();
  const reason =
    route.params?.reason ||
    user?.rejectionReason ||
    'Your trade registration document could not be verified with the official municipal registry. Please upload a clear, active certificate.';

  const handleReapply = () => {
    navigation.replace('OwnerRegistrationWizard');
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
          <Ionicons name="close-circle" size={48} color={colors.error} />
        </View>

        <Text style={styles.title}>Application Not Approved</Text>
        <Text style={styles.subtitle}>
          We reviewed your salon registration submission, but were unable to approve it at this time.
        </Text>

        {/* Reason Card */}
        <View style={styles.reasonCard}>
          <View style={styles.reasonHeader}>
            <Ionicons name="alert-circle" size={20} color={colors.error} />
            <Text style={styles.reasonHeading}>Reason Provided by Review Team</Text>
          </View>
          <Text style={styles.reasonText}>{reason}</Text>
        </View>

        {/* Instructions */}
        <View style={styles.guidanceBox}>
          <Text style={styles.guidanceTitle}>What you can do:</Text>
          <Text style={styles.guidanceItem}>
            • Update your business registration number or certificate.
          </Text>
          <Text style={styles.guidanceItem}>
            • Ensure the physical address matches your utility or trade document.
          </Text>
          <Text style={styles.guidanceItem}>
            • Re-submit your application for accelerated re-evaluation.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionBlock}>
          <Button
            title="Edit & Re-submit Application"
            onPress={handleReapply}
            size="lg"
            leftIcon="create-outline"
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
    backgroundColor: colors.errorLight,
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
    borderLeftColor: colors.error,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  reasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  reasonHeading: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.error,
    marginLeft: spacing.xs,
  },
  reasonText: {
    fontSize: typography.fontSize.sm + 1,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  guidanceBox: {
    width: '100%',
    backgroundColor: colors.surfaceWarm,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  guidanceTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  guidanceItem: {
    fontSize: typography.fontSize.xs + 1,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 2,
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

