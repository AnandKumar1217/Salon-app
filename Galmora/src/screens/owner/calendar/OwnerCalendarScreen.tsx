import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows, STATUS_BAR_HEIGHT } from '../../../constants/theme';
import { useOwnerSalon } from '../../../context/OwnerSalonContext';
import { Booking, BookingStatus } from '../../../types';
import { BlockTimeModal } from '../../../components/modals/BlockTimeModal';
import { AddAppointmentModal } from '../../../components/modals/AddAppointmentModal';

export const OwnerCalendarScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {
    staffList,
    appointments,
    blockedTimes,
    updateAppointmentStatus,
    removeBlockedTime,
  } = useOwnerSalon();

  // State
  const [selectedStaffId, setSelectedStaffId] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [appointmentModalVisible, setAppointmentModalVisible] = useState(false);

  // Generate next 7 days for calendar strip
  const dateStrip = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      dateStr: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: d.getDate(),
      monthName: d.toLocaleDateString('en-US', { month: 'short' }),
    };
  });

  // Filter bookings
  const filteredBookings = appointments
    .filter((b) => {
      if (viewMode === 'day' && b.date !== selectedDate) return false;
      if (selectedStaffId !== 'all' && b.staffId !== selectedStaffId) return false;
      return true;
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Blocked slots for selected staff & date
  const filteredBlocked = blockedTimes.filter((bt) => {
    if (viewMode === 'day' && bt.date !== selectedDate) return false;
    if (selectedStaffId !== 'all' && bt.staffId !== selectedStaffId) return false;
    return true;
  });

  const handleStatusChange = (bookingId: string, newStatus: BookingStatus) => {
    Alert.alert(
      `Update Status to ${newStatus}`,
      `Are you sure you want to mark this appointment as ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            await updateAppointmentStatus(bookingId, newStatus);
          },
        },
      ]
    );
  };

  const handleReportDelay = (bookingId: string) => {
    Alert.alert('Report Delay', 'Notify customer and update staff schedule with a delay?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: '10 Mins Delay',
        onPress: () => updateAppointmentStatus(bookingId, 'CONFIRMED', 10),
      },
      {
        text: '20 Mins Delay',
        onPress: () => updateAppointmentStatus(bookingId, 'CONFIRMED', 20),
      },
    ]);
  };

  const getSourceBadge = (source: Booking['source']) => {
    switch (source) {
      case 'WHATSAPP':
        return { label: 'WhatsApp', bg: '#E8F8F0', color: '#128C7E', icon: 'logo-whatsapp' as const };
      case 'WALK_IN':
        return { label: 'Walk-in', bg: '#FFF4E5', color: '#B25E00', icon: 'footsteps' as const };
      case 'APP':
      default:
        return { label: 'Online App', bg: '#FAF0F3', color: colors.primary, icon: 'globe-outline' as const };
    }
  };

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'IN_PROGRESS':
        return { label: 'IN PROGRESS', bg: colors.successLight, color: colors.success };
      case 'CONFIRMED':
        return { label: 'CONFIRMED', bg: colors.infoLight, color: colors.info };
      case 'COMPLETED':
        return { label: 'COMPLETED', bg: '#F0ECE9', color: '#666666' };
      case 'CANCELLED':
        return { label: 'CANCELLED', bg: colors.errorLight, color: colors.error };
      case 'NO_SHOW':
        return { label: 'NO SHOW', bg: '#FFEAEA', color: '#C62828' };
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Top Header Card */}
      <View style={styles.topCard}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.topBarTitle}>Salon Schedule</Text>
            <Text style={styles.topBarSub}>Staff Availability & Appointments</Text>
          </View>

          <View style={styles.topBarRight}>
            {/* View Mode Toggle Pill */}
            <View style={styles.togglePill}>
              <TouchableOpacity
                style={[styles.toggleBtn, viewMode === 'day' && styles.toggleBtnActive]}
                onPress={() => setViewMode('day')}
                activeOpacity={0.7}
              >
                <Text style={[styles.toggleText, viewMode === 'day' && styles.toggleTextActive]}>
                  Day
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, viewMode === 'week' && styles.toggleBtnActive]}
                onPress={() => setViewMode('week')}
                activeOpacity={0.7}
              >
                <Text style={[styles.toggleText, viewMode === 'week' && styles.toggleTextActive]}>
                  Week
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.addApptBtn}
              onPress={() => setAppointmentModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Strip (for Day view) */}
        {viewMode === 'day' && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateStrip}
          >
            {dateStrip.map((item) => {
              const isSelected = selectedDate === item.dateStr;
              return (
                <TouchableOpacity
                  key={item.dateStr}
                  style={[styles.dateChip, isSelected && styles.dateChipSelected]}
                  onPress={() => setSelectedDate(item.dateStr)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dayName, isSelected && styles.dateTextSelected]}>
                    {item.dayName}
                  </Text>
                  <Text style={[styles.dayNumber, isSelected && styles.dateTextSelected]}>
                    {item.dayNumber}
                  </Text>
                  <Text style={[styles.monthName, isSelected && styles.dateTextSelected]}>
                    {item.monthName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Staff Filter Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.staffFilterRow}
        >
          <TouchableOpacity
            style={[
              styles.staffFilterChip,
              selectedStaffId === 'all' && styles.staffFilterChipActive,
            ]}
            onPress={() => setSelectedStaffId('all')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.staffFilterText,
                selectedStaffId === 'all' && styles.staffFilterTextActive,
              ]}
            >
              All Staff ({staffList.length})
            </Text>
          </TouchableOpacity>

          {staffList.map((stf) => (
            <TouchableOpacity
              key={stf.id}
              style={[
                styles.staffFilterChip,
                selectedStaffId === stf.id && styles.staffFilterChipActive,
              ]}
              onPress={() => setSelectedStaffId(stf.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.staffFilterText,
                  selectedStaffId === stf.id && styles.staffFilterTextActive,
                ]}
              >
                {stf.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Schedule Summary & Action Bar */}
      <View style={styles.blockShortcutRow}>
        <View style={styles.countBadge}>
          <Ionicons name="calendar-outline" size={13} color={colors.primary} />
          <Text style={styles.slotCountText}>
            {filteredBookings.length} booking{filteredBookings.length === 1 ? '' : 's'}
            {filteredBlocked.length > 0 ? ` • ${filteredBlocked.length} blocked` : ''}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.blockBtnSmall}
          onPress={() => setBlockModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="ban-outline" size={13} color={colors.primary} />
          <Text style={styles.blockBtnSmallText}>Block Staff Time</Text>
        </TouchableOpacity>
      </View>

      {/* Schedule Feed */}
      <ScrollView contentContainerStyle={styles.scheduleFeed} showsVerticalScrollIndicator={false}>
        {/* Blocked Times Cards */}
        {filteredBlocked.map((block) => (
          <View key={block.id} style={styles.blockedCard}>
            <View style={styles.blockedLeft}>
              <View style={styles.blockedIconBox}>
                <Ionicons name="lock-closed" size={15} color="#8E2800" />
              </View>
              <View style={styles.blockedInfo}>
                <Text style={styles.blockedTitle}>
                  {block.staffName} ({block.startTime} - {block.endTime})
                </Text>
                <Text style={styles.blockedReason}>{block.reason || 'Staff Unavailable'}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => removeBlockedTime(block.id)}
              style={styles.unblockBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.unblockBtnText}>Unblock</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Appointment Cards */}
        {filteredBookings.length === 0 && filteredBlocked.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="calendar-outline" size={36} color={colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No Appointments Scheduled</Text>
            <Text style={styles.emptySub}>
              All resident staff chairs are free for this selection.
            </Text>
          </View>
        ) : (
          filteredBookings.map((b) => {
            const sourceBadge = getSourceBadge(b.source);
            const statusBadge = getStatusBadge(b.status);

            return (
              <View key={b.id} style={styles.bookingCard}>
                {/* 1. Header: Time Pill & Source Badge */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.timeTag}>
                    <Ionicons name="time" size={13} color={colors.primary} />
                    <Text style={styles.timeTagText}>
                      {b.startTime} - {b.endTime}
                    </Text>
                    <Text style={styles.durationTag}>({b.totalDurationMinutes}m)</Text>
                  </View>

                  <View style={[styles.sourceBadge, { backgroundColor: sourceBadge.bg }]}>
                    <Ionicons name={sourceBadge.icon} size={11} color={sourceBadge.color} />
                    <Text style={[styles.sourceBadgeText, { color: sourceBadge.color }]}>
                      {sourceBadge.label}
                    </Text>
                  </View>
                </View>

                {/* 2. Customer & Status Row */}
                <View style={styles.customerRow}>
                  <View style={styles.customerCol}>
                    <Text style={styles.customerName}>{b.customerName}</Text>
                    <Text style={styles.customerPhone}>📞 {b.customerPhone}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusBadge.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: statusBadge.color }]}>
                      {statusBadge.label}
                    </Text>
                  </View>
                </View>

                {/* 3. Service & Stylist Info Box */}
                <View style={styles.serviceBox}>
                  <View style={styles.serviceRow}>
                    <Text style={styles.serviceName} numberOfLines={1}>
                      {b.services.map((s) => s.name).join(' + ')}
                    </Text>
                    <Text style={styles.servicePrice}>₹{b.totalAmount}</Text>
                  </View>
                  <View style={styles.staffAssignedRow}>
                    <Ionicons name="person" size={12} color={colors.primary} />
                    <Text style={styles.staffAssignedText}>
                      Stylist: <Text style={styles.bold}>{b.staffName}</Text>
                    </Text>
                  </View>
                </View>

                {/* 4. Delay Notice Tag if present */}
                {b.delayMinutes && b.delayMinutes > 0 ? (
                  <View style={styles.delayTagRow}>
                    <Ionicons name="alert-circle" size={13} color={colors.warning} />
                    <Text style={styles.delayTagText}>
                      Running {b.delayMinutes} mins behind schedule
                    </Text>
                  </View>
                ) : null}

                {/* 5. Clean, Properly Aligned Action Buttons */}
                {b.status === 'CONFIRMED' && (
                  <View style={styles.actionsContainer}>
                    <TouchableOpacity
                      style={styles.checkInBtn}
                      onPress={() => handleStatusChange(b.id, 'IN_PROGRESS')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="play" size={13} color="#FFFFFF" />
                      <Text style={styles.checkInBtnText}>Check In</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.delayBtn}
                      onPress={() => handleReportDelay(b.id)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="time-outline" size={13} color={colors.warning} />
                      <Text style={styles.delayBtnText}>+10m Delay</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.noShowBtn}
                      onPress={() => handleStatusChange(b.id, 'NO_SHOW')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="close" size={13} color={colors.error} />
                      <Text style={styles.noShowBtnText}>No-Show</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {b.status === 'IN_PROGRESS' && (
                  <View style={styles.actionsContainer}>
                    <TouchableOpacity
                      style={styles.completeBtn}
                      onPress={() => handleStatusChange(b.id, 'COMPLETED')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
                      <Text style={styles.completeBtnText}>Complete & Bill Service</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modals */}
      <BlockTimeModal
        visible={blockModalVisible}
        onClose={() => setBlockModalVisible(false)}
      />
      <AddAppointmentModal
        visible={appointmentModalVisible}
        onClose={() => setAppointmentModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topCard: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingTop: STATUS_BAR_HEIGHT + 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  topBarTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  topBarSub: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  togglePill: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceWarm,
    padding: 3,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  toggleBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: borderRadius.full,
  },
  toggleBtnActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  addApptBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateStrip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: 8,
  },
  dateChip: {
    width: 52,
    height: 64,
    backgroundColor: colors.surfaceWarm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  dateChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayName: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  dayNumber: {
    fontSize: typography.fontSize.base,
    fontWeight: '800',
    color: colors.textPrimary,
    marginVertical: 1,
  },
  monthName: {
    fontSize: 9,
    color: colors.textTertiary,
  },
  dateTextSelected: {
    color: '#FFFFFF',
  },
  staffFilterRow: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: 6,
  },
  staffFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  staffFilterChipActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  staffFilterText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  staffFilterTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  blockShortcutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceWarm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  slotCountText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  blockBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 4,
  },
  blockBtnSmallText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  scheduleFeed: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.huge,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  blockedCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF2EC',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#FFCCBC',
  },
  blockedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  blockedIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFE0B2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockedInfo: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  blockedTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E2800',
  },
  blockedReason: {
    fontSize: 11,
    color: '#8E2800',
    opacity: 0.8,
    marginTop: 1,
  },
  unblockBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#FFCCBC',
  },
  unblockBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E2800',
  },
  bookingCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    marginBottom: spacing.sm,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeTagText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '800',
    color: colors.primary,
  },
  durationTag: {
    fontSize: 11,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  sourceBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  customerCol: {
    flex: 1,
    marginRight: spacing.sm,
  },
  customerName: {
    fontSize: typography.fontSize.md,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  customerPhone: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  serviceBox: {
    backgroundColor: colors.surfaceWarm,
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: typography.fontSize.xs + 1,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  servicePrice: {
    fontSize: typography.fontSize.xs + 1,
    fontWeight: '800',
    color: colors.primary,
  },
  staffAssignedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  staffAssignedText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  bold: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  delayTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E5',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
    gap: 5,
  },
  delayTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.warning,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  checkInBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  checkInBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  delayBtn: {
    flex: 1.1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF4E5',
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.warning,
    gap: 4,
  },
  delayBtnText: {
    color: colors.warning,
    fontSize: 11,
    fontWeight: '700',
  },
  noShowBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE',
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.error,
    gap: 4,
  },
  noShowBtnText: {
    color: colors.error,
    fontSize: 11,
    fontWeight: '700',
  },
  completeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    gap: 6,
  },
  completeBtnText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.xs + 1,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.huge,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  emptySub: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    marginTop: 4,
    textAlign: 'center',
  },
});
