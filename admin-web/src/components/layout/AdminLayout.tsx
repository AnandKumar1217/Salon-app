'use client';

import React, { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAdminAuth } from '../../context/AdminAuthContext';
import LoginPage from '../../app/login/page';

export const AdminLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { admin, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin h-8 w-8 border-3 border-[#4A154B] border-t-transparent rounded-full" />
          <p className="mt-4 text-xs font-medium text-stone-500 tracking-wide">VERIFYING ADMIN CREDENTIALS...</p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
};

