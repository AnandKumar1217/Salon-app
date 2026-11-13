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

interface AddAppointmentModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AddAppointmentModal: React.FC<AddAppointmentModalProps> = ({
  visible,
  onClose,
}) => {
  const { staffList, servicesList, createOwnerAppointment } = useOwnerSalon();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState(staffList[0]?.id || 'stf_1');
  const [selectedServiceId, setSelectedServiceId] = useState(servicesList[0]?.id || 'srv_101');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('11:00');
  const [bookingSource, setBookingSource] = useState<'APP' | 'WHATSAPP' | 'WALK_IN'>('WHATSAPP');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      Alert.alert('Required', 'Please enter customer name and phone.');
      return;
    }

    const srv = servicesList.find((s) => s.id === selectedServiceId) || servicesList[0];
    const stf = staffList.find((s) => s.id === selectedStaffId) || staffList[0];

    const [hh, mm] = startTime.split(':').map(Number);
    const endMinutes = hh * 60 + mm + srv.durationMinutes;
    const endHH = String(Math.floor(endMinutes / 60)).padStart(2, '0');
    const endMM = String(endMinutes % 60).padStart(2, '0');
    const endTime = `${endHH}:${endMM}`;

    try {
      setLoading(true);
      await createOwnerAppointment({
        customerName,
        customerPhone,
        staffId: stf.id,
        staffName: stf.name,
        services: [srv],
        totalDurationMinutes: srv.durationMinutes,
        date,
        startTime,
        endTime,
        source: bookingSource,
        subtotal: srv.price,
        tax: Math.round(srv.price * 0.05),
        totalAmount: Math.round(srv.price * 1.05),
      });

      Alert.alert('Booking Added', `Appointment confirmed for ${customerName} at ${startTime}.`, [
        { text: 'OK', onPress: onClose },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not create appointment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Add Custom Appointment</Text>
              <Text style={styles.subtitle}>Phone Booking / WhatsApp Inquiry</Text>
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
            {/* Booking Source Toggle */}
            <Text style={styles.sectionLabel}>Booking Channel Source *</Text>
            <View style={styles.sourceRow}>
              {(['WHATSAPP', 'APP', 'WALK_IN'] as const).map((source) => (
                <TouchableOpacity
                  key={source}
                  style={[
                    styles.sourceChip,
                    bookingSource === source && styles.sourceChipSelected,
                  ]}
                  onPress={() => setBookingSource(source)}
                >
                  <Text
                    style={[
                      styles.sourceChipText,
                      bookingSource === source && styles.sourceChipTextSelected,
                    ]}
                  >
                    {source === 'WHATSAPP' ? 'WhatsApp' : source === 'APP' ? 'Online App' : 'Walk-in'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Customer Name *"
              placeholder="e.g. Priyanjali Sen"
              value={customerName}
              onChangeText={setCustomerName}
              leftIcon="person-outline"
            />

            <Input
              label="Customer Mobile *"
              placeholder="e.g. 98450 11223"
              keyboardType="phone-pad"
              value={customerPhone}
              onChangeText={setCustomerPhone}
              leftIcon="call-outline"
            />

            {/* Service & Staff */}
            <Text style={styles.sectionLabel}>Assigned Specialist *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.staffRow}>
              {staffList.map((stf) => (
                <TouchableOpacity
                  key={stf.id}
                  style={[
                    styles.staffChip,
                    selectedStaffId === stf.id && styles.staffChipSelected,
                  ]}
                  onPress={() => setSelectedStaffId(stf.id)}
                >
                  <Text
                    style={[
                      styles.staffChipText,
                      selectedStaffId === stf.id && styles.staffChipTextSelected,
                    ]}
                  >
                    {stf.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.sectionLabel}>Treatment / Service *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.staffRow}>
              {servicesList.map((srv) => (
                <TouchableOpacity
                  key={srv.id}
                  style={[
                    styles.staffChip,
                    selectedServiceId === srv.id && styles.staffChipSelected,
                  ]}
                  onPress={() => setSelectedServiceId(srv.id)}
                >
                  <Text
                    style={[
                      styles.staffChipText,
                      selectedServiceId === srv.id && styles.staffChipTextSelected,
                    ]}
                  >
                    {srv.name} (₹{srv.price})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.timeRow}>
              <View style={styles.timeCol}>
                <Input
                  label="Date *"
                  placeholder="YYYY-MM-DD"
                  value={date}
                  onChangeText={setDate}
                  leftIcon="calendar-outline"
                />
              </View>
              <View style={styles.timeCol}>
                <Input
                  label="Start Time *"
                  placeholder="11:00"
                  value={startTime}
                  onChangeText={setStartTime}
                  leftIcon="time-outline"
                />
              </View>
            </View>

            <Button
              title="Save & Lock Slot"
              onPress={handleCreate}
              size="lg"
              loading={loading}
              variant="primary"
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
  sourceRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sourceChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sourceChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sourceChipText: {
    fontSize: typography.fontSize.xs + 1,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  sourceChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  staffRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  staffChip: {
    paddingVertical: spacing.xs + 4,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
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
  },
  staffChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  timeRow: {
    flexDirection: 'row',
    marginHorizontal: -spacing.xs,
  },
  timeCol: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  actionBtn: {
    marginTop: spacing.sm,
  },
});

