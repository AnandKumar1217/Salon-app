import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows, STATUS_BAR_HEIGHT } from '../../../constants/theme';
import { useOwnerSalon } from '../../../context/OwnerSalonContext';
import { Staff } from '../../../types';
import { StaffEditModal } from '../../../components/modals/StaffEditModal';

export const StaffManagementScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { staffList, toggleStaffActive } = useOwnerSalon();
  const [modalVisible, setModalVisible] = useState(false);
  const [staffToEdit, setStaffToEdit] = useState<Staff | null>(null);

  const handleAddNew = () => {
    setStaffToEdit(null);
    setModalVisible(true);
  };

  const handleEdit = (staff: Staff) => {
    setStaffToEdit(staff);
    setModalVisible(true);
  };

  const handleToggle = async (staff: Staff) => {
    await toggleStaffActive(staff.id);
  };

  const activeCount = staffList.filter((s) => s.isActive).length;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Top Header */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.topBarTitle}>Staff & Specialists</Text>
          <Text style={styles.topBarSub}>
            {activeCount} active on floor • {staffList.length} total team members
          </Text>
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={handleAddNew} activeOpacity={0.85}>
          <Ionicons name="person-add" size={16} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Add Staff</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {staffList.map((staff) => {
          const mondayHours = staff.workingHours?.monday;
          return (
            <View key={staff.id} style={[styles.staffCard, !staff.isActive && styles.staffCardInactive]}>
              <View style={styles.cardTop}>
                <Image source={{ uri: staff.avatar }} style={styles.avatar} />

                <View style={styles.infoCol}>
                  <View style={styles.nameRow}>
                    <Text style={styles.staffName}>{staff.name}</Text>
                    <View style={styles.switchWrapper}>
                      <Switch
                        value={staff.isActive}
                        onValueChange={() => handleToggle(staff)}
                        trackColor={{ false: colors.borderDark, true: colors.success }}
                        thumbColor="#FFFFFF"
                      />
                    </View>
                  </View>

                  <Text style={styles.staffRole}>{staff.role}</Text>

                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Ionicons name="star" size={12} color="#F5A623" />
                      <Text style={styles.metaText}>
                        {staff.rating} ({staff.reviewCount})
                      </Text>
                    </View>
                    <Text style={styles.metaDot}>•</Text>
                    <Text style={styles.metaText}>{staff.experienceYears} yrs exp</Text>
                  </View>
                </View>
              </View>

              {/* Working Hours & Breaks Badge */}
              <View style={styles.scheduleRow}>
                <View style={styles.scheduleItem}>
                  <Ionicons name="time-outline" size={14} color={colors.primary} />
                  <Text style={styles.scheduleText}>
                    Shift: {mondayHours?.start || '09:00'} - {mondayHours?.end || '20:00'}
                  </Text>
                </View>

                {mondayHours?.breaks && mondayHours.breaks[0] ? (
                  <View style={styles.scheduleItem}>
                    <Ionicons name="restaurant-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.scheduleText}>
                      Break: {mondayHours.breaks[0].start} - {mondayHours.breaks[0].end}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Action Buttons */}
              <View style={styles.cardFooter}>
                <View style={styles.statusPill}>
                  <View
                    style={[
                      styles.statusIndicator,
                      { backgroundColor: staff.isActive ? colors.success : colors.textTertiary },
                    ]}
                  />
                  <Text style={styles.statusPillText}>
                    {staff.isActive ? 'Active on Schedule' : 'Deactivated / On Leave'}
                  </Text>
                </View>

                <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(staff)}>
                  <Ionicons name="create-outline" size={15} color={colors.primary} />
                  <Text style={styles.editBtnText}>Edit Hours</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Staff Edit / Create Modal */}
      <StaffEditModal
        visible={modalVisible}
        staffToEdit={staffToEdit}
        onClose={() => setModalVisible(false)}
      />
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
    marginTop: 2,
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
  staffCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.subtle,
  },
  staffCardInactive: {
    opacity: 0.65,
    backgroundColor: colors.surfaceWarm,
  },
  cardTop: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.surfaceWarm,
  },
  infoCol: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  staffName: {
    fontSize: typography.fontSize.base,
    fontWeight: '800',
    color: colors.textPrimary,
    flex: 1,
  },
  switchWrapper: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  staffRole: {
    fontSize: typography.fontSize.xs + 1,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  metaDot: {
    marginHorizontal: 6,
    color: colors.textTertiary,
  },
  scheduleRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceWarm,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: spacing.md,
    marginVertical: spacing.xs,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scheduleText: {
    fontSize: 11,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs + 2,
    paddingTop: spacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusPillText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceWarm,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
});

