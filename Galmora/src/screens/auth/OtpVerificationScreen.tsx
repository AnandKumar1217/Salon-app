import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { colors, typography, spacing, borderRadius } from '../../constants/theme';
import { Button } from '../../components/common/Button';
import { Header } from '../../components/common/Header';
import { useAuth } from '../../context/AuthContext';
import { safeGoBack, useHardwareBackHandler } from '../../utils/navigationUtils';

type Props = NativeStackScreenProps<RootStackParamList, 'OtpVerification'>;

export const OtpVerificationScreen: React.FC<Props> = ({ route, navigation }) => {
  const { phone } = route.params;
  const { verifyPhoneOtp, sendPhoneOtp } = useAuth();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputsRef = useRef<Array<any>>([]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleOtpChange = (text: string, index: number) => {
    setError(null);
    const newOtp = [...otp];

    if (text.length > 1) {
      // Handle paste of full 6-digit code
      const digits = text.replace(/\D/g, '').slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newOtp[i] = digits[i] || '';
      }
      setOtp(newOtp);
      const nextFocus = Math.min(digits.length, 5);
      inputsRef.current[nextFocus]?.focus();
      return;
    }

    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-advance
    if (text && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = otp.join('');
    if (fullCode.length !== 6) {
      setError('Please enter all 6 digits of the code.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await verifyPhoneOtp(phone, fullCode, route.params?.rolePreference);

      if (route.params?.rolePreference === 'salon_owner') {
        const status = res.applicationStatus || 'UNAPPLIED';
        if (status === 'APPROVED') {
          navigation.replace('OwnerTabs', { screen: 'DashboardTab' });
        } else if (status === 'PENDING_APPROVAL') {
          navigation.replace('PendingApproval');
        } else if (status === 'REJECTED') {
          navigation.replace('RejectedApplication');
        } else if (status === 'SUSPENDED') {
          navigation.replace('SuspendedAccount');
        } else {
          // Phone is not associated with any approved or submitted salon yet
          navigation.replace('OwnerRegistrationWizard');
        }
      } else {
        // Customer flow
        if (res.isNewUser) {
          navigation.replace('ProfileSetup', { phone });
        } else {
          navigation.replace('MainTabs', { screen: 'HomeTab' });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFillDemo = () => {
    setError(null);
    setOtp(['1', '2', '3', '4', '5', '6']);
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    try {
      setError(null);
      await sendPhoneOtp(phone);
      setCooldown(60);
      setOtp(['', '', '', '', '', '']);
      inputsRef.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || 'Failed to resend code.');
    }
  };

  useHardwareBackHandler(() => {
    safeGoBack(navigation, 'Login', { rolePreference: route.params?.rolePreference });
    return true;
  }, [navigation, route.params?.rolePreference]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Header
        title="Verification"
        onBack={() =>
          safeGoBack(navigation, 'Login', { rolePreference: route.params?.rolePreference })
        }
      />

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topSection}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark" size={32} color={colors.primary} />
          </View>
          <Text style={styles.title}>Enter 6-Digit Code</Text>
          <Text style={styles.subtitle}>
            Code sent to <Text style={styles.phoneHighlight}>+91 {phone}</Text>
          </Text>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* 6 Digit Inputs */}
        <View style={styles.otpRow}>
          {otp.map((digit, idx) => (
            <TextInput
              key={idx}
              ref={(ref) => { inputsRef.current[idx] = ref; }}
              style={[
                styles.otpInput,
                Boolean(digit) && styles.otpInputFilled,
                Boolean(error) && styles.otpInputError,
              ]}
              value={digit}
              onChangeText={(text) => handleOtpChange(text, idx)}
              onKeyPress={(e) => handleKeyPress(e, idx)}
              keyboardType="number-pad"
              maxLength={6} // Allow paste in first input
              selectTextOnFocus
              textAlign="center"
            />
          ))}
        </View>

        <Button
          title="Verify & Continue"
          onPress={handleVerify}
          loading={loading}
          size="lg"
          style={styles.verifyBtn}
        />

        {/* Resend Cooldown */}
        <View style={styles.resendRow}>
          {cooldown > 0 ? (
            <Text style={styles.cooldownText}>
              Resend code in <Text style={styles.timerBold}>{cooldown}s</Text>
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendAction}>Resend OTP</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Demo Helper Button */}
        <TouchableOpacity
          style={styles.demoPill}
          onPress={handleAutoFillDemo}
          activeOpacity={0.8}
        >
          <Ionicons name="key-outline" size={16} color={colors.primary} />
          <Text style={styles.demoPillText}>
            Demo Code: <Text style={styles.demoCodeBold}>123456</Text> (Tap to auto-fill)
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F8EFF2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  phoneHighlight: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  errorText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: colors.error,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8E0D7',
    backgroundColor: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  otpInputFilled: {
    borderColor: colors.primary,
    backgroundColor: '#FAF5F7',
  },
  otpInputError: {
    borderColor: colors.error,
  },
  verifyBtn: {
    marginBottom: spacing.lg,
  },
  resendRow: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  cooldownText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  timerBold: {
    fontWeight: '700',
    color: colors.primary,
  },
  resendAction: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  demoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8EFF2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(74, 30, 54, 0.15)',
    gap: 8,
  },
  demoPillText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  demoCodeBold: {
    fontWeight: '800',
    color: colors.primary,
  },
});
