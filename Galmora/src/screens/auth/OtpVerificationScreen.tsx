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
      const res = await verifyPhoneOtp(phone, fullCode);

      if (res.isNewUser) {
        navigation.replace('ProfileSetup', { phone });
      } else if (route.params?.rolePreference === 'salon_owner') {
        navigation.replace('OwnerRegistrationWizard');
      } else {
        navigation.replace('MainTabs', { screen: 'HomeTab' });
      }
    } catch (err: any) {
      setError(err.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
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

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Header title="Verification" onBack={() => navigation.goBack()} />

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

        <View style={styles.demoNote}>
          <Text style={styles.demoNoteText}>
            💡 For demo testing: Enter <Text style={{ fontWeight: '700' }}>123456</Text>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
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
    marginBottom: spacing.xxl,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
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
    marginBottom: spacing.xxl,
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
  demoNote: {
    backgroundColor: colors.surfaceWarm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  demoNoteText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
});
