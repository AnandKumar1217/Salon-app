import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { colors, typography, spacing, borderRadius, STATUS_BAR_HEIGHT } from '../../constants/theme';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
  route: RouteProp<RootStackParamList, 'Login'>;
};

export const LoginScreen: React.FC<Props> = ({ navigation, route }) => {
  const {
    sendPhoneOtp,
    loginWithEmail,
    registerWithEmail,
    ownerLoginWithEmail,
    loadPresetUser,
    switchMode,
  } = useAuth();

  const initialRole: UserRole = route.params?.rolePreference || 'customer';
  const [activeRoleTab, setActiveRoleTab] = useState<'customer' | 'salon_owner'>(
    initialRole === 'salon_owner' ? 'salon_owner' : 'customer'
  );

  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
  const [isRegister, setIsRegister] = useState(false);

  // Phone states
  const [phone, setPhone] = useState('9845012345');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [loadingPhone, setLoadingPhone] = useState(false);

  // Email states (Customer & Owner)
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loadingEmail, setLoadingEmail] = useState(false);

  useEffect(() => {
    if (route.params?.rolePreference) {
      setActiveRoleTab(route.params.rolePreference === 'salon_owner' ? 'salon_owner' : 'customer');
    }
  }, [route.params?.rolePreference]);

  const handleSendOtp = async () => {
    setPhoneError(null);
    if (!phone || phone.trim().length < 10) {
      setPhoneError('Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      setLoadingPhone(true);
      await sendPhoneOtp(phone);
      navigation.navigate('OtpVerification', {
        phone,
        rolePreference: activeRoleTab,
      });
    } catch (err: any) {
      setPhoneError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoadingPhone(false);
    }
  };

  const handleCustomerEmailAuth = async () => {
    setEmailError(null);
    try {
      setLoadingEmail(true);
      if (isRegister) {
        await registerWithEmail(fullName, email, password);
      } else {
        await loginWithEmail(email, password);
      }
      await switchMode('CUSTOMER');
      navigation.replace('MainTabs', { screen: 'HomeTab' });
    } catch (err: any) {
      setEmailError(err.message || 'Authentication failed. Please check details.');
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleOwnerEmailAuth = async () => {
    setEmailError(null);
    try {
      setLoadingEmail(true);
      await ownerLoginWithEmail(email, password);
      navigation.replace('OwnerTabs', { screen: 'DashboardTab' });
    } catch (err: any) {
      setEmailError(err.message || 'Owner authentication failed.');
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Reset Password',
      'A password reset link has been dispatched to your registered address.',
      [{ text: 'OK' }]
    );
  };

  const handleQuickPreset = async (
    presetKey: 'dualRoleApproved' | 'customerOnly' | 'pendingOwner' | 'rejectedOwner' | 'suspendedOwner'
  ) => {
    await loadPresetUser(presetKey);
    if (presetKey === 'customerOnly') {
      navigation.replace('MainTabs', { screen: 'HomeTab' });
    } else if (presetKey === 'dualRoleApproved') {
      if (activeRoleTab === 'salon_owner') {
        navigation.replace('OwnerTabs', { screen: 'DashboardTab' });
      } else {
        navigation.replace('MainTabs', { screen: 'HomeTab' });
      }
    } else if (presetKey === 'pendingOwner') {
      navigation.replace('PendingApproval');
    } else if (presetKey === 'rejectedOwner') {
      navigation.replace('RejectedApplication');
    } else if (presetKey === 'suspendedOwner') {
      navigation.replace('SuspendedAccount');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Clean Top Navigation Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.navigate('RoleSelection')}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          {/* Role Indicator Pill */}
          <View style={styles.roleTogglePill}>
            <TouchableOpacity
              style={[styles.rolePillOption, activeRoleTab === 'customer' && styles.rolePillActive]}
              onPress={() => {
                setActiveRoleTab('customer');
                setEmailError(null);
                setPhoneError(null);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.rolePillText, activeRoleTab === 'customer' && styles.rolePillTextActive]}>
                Customer
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.rolePillOption, activeRoleTab === 'salon_owner' && styles.rolePillActive]}
              onPress={() => {
                setActiveRoleTab('salon_owner');
                setEmailError(null);
                setPhoneError(null);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.rolePillText, activeRoleTab === 'salon_owner' && styles.rolePillTextActive]}>
                Salon Owner
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Title Header */}
        <View style={styles.header}>
          <Text style={styles.badgeLabel}>
            {activeRoleTab === 'customer' ? 'CUSTOMER ACCESS' : 'SALON OWNER PORTAL'}
          </Text>
          <Text style={styles.title}>
            {activeRoleTab === 'customer'
              ? (isRegister && authMethod === 'email' ? 'Create an Account' : 'Welcome to Glamora')
              : 'Sign in to Salon'}
          </Text>
          <Text style={styles.subtitle}>
            {activeRoleTab === 'customer'
              ? 'Book appointments with guaranteed zero waiting time'
              : 'Manage your calendar, walk-ins and staff schedules'}
          </Text>
        </View>

        {/* ----------------- CUSTOMER FLOW ----------------- */}
        {activeRoleTab === 'customer' && (
          <View style={styles.formCard}>
            {/* Method Tabs: Phone vs Email */}
            <View style={styles.methodTabs}>
              <TouchableOpacity
                style={[styles.methodTab, authMethod === 'phone' && styles.methodTabActive]}
                onPress={() => {
                  setAuthMethod('phone');
                  setPhoneError(null);
                  setEmailError(null);
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="call-outline"
                  size={15}
                  color={authMethod === 'phone' ? colors.primary : colors.textTertiary}
                />
                <Text style={[styles.methodTabText, authMethod === 'phone' && styles.methodTabTextActive]}>
                  Mobile OTP
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.methodTab, authMethod === 'email' && styles.methodTabActive]}
                onPress={() => {
                  setAuthMethod('email');
                  setPhoneError(null);
                  setEmailError(null);
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="mail-outline"
                  size={15}
                  color={authMethod === 'email' ? colors.primary : colors.textTertiary}
                />
                <Text style={[styles.methodTabText, authMethod === 'email' && styles.methodTabTextActive]}>
                  Email
                </Text>
              </TouchableOpacity>
            </View>

            {authMethod === 'phone' ? (
              <View style={styles.formFields}>
                <Input
                  label="Mobile Number"
                  placeholder="Enter 10-digit mobile number"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={10}
                  leftIcon="call-outline"
                  error={phoneError || undefined}
                  helperText="A 6-digit confirmation code will be sent"
                />

                <Button
                  title="Send Verification Code"
                  onPress={handleSendOtp}
                  loading={loadingPhone}
                  size="lg"
                  style={styles.actionBtn}
                />
              </View>
            ) : (
              <View style={styles.formFields}>
                {isRegister && (
                  <Input
                    label="Full Name"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChangeText={setFullName}
                    leftIcon="person-outline"
                  />
                )}

                <Input
                  label="Email Address"
                  placeholder="name@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon="mail-outline"
                />

                <Input
                  label="Password"
                  placeholder="Enter password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  leftIcon="lock-closed-outline"
                  error={emailError || undefined}
                />

                {!isRegister && (
                  <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotRow}>
                    <Text style={styles.forgotText}>Forgot password?</Text>
                  </TouchableOpacity>
                )}

                <Button
                  title={isRegister ? 'Create Customer Account' : 'Sign In'}
                  onPress={handleCustomerEmailAuth}
                  loading={loadingEmail}
                  size="lg"
                  style={styles.actionBtn}
                />

                <TouchableOpacity
                  onPress={() => setIsRegister(!isRegister)}
                  style={styles.toggleAuthBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.toggleAuthText}>
                    {isRegister
                      ? 'Already have an account? Sign In'
                      : "Don't have an account? Create one"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ----------------- SALON OWNER FLOW ----------------- */}
        {activeRoleTab === 'salon_owner' && (
          <View style={styles.formCard}>
            <View style={styles.formFields}>
              <Input
                label="Salon Business Email"
                placeholder="e.g. owner@maisondebelle.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon="business-outline"
              />

              <Input
                label="Owner Password"
                placeholder="Enter password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                leftIcon="lock-closed-outline"
                error={emailError || undefined}
              />

              <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotRow}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>

              <Button
                title="Sign In to Salon Portal"
                onPress={handleOwnerEmailAuth}
                loading={loadingEmail}
                size="lg"
                variant="primary"
                style={styles.actionBtn}
              />

              <View style={styles.registerDivider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <Button
                title="Register New Salon"
                onPress={() => navigation.navigate('OwnerRegistrationWizard')}
                variant="outline"
                size="md"
                leftIcon="add-circle-outline"
                style={styles.registerBtn}
              />
            </View>
          </View>
        )}

        {/* Clean, Subtle Demo Helper Bar */}
        <View style={styles.demoBar}>
          <Text style={styles.demoBarLabel}>Demo Presets:</Text>
          <View style={styles.demoPills}>
            <TouchableOpacity
              style={styles.demoPill}
              onPress={() => handleQuickPreset('dualRoleApproved')}
              activeOpacity={0.7}
            >
              <Text style={styles.demoPillText}>Owner</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.demoPill}
              onPress={() => handleQuickPreset('customerOnly')}
              activeOpacity={0.7}
            >
              <Text style={styles.demoPillText}>Customer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.demoPill}
              onPress={() => handleQuickPreset('pendingOwner')}
              activeOpacity={0.7}
            >
              <Text style={styles.demoPillText}>Pending</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => navigation.navigate('TermsPrivacy')}>
            <Text style={styles.footerText}>Terms of Service • Privacy Policy</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: STATUS_BAR_HEIGHT + 16,
    paddingBottom: spacing.xxl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  roleTogglePill: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceWarm,
    padding: 3,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  rolePillOption: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: borderRadius.full,
  },
  rolePillActive: {
    backgroundColor: colors.primary,
  },
  rolePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  rolePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  header: {
    marginBottom: spacing.xl,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: colors.primary,
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    marginBottom: spacing.xl,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  methodTabs: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceWarm,
    borderRadius: borderRadius.md,
    padding: 3,
    marginBottom: spacing.lg,
  },
  methodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: borderRadius.sm,
    gap: 6,
  },
  methodTabActive: {
    backgroundColor: colors.surface,
    elevation: 1,
  },
  methodTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  methodTabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  formFields: {
    width: '100%',
  },
  actionBtn: {
    marginTop: spacing.sm,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginBottom: spacing.md,
    marginTop: -spacing.xs,
  },
  forgotText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: '600',
  },
  toggleAuthBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  toggleAuthText: {
    fontSize: typography.fontSize.xs + 1,
    color: colors.primary,
    fontWeight: '600',
  },
  registerDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderLight,
  },
  dividerText: {
    paddingHorizontal: spacing.sm,
    fontSize: 11,
    color: colors.textTertiary,
  },
  registerBtn: {
    width: '100%',
  },
  demoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  demoBarLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    fontWeight: '600',
  },
  demoPills: {
    flexDirection: 'row',
    gap: 6,
  },
  demoPill: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: colors.surfaceWarm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  demoPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  footerText: {
    fontSize: 11,
    color: colors.textTertiary,
  },
});
