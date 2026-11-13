import { NavigatorScreenParams } from '@react-navigation/native';
import { UserRole } from '../types';

export type MainTabParamList = {
  HomeTab: undefined;
  ExploreTab: { category?: string } | undefined;
  BookingsTab: undefined;
  SavedTab: undefined;
  ProfileTab: undefined;
};

export type OwnerTabParamList = {
  DashboardTab: undefined;
  CalendarTab: undefined;
  WalkInsTab: undefined;
  StaffTab: undefined;
  MoreTab: undefined;
};

export type RootStackParamList = {
  // Common & Auth
  Splash: undefined;
  Onboarding: undefined;
  RoleSelection: undefined;
  Login: { rolePreference?: UserRole } | undefined;
  OtpVerification: { phone: string; rolePreference?: UserRole };
  ProfileSetup: { phone: string };

  // Owner Auth & Status screens
  OwnerRegistrationWizard: undefined;
  PendingApproval: undefined;
  RejectedApplication: { reason?: string } | undefined;
  SuspendedAccount: { reason?: string } | undefined;

  // Customer Mode Navigators & Screens
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  SalonDetail: { salonId: string };
  BookingFlow: { salonId: string; preselectedServiceId?: string };
  BookingConfirmation: { bookingId: string };
  AppointmentDetail: { bookingId: string };
  Notifications: undefined;
  EditProfile: undefined;
  SavedSalons: undefined;
  HelpSupport: undefined;
  TermsPrivacy: undefined;

  // Owner Mode Navigators & Screens
  OwnerTabs: NavigatorScreenParams<OwnerTabParamList> | undefined;
  OwnerAppointmentDetail: { bookingId: string };
  AddWalkInModal: undefined;
  AddAppointmentModal: undefined;
  BlockTimeModal: undefined;
  AddStaffModal: { staffId?: string } | undefined;
  AddServiceModal: { serviceId?: string } | undefined;
  SalonProfileEdit: undefined;
  SalonQrCode: undefined;
  OwnerReports: undefined;
};
