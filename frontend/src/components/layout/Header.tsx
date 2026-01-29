'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Menu,
  Search,
  Bell,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Activity,
  Shield,
  Clock,
  FileImage,
  X
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCases } from '@/context/CasesContext';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user } = useAuth();
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { cases } = useCases();
  const router = useRouter();

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredResults = cases.filter(c => 
    c.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.modalities.some(m => m.toLowerCase().includes(searchQuery.toLowerCase()))
  ).slice(0, 5);

  const handleSearchSelect = (caseId: string) => {
    router.push(`/studies/${caseId}`);
    setShowResults(false);
    setSearchQuery('');
  };

  return (
    <header 
      className="h-18 px-6 flex items-center justify-between sticky top-0 z-40"
      style={{
        background: 'linear-gradient(180deg, rgba(17, 26, 46, 0.95) 0%, rgba(12, 18, 34, 0.9) 100%)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
        height: '72px',
      }}
    >
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2.5 rounded-xl transition-all lg:hidden"
          style={{
            background: 'transparent',
            border: '1px solid transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <Menu className="w-5 h-5 text-[#94a3b8]" />
        </button>

        {/* Global Search */}
        <div className="relative hidden sm:block" ref={searchRef}>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            placeholder="Search cases, reports, patients..."
            className="w-72 lg:w-96 pl-11 pr-16 py-3 rounded-xl text-sm transition-all"
            style={{
              background: 'rgba(26, 39, 68, 0.6)',
              border: '1px solid rgba(148, 163, 184, 0.1)',
              color: '#f1f5f9',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(13, 148, 136, 0.5)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(13, 148, 136, 0.1)';
              setShowResults(true);
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.1)';
              e.currentTarget.style.boxShadow = 'none';
              // Delayed close handled by click outside
            }}
          />
          {searchQuery && (
             <button 
                onClick={() => { setSearchQuery(''); setShowResults(false); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full"
             >
                <X className="w-3 h-3 text-[#64748b]" />
             </button>
          )}

          {/* Search Dropdown */}
          <AnimatePresence>
            {showResults && searchQuery && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute left-0 top-full mt-2 w-full rounded-2xl overflow-hidden shadow-2xl z-50"
                style={{
                  background: 'rgba(17, 26, 46, 0.98)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                }}
              >
                {filteredResults.length > 0 ? (
                  <div className="py-2">
                     <div className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Cases & Patients
                     </div>
                     {filteredResults.map(result => (
                        <div 
                           key={result.id}
                           onClick={() => handleSearchSelect(result.id)}
                           className="px-4 py-3 hover:bg-white/5 cursor-pointer flex items-center gap-3 transition-colors"
                        >
                           <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
                              <FileImage className="w-4 h-4" />
                           </div>
                           <div>
                              <p className="text-sm font-semibold text-white">{result.patientName}</p>
                              <div className="flex items-center gap-2 text-xs text-slate-400">
                                 <span>{result.id}</span>
                                 <span>•</span>
                                 <span>{result.patientId}</span>
                              </div>
                           </div>
                           <div className="ml-auto">
                              <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                 {result.modalities[0]}
                              </span>
                           </div>
                        </div>
                     ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500">
                     <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                     <p>No results found for "{searchQuery}"</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* AI Status Badge */}
        <div 
          className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl"
          style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
          }}
        >
          <div className="relative">
            <Activity className="w-4 h-4 text-[#10b981]" />
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
          </div>
          <span className="text-sm font-medium text-[#10b981]">AI Online</span>
        </div>
        
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-3 rounded-xl transition-all relative"
            style={{
              background: showNotifications ? 'rgba(148, 163, 184, 0.1)' : 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
            }}
            onMouseLeave={(e) => {
              if (!showNotifications) e.currentTarget.style.background = 'transparent';
            }}
          >
            <Bell className="w-5 h-5 text-[#94a3b8]" />
            <span 
              className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full"
              style={{
                background: '#f43f5e',
                boxShadow: '0 0 8px #f43f5e',
              }}
            />
          </button>

          <AnimatePresence>
            {showNotifications && (
              <NotificationDropdown onClose={() => setShowNotifications(false)} />
            )}
          </AnimatePresence>
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 p-2 pr-4 rounded-xl transition-all"
            style={{
              background: showUserMenu ? 'rgba(148, 163, 184, 0.1)' : 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
            }}
            onMouseLeave={(e) => {
              if (!showUserMenu) e.currentTarget.style.background = 'transparent';
            }}
          >
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-semibold"
              style={{
                background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
                boxShadow: '0 2px 8px rgba(13, 148, 136, 0.3)',
              }}
            >
              {user?.name?.[0] || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-[#f1f5f9]">{user?.name || 'Dr. User'}</p>
              <p className="text-xs text-[#64748b]">Radiologist</p>
            </div>
            <ChevronDown className="w-4 h-4 text-[#64748b] hidden sm:block" />
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <UserDropdown onClose={() => setShowUserMenu(false)} />
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const notifications = [
    {
      id: 1,
      title: 'New study uploaded',
      message: 'CT Chest scan ready for AI analysis',
      time: '2 min ago',
      unread: true,
      icon: Activity,
      color: '#06b6d4',
    },
    {
      id: 2,
      title: 'AI Analysis Complete',
      message: 'Detected findings in Study #2847',
      time: '15 min ago',
      unread: true,
      icon: Shield,
      color: '#10b981',
    },
    {
      id: 3,
      title: 'Report signed',
      message: 'Report for MRN-45821 finalized',
      time: '1 hour ago',
      unread: false,
      icon: Clock,
      color: '#8b5cf6',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 top-full mt-2 w-96 rounded-2xl overflow-hidden z-50"
      style={{
        background: 'linear-gradient(180deg, rgba(26, 39, 68, 0.98) 0%, rgba(17, 26, 46, 0.98) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(148, 163, 184, 0.15)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
      }}
    >
      <div className="p-4 border-b border-[rgba(148,163,184,0.1)] flex items-center justify-between">
        <h3 className="font-semibold text-[#f1f5f9]">Notifications</h3>
        <button 
          className="text-sm font-medium transition-colors"
          style={{ color: '#14b8a6' }}
        >
          Mark all read
        </button>
      </div>
      
      <div className="max-h-80 overflow-y-auto">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className="p-4 border-b border-[rgba(148,163,184,0.08)] cursor-pointer transition-all"
            style={{
              background: notif.unread ? 'rgba(13, 148, 136, 0.05)' : 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = notif.unread ? 'rgba(13, 148, 136, 0.05)' : 'transparent';
            }}
          >
            <div className="flex items-start gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ 
                  background: `${notif.color}20`,
                  border: `1px solid ${notif.color}30`,
                }}
              >
                <notif.icon className="w-5 h-5" style={{ color: notif.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm text-[#f1f5f9]">{notif.title}</p>
                  {notif.unread && (
                    <span 
                      className="w-2 h-2 rounded-full"
                      style={{ background: '#0d9488' }}
                    />
                  )}
                </div>
                <p className="text-sm text-[#94a3b8] mt-0.5">{notif.message}</p>
                <p className="text-xs text-[#64748b] mt-1">{notif.time}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-3 border-t border-[rgba(148,163,184,0.1)]">
        <button 
          className="w-full py-2.5 text-sm font-medium rounded-xl transition-all"
          style={{
            background: 'rgba(13, 148, 136, 0.1)',
            color: '#14b8a6',
            border: '1px solid rgba(13, 148, 136, 0.2)',
          }}
        >
          View all notifications
        </button>
      </div>
    </motion.div>
  );
}

function UserDropdown({ onClose }: { onClose: () => void }) {
  const { user, logout } = useAuth();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 top-full mt-2 w-64 rounded-2xl overflow-hidden z-50"
      style={{
        background: 'linear-gradient(180deg, rgba(26, 39, 68, 0.98) 0%, rgba(17, 26, 46, 0.98) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(148, 163, 184, 0.15)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
      }}
    >
      <div className="p-4 border-b border-[rgba(148,163,184,0.1)]">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold"
            style={{
              background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
              boxShadow: '0 2px 8px rgba(13, 148, 136, 0.3)',
            }}
          >
            {user?.name?.[0] || 'U'}
          </div>
          <div>
            <p className="font-semibold text-[#f1f5f9]">{user?.name || 'Doctor'}</p>
            <p className="text-sm text-[#64748b] truncate w-32">{user?.email || 'email'}</p>
          </div>
        </div>
      </div>
      
      <div className="p-2">
        <Link href="/profile">
           <button 
             className="w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all text-left text-[#94a3b8]"
             onMouseEnter={(e) => {
               e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
               e.currentTarget.style.color = '#f1f5f9';
             }}
             onMouseLeave={(e) => {
               e.currentTarget.style.background = 'transparent';
               e.currentTarget.style.color = '#94a3b8';
             }}
           >
             <User className="w-5 h-5" />
             Profile
           </button>
        </Link>
        <Link href="/settings">
           <button 
             className="w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all text-left text-[#94a3b8]"
             onMouseEnter={(e) => {
               e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
               e.currentTarget.style.color = '#f1f5f9';
             }}
             onMouseLeave={(e) => {
               e.currentTarget.style.background = 'transparent';
               e.currentTarget.style.color = '#94a3b8';
             }}
           >
             <Settings className="w-5 h-5" />
             Settings
           </button>
        </Link>
      </div>
      
      <div className="p-2 border-t border-[rgba(148,163,184,0.1)]">
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all text-left"
          style={{ color: '#fb7185' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <LogOut className="w-5 h-5" />
          Sign out
        </button>
      </div>
    </motion.div>
  );
}
