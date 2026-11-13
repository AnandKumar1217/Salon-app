import React, { createContext, useContext, useState } from 'react';

export interface LocationArea {
  name: string;
  city: string;
}

export const POPULAR_LOCATIONS: LocationArea[] = [
  { name: 'Indiranagar', city: 'Bengaluru' },
  { name: 'Koramangala', city: 'Bengaluru' },
  { name: 'Lavelle Road', city: 'Bengaluru' },
  { name: 'Richmond Road', city: 'Bengaluru' },
  { name: 'Bandra West', city: 'Mumbai' },
  { name: 'Juhu', city: 'Mumbai' },
  { name: 'Connaught Place', city: 'New Delhi' },
  { name: 'Greater Kailash', city: 'New Delhi' },
];

interface LocationContextType {
  currentArea: string;
  currentCity: string;
  isGpsActive: boolean;
  setLocation: (area: string, city: string) => void;
  useCurrentGps: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentArea, setCurrentArea] = useState<string>('Indiranagar');
  const [currentCity, setCurrentCity] = useState<string>('Bengaluru');
  const [isGpsActive, setIsGpsActive] = useState<boolean>(true);

  const setLocation = (area: string, city: string) => {
    setCurrentArea(area);
    setCurrentCity(city);
    setIsGpsActive(false);
  };

  const useCurrentGps = () => {
    setCurrentArea('Indiranagar');
    setCurrentCity('Bengaluru');
    setIsGpsActive(true);
  };

  return (
    <LocationContext.Provider
      value={{
        currentArea,
        currentCity,
        isGpsActive,
        setLocation,
        useCurrentGps,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

