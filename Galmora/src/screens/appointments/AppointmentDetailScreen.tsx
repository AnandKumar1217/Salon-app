import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { BookingStatusBadge } from '../../components/common/Badge';
import { CancelBookingModal } from '../../components/modals/CancelBookingModal';
import { RescheduleModal } from '../../components/modals/RescheduleModal';
import { useBookings } from '../../context/BookingsContext';

type Props = NativeStackScreenProps<RootStackParamList, 'AppointmentDetail'>;

export const AppointmentDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { bookingId } = route.params;
  const { bookings, cancelBooking, rescheduleBooking } = useBookings();

  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);

  const booking = bookings.find((b) => b.id === bookingId);

  if (!booking) {
    return (
      <View style={styles.container}>
        <Header title="Booking Details" onBack={() => navigation.goBack()} />
        <View style={styles.centerBox}>
          <Text style={styles.notFoundText}>Booking not found.</Text>
        </View>
      </View>
    );
  }

  const isCancellable =
    booking.status === 'CONFIRMED' || booking.status === 'IN_PROGRESS';

  const handleDirections = () => {
    const query = encodeURIComponent(`${booking.salonName}, ${booking.salonAddress}`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  const handleCallSalon = () => {
    Linking.openURL(`tel:${booking.salonPhone.replace(/\s+/g, '')}`);
  };

  const handleWhatsAppSalon = () => {
    const cleanNumber = (booking.salonWhatsapp || booking.salonPhone).replace(/\D/g, '');
    const msg = encodeURIComponent(
      `Hi ${booking.salonName}! Regarding my booking #${booking.bookingCode} on ${booking.date} at ${booking.startTime}.`
    );
    Linking.openURL(`whatsapp://send?phone=${cleanNumber}&text=${msg}`).catch(() => {
      Linking.openURL(`https://wa.me/${cleanNumber}?text=${msg}`);
    });
  };

  const onConfirmCancel = async (reason: string) => {
    await cancelBooking(booking.id, reason);
    Alert.alert('Booking Cancelled', 'Your appointment has been cancelled successfully.');
  };

  const onConfirmReschedule = async (newDate: string, newTime: string) => {
    await rescheduleBooking(booking.id, newDate, newTime);
    Alert.alert(
      'Appointment Rescheduled',
      `Your appointment has been moved to ${newDate} at ${newTime}.`
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Header
        title={`Booking #${booking.bookingCode}`}
        subtitle={booking.salonName}
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.card}>
          <View style={styles.statusHeader}>
            <View>
              <Text style={styles.refLabel}>REFERENCE CODE</Text>
              <Text style={styles.refValue}>#{booking.bookingCode}</Text>
            </View>
            <BookingStatusBadge status={booking.status} size="md" />
          </View>

          {/* Delay Notice Banner if reported */}
          {booking.delayMinutes && (
            <View style={styles.delayBox}>
              <Ionicons name="time" size={18} color={colors.warning} />
              <View style={{ flex: 1 }}>
                <Text style={styles.delayTitle}>
                  Salon Delay: {booking.delayMinutes} mins
                </Text>
                <Text style={styles.delayDesc}>
                  Your updated start time is expected around {booking.newStartTime || booking.startTime}.
                </Text>
              </View>
            </View>
          )}

          {/* Cancellation Notice if cancelled */}
          {booking.status === 'CANCELLED' && (
            <View style={styles.cancelledBox}>
              <Ionicons name="alert-circle" size={18} color={colors.error} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cancelledTitle}>Appointment Cancelled</Text>
                <Text style={styles.cancelledDesc}>
                  Reason: {booking.cancellationReason || 'Customer requested'}
                </Text>
              </View>
            </View>
          )}

          {/* Status Timeline */}
          <View style={styles.timeline}>
            <View style={styles.timelineStep}>
              <View style={[styles.timelineDot, styles.timelineDotActive]} />
              <Text style={styles.timelineStepText}>Booked</Text>
            </View>
            <View style={[styles.timelineLine, styles.timelineLineActive]} />

            <View style={styles.timelineStep}>
              <View
                style={[
                  styles.timelineDot,
                  (booking.status === 'CONFIRMED' || booking.status === 'IN_PROGRESS' || booking.status === 'COMPLETED') &&
                    styles.timelineDotActive,
                ]}
              />
              <Text style={styles.timelineStepText}>Confirmed</Text>
            </View>
            <View
              style={[
                styles.timelineLine,
                (booking.status === 'IN_PROGRESS' || booking.status === 'COMPLETED') &&
                  styles.timelineLineActive,
              ]}
            />

            <View style={styles.timelineStep}>
              <View
                style={[
                  styles.timelineDot,
                  booking.status === 'COMPLETED' && styles.timelineDotActive,
                ]}
              />
              <Text style={styles.timelineStepText}>Completed</Text>
            </View>
          </View>
        </View>

        {/* Schedule & Salon Info */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Salon & Schedule</Text>

          <View style={styles.detailRow}>
            <Ionicons name="business" size={20} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.detailTitle}>{booking.salonName}</Text>
              <Text style={styles.detailSubtitle}>{booking.salonAddress}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={20} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.detailTitle}>
                {booking.date} • {booking.startTime} – {booking.endTime}
              </Text>
              <Text style={styles.detailSubtitle}>
                Total Duration: {booking.totalDurationMinutes} mins • {booking.bufferMinutes} min buffer
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="person" size={20} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.detailTitle}>{booking.staffName}</Text>
              <Text style={styles.detailSubtitle}>Dedicated Stylist</Text>
            </View>
          </View>

          {/* Quick Contact Row */}
          <View style={styles.contactActionsRow}>
            <TouchableOpacity style={styles.contactBtn} onPress={handleDirections}>
              <Ionicons name="navigate-outline" size={16} color={colors.primary} />
              <Text style={styles.contactBtnText}>Directions</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactBtn} onPress={handleCallSalon}>
              <Ionicons name="call-outline" size={16} color={colors.primary} />
              <Text style={styles.contactBtnText}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactBtn} onPress={handleWhatsAppSalon}>
              <Ionicons name="logo-whatsapp" size={16} color={colors.whatsapp} />
              <Text style={styles.contactBtnText}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Services & Bill Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Services & Payment</Text>

          {booking.services.map((srv) => (
            <View key={srv.id} style={styles.serviceItemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.srvName}>{srv.name}</Text>
                <Text style={styles.srvDuration}>{srv.durationMinutes} mins</Text>
              </View>
              <Text style={styles.srvPrice}>₹{srv.price}</Text>
            </View>
          ))}

          <View style={styles.billDivider} />

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Subtotal</Text>
            <Text style={styles.billVal}>₹{booking.subtotal}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Salon Tax & GST (5%)</Text>
            <Text style={styles.billVal}>₹{booking.tax}</Text>
          </View>

          <View style={[styles.billRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Text style={styles.totalVal}>₹{booking.totalAmount}</Text>
          </View>

          <View style={styles.paymentMethodBadge}>
            <Ionicons
              name={booking.paymentMethod === 'ONLINE' ? 'card-outline' : 'storefront-outline'}
              size={14}
              color={colors.primary}
            />
            <Text style={styles.paymentMethodText}>
              {booking.paymentMethod === 'ONLINE'
                ? 'Paid Online (Verified)'
                : 'Pay at Salon Reception (Pending)'}
            </Text>
          </View>
        </View>

        {/* Cancellation / Reschedule Actions */}
        {isCancellable && (
          <View style={styles.managementActions}>
            <Button
              title="Reschedule Appointment"
              variant="outline"
              size="md"
              leftIcon="calendar-outline"
              onPress={() => setRescheduleModalVisible(true)}
              style={styles.actionButton}
            />

            <Button
              title="Cancel Appointment"
              variant="danger"
              size="md"
              leftIcon="close-circle-outline"
              onPress={() => setCancelModalVisible(true)}
              style={styles.actionButton}
            />
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <CancelBookingModal
        visible={cancelModalVisible}
        booking={booking}
        onClose={() => setCancelModalVisible(false)}
        onConfirm={onConfirmCancel}
      />

      <RescheduleModal
        visible={rescheduleModalVisible}
        booking={booking}
        onClose={() => setRescheduleModalVisible(false)}
        onConfirm={onConfirmReschedule}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.huge,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.card,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  refLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.8,
  },
  refValue: {
    fontSize: typography.fontSize.md,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 2,
  },
  delayBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  delayTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.warning,
  },
  delayDesc: {
    fontSize: 11,
    color: colors.textPrimary,
    marginTop: 2,
  },
  cancelledBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  cancelledTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.error,
  },
  cancelledDesc: {
    fontSize: 11,
    color: colors.textPrimary,
    marginTop: 2,
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  timelineStep: {
    alignItems: 'center',
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 2,
    borderColor: colors.borderDark,
    marginBottom: 4,
  },
  timelineDotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timelineStepText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  timelineLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.borderLight,
    marginBottom: 16,
    marginHorizontal: 8,
  },
  timelineLineActive: {
    backgroundColor: colors.primary,
  },
  cardSectionTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  detailTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  detailSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  contactActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.md,
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceWarm,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: 6,
  },
  contactBtnText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  serviceItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  srvName: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  srvDuration: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  srvPrice: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  billDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    marginVertical: spacing.sm,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  billLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  billVal: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.borderDark,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
  totalLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  totalVal: {
    fontSize: typography.fontSize.base,
    fontWeight: '800',
    color: colors.primary,
  },
  paymentMethodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceWarm,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.md,
    gap: 6,
  },
  paymentMethodText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  managementActions: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  actionButton: {
    width: '100%',
  },
});
