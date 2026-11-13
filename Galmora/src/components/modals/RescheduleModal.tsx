import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../constants/theme';
import { Button } from '../common/Button';
import { Booking, TimeSlot } from '../../types';
import { getLiveAvailableSlots } from '../../api/bookingsApi';

interface RescheduleModalProps {
  visible: boolean;
  booking: Booking | null;
  onClose: () => void;
  onConfirm: (newDate: string, newTime: string) => Promise<void>;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  visible,
  booking,
  onClose,
  onConfirm,
}) => {
  if (!booking) return null;

  // Generate next 10 days
  const dates = Array.from({ length: 10 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1); // Start tomorrow
    return d.toISOString().split('T')[0];
  });

  const [selectedDate, setSelectedDate] = useState<string>(dates[0]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && booking) {
      loadSlots(selectedDate);
    }
  }, [visible, selectedDate, booking]);

  const loadSlots = async (dateStr: string) => {
    try {
      setLoadingSlots(true);
      setError(null);
      setSelectedSlot(null);

      const res = await getLiveAvailableSlots({
        salonId: booking.salonId,
        serviceIds: booking.services.map((s) => s.id),
        date: dateStr,
        preferredStaffId: booking.staffId,
      });

      setSlots(res.slots);
    } catch (e: any) {
      setError('Unable to load available slots.');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedSlot) return;
    try {
      setSubmitting(true);
      setError(null);
      await onConfirm(selectedDate, selectedSlot);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Slot no longer available.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              <View style={styles.handle} />

              <View style={styles.header}>
                <Text style={styles.title}>Reschedule Appointment</Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.subtitle}>
                Select a new date and time for #{booking.bookingCode} with {booking.staffName}
              </Text>

              {error && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color={colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Date selection strip */}
              <Text style={styles.sectionTitle}>Select Date</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.dateScroll}
              >
                {dates.map((d) => {
                  const dateObj = new Date(d + 'T00:00:00');
                  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                  const dayNum = dateObj.getDate();
                  const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });
                  const isSelected = selectedDate === d;

                  return (
                    <TouchableOpacity
                      key={d}
                      style={[styles.dateChip, isSelected && styles.selectedDateChip]}
                      onPress={() => setSelectedDate(d)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.dayName, isSelected && styles.selectedDateText]}>
                        {dayName}
                      </Text>
                      <Text style={[styles.dayNum, isSelected && styles.selectedDateText]}>
                        {dayNum}
                      </Text>
                      <Text style={[styles.monthName, isSelected && styles.selectedDateText]}>
                        {monthName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Slots */}
              <Text style={styles.sectionTitle}>Available Slots</Text>
              {loadingSlots ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.loadingText}>Checking live stylist schedule...</Text>
                </View>
              ) : slots.length === 0 ? (
                <View style={styles.emptySlots}>
                  <Text style={styles.emptyText}>No available slots for this date.</Text>
                </View>
              ) : (
                <ScrollView style={{ maxHeight: 180 }}>
                  <View style={styles.slotsGrid}>
                    {slots.map((slot) => {
                      const isSelected = selectedSlot === slot.time;
                      const isAvail = slot.available;

                      return (
                        <TouchableOpacity
                          key={slot.time}
                          style={[
                            styles.slotChip,
                            !isAvail && styles.slotDisabled,
                            isSelected && styles.slotSelected,
                          ]}
                          disabled={!isAvail}
                          onPress={() => setSelectedSlot(slot.time)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.slotText,
                              !isAvail && styles.slotTextDisabled,
                              isSelected && styles.slotTextSelected,
                            ]}
                          >
                            {slot.time}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              )}

              <View style={styles.actions}>
                <Button
                  title="Confirm Reschedule"
                  onPress={handleConfirm}
                  disabled={!selectedSlot || submitting}
                  loading={submitting}
                  style={{ width: '100%' }}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.borderDark,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.error,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  dateScroll: {
    marginBottom: spacing.md,
  },
  dateChip: {
    width: 60,
    height: 72,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  selectedDateChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayName: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  dayNum: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginVertical: 2,
  },
  monthName: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  selectedDateText: {
    color: '#FFFFFF',
  },
  loadingBox: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  emptySlots: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  slotChip: {
    width: '30%',
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  slotDisabled: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.borderLight,
    opacity: 0.4,
  },
  slotText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  slotTextSelected: {
    color: '#FFFFFF',
  },
  slotTextDisabled: {
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  actions: {
    marginTop: spacing.lg,
  },
});

