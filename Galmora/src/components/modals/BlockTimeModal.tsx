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

interface BlockTimeModalProps {
  visible: boolean;
  onClose: () => void;
}

export const BlockTimeModal: React.FC<BlockTimeModalProps> = ({ visible, onClose }) => {
  const { staffList, blockStaffTime } = useOwnerSalon();

  const [selectedStaffId, setSelectedStaffId] = useState(staffList[0]?.id || 'stf_1');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('15:00');
  const [reason, setReason] = useState('Equipment Sanitize & Master Training');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!reason.trim()) {
      Alert.alert('Required', 'Please enter a reason for blocking staff calendar.');
      return;
    }

    try {
      setLoading(true);
      await blockStaffTime({
        staffId: selectedStaffId,
        date,
        startTime,
        endTime,
        reason,
      });
      Alert.alert('Staff Time Blocked', `Calendar reserved from ${startTime} to ${endTime}.`, [
        { text: 'OK', onPress: onClose },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to block time.');
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
              <Text style={styles.title}>Block Staff Calendar</Text>
              <Text style={styles.subtitle}>Prevents Online Bookings & Walk-ins</Text>
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
            {/* Staff Selector */}
            <Text style={styles.sectionLabel}>Select Employee *</Text>
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

            <Input
              label="Date (YYYY-MM-DD) *"
              placeholder="e.g. 2026-11-12"
              value={date}
              onChangeText={setDate}
              leftIcon="calendar-outline"
            />

            <View style={styles.timeRow}>
              <View style={styles.timeCol}>
                <Input
                  label="Start Time *"
                  placeholder="14:00"
                  value={startTime}
                  onChangeText={setStartTime}
                  leftIcon="time-outline"
                />
              </View>
              <View style={styles.timeCol}>
                <Input
                  label="End Time *"
                  placeholder="15:00"
                  value={endTime}
                  onChangeText={setEndTime}
                  leftIcon="time-outline"
                />
              </View>
            </View>

            <Input
              label="Reason for Blocking *"
              placeholder="e.g. Staff Training, Lunch Break, Emergency"
              value={reason}
              onChangeText={setReason}
              leftIcon="warning-outline"
            />

            <Button
              title="Lock Staff Calendar Window"
              onPress={handleConfirm}
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
    maxHeight: '85%',
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

