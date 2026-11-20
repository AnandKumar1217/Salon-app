import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors, typography, spacing } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { safeGoBack, useHardwareBackHandler } from '../../utils/navigationUtils';

type Props = NativeStackScreenProps<RootStackParamList, 'TermsPrivacy'>;

export const TermsPrivacyScreen: React.FC<Props> = ({ navigation }) => {
  const handleBack = () => {
    safeGoBack(navigation, 'MainTabs', { screen: 'ProfileTab' });
  };

  useHardwareBackHandler(() => {
    handleBack();
    return true;
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Header title="Terms & Privacy" onBack={handleBack} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>1. Glamora Platform Terms</Text>
        <Text style={styles.paragraph}>
          Glamora provides a unified discovery and reservation platform connecting customers with verified local boutique salons. By using Glamora, you agree that committed start times represent reserved staff capacity, and you commit to arriving on time.
        </Text>

        <Text style={styles.sectionTitle}>2. Cancellation & Rescheduling Policy</Text>
        <Text style={styles.paragraph}>
          Each participating salon establishes their cancellation window (usually 2 to 3 hours prior to scheduled appointment). Free cancellations and rescheduling are allowed up to this threshold. Within the non-cancellable window, the salon reserves the right to charge cancellation fees or mark no-shows.
        </Text>

        <Text style={styles.sectionTitle}>3. Shared Staff Calendar & Availability</Text>
        <Text style={styles.paragraph}>
          Glamora operates a server-authoritative scheduling system shared between online bookings and physical walk-in customers. Slots are reserved atomically. In the rare event of staff emergency or salon equipment disruption, the salon will promptly notify you through Glamora delay notices.
        </Text>

        <Text style={styles.sectionTitle}>4. Privacy & Personal Data</Text>
        <Text style={styles.paragraph}>
          We value your privacy. Your phone number and appointment preferences are shared exclusively with the specific salon you book for service delivery and appointment reminders. We never sell your personal data to third-party advertisers.
        </Text>

        <Text style={styles.sectionTitle}>5. Contact & Data Deletion</Text>
        <Text style={styles.paragraph}>
          You have full rights to request complete deletion of your account and booking history at any time from the Glamora Profile screen or by emailing privacy@glamora.app.
        </Text>

        <Text style={styles.lastUpdated}>Last updated: November 2026</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.huge,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.primary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  paragraph: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  lastUpdated: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: spacing.xl,
    textAlign: 'center',
  },
});
