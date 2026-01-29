'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Activity, 
  Upload, 
  FileText, 
  Settings, 
  BarChart3,
  Stethoscope,
  Brain,
  Zap
} from 'lucide-react';
import Dashboard from '@/components/Dashboard';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

import AuthGuard from '@/components/auth/AuthGuard';

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
            <Dashboard />
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
