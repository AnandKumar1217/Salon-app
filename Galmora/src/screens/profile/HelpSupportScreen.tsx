import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { colors, typography, spacing, borderRadius } from '../../constants/theme';
import { Header } from '../../components/common/Header';

type Props = NativeStackScreenProps<RootStackParamList, 'HelpSupport'>;

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: 'How does the shared booking engine protect my start time?',
    a: 'Glamora synchronizes offline walk-ins and app bookings in one real-time calendar. When an appointment is confirmed, that staff member is locked for the entire duration plus required buffer time, preventing any double booking.',
  },
  {
    q: 'What is the salon cancellation policy?',
    a: 'Each salon sets their cancellation window (typically 2 to 3 hours before start time). You can cancel or reschedule for free up to this deadline directly in the app.',
  },
  {
    q: 'Can I book directly via WhatsApp?',
    a: 'Yes! Tap the WhatsApp button on any salon page to open a pre-filled verified chat. When the salon confirms, the appointment links directly into your Glamora account.',
  },
  {
    q: 'Do I pay online or at the salon?',
    a: 'Glamora supports both options! You can choose Pay at Salon (cash, UPI, cards) at reception after your service, or choose instant online payment during checkout.',
  },
];

export const HelpSupportScreen: React.FC<Props> = ({ navigation }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const handleWhatsAppSupport = () => {
    const defaultNumber = process.env.EXPO_PUBLIC_DEFAULT_SUPPORT_WHATSAPP || '+919876543210';
    const msg = encodeURIComponent('Hi Glamora Support, I need assistance with my booking.');
    Linking.openURL(`whatsapp://send?phone=${defaultNumber.replace(/\D/g, '')}&text=${msg}`).catch(() => {
      Linking.openURL(`https://wa.me/${defaultNumber.replace(/\D/g, '')}?text=${msg}`);
    });
  };

  const handleCallSupport = () => {
    Linking.openURL('tel:+918041239800');
  };

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@glamora.app?subject=Support%20Request');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Header title="Help & Support" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Support Channels */}
        <Text style={styles.sectionHeading}>Contact Concierge</Text>
        <View style={styles.channelsGrid}>
          <TouchableOpacity style={styles.channelCard} onPress={handleWhatsAppSupport} activeOpacity={0.8}>
            <View style={[styles.iconBox, { backgroundColor: colors.whatsappLight }]}>
              <Ionicons name="logo-whatsapp" size={24} color={colors.whatsappDark} />
            </View>
            <Text style={styles.channelTitle}>WhatsApp Support</Text>
            <Text style={styles.channelDesc}>Instant response in minutes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.channelCard} onPress={handleCallSupport} activeOpacity={0.8}>
            <View style={[styles.iconBox, { backgroundColor: colors.primaryMuted }]}>
              <Ionicons name="call" size={24} color={colors.primary} />
            </View>
            <Text style={styles.channelTitle}>Concierge Helpline</Text>
            <Text style={styles.channelDesc}>Mon-Sun 9AM – 9PM</Text>
          </TouchableOpacity>
        </View>

        {/* FAQs */}
        <Text style={[styles.sectionHeading, { marginTop: spacing.xl }]}>
          Frequently Asked Questions
        </Text>
        <View style={styles.faqList}>
          {FAQS.map((faq, idx) => {
            const isExpanded = expandedIndex === idx;
            return (
              <TouchableOpacity
                key={idx}
                style={styles.faqItem}
                onPress={() => setExpandedIndex(isExpanded ? null : idx)}
                activeOpacity={0.8}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{faq.q}</Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={colors.textSecondary}
                  />
                </View>
                {isExpanded && <Text style={styles.faqAnswer}>{faq.a}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Email Footer */}
        <TouchableOpacity style={styles.emailBox} onPress={handleEmailSupport}>
          <Ionicons name="mail-outline" size={20} color={colors.primary} />
          <Text style={styles.emailText}>Email: support@glamora.app</Text>
        </TouchableOpacity>
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
  sectionHeading: {
    fontSize: typography.fontSize.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  channelsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  channelCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  channelTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  channelDesc: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  faqList: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  faqItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  faqAnswer: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: spacing.sm,
  },
  emailBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.surfaceWarm,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  emailText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.primary,
  },
});
