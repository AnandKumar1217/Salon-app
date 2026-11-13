import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../constants/theme';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useOwnerSalon } from '../../context/OwnerSalonContext';

interface AddWalkInModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AddWalkInModal: React.FC<AddWalkInModalProps> = ({ visible, onClose }) => {
  const { staffList, servicesList, addWalkIn } = useOwnerSalon();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [preferredStaffId, setPreferredStaffId] = useState<string>('any');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleService = (srvId: string) => {
    if (selectedServiceIds.includes(srvId)) {
      setSelectedServiceIds(selectedServiceIds.filter((id) => id !== srvId));
    } else {
      setSelectedServiceIds([...selectedServiceIds, srvId]);
    }
  };

  const handleConfirm = async () => {
    const errs: Record<string, string> = {};
    if (!customerName.trim()) errs.name = 'Customer name is required.';
    if (!customerPhone.trim() || customerPhone.replace(/\D/g, '').length < 10) {
      errs.phone = 'Valid 10-digit phone number is required.';
    }
    if (selectedServiceIds.length === 0) {
      errs.services = 'Please select at least one treatment.';
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    try {
      setLoading(true);
      const res = await addWalkIn({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        serviceIds: selectedServiceIds,
        preferredStaffId,
      });

      Alert.alert(
        res.isDirectlyAssigned ? 'Walk-in Assigned ⚡' : 'Added to Waiting Queue ⏱️',
        res.message,
        [{ text: 'OK', onPress: onClose }]
      );

      // Reset
      setCustomerName('');
      setCustomerPhone('');
      setSelectedServiceIds([]);
      setPreferredStaffId('any');
    } catch (e: any) {
      Alert.alert('Walk-in Error', e.message || 'Could not process walk-in.');
    } finally {
      setLoading(false);
    }
  };

  const totalDuration = servicesList
    .filter((s) => selectedServiceIds.includes(s.id))
    .reduce((sum, s) => sum + s.durationMinutes, 0);

  const totalPrice = servicesList
    .filter((s) => selectedServiceIds.includes(s.id))
    .reduce((sum, s) => sum + s.price, 0);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Fast Walk-in Check-in</Text>
              <Text style={styles.subtitle}>Unified Staff Availability Engine</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Customer Details */}
            <Input
              label="Customer Full Name *"
              placeholder="e.g. Siddharth Verma"
              value={customerName}
              onChangeText={setCustomerName}
              error={errors.name}
              leftIcon="person-outline"
            />

            <Input
              label="Customer Mobile Number *"
              placeholder="e.g. 98451 99887"
              keyboardType="phone-pad"
              maxLength={10}
              value={customerPhone}
              onChangeText={setCustomerPhone}
              error={errors.phone}
              leftIcon="call-outline"
            />

            {/* Service Selection */}
            <Text style={styles.sectionLabel}>Select Treatment(s) *</Text>
            {errors.services && <Text style={styles.errorText}>{errors.services}</Text>}
            <View style={styles.servicesGrid}>
              {servicesList.map((service) => {
                const isSelected = selectedServiceIds.includes(service.id);
                return (
                  <TouchableOpacity
                    key={service.id}
                    style={[styles.serviceChip, isSelected && styles.serviceChipSelected]}
                    onPress={() => toggleService(service.id)}
                  >
                    <Ionicons
                      name={isSelected ? 'checkbox' : 'square-outline'}
                      size={18}
                      color={isSelected ? colors.primary : colors.textTertiary}
                    />
                    <View style={styles.serviceChipInfo}>
                      <Text style={[styles.serviceChipName, isSelected && styles.serviceChipNameSelected]}>
                        {service.name}
                      </Text>
                      <Text style={styles.serviceChipMeta}>
                        ₹{service.price} • {service.durationMinutes}m
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Staff Assignment */}
            <Text style={styles.sectionLabel}>Preferred Stylist / Staff</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.staffRow}>
              <TouchableOpacity
                style={[
                  styles.staffChip,
                  preferredStaffId === 'any' && styles.staffChipSelected,
                ]}
                onPress={() => setPreferredStaffId('any')}
              >
                <Ionicons
                  name="sparkles"
                  size={16}
                  color={preferredStaffId === 'any' ? '#FFFFFF' : colors.primary}
                />
                <Text
                  style={[
                    styles.staffChipText,
                    preferredStaffId === 'any' && styles.staffChipTextSelected,
                  ]}
                >
                  Any Available
                </Text>
              </TouchableOpacity>

              {staffList
                .filter((s) => s.isActive)
                .map((staff) => (
                  <TouchableOpacity
                    key={staff.id}
                    style={[
                      styles.staffChip,
                      preferredStaffId === staff.id && styles.staffChipSelected,
                    ]}
                    onPress={() => setPreferredStaffId(staff.id)}
                  >
                    <Text
                      style={[
                        styles.staffChipText,
                        preferredStaffId === staff.id && styles.staffChipTextSelected,
                      ]}
                    >
                      {staff.name}
                    </Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Live Summary Bar */}
            {selectedServiceIds.length > 0 && (
              <View style={styles.summaryBox}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total Duration</Text>
                  <Text style={styles.summaryValue}>{totalDuration} mins</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Estimated Total</Text>
                  <Text style={styles.summaryValue}>₹{totalPrice}</Text>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <Button
              title="Assign or Queue Walk-in"
              onPress={handleConfirm}
              size="lg"
              loading={loading}
              leftIcon="flash"
              style={styles.actionBtn}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: spacing.xxl,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceWarm,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs + 2,
    marginTop: spacing.xs,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.error,
    marginBottom: spacing.xs,
  },
  servicesGrid: {
    marginBottom: spacing.md,
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs + 2,
  },
  serviceChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  serviceChipInfo: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  serviceChipName: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  serviceChipNameSelected: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  serviceChipMeta: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  staffRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  staffChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs + 4,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
  },
  staffChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  staffChipText: {
    fontSize: typography.fontSize.xs + 1,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: 4,
  },
  staffChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  summaryBox: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  summaryLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: typography.fontSize.base,
    fontWeight: '800',
    color: colors.primary,
  },
  actionBtn: {
    width: '100%',
  },
});

