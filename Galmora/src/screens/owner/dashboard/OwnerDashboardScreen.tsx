import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows, STATUS_BAR_HEIGHT } from '../../../constants/theme';
import { useOwnerSalon } from '../../../context/OwnerSalonContext';
import { AddWalkInModal } from '../../../components/modals/AddWalkInModal';
import { AddAppointmentModal } from '../../../components/modals/AddAppointmentModal';
import { BlockTimeModal } from '../../../components/modals/BlockTimeModal';

export const OwnerDashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {
    salon,
    staffList,
    appointments,
    waitingQueue,
    dailyRevenue,
    updateAppointmentStatus,
    togglePauseOnlineBooking,
    refreshOwnerData,
  } = useOwnerSalon();

  const [refreshing, setRefreshing] = useState(false);
  const [walkInModalVisible, setWalkInModalVisible] = useState(false);
  const [appointmentModalVisible, setAppointmentModalVisible] = useState(false);
  const [blockTimeModalVisible, setBlockTimeModalVisible] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshOwnerData();
    setRefreshing(false);
  };

  const handleToggleOnlinePause = async () => {
    const isPaused = await togglePauseOnlineBooking();
    Alert.alert(
      isPaused ? 'Online Bookings Paused ⏸️' : 'Online Bookings Live ▶️',
      isPaused
        ? 'Public booking links and app discovery now show slots as temporarily held.'
        : 'Your salon is now live and accepting online reservations.'
    );
  };

  // Metrics computation
  const todayStr = new Date().toISOString().split('T')[0];
  const todayBookings = appointments.filter((b) => b.date === todayStr);

  const walkInsToday = todayBookings.filter((b) => b.source === 'WALK_IN').length;
  const appBookingsToday = todayBookings.filter((b) => b.source === 'APP').length;
  const whatsAppToday = todayBookings.filter((b) => b.source === 'WHATSAPP').length;
  const completedToday = todayBookings.filter((b) => b.status === 'COMPLETED').length;

  const inProgressList = todayBookings.filter((b) => b.status === 'IN_PROGRESS');
  const workingStaffCount = inProgressList.length;
  const activeStaffTotal = staffList.filter((s) => s.isActive).length;
  const availableStaffCount = Math.max(0, activeStaffTotal - workingStaffCount);

  // Next upcoming confirmed booking
  const upcomingConfirmed = todayBookings
    .filter((b) => b.status === 'CONFIRMED')
    .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];

  // Delayed appointments
  const delayedList = todayBookings.filter((b) => b.delayMinutes && b.delayMinutes > 0);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Top Operational Bar */}
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          <Text style={styles.salonName} numberOfLines={1}>
            {salon?.name || 'Maison De Belle'}
          </Text>
          <View style={styles.liveBadgeRow}>
            <View
              style={[
                styles.liveStatusDot,
                salon?.isOnlineBookingPaused ? styles.dotPaused : styles.dotActive,
              ]}
            />
            <Text style={styles.liveStatusText}>
              {salon?.isOnlineBookingPaused ? 'Online Booking Paused' : 'Live Booking Active'}
            </Text>
          </View>
        </View>

        <View style={styles.topRightActions}>
          <TouchableOpacity
            style={styles.pauseBtn}
            onPress={handleToggleOnlinePause}
            activeOpacity={0.8}
          >
            <Ionicons
              name={salon?.isOnlineBookingPaused ? 'play' : 'pause'}
              size={16}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Quick Action Dock */}
        <View style={styles.quickActionCard}>
          <Text style={styles.sectionHeaderTitle}>FAST OPERATIONAL ACTIONS</Text>
          <View style={styles.quickActionRow}>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => setWalkInModalVisible(true)}
            >
              <View style={[styles.actionIconBox, { backgroundColor: colors.primary }]}>
                <Ionicons name="person-add" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.actionLabel}>Add Walk-in</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => setAppointmentModalVisible(true)}
            >
              <View style={[styles.actionIconBox, { backgroundColor: colors.roseDark }]}>
                <Ionicons name="calendar" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.actionLabel}>Add Appt</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => setBlockTimeModalVisible(true)}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#8E2800' }]}>
                <Ionicons name="ban" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.actionLabel}>Block Time</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation.navigate('StaffTab')}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#3A506B' }]}>
                <Ionicons name="people" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.actionLabel}>Staff</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Live Operational KPI Grid */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <View style={styles.kpiTop}>
              <Text style={styles.kpiLabel}>TODAY'S APPTS</Text>
              <Ionicons name="calendar-outline" size={16} color={colors.primary} />
            </View>
            <Text style={styles.kpiValue}>{todayBookings.length}</Text>
            <Text style={styles.kpiSub}>
              {completedToday} done • {todayBookings.length - completedToday} pending
            </Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiTop}>
              <Text style={styles.kpiLabel}>TODAY'S WALK-INS</Text>
              <Ionicons name="footsteps-outline" size={16} color={colors.roseDark} />
            </View>
            <Text style={styles.kpiValue}>{walkInsToday}</Text>
            <Text style={styles.kpiSub}>Direct offline clients</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiTop}>
              <Text style={styles.kpiLabel}>WAITING QUEUE</Text>
              <Ionicons name="hourglass-outline" size={16} color={colors.warning} />
            </View>
            <Text style={[styles.kpiValue, waitingQueue.length > 0 && { color: colors.warning }]}>
              {waitingQueue.length}
            </Text>
            <Text style={styles.kpiSub}>
              {waitingQueue.length > 0 ? 'Clients in lounge' : 'Zero queue'}
            </Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiTop}>
              <Text style={styles.kpiLabel}>STAFF STATUS</Text>
              <Ionicons name="person-circle-outline" size={16} color={colors.success} />
            </View>
            <Text style={styles.kpiValue}>
              {workingStaffCount} / {activeStaffTotal}
            </Text>
            <Text style={styles.kpiSub}>{availableStaffCount} available now</Text>
          </View>
        </View>

        {/* Next Upcoming Appointment Highlight */}
        {upcomingConfirmed ? (
          <View style={styles.nextAppointmentCard}>
            <View style={styles.nextCardHeader}>
              <View style={styles.nextTag}>
                <Ionicons name="alarm-outline" size={14} color={colors.primary} />
                <Text style={styles.nextTagText}>NEXT CONFIRMED APPOINTMENT</Text>
              </View>
              <Text style={styles.nextTime}>{upcomingConfirmed.startTime}</Text>
            </View>

            <Text style={styles.nextCustomerName}>{upcomingConfirmed.customerName}</Text>
            <Text style={styles.nextService}>
              {upcomingConfirmed.services[0]?.name} • with {upcomingConfirmed.staffName}
            </Text>

            <View style={styles.nextActionsRow}>
              <TouchableOpacity
                style={styles.quickStartBtn}
                onPress={() => updateAppointmentStatus(upcomingConfirmed.id, 'IN_PROGRESS')}
              >
                <Ionicons name="play" size={14} color="#FFFFFF" />
                <Text style={styles.quickStartBtnText}>Start Service</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickDelayBtn}
                onPress={() => {
                  Alert.alert('Report Delay', 'Notify customer of 10-minute queue delay?', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Notify 10m Delay',
                      onPress: () => updateAppointmentStatus(upcomingConfirmed.id, 'CONFIRMED', 10),
                    },
                  ]);
                }}
              >
                <Ionicons name="time-outline" size={14} color={colors.warning} />
                <Text style={styles.quickDelayBtnText}>10m Delay</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Delay Warnings Banner if any */}
        {delayedList.length > 0 && (
          <View style={styles.delayBanner}>
            <Ionicons name="warning" size={20} color="#D32F2F" />
            <View style={styles.delayBannerText}>
              <Text style={styles.delayBannerTitle}>
                {delayedList.length} Appointment(s) Running Late
              </Text>
              <Text style={styles.delayBannerSub}>
                Customer notifications dispatched. Automatic buffer protection active.
              </Text>
            </View>
          </View>
        )}

        {/* Currently In-Progress Chairs */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.blockTitle}>Chairs In Service ({inProgressList.length})</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CalendarTab')}>
              <Text style={styles.viewCalendarLink}>View Calendar</Text>
            </TouchableOpacity>
          </View>

          {inProgressList.length === 0 ? (
            <View style={styles.emptyChairsBox}>
              <Ionicons name="sparkles-outline" size={24} color={colors.textTertiary} />
              <Text style={styles.emptyChairsText}>All styling chairs currently open</Text>
            </View>
          ) : (
            inProgressList.map((chair) => (
              <View key={chair.id} style={styles.chairCard}>
                <View style={styles.chairTopRow}>
                  <View style={styles.chairBadge}>
                    <Text style={styles.chairBadgeText}>IN CHAIR</Text>
                  </View>
                  <Text style={styles.chairTime}>
                    {chair.startTime} - {chair.endTime}
                  </Text>
                </View>

                <Text style={styles.chairCustomer}>{chair.customerName}</Text>
                <Text style={styles.chairDetails}>
                  {chair.services[0]?.name} • Stylist: {chair.staffName}
                </Text>

                <View style={styles.chairBottomActions}>
                  <TouchableOpacity
                    style={styles.completeBtn}
                    onPress={() => updateAppointmentStatus(chair.id, 'COMPLETED')}
                  >
                    <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
                    <Text style={styles.completeBtnText}>Complete & Bill</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Today's Booking Channels & Revenue Breakdown */}
        <View style={styles.revenueCard}>
          <Text style={styles.revenueCardTitle}>TODAY'S COLLECTIONS & CHANNELS</Text>
          <Text style={styles.revenueAmount}>₹{dailyRevenue.totalRevenue.toLocaleString()}</Text>

          <View style={styles.revenueSplitRow}>
            <View style={styles.revenueSplitItem}>
              <Text style={styles.splitSub}>Online UPI/Card</Text>
              <Text style={styles.splitVal}>₹{dailyRevenue.onlineRevenue.toLocaleString()}</Text>
            </View>
            <View style={styles.splitDivider} />
            <View style={styles.revenueSplitItem}>
              <Text style={styles.splitSub}>Pay at Salon</Text>
              <Text style={styles.splitVal}>₹{dailyRevenue.cashRevenue.toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.channelRow}>
            <View style={styles.channelBadge}>
              <Text style={styles.channelBadgeText}>App: {appBookingsToday}</Text>
            </View>
            <View style={styles.channelBadge}>
              <Text style={styles.channelBadgeText}>WhatsApp: {whatsAppToday}</Text>
            </View>
            <View style={styles.channelBadge}>
              <Text style={styles.channelBadgeText}>Walk-in: {walkInsToday}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Quick Action Modals */}
      <AddWalkInModal
        visible={walkInModalVisible}
        onClose={() => setWalkInModalVisible(false)}
      />
      <AddAppointmentModal
        visible={appointmentModalVisible}
        onClose={() => setAppointmentModalVisible(false)}
      />
      <BlockTimeModal
        visible={blockTimeModalVisible}
        onClose={() => setBlockTimeModalVisible(false)}
      />
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
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    ...shadows.subtle,
  },
  topLeft: {
    flex: 1,
  },
  salonName: {
    fontSize: typography.fontSize.lg,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  liveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  liveStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  dotActive: {
    backgroundColor: colors.success,
  },
  dotPaused: {
    backgroundColor: colors.warning,
  },
  liveStatusText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pauseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.huge,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  quickActionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.card,
  },
  sectionHeaderTitle: {
    fontSize: typography.fontSize.xs - 1,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
  quickActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionItem: {
    alignItems: 'center',
    flex: 1,
  },
  actionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
    marginBottom: spacing.md,
  },
  kpiCard: {
    width: '47.5%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: '1.25%',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.subtle,
  },
  kpiTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textTertiary,
    letterSpacing: 0.6,
  },
  kpiValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  kpiSub: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  nextAppointmentCard: {
    backgroundColor: '#FAF5F7',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.roseLight,
  },
  nextCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  nextTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nextTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  nextTime: {
    fontSize: typography.fontSize.sm,
    fontWeight: '800',
    color: colors.primary,
  },
  nextCustomerName: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  nextService: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  nextActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  quickStartBtnText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
  },
  quickDelayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E5',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.warning,
    gap: 4,
  },
  quickDelayBtnText: {
    color: colors.warning,
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
  },
  delayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    gap: spacing.sm,
  },
  delayBannerText: {
    flex: 1,
  },
  delayBannerTitle: {
    fontSize: typography.fontSize.xs + 1,
    fontWeight: '700',
    color: '#D32F2F',
  },
  delayBannerSub: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  sectionBlock: {
    marginBottom: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  blockTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  viewCalendarLink: {
    fontSize: typography.fontSize.xs + 1,
    fontWeight: '700',
    color: colors.primary,
  },
  emptyChairsBox: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  emptyChairsText: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  chairCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chairTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chairBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  chairBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.success,
  },
  chairTime: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  chairCustomer: {
    fontSize: typography.fontSize.sm + 1,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  chairDetails: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  chairBottomActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  completeBtnText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
  },
  revenueCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.card,
  },
  revenueCardTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.textTertiary,
  },
  revenueAmount: {
    fontSize: typography.fontSize.xxl,
    fontWeight: '900',
    color: colors.primary,
    marginVertical: spacing.xs,
  },
  revenueSplitRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
    marginVertical: spacing.sm,
  },
  revenueSplitItem: {
    flex: 1,
    alignItems: 'center',
  },
  splitDivider: {
    width: 1,
    backgroundColor: colors.borderLight,
  },
  splitSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  splitVal: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  channelRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  channelBadge: {
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
  },
  channelBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});

