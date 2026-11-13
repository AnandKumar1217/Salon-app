import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/theme';
import { Booking } from '../../types';
import { BookingStatusBadge } from '../common/Badge';

interface AppointmentCardProps {
  booking: Booking;
  onPress: () => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({ booking, onPress }) => {
  const serviceSummary = booking.services.map((s) => s.name).join(', ');

  // Format date display
  const dateObj = new Date(booking.date + 'T00:00:00');
  const dateStr = dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.header}>
        <View style={styles.dateBlock}>
          <Ionicons name="calendar-outline" size={16} color={colors.primary} />
          <Text style={styles.dateText}>
            {dateStr} • {booking.startTime}
          </Text>
        </View>
        <BookingStatusBadge status={booking.status} />
      </View>

      <View style={styles.body}>
        <Image source={{ uri: booking.salonImage }} style={styles.salonThumb} />

        <View style={styles.details}>
          <Text style={styles.salonName} numberOfLines={1}>
            {booking.salonName}
          </Text>
          <Text style={styles.services} numberOfLines={2}>
            {serviceSummary}
          </Text>

          <View style={styles.stylistRow}>
            <Ionicons name="person-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.stylistText}>{booking.staffName}</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View>
          <Text style={styles.bookingCode}>Ref: #{booking.bookingCode}</Text>
          <Text style={styles.amount}>₹{booking.totalAmount} • {booking.paymentMethod === 'ONLINE' ? 'Paid Online' : 'Pay at Salon'}</Text>
        </View>

        <View style={styles.actionPill}>
          <Text style={styles.actionText}>Details</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  dateBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.primary,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  salonThumb: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceMuted,
  },
  details: {
    flex: 1,
    marginLeft: spacing.md,
  },
  salonName: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  services: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: 4,
  },
  stylistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stylistText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  bookingCode: {
    fontSize: 11,
    color: colors.textTertiary,
    fontWeight: '600',
  },
  amount: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.primary,
  },
});

