import React, { useState, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, MainTabParamList } from '../../navigation/types';
import { colors, typography, spacing, borderRadius, STATUS_BAR_HEIGHT } from '../../constants/theme';
import { EmptyState } from '../../components/common/EmptyState';
import { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../../api/notificationsApi';
import { InAppNotification } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

export const NotificationsScreen: React.FC<Props> = ({ navigation }) => {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifs();
  }, []);

  const loadNotifs = async () => {
    const list = await fetchNotifications();
    setNotifications(list);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifs();
    setRefreshing(false);
  };

  const handleMarkAllRead = async () => {
    const updated = await markAllNotificationsAsRead();
    setNotifications(updated);
  };

  const handlePressItem = async (item: InAppNotification) => {
    if (!item.read) {
      const updated = await markNotificationAsRead(item.id);
      setNotifications(updated);
    }
    if (item.bookingId) {
      navigation.navigate('AppointmentDetail', { bookingId: item.bookingId });
    }
  };

  const getIconForType = (type: InAppNotification['type']) => {
    switch (type) {
      case 'BOOKING_CONFIRMED':
        return { name: 'checkmark-circle' as const, color: colors.success };
      case 'REMINDER':
        return { name: 'time' as const, color: colors.primary };
      case 'RESCHEDULED':
        return { name: 'calendar' as const, color: colors.info };
      case 'DELAY':
        return { name: 'alert-circle' as const, color: colors.warning };
      case 'CANCELLED':
        return { name: 'close-circle' as const, color: colors.error };
      case 'PROMO':
      default:
        return { name: 'sparkles' as const, color: colors.roseDark };
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.subtitle}>
              {unreadCount > 0 ? `${unreadCount} unread updates` : 'All caught up'}
            </Text>
          </View>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => {
          const icon = getIconForType(item.type);
          return (
            <TouchableOpacity
              style={[styles.itemCard, !item.read && styles.itemCardUnread]}
              onPress={() => handlePressItem(item)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconCircle, { backgroundColor: icon.color + '15' }]}>
                <Ionicons name={icon.name} size={22} color={icon.color} />
              </View>

              <View style={styles.itemContent}>
                <View style={styles.topRow}>
                  <Text style={[styles.itemTitle, !item.read && styles.itemTitleBold]}>
                    {item.title}
                  </Text>
                  {!item.read && <View style={styles.unreadDot} />}
                </View>

                <Text style={styles.itemMessage}>{item.message}</Text>
                <Text style={styles.itemDate}>
                  {new Date(item.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="notifications-outline"
            title="No Notifications"
            description="You don't have any notifications or appointment alerts at this moment."
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: STATUS_BAR_HEIGHT + 10,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceWarm,
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
  markAllText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.primary,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.huge,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.sm,
  },
  itemCardUnread: {
    borderColor: colors.primary,
    backgroundColor: '#FAF5F7',
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  itemContent: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  itemTitleBold: {
    fontWeight: '700',
    color: colors.primary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 6,
  },
  itemMessage: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  itemDate: {
    fontSize: 10,
    color: colors.textTertiary,
  },
});
