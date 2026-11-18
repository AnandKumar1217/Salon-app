import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Salon,
  Staff,
  ServiceItem,
  Booking,
  BookingStatus,
  WaitingQueueItem,
  BlockedTime,
  DailyRevenueReport,
} from '../types';
import {
  SALONS,
  INITIAL_SALON_BOOKINGS,
  INITIAL_WAITING_QUEUE,
  INITIAL_BLOCKED_TIMES,
  INITIAL_REVENUE_REPORT,
} from '../constants/mockData';
import { useAuth } from './AuthContext';
import {
  fetchBookingsFromBackend,
  createBookingInBackend,
  updateBookingInBackend,
  fetchSalonsFromBackend,
} from '../api/mongoApi';

const isMockAllowed = process.env.EXPO_PUBLIC_USE_LOCAL_MOCK_FALLBACK === 'true';

const OWNER_SALON_STORAGE_KEY = '@glamora_owner_salon_v1';
const OWNER_BOOKINGS_STORAGE_KEY = '@glamora_owner_bookings_v1';
const OWNER_QUEUE_STORAGE_KEY = '@glamora_owner_queue_v1';
const OWNER_BLOCKED_STORAGE_KEY = '@glamora_owner_blocked_v1';

interface OwnerSalonContextType {
  salon: Salon | null;
  staffList: Staff[];
  servicesList: ServiceItem[];
  appointments: Booking[];
  waitingQueue: WaitingQueueItem[];
  blockedTimes: BlockedTime[];
  dailyRevenue: DailyRevenueReport;
  isLoading: boolean;
  addWalkIn: (params: {
    customerName: string;
    customerPhone: string;
    serviceIds: string[];
    preferredStaffId?: string;
  }) => Promise<{ success: boolean; isDirectlyAssigned: boolean; message: string }>;
  createOwnerAppointment: (bookingData: Partial<Booking>) => Promise<Booking>;
  updateAppointmentStatus: (
    bookingId: string,
    status: BookingStatus,
    delayMinutes?: number
  ) => Promise<void>;
  blockStaffTime: (params: {
    staffId: string;
    date: string;
    startTime: string;
    endTime: string;
    reason: string;
  }) => Promise<void>;
  removeBlockedTime: (blockedId: string) => Promise<void>;
  serveQueueCustomer: (queueId: string, staffId: string) => Promise<void>;
  cancelQueueCustomer: (queueId: string) => Promise<void>;
  addOrUpdateStaff: (staffData: Partial<Staff>) => Promise<void>;
  toggleStaffActive: (staffId: string) => Promise<void>;
  addOrUpdateService: (serviceData: Partial<ServiceItem>) => Promise<void>;
  toggleServiceOnlineBooking: (serviceId: string) => Promise<void>;
  updateSalonProfile: (updates: Partial<Salon>) => Promise<void>;
  togglePauseOnlineBooking: () => Promise<boolean>;
  refreshOwnerData: () => Promise<void>;
}

const OwnerSalonContext = createContext<OwnerSalonContextType | undefined>(undefined);

