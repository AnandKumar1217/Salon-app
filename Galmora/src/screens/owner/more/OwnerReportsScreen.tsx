import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows, STATUS_BAR_HEIGHT } from '../../../constants/theme';
import { useOwnerSalon } from '../../../context/OwnerSalonContext';

export const OwnerReportsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { dailyRevenue, appointments } = useOwnerSalon();
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');

  // Compute breakdown from appointments
  const todayStr = new Date().toISOString().split('T')[0];
  const todayList = appointments.filter((b) => b.date === todayStr);

  const completedRevenue = todayList
    .filter((b) => b.status === 'COMPLETED')
    .reduce((sum, b) => sum + b.totalAmount, 0);

  const pendingCollection = todayList
    .filter((b) => b.status === 'IN_PROGRESS' || b.status === 'CONFIRMED')
    .reduce((sum, b) => sum + b.totalAmount, 0);

  const multiplier = period === 'week' ? 6.5 : period === 'month' ? 26 : 1;
  const totalDisplay = Math.round(dailyRevenue.totalRevenue * multiplier);
  const onlineDisplay = Math.round(dailyRevenue.onlineRevenue * multiplier);
  const cashDisplay = Math.round(dailyRevenue.cashRevenue * multiplier);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Payments & Financial Reports</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Period Selector */}
      <View style={styles.periodRow}>
        {(['today', 'week', 'month'] as const).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
              {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Big Gross Collection Card */}
        <View style={styles.grossCard}>
          <Text style={styles.grossLabel}>TOTAL SERVICE COLLECTIONS</Text>
          <Text style={styles.grossAmount}>₹{totalDisplay.toLocaleString()}</Text>
          <Text style={styles.grossSubtitle}>
            {period === 'today'
              ? 'Gross collection across walk-ins, app & WhatsApp'
              : `Aggregated revenue for ${period}`}
          </Text>

          <View style={styles.channelSplit}>
            <View style={styles.channelCol}>
              <View style={styles.channelDotRow}>
                <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                <Text style={styles.channelName}>Online UPI / Cards</Text>
              </View>
              <Text style={styles.channelAmt}>₹{onlineDisplay.toLocaleString()}</Text>
            </View>

            <View style={styles.splitDivider} />

            <View style={styles.channelCol}>
              <View style={styles.channelDotRow}>
                <View style={[styles.dot, { backgroundColor: colors.warning }]} />
                <Text style={styles.channelName}>Pay at Salon (Cash/POS)</Text>
              </View>
              <Text style={styles.channelAmt}>₹{cashDisplay.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Operational Status Breakup */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Service Status Collections</Text>
        </View>

        <View style={styles.statusCardsRow}>
          <View style={styles.statusBox}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.statusAmt}>₹{completedRevenue.toLocaleString()}</Text>
            <Text style={styles.statusSub}>Completed & Collected</Text>
          </View>

          <View style={styles.statusBox}>
            <Ionicons name="hourglass" size={20} color={colors.info} />
            <Text style={styles.statusAmt}>₹{pendingCollection.toLocaleString()}</Text>
            <Text style={styles.statusSub}>In-Chair / Scheduled</Text>
          </View>
        </View>

        {/* Channel Volume Metrics */}
        <View style={styles.metricGroup}>
          <Text style={styles.metricGroupTitle}>BOOKING VOLUME BY ORIGIN</Text>

          <View style={styles.metricRow}>
            <View style={styles.metricLeft}>
              <Ionicons name="phone-portrait-outline" size={18} color={colors.primary} />
              <Text style={styles.metricName}>Glamora Customer App</Text>
            </View>
            <Text style={styles.metricCount}>
              {Math.round(dailyRevenue.appBookingCount * multiplier)} bookings
            </Text>
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metricLeft}>
              <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
              <Text style={styles.metricName}>Verified WhatsApp Inquiries</Text>
            </View>
            <Text style={styles.metricCount}>
              {Math.round(dailyRevenue.whatsAppBookingCount * multiplier)} bookings
            </Text>
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metricLeft}>
              <Ionicons name="globe-outline" size={18} color={colors.info} />
              <Text style={styles.metricName}>Public Web Booking Link</Text>
            </View>
            <Text style={styles.metricCount}>
              {Math.round(dailyRevenue.webBookingCount * multiplier)} bookings
            </Text>
          </View>

          <View style={[styles.metricRow, { borderBottomWidth: 0 }]}>
            <View style={styles.metricLeft}>
              <Ionicons name="footsteps-outline" size={18} color={colors.warning} />
              <Text style={styles.metricName}>Direct Walk-in Guests</Text>
            </View>
            <Text style={styles.metricCount}>
              {Math.round(dailyRevenue.walkInCount * multiplier)} walk-ins
            </Text>
          </View>
        </View>

        {/* Platform Subscription Billing Separation Notice */}
        <View style={styles.subscriptionNoticeCard}>
          <View style={styles.subNoticeHeader}>
            <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
            <Text style={styles.subNoticeTitle}>Glamora Platform Billing Separation</Text>
          </View>
          <Text style={styles.subNoticeText}>
            Customer service payments above are credited directly to your salon settlement account.
            Glamora partner platform subscription fees (₹1,499/mo) are billed separately on the 1st
            of each calendar month.
          </Text>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: STATUS_BAR_HEIGHT + 10,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  periodRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceWarm,
    padding: 3,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: borderRadius.lg,
    maxWidth: 560,
    alignSelf: 'center',
    width: '92%',
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  periodBtnActive: {
    backgroundColor: colors.surface,
    elevation: 1,
  },
  periodText: {
    fontSize: typography.fontSize.xs + 1,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  periodTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.huge,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  grossCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  grossLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textTertiary,
    letterSpacing: 1,
  },
  grossAmount: {
    fontSize: 34,
    fontWeight: '900',
    color: colors.primary,
    marginVertical: spacing.xs,
  },
  grossSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  channelSplit: {
    flexDirection: 'row',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  channelCol: {
    flex: 1,
  },
  channelDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  channelName: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  channelAmt: {
    fontSize: typography.fontSize.base,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  splitDivider: {
    width: 1,
    backgroundColor: colors.borderLight,
    marginHorizontal: spacing.md,
  },
  sectionHeader: {
    marginBottom: spacing.xs + 2,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '800',
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statusCardsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statusBox: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  statusAmt: {
    fontSize: typography.fontSize.lg,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing.xs,
    marginBottom: 2,
  },
  statusSub: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  metricGroup: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.lg,
  },
  metricGroupTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textTertiary,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  metricLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metricName: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  metricCount: {
    fontSize: typography.fontSize.xs + 1,
    fontWeight: '700',
    color: colors.primary,
  },
  subscriptionNoticeCard: {
    backgroundColor: colors.surfaceWarm,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  subNoticeTitle: {
    fontSize: typography.fontSize.xs + 1,
    fontWeight: '700',
    color: colors.primary,
  },
  subNoticeText: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});

