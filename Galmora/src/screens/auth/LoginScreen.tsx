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
    switchMode,
  } = useAuth();

  const initialRole: UserRole = route.params?.rolePreference || 'customer';
  const [activeRoleTab, setActiveRoleTab] = useState<'customer' | 'salon_owner'>(
    initialRole === 'salon_owner' ? 'salon_owner' : 'customer'
  );

  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
  const [isRegister, setIsRegister] = useState(false);

  // Phone state
  const [phone, setPhone] = useState('');
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
    const clean = phone.replace(/\D/g, '');
    if (!clean || clean.length < 10) {
      setPhoneError('Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      setLoadingPhone(true);
      await sendPhoneOtp(clean);
      navigation.navigate('OtpVerification', {
        phone: clean,
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Top Navigation Bar with Pretty Switch */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.navigate('RoleSelection')}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          {/* Pretty Segmented Role Switch in Top Right */}
          <View style={styles.roleSwitchPill}>
            <TouchableOpacity
              style={[
                styles.roleSwitchOption,
                activeRoleTab === 'customer' && styles.roleSwitchActive,
              ]}
              onPress={() => {
                setActiveRoleTab('customer');
                setEmailError(null);
                setPhoneError(null);
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="person-outline"
                size={13}
                color={activeRoleTab === 'customer' ? '#FFFFFF' : '#736B66'}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.roleSwitchText,
                  activeRoleTab === 'customer' && styles.roleSwitchTextActive,
                ]}
              >
                Customer
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleSwitchOption,
                activeRoleTab === 'salon_owner' && styles.roleSwitchActive,
              ]}
              onPress={() => {
                setActiveRoleTab('salon_owner');
                setEmailError(null);
                setPhoneError(null);
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="storefront-outline"
                size={13}
                color={activeRoleTab === 'salon_owner' ? '#FFFFFF' : '#736B66'}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.roleSwitchText,
                  activeRoleTab === 'salon_owner' && styles.roleSwitchTextActive,
                ]}
              >
                Salon Owner
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Clean Header */}
        <View style={styles.header}>
          <Text style={styles.badgeLabel}>
            {activeRoleTab === 'customer' ? 'CLIENT ACCESS' : 'SALON OWNER PORTAL'}
          </Text>
          <Text style={styles.title}>
            {activeRoleTab === 'customer'
              ? (isRegister && authMethod === 'email' ? 'Create an Account' : 'Welcome to Glamora')
              : 'Salon Owner Sign In'}
          </Text>
          <Text style={styles.subtitle}>
            {activeRoleTab === 'customer'
              ? 'Book appointments with guaranteed zero waiting time'
              : 'Manage appointments, staff schedules, and your salon'}
          </Text>
        </View>

        {/* ----------------- CLEAN FORM CARD ----------------- */}
        <View style={styles.formCard}>
          {/* Method Tabs: Mobile OTP vs Email */}
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
                Email & Password
              </Text>
            </TouchableOpacity>
          </View>

          {/* Flow 1: Mobile OTP (for both Customer and Salon Owner) */}
          {authMethod === 'phone' ? (
            <View style={styles.formFields}>
              <Input
                label="Mobile Number"
                placeholder="Enter 10-digit mobile number"
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  setPhoneError(null);
                }}
                keyboardType="phone-pad"
                maxLength={10}
                leftIcon="call-outline"
                error={phoneError || undefined}
              />

              {/* Pretty Demo OTP Helper Badge */}
              <View style={styles.demoHelperPill}>
                <Ionicons name="information-circle-outline" size={15} color="#8A3B52" />
                <Text style={styles.demoHelperText}>
                  Demo OTP is <Text style={styles.demoOtpBold}>123456</Text> for instant registration & login
                </Text>
              </View>

              <Button
                title="Send Verification Code"
                onPress={handleSendOtp}
                loading={loadingPhone}
                size="lg"
                style={styles.actionBtn}
              />

              {activeRoleTab === 'salon_owner' && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('OwnerRegistrationWizard')}
                  style={styles.registerLinkBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.registerLinkText}>
                    Register a new salon instead ›
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            /* Flow 2: Email Auth */
            <View style={styles.formFields}>
              {activeRoleTab === 'customer' ? (
                <>
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
                </>
              ) : (
                /* Salon Owner Email */
                <>
                  <Input
                    label="Salon Business Email"
                    placeholder="e.g. owner@salon.com"
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
                </>
              )}
            </View>
          )}
        </View>

        {/* Clean Footer */}
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
    backgroundColor: '#FAF8F5',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: STATUS_BAR_HEIGHT + 16,
    paddingBottom: 36,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EFE9E3',
    shadowColor: '#4A1E36',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  roleSwitchPill: {
    flexDirection: 'row',
    backgroundColor: '#F3EBE6',
    padding: 3,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#EBE2DC',
  },
  roleSwitchOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9999,
  },
  roleSwitchActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    elevation: 2,
  },
  roleSwitchText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#736B66',
  },
  roleSwitchTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  header: {
    marginBottom: 22,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    color: colors.primary,
    marginBottom: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1F1E1E',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    color: '#736B66',
    marginTop: 4,
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EFE9E3',
    shadowColor: '#4A1E36',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 24,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  methodTabs: {
    flexDirection: 'row',
    backgroundColor: '#FAF5F1',
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
  },
  methodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  methodTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#4A1E36',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  methodTabText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#736B66',
  },
  methodTabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  formFields: {
    width: '100%',
  },
  demoHelperPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBF0F3',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(138, 59, 82, 0.15)',
    marginBottom: 16,
    marginTop: -4,
    gap: 7,
  },
  demoHelperText: {
    fontSize: 12,
    color: '#652D4C',
    flex: 1,
  },
  demoOtpBold: {
    fontWeight: '800',
    color: '#8A3B52',
  },
  actionBtn: {
    marginTop: 4,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    marginTop: -4,
  },
  forgotText: {
    fontSize: 12.5,
    color: colors.primary,
    fontWeight: '600',
  },
  toggleAuthBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 6,
  },
  toggleAuthText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
  },
  registerLinkBtn: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  registerLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  registerDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EFE9E3',
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 12,
    color: '#9E9690',
  },
  registerBtn: {
    width: '100%',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  footerText: {
    fontSize: 12,
    color: '#9E9690',
  },
});