export const OwnerSalonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [appointments, setAppointments] = useState<Booking[]>(INITIAL_SALON_BOOKINGS);
  const [waitingQueue, setWaitingQueue] = useState<WaitingQueueItem[]>(INITIAL_WAITING_QUEUE);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>(INITIAL_BLOCKED_TIMES);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenueReport>(INITIAL_REVENUE_REPORT);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadOwnerState();
  }, [user?.salonId]);

  const loadOwnerState = async () => {
    try {
      setIsLoading(true);
      const targetSalonId = user?.salonId || 'salon_1';
      const baseSalon = SALONS.find((s) => s.id === targetSalonId) || SALONS[0];

      const [storedSalon, storedBookings, storedQueue, storedBlocked] = await Promise.all([
        AsyncStorage.getItem(OWNER_SALON_STORAGE_KEY + '_' + targetSalonId),
        AsyncStorage.getItem(OWNER_BOOKINGS_STORAGE_KEY + '_' + targetSalonId),
        AsyncStorage.getItem(OWNER_QUEUE_STORAGE_KEY + '_' + targetSalonId),
        AsyncStorage.getItem(OWNER_BLOCKED_STORAGE_KEY + '_' + targetSalonId),
      ]);

      if (storedSalon) {
        setSalon(JSON.parse(storedSalon));
      } else {
        setSalon(baseSalon);
      }

      if (storedBookings) {
        setAppointments(JSON.parse(storedBookings));
      } else {
        setAppointments(isMockAllowed ? INITIAL_SALON_BOOKINGS : []);
      }

      // Synchronize live salon profile from backend API
      try {
        const liveSalons = await fetchSalonsFromBackend();
        const found = liveSalons.find((s) => s.id === targetSalonId);
        if (found) {
          setSalon(found);
          await AsyncStorage.setItem(
            OWNER_SALON_STORAGE_KEY + '_' + targetSalonId,
            JSON.stringify(found)
          );
        }
      } catch (liveSalErr) {}

      // Synchronize live bookings from backend API
      try {
        const liveBookings = await fetchBookingsFromBackend({ salonId: targetSalonId });
        if (Array.isArray(liveBookings)) {
          if (liveBookings.length > 0 || !isMockAllowed) {
            setAppointments(liveBookings);
            await AsyncStorage.setItem(
              OWNER_BOOKINGS_STORAGE_KEY + '_' + targetSalonId,
              JSON.stringify(liveBookings)
            );
          }
        }
      } catch (liveErr) {
        // use local state
      }

      if (storedQueue) {
        setWaitingQueue(JSON.parse(storedQueue));
      } else {
        setWaitingQueue(INITIAL_WAITING_QUEUE);
      }

      if (storedBlocked) {
        setBlockedTimes(JSON.parse(storedBlocked));
      } else {
        setBlockedTimes(INITIAL_BLOCKED_TIMES);
      }
    } catch (e) {
      console.warn('Error loading owner salon state:', e);
      setSalon(SALONS[0]);
    } finally {
      setIsLoading(false);
    }
  };

  const persistState = async (
    newSalon?: Salon,
    newBookings?: Booking[],
    newQueue?: WaitingQueueItem[],
    newBlocked?: BlockedTime[]
  ) => {
    const sId = salon?.id || user?.salonId || 'salon_1';
    if (newSalon) {
      await AsyncStorage.setItem(OWNER_SALON_STORAGE_KEY + '_' + sId, JSON.stringify(newSalon));
    }
    if (newBookings) {
      await AsyncStorage.setItem(
        OWNER_BOOKINGS_STORAGE_KEY + '_' + sId,
        JSON.stringify(newBookings)
      );
    }
    if (newQueue) {
      await AsyncStorage.setItem(OWNER_QUEUE_STORAGE_KEY + '_' + sId, JSON.stringify(newQueue));
    }
    if (newBlocked) {
      await AsyncStorage.setItem(OWNER_BLOCKED_STORAGE_KEY + '_' + sId, JSON.stringify(newBlocked));
    }
  };

  const staffList = salon?.staff || [];
  const servicesList = salon?.services || [];

  /**
   * Fast Walk-in Engine with Capacity Check:
   * Protects confirmed appointments from overlap!
   */
  const addWalkIn = async ({
    customerName,
    customerPhone,
    serviceIds,
    preferredStaffId,
  }: {
    customerName: string;
    customerPhone: string;
    serviceIds: string[];
    preferredStaffId?: string;
  }): Promise<{ success: boolean; isDirectlyAssigned: boolean; message: string }> => {
    if (!salon) throw new Error('No salon active.');

    // 1. Calculate services and duration
    const matchedServices = servicesList.filter((s) => serviceIds.includes(s.id));
    const totalDuration = matchedServices.reduce((sum, s) => sum + s.durationMinutes, 0) || 30;
    const now = new Date();
    const currentHH = String(now.getHours()).padStart(2, '0');
    const currentMM = String(now.getMinutes()).padStart(2, '0');
    const startTimeStr = `${currentHH}:${currentMM}`;

    // End time calculation
    const endMinutesTotal = now.getHours() * 60 + now.getMinutes() + totalDuration;
    const endHH = String(Math.floor(endMinutesTotal / 60)).padStart(2, '0');
    const endMM = String(endMinutesTotal % 60).padStart(2, '0');
    const endTimeStr = `${endHH}:${endMM}`;

    // 2. Capacity Check: Find eligible, non-overlapping staff
    let assignedStaff: Staff | null = null;
    const todayDateStr = now.toISOString().split('T')[0];

    const eligibleStaff = staffList.filter((stf) => {
      if (!stf.isActive) return false;
      if (preferredStaffId && preferredStaffId !== 'any' && stf.id !== preferredStaffId) {
        return false;
      }
      return true;
    });

    for (const candidate of eligibleStaff) {
      // Check if candidate is currently engaged in an IN_PROGRESS or upcoming CONFIRMED appointment that overlaps
      const candidateBookings = appointments.filter(
        (b) =>
          b.staffId === candidate.id &&
          b.date === todayDateStr &&
          (b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS')
      );

      // Check blocked times
      const isBlocked = blockedTimes.some(
        (bt) => bt.staffId === candidate.id && bt.date === todayDateStr
      );

      // If candidate has no overlapping in-progress or near-term confirmed booking
      const hasConflict = candidateBookings.some((b) => {
        return (
          (startTimeStr >= b.startTime && startTimeStr < b.endTime) ||
          (endTimeStr > b.startTime && endTimeStr <= b.endTime) ||
          (startTimeStr <= b.startTime && endTimeStr >= b.endTime)
        );
      });

      if (!isBlocked && !hasConflict) {
        assignedStaff = candidate;
        break;
      }
    }

    if (assignedStaff) {
      // Directly assign walk-in to staff
      const subtotal = matchedServices.reduce((acc, s) => acc + s.price, 0);
      const tax = Math.round(subtotal * 0.05);
      const newBooking: Booking = {
        id: `bk_walkin_${Date.now()}`,
        bookingCode: `GLM-W${Math.floor(1000 + Math.random() * 9000)}`,
        salonId: salon.id,
        salonName: salon.name,
        salonAddress: salon.address,
        salonPhone: salon.phone,
        salonWhatsapp: salon.whatsappNumber,
        salonImage: salon.coverImage,
        customerId: `usr_walkin_${Date.now()}`,
        customerName: `${customerName} (Walk-in)`,
        customerPhone,
        staffId: assignedStaff.id,
        staffName: assignedStaff.name,
        services: matchedServices,
        totalDurationMinutes: totalDuration,
        bufferMinutes: salon.bufferMinutes || 10,
        date: todayDateStr,
        startTime: startTimeStr,
        endTime: endTimeStr,
        status: 'IN_PROGRESS',
        paymentStatus: 'PENDING',
        paymentMethod: 'PAY_AT_SALON',
        subtotal,
        tax,
        totalAmount: subtotal + tax,
        source: 'WALK_IN',
        serviceStartedAt: now.toISOString(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      const updated = [newBooking, ...appointments];
      setAppointments(updated);
      await persistState(undefined, updated);

      return {
        success: true,
        isDirectlyAssigned: true,
        message: `Assigned immediately to ${assignedStaff.name}. Service started!`,
      };
    } else {
      // All staff currently busy: Add customer to Waiting Queue
      const waitEst = waitingQueue.length > 0 ? (waitingQueue.length + 1) * 20 : 15;
      const queueItem: WaitingQueueItem = {
        id: `wq_${Date.now()}`,
        salonId: salon.id,
        customerName,
        customerPhone,
        serviceIds,
        serviceNames: matchedServices.map((s) => s.name),
        totalDurationMinutes: totalDuration,
        preferredStaffId: preferredStaffId !== 'any' ? preferredStaffId : undefined,
        preferredStaffName:
          preferredStaffId && preferredStaffId !== 'any'
            ? staffList.find((s) => s.id === preferredStaffId)?.name
            : 'Any Available',
        status: 'WAITING',
        estimatedWaitMinutes: waitEst,
        joinedAt: now.toISOString(),
      };

      const updatedQueue = [...waitingQueue, queueItem];
      setWaitingQueue(updatedQueue);
      await persistState(undefined, undefined, updatedQueue);

      return {
        success: true,
        isDirectlyAssigned: false,
        message: `All staff currently busy with protected appointments. Added to waiting queue (Est. wait: ${waitEst}m).`,
      };
    }
  };

  const createOwnerAppointment = async (bookingData: Partial<Booking>): Promise<Booking> => {
    if (!salon) throw new Error('No salon active.');
    const now = new Date();
    const newBooking: Booking = {
      id: `bk_own_${Date.now()}`,
      bookingCode: `GLM-${Math.floor(10000 + Math.random() * 90000)}`,
      salonId: salon.id,
      salonName: salon.name,
      salonAddress: salon.address,
      salonPhone: salon.phone,
      salonWhatsapp: salon.whatsappNumber,
      salonImage: salon.coverImage,
      customerId: bookingData.customerId || `usr_custom_${Date.now()}`,
      customerName: bookingData.customerName || 'Direct Booking',
      customerPhone: bookingData.customerPhone || salon.phone,
      staffId: bookingData.staffId || staffList[0]?.id || 'stf_1',
      staffName:
        bookingData.staffName ||
        staffList.find((s) => s.id === bookingData.staffId)?.name ||
        'Resident Stylist',
      services: bookingData.services || [],
      totalDurationMinutes: bookingData.totalDurationMinutes || 45,
      bufferMinutes: salon.bufferMinutes || 10,
      date: bookingData.date || now.toISOString().split('T')[0],
      startTime: bookingData.startTime || '10:00',
      endTime: bookingData.endTime || '10:45',
      status: 'CONFIRMED',
      paymentStatus: bookingData.paymentStatus || 'PENDING',
      paymentMethod: bookingData.paymentMethod || 'PAY_AT_SALON',
      subtotal: bookingData.subtotal || 1000,
      tax: bookingData.tax || 50,
      totalAmount: bookingData.totalAmount || 1050,
      source: bookingData.source || 'APP',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const updated = [newBooking, ...appointments];
    setAppointments(updated);
    await persistState(undefined, updated);

    // Sync booking with live backend
    try {
      await createBookingInBackend(newBooking);
    } catch (e) {
      console.warn('Backend createOwnerAppointment note:', e);
    }

    return newBooking;
  };

  const updateAppointmentStatus = async (
    bookingId: string,
    status: BookingStatus,
    delayMinutes?: number
  ) => {
    const now = new Date().toISOString();
    const updated = appointments.map((b) => {
      if (b.id !== bookingId) return b;
      return {
        ...b,
        status,
        delayMinutes: delayMinutes !== undefined ? delayMinutes : b.delayMinutes,
        serviceStartedAt: status === 'IN_PROGRESS' ? now : b.serviceStartedAt,
        serviceCompletedAt: status === 'COMPLETED' ? now : b.serviceCompletedAt,
        updatedAt: now,
      };
    });

    setAppointments(updated);
    await persistState(undefined, updated);

    // Sync status change to backend
    try {
      await updateBookingInBackend(bookingId, status, delayMinutes);
    } catch (e) {
      console.warn('Backend updateAppointmentStatus note:', e);
    }

    // If marked completed, update daily collection report
    if (status === 'COMPLETED') {
      const completedBooking = appointments.find((b) => b.id === bookingId);
      if (completedBooking) {
        setDailyRevenue((prev) => ({
          ...prev,
          totalRevenue: prev.totalRevenue + completedBooking.totalAmount,
          cashRevenue:
            completedBooking.paymentMethod === 'PAY_AT_SALON'
              ? prev.cashRevenue + completedBooking.totalAmount
              : prev.cashRevenue,
          onlineRevenue:
            completedBooking.paymentMethod === 'ONLINE'
              ? prev.onlineRevenue + completedBooking.totalAmount
              : prev.onlineRevenue,
          completedBookingsCount: prev.completedBookingsCount + 1,
        }));
      }
    }
  };

  const blockStaffTime = async ({
    staffId,
    date,
    startTime,
    endTime,
    reason,
  }: {
    staffId: string;
    date: string;
    startTime: string;
    endTime: string;
    reason: string;
  }) => {
    const staff = staffList.find((s) => s.id === staffId);
    const newBlock: BlockedTime = {
      id: `blk_${Date.now()}`,
      salonId: salon?.id || 'salon_1',
      staffId,
      staffName: staff?.name || 'Stylist',
      date,
      startTime,
      endTime,
      reason,
      createdAt: new Date().toISOString(),
    };

    const updated = [...blockedTimes, newBlock];
    setBlockedTimes(updated);
    await persistState(undefined, undefined, undefined, updated);
  };

  const removeBlockedTime = async (blockedId: string) => {
    const updated = blockedTimes.filter((b) => b.id !== blockedId);
    setBlockedTimes(updated);
    await persistState(undefined, undefined, undefined, updated);
  };

  const serveQueueCustomer = async (queueId: string, staffId: string) => {
    const targetQueue = waitingQueue.find((q) => q.id === queueId);
    if (!targetQueue || !salon) return;

    const assigned = staffList.find((s) => s.id === staffId);
    const now = new Date();
    const currentHH = String(now.getHours()).padStart(2, '0');
    const currentMM = String(now.getMinutes()).padStart(2, '0');
    const startTime = `${currentHH}:${currentMM}`;

    const endMinutes = now.getHours() * 60 + now.getMinutes() + targetQueue.totalDurationMinutes;
    const endHH = String(Math.floor(endMinutes / 60)).padStart(2, '0');
    const endMM = String(endMinutes % 60).padStart(2, '0');
    const endTime = `${endHH}:${endMM}`;

    const matchedServices = servicesList.filter((s) => targetQueue.serviceIds.includes(s.id));
    const subtotal = matchedServices.reduce((sum, s) => sum + s.price, 0) || 1000;
    const tax = Math.round(subtotal * 0.05);

    const newBooking: Booking = {
      id: `bk_queue_${Date.now()}`,
      bookingCode: `GLM-Q${Math.floor(1000 + Math.random() * 9000)}`,
      salonId: salon.id,
      salonName: salon.name,
      salonAddress: salon.address,
      salonPhone: salon.phone,
      salonWhatsapp: salon.whatsappNumber,
      salonImage: salon.coverImage,
      customerId: `usr_q_${Date.now()}`,
      customerName: `${targetQueue.customerName} (Walk-in)`,
      customerPhone: targetQueue.customerPhone,
      staffId,
      staffName: assigned?.name || 'Stylist',
      services: matchedServices,
      totalDurationMinutes: targetQueue.totalDurationMinutes,
      bufferMinutes: salon.bufferMinutes || 10,
      date: now.toISOString().split('T')[0],
      startTime,
      endTime,
      status: 'IN_PROGRESS',
      paymentStatus: 'PENDING',
      paymentMethod: 'PAY_AT_SALON',
      subtotal,
      tax,
      totalAmount: subtotal + tax,
      source: 'WALK_IN',
      serviceStartedAt: now.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const updatedBookings = [newBooking, ...appointments];
    const updatedQueue = waitingQueue.filter((q) => q.id !== queueId);

    setAppointments(updatedBookings);
    setWaitingQueue(updatedQueue);

    await persistState(undefined, updatedBookings, updatedQueue);
  };

  const cancelQueueCustomer = async (queueId: string) => {
    const updatedQueue = waitingQueue.filter((q) => q.id !== queueId);
    setWaitingQueue(updatedQueue);
    await persistState(undefined, undefined, updatedQueue);
  };

  const addOrUpdateStaff = async (staffData: Partial<Staff>) => {
    if (!salon) return;
    let updatedStaff: Staff[];
    if (staffData.id) {
      updatedStaff = (salon.staff || []).map((s) =>
        s.id === staffData.id ? ({ ...s, ...staffData } as Staff) : s
      );
    } else {
      const newStaff: Staff = {
        id: `stf_${Date.now()}`,
        salonId: salon.id,
        name: staffData.name || 'New Specialist',
        role: staffData.role || 'Resident Stylist',
        avatar:
          staffData.avatar ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        phone: staffData.phone,
        email: staffData.email,
        rating: 5.0,
        reviewCount: 0,
        experienceYears: staffData.experienceYears || 3,
        specialties: staffData.specialties || ['Hair & Styling'],
        serviceCategoryIds: staffData.serviceCategoryIds || [],
        workingHours: staffData.workingHours || {},
        isActive: true,
      };
      updatedStaff = [...(salon.staff || []), newStaff];
    }

    const updatedSalon = { ...salon, staff: updatedStaff };
    setSalon(updatedSalon);
    await persistState(updatedSalon);
  };

  const toggleStaffActive = async (staffId: string) => {
    if (!salon) return;
    const updatedStaff = (salon.staff || []).map((s) =>
      s.id === staffId ? { ...s, isActive: !s.isActive } : s
    );
    const updatedSalon = { ...salon, staff: updatedStaff };
    setSalon(updatedSalon);
    await persistState(updatedSalon);
  };

  const addOrUpdateService = async (serviceData: Partial<ServiceItem>) => {
    if (!salon) return;
    let updatedServices: ServiceItem[];
    if (serviceData.id) {
      updatedServices = (salon.services || []).map((s) =>
        s.id === serviceData.id ? ({ ...s, ...serviceData } as ServiceItem) : s
      );
    } else {
      const newSrv: ServiceItem = {
        id: `srv_${Date.now()}`,
        salonId: salon.id,
        name: serviceData.name || 'New Treatment',
        category: serviceData.category || 'Hair & Styling',
        description: serviceData.description || 'Premium personalized service.',
        price: serviceData.price || 999,
        durationMinutes: serviceData.durationMinutes || 45,
        bufferMinutes: serviceData.bufferMinutes || 10,
        gender: serviceData.gender || 'unisex',
        imageUrl: serviceData.imageUrl,
        popular: false,
        isOnlineBookingEnabled: true,
      };
      updatedServices = [...(salon.services || []), newSrv];
    }

    const updatedSalon = { ...salon, services: updatedServices };
    setSalon(updatedSalon);
    await persistState(updatedSalon);
  };

  const toggleServiceOnlineBooking = async (serviceId: string) => {
    if (!salon) return;
    const updatedServices = (salon.services || []).map((s) =>
      s.id === serviceId
        ? {
            ...s,
            isOnlineBookingEnabled:
              s.isOnlineBookingEnabled !== undefined ? !s.isOnlineBookingEnabled : false,
          }
        : s
    );
    const updatedSalon = { ...salon, services: updatedServices };
    setSalon(updatedSalon);
    await persistState(updatedSalon);
  };

  const updateSalonProfile = async (updates: Partial<Salon>) => {
    if (!salon) return;
    const updatedSalon = { ...salon, ...updates };
    setSalon(updatedSalon);
    await persistState(updatedSalon);
  };

  const togglePauseOnlineBooking = async (): Promise<boolean> => {
    if (!salon) return false;
    const newPaused = !salon.isOnlineBookingPaused;
    const updatedSalon = { ...salon, isOnlineBookingPaused: newPaused };
    setSalon(updatedSalon);
    await persistState(updatedSalon);
    return newPaused;
  };

  const refreshOwnerData = async () => {
    await loadOwnerState();
  };

  return (
    <OwnerSalonContext.Provider
      value={{
        salon,
        staffList,
        servicesList,
        appointments,
        waitingQueue,
        blockedTimes,
        dailyRevenue,
        isLoading,
        addWalkIn,
        createOwnerAppointment,
        updateAppointmentStatus,
        blockStaffTime,
        removeBlockedTime,
        serveQueueCustomer,
        cancelQueueCustomer,
        addOrUpdateStaff,
        toggleStaffActive,
        addOrUpdateService,
        toggleServiceOnlineBooking,
        updateSalonProfile,
        togglePauseOnlineBooking,
        refreshOwnerData,
      }}
    >
      {children}
    </OwnerSalonContext.Provider>
  );
};

export const useOwnerSalon = () => {
  const context = useContext(OwnerSalonContext);
  if (!context) {
    throw new Error('useOwnerSalon must be used within an OwnerSalonProvider');
  }
  return context;
};

