import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { colors, typography, spacing, borderRadius, STATUS_BAR_HEIGHT } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'RoleSelection'>;
};

export const RoleSelectionScreen: React.FC<Props> = ({ navigation }) => {
  const { setPreferredNavigationRole, user, switchMode } = useAuth();

  const handleSelectCustomer = async () => {
    await setPreferredNavigationRole('customer');
    if (user && user.roles.includes('customer')) {
      await switchMode('CUSTOMER');
      navigation.replace('MainTabs', { screen: 'HomeTab' });
    } else {
      navigation.navigate('Login', { rolePreference: 'customer' });
    }
  };

  const handleSelectOwner = async () => {
    await setPreferredNavigationRole('salon_owner');
    if (user && user.roles.includes('salon_owner')) {
      if (user.applicationStatus === 'APPROVED') {
        await switchMode('OWNER');
        navigation.replace('OwnerTabs', { screen: 'DashboardTab' });
      } else if (user.applicationStatus === 'PENDING_APPROVAL') {
        navigation.replace('PendingApproval');
      } else if (user.applicationStatus === 'REJECTED') {
        navigation.replace('RejectedApplication', { reason: user.rejectionReason });
      } else if (user.applicationStatus === 'SUSPENDED') {
        navigation.replace('SuspendedAccount', { reason: user.rejectionReason });
      } else {
        navigation.navigate('OwnerRegistrationWizard');
      }
    } else {
      navigation.navigate('Login', { rolePreference: 'salon_owner' });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header */}
        <View style={styles.brandSection}>
          <View style={styles.brandIcon}>
            <Text style={styles.brandLetter}>G</Text>
          </View>
          <Text style={styles.brandName}>GLAMORA</Text>
          <Text style={styles.tagline}>Your Salon. Your Style. Your Time.</Text>
        </View>

        {/* Welcome Section */}
        <View style={styles.headingSection}>
          <Text style={styles.heading}>Welcome</Text>
          <Text style={styles.subheading}>How would you like to continue?</Text>
        </View>

        {/* Option Cards */}
        <View style={styles.cardsContainer}>
          {/* Card 1: Customer */}
          <TouchableOpacity
            style={styles.card}
            onPress={handleSelectCustomer}
            activeOpacity={0.88}
          >
            <View style={[styles.iconCircle, styles.customerIconCircle]}>
              <Ionicons name="sparkles" size={24} color={colors.primary} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>I'm a Customer</Text>
              <Text style={styles.cardDesc}>
                Discover salons, explore services and book your next appointment.
              </Text>
            </View>
            <View style={styles.arrowCircle}>
              <Ionicons name="arrow-forward" size={18} color={colors.primary} />
            </View>
          </TouchableOpacity>

          {/* Card 2: Salon Owner */}
          <TouchableOpacity
            style={[styles.card, styles.ownerCard]}
            onPress={handleSelectOwner}
            activeOpacity={0.88}
          >
            <View style={[styles.iconCircle, styles.ownerIconCircle]}>
              <Ionicons name="business" size={24} color={colors.roseDark} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>I'm a Salon Owner</Text>
              <Text style={styles.cardDesc}>
                Manage your salon, employees, appointments and walk-in clients.
              </Text>
            </View>
            <View style={[styles.arrowCircle, styles.ownerArrowCircle]}>
              <Ionicons name="arrow-forward" size={18} color={colors.roseDark} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Bottom Login & Legal Links */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login', { rolePreference: 'customer' })}
            style={styles.loginRow}
            activeOpacity={0.7}
          >
            <Text style={styles.loginHint}>Already have an account? </Text>
            <Text style={styles.loginLink}>Log In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('TermsPrivacy')}
            style={styles.legalBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.legalText}>Terms & Privacy Policy</Text>
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
    paddingTop: STATUS_BAR_HEIGHT + 24,
    paddingBottom: spacing.xxl,
    minHeight: '100%',
    justifyContent: 'space-between',
  },
  brandSection: {
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  brandIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    elevation: 3,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  brandLetter: {
    color: '#FAF7F2',
    fontWeight: '800',
    fontSize: 28,
    fontStyle: 'italic',
  },
  brandName: {
    fontSize: typography.fontSize.lg,
    fontWeight: '800',
    letterSpacing: 4,
    color: colors.primary,
  },
  tagline: {
    fontSize: typography.fontSize.xs + 1,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 4,
  },
  headingSection: {
    marginBottom: spacing.xl,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  subheading: {
    fontSize: typography.fontSize.sm + 1,
    color: colors.textSecondary,
    marginTop: 4,
  },
  cardsContainer: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  ownerCard: {
    borderColor: '#E8D2DC',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  customerIconCircle: {
    backgroundColor: colors.primaryMuted,
  },
  ownerIconCircle: {
    backgroundColor: colors.roseLight,
  },
  cardContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  cardTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  arrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerArrowCircle: {
    backgroundColor: colors.roseLight,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  loginHint: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  loginLink: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.primary,
  },
  legalBtn: {
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
  },
  legalText: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  },
});
