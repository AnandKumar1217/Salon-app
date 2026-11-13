import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows, STATUS_BAR_HEIGHT } from '../../../constants/theme';
import { useOwnerSalon } from '../../../context/OwnerSalonContext';
import { AddWalkInModal } from '../../../components/modals/AddWalkInModal';

export const WalkInManagementScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {
    staffList,
    appointments,
    waitingQueue,
    serveQueueCustomer,
    cancelQueueCustomer,
    updateAppointmentStatus,
  } = useOwnerSalon();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedQueueItem, setSelectedQueueItem] = useState<string | null>(null);

  // Active walk-in bookings
  const todayStr = new Date().toISOString().split('T')[0];
  const activeWalkIns = appointments.filter(
    (b) => b.date === todayStr && b.source === 'WALK_IN' && b.status === 'IN_PROGRESS'
  );

  const activeStaffTotal = staffList.filter((s) => s.isActive).length;
  const inServiceStaffCount = appointments.filter(
    (b) => b.date === todayStr && b.status === 'IN_PROGRESS'
  ).length;
  const availableStaff = Math.max(0, activeStaffTotal - inServiceStaffCount);

  const handleSeatFromQueue = (queueId: string) => {
    // Find available staff
    const busyStaffIds = appointments
      .filter((b) => b.date === todayStr && b.status === 'IN_PROGRESS')
      .map((b) => b.staffId);

    const openStaff = staffList.filter((s) => s.isActive && !busyStaffIds.includes(s.id));

    if (openStaff.length === 0) {
      Alert.alert(
        'All Stylists Engaged',
        'There are currently no free staff members. Confirmed appointments and active clients are protected.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Assign Staff Member',
      'Select which available specialist will take this waiting walk-in:',
      [
        ...openStaff.map((stf) => ({
          text: stf.name,
          onPress: async () => {
            await serveQueueCustomer(queueId, stf.id);
            Alert.alert('Customer Seated', `Assigned to ${stf.name}. Service is now live.`);
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleNotifyCustomer = (phone: string, name: string) => {
    const clean = phone.replace(/\D/g, '');
    const msg = `Hello ${name}! 👋 Your chair is almost ready at ${staffList[0]?.name || 'the salon'}. Please head inside.`;
    Linking.openURL(`sms:${clean}?body=${encodeURIComponent(msg)}`);
  };

  const handleRemoveFromQueue = (queueId: string, name: string) => {
    Alert.alert('Remove Customer', `Cancel waiting queue ticket for ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => cancelQueueCustomer(queueId),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Top Header */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.topBarTitle}>Walk-in Management</Text>
          <Text style={styles.topBarSub}>Zero Overbooking • Capacity Protection</Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="person-add" size={16} color="#FFFFFF" />
          <Text style={styles.addBtnText}>New Walk-in</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Real-time Capacity Banner */}
        <View style={styles.capacityBanner}>
          <View style={styles.capacityItem}>
            <Text style={styles.capacityVal}>{availableStaff}</Text>
            <Text style={styles.capacityLabel}>Available Stylists</Text>
          </View>
          <View style={styles.capacityDivider} />
          <View style={styles.capacityItem}>
            <Text style={styles.capacityVal}>{waitingQueue.length}</Text>
            <Text style={styles.capacityLabel}>Waiting in Lounge</Text>
          </View>
          <View style={styles.capacityDivider} />
          <View style={styles.capacityItem}>
            <Text style={styles.capacityVal}>{activeWalkIns.length}</Text>
            <Text style={styles.capacityLabel}>Walk-ins in Chair</Text>
          </View>
        </View>

        {/* Section 1: Waiting Queue */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleWithBadge}>
            <Text style={styles.sectionTitle}>Waiting Lounge Queue</Text>
            {waitingQueue.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{waitingQueue.length}</Text>
              </View>
            )}
          </View>
          <Text style={styles.queueEngineHint}>Protected FIFO Order</Text>
        </View>

        {waitingQueue.length === 0 ? (
          <View style={styles.emptyQueueCard}>
            <Ionicons name="people-outline" size={36} color={colors.textTertiary} />
            <Text style={styles.emptyQueueTitle}>Lounge is Clear</Text>
            <Text style={styles.emptyQueueSub}>
              All offline walk-in guests are currently seated or completed.
            </Text>
          </View>
        ) : (
          waitingQueue.map((item, index) => (
            <View key={item.id} style={styles.queueCard}>
              <View style={styles.queueLeft}>
                <View style={styles.queueOrderCircle}>
                  <Text style={styles.queueOrderNumber}>#{index + 1}</Text>
                </View>
                <View style={styles.queueCustomerInfo}>
                  <Text style={styles.queueCustomerName}>{item.customerName}</Text>
                  <Text style={styles.queueCustomerPhone}>📞 {item.customerPhone}</Text>
                  <Text style={styles.queueServices}>
                    {item.serviceNames.join(', ')} ({item.totalDurationMinutes}m)
                  </Text>
                  <Text style={styles.queuePrefStaff}>
                    Preference: {item.preferredStaffName || 'Any Available'}
                  </Text>
                </View>
              </View>

              <View style={styles.queueRightActions}>
                <View style={styles.waitBadge}>
                  <Ionicons name="time-outline" size={12} color={colors.warning} />
                  <Text style={styles.waitBadgeText}>~{item.estimatedWaitMinutes}m wait</Text>
                </View>

                <TouchableOpacity
                  style={styles.seatNowBtn}
                  onPress={() => handleSeatFromQueue(item.id)}
                >
                  <Ionicons name="play" size={13} color="#FFFFFF" />
                  <Text style={styles.seatNowBtnText}>Seat Guest</Text>
                </TouchableOpacity>

                <View style={styles.queueSecondaryActions}>
                  <TouchableOpacity
                    style={styles.iconActionBtn}
                    onPress={() => handleNotifyCustomer(item.customerPhone, item.customerName)}
                  >
                    <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.primary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.iconActionBtn}
                    onPress={() => handleRemoveFromQueue(item.id, item.customerName)}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}

        {/* Section 2: Walk-ins Currently In Chair */}
        <View style={[styles.sectionHeaderRow, { marginTop: spacing.xl }]}>
          <Text style={styles.sectionTitle}>Walk-ins Currently in Chair ({activeWalkIns.length})</Text>
        </View>

        {activeWalkIns.length === 0 ? (
          <View style={styles.emptyQueueCard}>
            <Ionicons name="sparkles-outline" size={32} color={colors.textTertiary} />
            <Text style={styles.emptyQueueTitle}>No Active Walk-ins</Text>
            <Text style={styles.emptyQueueSub}>
              Walk-in guests assigned to stylists will show up here.
            </Text>
          </View>
        ) : (
          activeWalkIns.map((walkIn) => (
            <View key={walkIn.id} style={styles.activeWalkInCard}>
              <View style={styles.walkInTopRow}>
                <View style={styles.inServiceBadge}>
                  <Text style={styles.inServiceBadgeText}>IN CHAIR</Text>
                </View>
                <Text style={styles.walkInTimer}>
                  Started: {walkIn.startTime} (Est. finish: {walkIn.endTime})
                </Text>
              </View>

              <Text style={styles.walkInName}>{walkIn.customerName}</Text>
              <Text style={styles.walkInMeta}>
                {walkIn.services[0]?.name} • Stylist: <Text style={styles.bold}>{walkIn.staffName}</Text>
              </Text>
              <Text style={styles.walkInBill}>
                Total Bill: ₹{walkIn.totalAmount} (Pay at Salon)
              </Text>

              <View style={styles.walkInFooter}>
                <TouchableOpacity
                  style={styles.finishBtn}
                  onPress={() => updateAppointmentStatus(walkIn.id, 'COMPLETED')}
                >
                  <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
                  <Text style={styles.finishBtnText}>Complete & Record Payment</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Walk-in Modal */}
      <AddWalkInModal visible={modalVisible} onClose={() => setModalVisible(false)} />
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
  topBarTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  topBarSub: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs + 3,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.xs,
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
  capacityBanner: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.card,
  },
  capacityItem: {
    flex: 1,
    alignItems: 'center',
  },
  capacityDivider: {
    width: 1,
    backgroundColor: colors.borderLight,
  },
  capacityVal: {
    fontSize: typography.fontSize.xl,
    fontWeight: '900',
    color: colors.primary,
  },
  capacityLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  countBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: borderRadius.full,
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  queueEngineHint: {
    fontSize: 11,
    color: colors.textTertiary,
    fontWeight: '600',
  },
  emptyQueueCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  emptyQueueTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  emptyQueueSub: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 2,
  },
  queueCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.subtle,
  },
  queueLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  queueOrderCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  queueOrderNumber: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  queueCustomerInfo: {
    flex: 1,
  },
  queueCustomerName: {
    fontSize: typography.fontSize.base - 1,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  queueCustomerPhone: {
    fontSize: 11,
    color: colors.textTertiary,
    marginVertical: 1,
  },
  queueServices: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  queuePrefStaff: {
    fontSize: 10,
    color: colors.textTertiary,
    fontStyle: 'italic',
    marginTop: 1,
  },
  queueRightActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginLeft: spacing.sm,
  },
  waitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    gap: 3,
    marginBottom: spacing.xs,
  },
  waitBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.warning,
  },
  seatNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 5,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: borderRadius.md,
    gap: 4,
    marginBottom: spacing.xs,
  },
  seatNowBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  queueSecondaryActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  iconActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeWalkInCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.subtle,
  },
  walkInTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  inServiceBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  inServiceBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.success,
  },
  walkInTimer: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  walkInName: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  walkInMeta: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bold: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  walkInBill: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  walkInFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.xs + 2,
  },
  finishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  finishBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});

