import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, MainTabParamList } from '../../navigation/types';
import { colors, typography, spacing, borderRadius, STATUS_BAR_HEIGHT } from '../../constants/theme';
import { AppointmentCard } from '../../components/cards/AppointmentCard';
import { EmptyState } from '../../components/common/EmptyState';
import { useBookings } from '../../context/BookingsContext';

type Props = any;

export const AppointmentsListScreen: React.FC<Props> = ({ navigation }) => {
  const { upcomingBookings, pastBookings, refreshBookings } = useBookings();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshBookings();
    setRefreshing(false);
  };

  const displayedList = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Appointments</Text>
        <Text style={styles.subtitle}>Track your bookings & live salon status</Text>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabsWrapper}>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'upcoming' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('upcoming')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, activeTab === 'upcoming' && styles.segmentTextActive]}>
              Upcoming ({upcomingBookings.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'past' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('past')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, activeTab === 'past' && styles.segmentTextActive]}>
              Past History ({pastBookings.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Appointments List */}
      <FlatList
        data={displayedList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <AppointmentCard
            booking={item}
            onPress={() => navigation.navigate('AppointmentDetail', { bookingId: item.id })}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="calendar-outline"
            title={activeTab === 'upcoming' ? 'No Upcoming Bookings' : 'No Past History'}
            description={
              activeTab === 'upcoming'
                ? "You don't have any confirmed salon appointments scheduled right now."
                : "You haven't completed any salon visits yet."
            }
            actionLabel={activeTab === 'upcoming' ? 'Discover Salons' : undefined}
            onAction={
              activeTab === 'upcoming'
                ? () => navigation.navigate('MainTabs', { screen: 'ExploreTab' })
                : undefined
            }
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: STATUS_BAR_HEIGHT + 10,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tabsWrapper: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceWarm,
    borderRadius: borderRadius.lg,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    elevation: 1,
  },
  segmentText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.huge,
  },
});
