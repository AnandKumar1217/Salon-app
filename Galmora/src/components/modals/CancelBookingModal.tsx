import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../constants/theme';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Booking } from '../../types';

interface CancelBookingModalProps {
  visible: boolean;
  booking: Booking | null;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

const REASONS = [
  'Schedule conflict / Change of plans',
  'Booked incorrect service or time',
  'Stylist requested change',
  'Health / Feeling unwell',
  'Other reasons',
];

export const CancelBookingModal: React.FC<CancelBookingModalProps> = ({
  visible,
  booking,
  onClose,
  onConfirm,
}) => {
  const [selectedReason, setSelectedReason] = useState(REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!booking) return null;

  const handleConfirm = async () => {
    try {
      setLoading(true);
      setError(null);
      const finalReason = selectedReason === 'Other reasons' ? customReason : selectedReason;
      await onConfirm(finalReason);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel appointment. Please check salon policy.');
    } finally {
      setLoading(false);
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
                <View style={styles.warningCircle}>
                  <Ionicons name="alert" size={24} color={colors.error} />
                </View>
                <Text style={styles.title}>Cancel Appointment?</Text>
                <Text style={styles.subtitle}>
                  Booking #{booking.bookingCode} at {booking.salonName}
                </Text>
              </View>

              {/* Policy alert */}
              <View style={styles.policyBox}>
                <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
                <Text style={styles.policyText}>
                  Please note salon policy allows free cancellation up to {booking.bufferMinutes ? 2 : 2} hours prior.
                </Text>
              </View>

              {error && (
                <View style={styles.errorBox}>
                  <Ionicons name="close-circle" size={16} color={colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <Text style={styles.sectionTitle}>Select Reason</Text>
              <ScrollView style={{ maxHeight: 220 }}>
                {REASONS.map((r) => {
                  const isSelected = selectedReason === r;
                  return (
                    <TouchableOpacity
                      key={r}
                      style={[styles.reasonRow, isSelected && styles.selectedReasonRow]}
                      onPress={() => setSelectedReason(r)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.radio, isSelected && styles.selectedRadio]}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                      <Text style={[styles.reasonText, isSelected && styles.selectedReasonText]}>
                        {r}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                {selectedReason === 'Other reasons' && (
                  <Input
                    placeholder="Tell us why you need to cancel..."
                    value={customReason}
                    onChangeText={setCustomReason}
                    containerStyle={{ marginTop: spacing.sm }}
                  />
                )}
              </ScrollView>

              <View style={styles.actions}>
                <Button
                  title="Keep Appointment"
                  variant="outline"
                  onPress={onClose}
                  style={styles.actionBtn}
                  disabled={loading}
                />
                <Button
                  title="Confirm Cancel"
                  variant="danger"
                  onPress={handleConfirm}
                  loading={loading}
                  style={styles.actionBtn}
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
    maxHeight: '85%',
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
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  warningCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  policyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceWarm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  policyText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 16,
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
    flex: 1,
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
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  selectedReasonRow: {
    backgroundColor: colors.errorLight + '30',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  selectedRadio: {
    borderColor: colors.error,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.error,
  },
  reasonText: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  selectedReasonText: {
    fontWeight: '600',
    color: colors.error,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  actionBtn: {
    flex: 1,
  },
});

