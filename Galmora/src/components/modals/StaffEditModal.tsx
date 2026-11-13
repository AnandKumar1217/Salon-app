import React, { useState, useEffect } from 'react';
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
import { Staff } from '../../types';

interface StaffEditModalProps {
  visible: boolean;
  staffToEdit?: Staff | null;
  onClose: () => void;
}

export const StaffEditModal: React.FC<StaffEditModalProps> = ({
  visible,
  staffToEdit,
  onClose,
}) => {
  const { addOrUpdateStaff } = useOwnerSalon();

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [experienceYears, setExperienceYears] = useState('5');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('20:00');
  const [breakStart, setBreakStart] = useState('13:00');
  const [breakEnd, setBreakEnd] = useState('14:00');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (staffToEdit) {
      setName(staffToEdit.name);
      setRole(staffToEdit.role);
      setPhone(staffToEdit.phone || '');
      setEmail(staffToEdit.email || '');
      setExperienceYears(String(staffToEdit.experienceYears || 5));
      const hours = staffToEdit.workingHours?.monday;
      if (hours) {
        setStartTime(hours.start);
        setEndTime(hours.end);
        if (hours.breaks && hours.breaks[0]) {
          setBreakStart(hours.breaks[0].start);
          setBreakEnd(hours.breaks[0].end);
        }
      }
    } else {
      setName('');
      setRole('Resident Stylist');
      setPhone('');
      setEmail('');
      setExperienceYears('4');
      setStartTime('09:00');
      setEndTime('20:00');
      setBreakStart('13:00');
      setBreakEnd('14:00');
    }
  }, [staffToEdit, visible]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter employee name.');
      return;
    }

    try {
      setLoading(true);
      const defaultHoursRecord = {
        monday: { start: startTime, end: endTime, isWorking: true, breaks: [{ start: breakStart, end: breakEnd }] },
        tuesday: { start: startTime, end: endTime, isWorking: true, breaks: [{ start: breakStart, end: breakEnd }] },
        wednesday: { start: startTime, end: endTime, isWorking: true, breaks: [{ start: breakStart, end: breakEnd }] },
        thursday: { start: startTime, end: endTime, isWorking: true, breaks: [{ start: breakStart, end: breakEnd }] },
        friday: { start: startTime, end: endTime, isWorking: true, breaks: [{ start: breakStart, end: breakEnd }] },
        saturday: { start: startTime, end: endTime, isWorking: true, breaks: [{ start: breakStart, end: breakEnd }] },
        sunday: { start: startTime, end: endTime, isWorking: true, breaks: [{ start: breakStart, end: breakEnd }] },
      };

      await addOrUpdateStaff({
        id: staffToEdit ? staffToEdit.id : undefined,
        name,
        role,
        phone,
        email,
        experienceYears: Number(experienceYears) || 3,
        workingHours: defaultHoursRecord,
        isActive: staffToEdit ? staffToEdit.isActive : true,
      });

      Alert.alert(
        staffToEdit ? 'Employee Updated' : 'Employee Added',
        `${name}'s profile and schedule have been updated in the live system.`,
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save staff member.');
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
              <Text style={styles.title}>
                {staffToEdit ? 'Edit Employee Profile' : 'Add New Salon Specialist'}
              </Text>
              <Text style={styles.subtitle}>Working Hours, Breaks & Role</Text>
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
            <Input
              label="Specialist Full Name *"
              placeholder="e.g. Farhan Akhtar"
              value={name}
              onChangeText={setName}
              leftIcon="person-outline"
            />

            <Input
              label="Role / Designation *"
              placeholder="e.g. Master Colorist, Barber, Esthetician"
              value={role}
              onChangeText={setRole}
              leftIcon="ribbon-outline"
            />

            <View style={styles.row}>
              <View style={styles.col}>
                <Input
                  label="Mobile Contact"
                  placeholder="e.g. 98450 12345"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  leftIcon="call-outline"
                />
              </View>
              <View style={styles.col}>
                <Input
                  label="Experience (Years)"
                  placeholder="5"
                  keyboardType="number-pad"
                  value={experienceYears}
                  onChangeText={setExperienceYears}
                  leftIcon="time-outline"
                />
              </View>
            </View>

            <Input
              label="Employee Login Email (Optional)"
              placeholder="e.g. farhan@glamora.partner"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              leftIcon="mail-outline"
            />

            {/* Shift & Break Hours */}
            <Text style={styles.sectionHeaderLabel}>Daily Shift Working Hours</Text>
            <View style={styles.row}>
              <View style={styles.col}>
                <Input
                  label="Shift Start *"
                  placeholder="09:00"
                  value={startTime}
                  onChangeText={setStartTime}
                  leftIcon="time-outline"
                />
              </View>
              <View style={styles.col}>
                <Input
                  label="Shift End *"
                  placeholder="20:00"
                  value={endTime}
                  onChangeText={setEndTime}
                  leftIcon="time-outline"
                />
              </View>
            </View>

            <Text style={styles.sectionHeaderLabel}>Lunch / Rest Break (Capacity Locked)</Text>
            <View style={styles.row}>
              <View style={styles.col}>
                <Input
                  label="Break Start *"
                  placeholder="13:00"
                  value={breakStart}
                  onChangeText={setBreakStart}
                  leftIcon="restaurant-outline"
                />
              </View>
              <View style={styles.col}>
                <Input
                  label="Break End *"
                  placeholder="14:00"
                  value={breakEnd}
                  onChangeText={setBreakEnd}
                  leftIcon="restaurant-outline"
                />
              </View>
            </View>

            <Button
              title={staffToEdit ? 'Save Employee Changes' : 'Create & Activate Specialist'}
              onPress={handleSave}
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
  row: {
    flexDirection: 'row',
    marginHorizontal: -spacing.xs,
  },
  col: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  sectionHeaderLabel: {
    fontSize: typography.fontSize.xs + 1,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  actionBtn: {
    marginTop: spacing.md,
  },
});

