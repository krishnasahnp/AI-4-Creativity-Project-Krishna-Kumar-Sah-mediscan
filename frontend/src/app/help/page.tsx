'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import AuthGuard from '@/components/auth/AuthGuard';
import { 
  Search, 
  HelpCircle, 
  Book, 
  MessageCircle, 
  FileText, 
  ChevronDown, 
  ChevronRight,
  Mail,
  Zap,
  Shield
} from 'lucide-react';

export default function HelpPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All Topics' },
    { id: 'getting-started', label: 'Getting Started' },
    { id: 'analysis', label: 'AI Analysis' },
    { id: 'account', label: 'Account & Billing' },
  ];

  const faqs = [
    {
      id: 1,
      category: 'getting-started',
      question: 'How do I upload a new study?',
      answer: 'Navigate to the "Upload" page from the sidebar. You can drag and drop DICOM files, images, or videos directly into the upload zone. Once uploaded, click "Start Analysis" to process the files.'
    },
    {
      id: 2,
      category: 'analysis',
      question: 'What imaging modalities are supported?',
      answer: 'MediVision AI currently supports CT, MRI, X-Ray, and Ultrasound analysis. We accept standard DICOM formats as well as common image (PNG, JPG) and video formats.'
    },
    {
      id: 3,
      category: 'analysis',
      question: 'How accurate is the AI diagnosis?',
      answer: 'Our AI models are trained on over 10 million validated case studies and have a 99.2% accuracy rate for common pathologies. However, all AI findings should be reviewed by a certified radiologist.'
    },
    {
      id: 4,
      category: 'account',
      question: 'How do I reset my password?',
      answer: 'Go to Settings > Security to update your password. If you cannot log in, use the "Forgot Password" link on the login page to receive a reset link via email.'
    },
    {
      id: 5,
      category: 'getting-started',
      question: 'Can I export reports to PDF?',
      answer: 'Yes! In the Study Viewer, switch to the "Report" tab. Once you have reviewed and signed the findings, click the "Export PDF" button to download a formatted report.'
    },
  ];

  const filteredFaqs = faqs.filter(faq => 
    (activeCategory === 'all' || faq.category === activeCategory) &&
    (faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
     faq.answer.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AuthGuard>
      <div className="min-h-screen flex" style={{ background: '#0c1222' }}>
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        <div className="flex-1 flex flex-col min-w-0">
          <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
            <div className="max-w-4xl mx-auto space-y-8">
              
              {/* Hero Section */}
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-2xl bg-teal-500/10 flex items-center justify-center mx-auto mb-6 text-teal-400">
                  <HelpCircle className="w-8 h-8" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-4">How can we help you?</h1>
                <p className="text-slate-400 max-w-lg mx-auto mb-8">
                  Search our knowledge base or browse frequently asked questions to find the answers you need.
                </p>
                
                <div className="relative max-w-xl mx-auto">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search for help..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-xl text-white outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
                    style={{
                      background: 'rgba(26, 39, 68, 0.6)',
                      border: '1px solid rgba(148, 163, 184, 0.15)',
                    }}
                  />
                </div>
              </div>

              {/* Quick Links */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <QuickLinkCard 
                  icon={Book} 
                  title="Documentation" 
                  desc="Detailed guides and API references"
                  color="blue"
                />
                <QuickLinkCard 
                  icon={FileText} 
                  title="Video Tutorials" 
                  desc="Step-by-step video walkthroughs"
                  color="purple"
                />
                <QuickLinkCard 
                  icon={Zap} 
                  title="System Status" 
                  desc="Check current AI model uptime"
                  color="amber"
                />
              </div>

              {/* FAQs */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <h2 className="text-xl font-bold text-white">Frequently Asked Questions</h2>
                  <div className="flex gap-2">
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          activeCategory === cat.id 
                            ? 'bg-teal-500 text-white' 
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredFaqs.length > 0 ? (
                    filteredFaqs.map((faq) => (
                      <FAQItem key={faq.id} question={faq.question} answer={faq.answer} />
                    ))
                  ) : (
                    <div className="text-center py-12 text-slate-500">
                      <p>No results found for "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Support */}
              <div className="rounded-2xl p-8 text-center relative overflow-hidden">
                <div 
                  className="absolute inset-0 opacity-20"
                  style={{
                    background: 'linear-gradient(135deg, #0d9488 0%, #3b82f6 100%)',
                  }}
                />
                <div className="relative z-10">
                   <h2 className="text-xl font-bold text-white mb-2">Still need support?</h2>
                   <p className="text-slate-300 mb-6">Our dedicated medical support team is available 24/7.</p>
                   <button 
                     className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all hover:scale-105"
                     style={{
                       background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
                       boxShadow: '0 4px 20px rgba(13, 148, 136, 0.3)',
                     }}
                   >
                     <Mail className="w-5 h-5" />
                     Contact Support
                   </button>
                </div>
              </div>

            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}

function QuickLinkCard({ icon: Icon, title, desc, color }: any) {
  const colors = {
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'hover:border-blue-500/50' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'hover:border-purple-500/50' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'hover:border-amber-500/50' },
  };
  const theme = colors[color as keyof typeof colors];

  return (
    <div className={`p-4 rounded-2xl bg-[rgba(26,39,68,0.5)] border border-[rgba(148,163,184,0.1)] transition-all cursor-pointer group ${theme.border}`}>
      <div className={`w-12 h-12 rounded-xl ${theme.bg} ${theme.text} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-semibold text-white mb-1 group-hover:text-teal-400 transition-colors">{title}</h3>
      <p className="text-sm text-slate-400">{desc}</p>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className="rounded-xl bg-[rgba(26,39,68,0.3)] border border-[rgba(148,163,184,0.1)] overflow-hidden transition-all hover:border-[rgba(148,163,184,0.2)]"
    >
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <span className="font-medium text-slate-200">{question}</span>
        <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 text-sm text-slate-400 leading-relaxed border-t border-slate-800/50">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
