import React from 'react';
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
import { colors, typography, spacing, borderRadius, shadows, STATUS_BAR_HEIGHT } from '../../constants/theme';
import { Button } from '../../components/common/Button';
import { useBookings } from '../../context/BookingsContext';

type Props = NativeStackScreenProps<RootStackParamList, 'BookingConfirmation'>;

export const BookingConfirmationScreen: React.FC<Props> = ({ route, navigation }) => {
  const { bookingId } = route.params;
  const { bookings } = useBookings();

  const booking = bookings.find((b) => b.id === bookingId);

  const handleDirections = () => {
    if (!booking) return;
    const query = encodeURIComponent(`${booking.salonName}, ${booking.salonAddress}`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  const handleCalendar = () => {
    if (!booking) return;
    // Create google calendar event URL
    const title = encodeURIComponent(`Glamora Appointment at ${booking.salonName}`);
    const details = encodeURIComponent(
      `Booking Ref: ${booking.bookingCode}\nStylist: ${booking.staffName}\nServices: ${booking.services.map((s) => s.name).join(', ')}`
    );
    const location = encodeURIComponent(booking.salonAddress);
    const startTimeFormatted = `${booking.date.replace(/-/g, '')}T${booking.startTime.replace(':', '')}00`;
    const endTimeFormatted = `${booking.date.replace(/-/g, '')}T${booking.endTime.replace(':', '')}00`;

    const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${startTimeFormatted}/${endTimeFormatted}`;
    Linking.openURL(calUrl);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Success Icon */}
        <View style={styles.successIconCircle}>
          <Ionicons name="checkmark-done" size={42} color="#FFFFFF" />
        </View>

        <Text style={styles.title}>Appointment Confirmed!</Text>
        <Text style={styles.subtitle}>
          Your staff capacity has been reserved and synchronized on the salon calendar.
        </Text>

        {/* Reference Ticket Card */}
        <View style={styles.ticketCard}>
          <View style={styles.ticketHeader}>
            <View>
              <Text style={styles.ticketCodeLabel}>BOOKING REFERENCE</Text>
              <Text style={styles.ticketCode}>#{booking?.bookingCode || 'GLM-84920'}</Text>
            </View>
            <View style={styles.confirmedPill}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text style={styles.confirmedPillText}>Confirmed</Text>
            </View>
          </View>

          <View style={styles.ticketDivider}>
            <View style={styles.notchLeft} />
            <View style={styles.dashedLine} />
            <View style={styles.notchRight} />
          </View>

          <View style={styles.ticketBody}>
            <View style={styles.infoRow}>
              <Ionicons name="business-outline" size={18} color={colors.primary} />
              <View style={styles.infoTextGroup}>
                <Text style={styles.infoTitle}>{booking?.salonName || 'Salon'}</Text>
                <Text style={styles.infoSubtitle}>{booking?.salonAddress}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              <View style={styles.infoTextGroup}>
                <Text style={styles.infoTitle}>
                  {booking?.date} at {booking?.startTime} – {booking?.endTime}
                </Text>
                <Text style={styles.infoSubtitle}>
                  Committed start window • {booking?.totalDurationMinutes} mins total duration
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={18} color={colors.primary} />
              <View style={styles.infoTextGroup}>
                <Text style={styles.infoTitle}>{booking?.staffName || 'Resident Stylist'}</Text>
                <Text style={styles.infoSubtitle}>Assigned Stylist</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="card-outline" size={18} color={colors.primary} />
              <View style={styles.infoTextGroup}>
                <Text style={styles.infoTitle}>₹{booking?.totalAmount}</Text>
                <Text style={styles.infoSubtitle}>
                  {booking?.paymentMethod === 'ONLINE' ? 'Paid Online' : 'Pay at Salon Reception'}
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Ticket Actions */}
          <View style={styles.ticketActions}>
            <TouchableOpacity style={styles.ticketActionBtn} onPress={handleDirections}>
              <Ionicons name="navigate-outline" size={16} color={colors.primary} />
              <Text style={styles.ticketActionText}>Directions</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.ticketActionBtn} onPress={handleCalendar}>
              <Ionicons name="calendar" size={16} color={colors.primary} />
              <Text style={styles.ticketActionText}>Add to Calendar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons */}
        <Button
          title="View in My Appointments"
          onPress={() => navigation.navigate('MainTabs', { screen: 'BookingsTab' })}
          size="lg"
          style={styles.appointmentsBtn}
        />

        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => navigation.navigate('MainTabs', { screen: 'HomeTab' })}
        >
          <Text style={styles.homeBtnText}>Return to Home</Text>
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
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: STATUS_BAR_HEIGHT + 24,
    paddingBottom: spacing.huge,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.floating,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
    marginBottom: spacing.xl,
  },
  ticketCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.xl,
    ...shadows.card,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  ticketCodeLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.textSecondary,
  },
  ticketCode: {
    fontSize: typography.fontSize.lg,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 2,
  },
  confirmedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  confirmedPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
  },
  ticketDivider: {
    position: 'relative',
    height: 20,
    justifyContent: 'center',
  },
  dashedLine: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderStyle: 'dashed',
    marginHorizontal: 16,
  },
  notchLeft: {
    position: 'absolute',
    left: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.background,
  },
  notchRight: {
    position: 'absolute',
    right: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.background,
  },
  ticketBody: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  infoTextGroup: {
    flex: 1,
  },
  infoTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  infoSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  ticketActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    padding: spacing.sm,
    backgroundColor: colors.surfaceWarm,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    gap: spacing.sm,
  },
  ticketActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: 6,
  },
  ticketActionText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.primary,
  },
  appointmentsBtn: {
    width: '100%',
    marginBottom: spacing.md,
  },
  homeBtn: {
    paddingVertical: spacing.md,
  },
  homeBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },
});
