import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { OwnerTabParamList } from './types';
import { colors } from '../constants/theme';
import { OwnerDashboardScreen } from '../screens/owner/dashboard/OwnerDashboardScreen';
import { OwnerCalendarScreen } from '../screens/owner/calendar/OwnerCalendarScreen';
import { WalkInManagementScreen } from '../screens/owner/walkin/WalkInManagementScreen';
import { StaffManagementScreen } from '../screens/owner/staff/StaffManagementScreen';
import { OwnerMoreScreen } from '../screens/owner/more/OwnerMoreScreen';
import { useOwnerSalon } from '../context/OwnerSalonContext';

const Tab = createBottomTabNavigator<OwnerTabParamList>();

export const OwnerTabNavigator: React.FC = () => {
  const { waitingQueue } = useOwnerSalon();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={OwnerDashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={21} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="CalendarTab"
        component={OwnerCalendarScreen}
        options={{
          tabBarLabel: 'Calendar',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={21} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="WalkInsTab"
        component={WalkInManagementScreen}
        options={{
          tabBarLabel: 'Walk-ins',
          tabBarBadge: waitingQueue.length > 0 ? waitingQueue.length : undefined,
          tabBarBadgeStyle: styles.badgeStyle,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={21} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="StaffTab"
        component={StaffManagementScreen}
        options={{
          tabBarLabel: 'Staff',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={21} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="MoreTab"
        component={OwnerMoreScreen}
        options={{
          tabBarLabel: 'More',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'ellipsis-horizontal' : 'ellipsis-horizontal-outline'} size={21} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    height: Platform.OS === 'android' ? 64 : 80,
    paddingBottom: Platform.OS === 'android' ? 8 : 24,
    paddingTop: 8,
    elevation: 8,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  badgeStyle: {
    backgroundColor: colors.warning,
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
});

