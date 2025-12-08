'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import TelegramBotModal from '@/components/telegram-bot-modal';
import { ConnectPolymarket } from '@/components/connect-polymarket';
import { useAuthStore } from '@/lib/stores/use-auth-store';
import { AuthModal } from '@/components/auth-modal';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  User,
  History,
  MessageSquare,
  Trash2,
  ExternalLink,
  Monitor,
  LogOut
} from 'lucide-react';

interface AnalysisSession {
  id: string;
  market_question?: string;
  market_url?: string;
  platform?: 'polymarket' | 'kalshi' | 'unknown';
  completed_at?: string;
  valyu_cost?: number;
  p_neutral?: number;
  p0?: number;
  forecast_card?: {
    question?: string;
    pNeutral?: number;
    market?: {
      question?: string;
    };
  };
  // Legacy support
  polymarket_slug?: string;
  report?: {
    market_question?: string;
    probability?: number;
    confidence?: string;
  };
}

// Helper to detect platform from URL
function getPlatformFromUrl(url: string | undefined | null): 'polymarket' | 'kalshi' | 'unknown' {
  if (!url) return 'unknown';
  if (url.includes('polymarket.com')) return 'polymarket';
  if (url.includes('kalshi.com')) return 'kalshi';
  return 'unknown';
}


export default function Header() {
  const [telegramModalOpen, setTelegramModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sessions, setSessions] = useState<AnalysisSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'system'>('light');

  const pathname = usePathname();
  const router = useRouter();
  const isAnalysisPage = pathname === '/analysis';
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);

  // User is a Valyu user if they have valyu_sub
  const isValyuUser = !!user?.valyu_sub;
  const isDevelopment = process.env.NEXT_PUBLIC_APP_MODE !== 'production';

  const tier = isValyuUser ? 'Valyu' : 'Sign in';

  useEffect(() => {
    setMounted(true);

    // Initialize theme from localStorage or default to light
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
      const themeToApply = savedTheme || 'light';
      setCurrentTheme(themeToApply);

      // Apply the theme class immediately
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');

      if (themeToApply === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.add(systemTheme);
      } else {
        root.classList.add(themeToApply);
      }
    }
  }, []);

  // Save theme changes to localStorage
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      localStorage.setItem('theme', currentTheme);
    }
  }, [currentTheme, mounted]);

  // Fetch analysis history when dropdown opens
  const fetchAnalysisHistory = async () => {
    if (!user) return;

    setLoadingSessions(true);
    try {
      const response = await fetch('/api/user/history');
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleSessionSelect = (sessionId: string) => {
    router.push(`/analysis?id=${sessionId}`);
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/user/history/${sessionId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setSessions(sessions.filter(s => s.id !== sessionId));
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  return (
    <header className='absolute top-0 left-0 right-0 z-50 w-full'>
      {/* Glass background for analysis page */}
      {isAnalysisPage && (
        <div className='absolute inset-0 bg-black/30 backdrop-blur-md'></div>
      )}

      <div className='relative w-full px-2 md:px-4'>
        <div className='flex h-14 items-center justify-between'>
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
            >
              <Link href='/' className='inline-block pt-2'>
                <Image
                  src='/polyseer.svg'
                  alt='Polyseer'
                  width={200}
                  height={80}
                  className='h-24 md:h-24 w-auto drop-shadow-md'
                  priority
                />
              </Link>
            </motion.div>

            {/* Valyu sign-in banner - only for non-authenticated users */}
            {mounted && !user && (
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                onClick={() => setAuthModalOpen(true)}
                className="hidden md:flex items-center gap-2 text-xs bg-white/10 hover:bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20 transition-all"
              >
                <span className="text-white/70">Sign in with Valyu</span>
                <span className="text-green-400 font-medium">$10 free</span>
              </motion.button>
            )}
          </div>

          {/* Center title for analysis page */}
          {isAnalysisPage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className='absolute left-1/2 transform -translate-x-1/2'
            >
              <h1 className='text-lg md:text-2xl font-bold text-white font-[family-name:var(--font-space)] drop-shadow-md'>
                Deep Analysis
              </h1>
            </motion.div>
          )}

          <motion.nav
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
            className='flex items-center gap-0.5 md:gap-1'
          >
            {/* <ConnectPolymarket /> */}

            {mounted && user ? (
              <DropdownMenu onOpenChange={(open) => open && fetchAnalysisHistory()}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 h-8 bg-gradient-to-br from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-white/20 hover:border-white/30 transition-all text-white/90 hover:text-white drop-shadow-md">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {user.email?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-96 max-h-[85vh] overflow-hidden">
                  {/* User Info Section */}
                  <div className="p-3 border-b">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.user_metadata?.avatar_url} />
                        <AvatarFallback>
                          {user.email?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {user.email?.split('@')[0]}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {user.email}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {tier}
                          </Badge>
                          {isValyuUser && user.valyu_organisation_name && (
                            <span className="text-xs text-gray-500 truncate">
                              {user.valyu_organisation_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Analysis History Section */}
                  <div className="border-b">
                    <DropdownMenuLabel className="flex items-center gap-2 px-3 py-2">
                      <History className="h-4 w-4" />
                      Recent Analyses
                    </DropdownMenuLabel>
                    {loadingSessions ? (
                      <div className="h-[200px]">
                        <div className="p-2 space-y-2">
                          {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
                          ))}
                        </div>
                      </div>
                    ) : sessions.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500 h-[80px] flex items-center justify-center">
                        No analyses yet. Paste a market URL to get started.
                      </div>
                    ) : (
                      <div className="max-h-[280px] overflow-y-auto">
                        <div className="p-2 space-y-1.5">
                          {sessions.slice(0, 8).map((session) => {
                            // Use stored platform or detect from URL
                            const platform = session.platform || getPlatformFromUrl(session.market_url || session.polymarket_slug);
                            // Get question from various possible fields
                            const question = session.market_question
                              || session.forecast_card?.question
                              || session.forecast_card?.market?.question
                              || session.report?.market_question
                              || session.market_url
                              || session.polymarket_slug
                              || 'Unknown market';
                            // Get probability from various possible fields
                            const probability = session.p_neutral
                              || session.forecast_card?.pNeutral
                              || session.report?.probability;

                            return (
                              <div
                                key={session.id}
                                className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
                                onClick={() => handleSessionSelect(session.id)}
                              >
                                {/* Platform Icon */}
                                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-gray-100 dark:bg-gray-800">
                                  {platform === 'polymarket' ? (
                                    <img
                                      src="https://www.google.com/s2/favicons?domain=polymarket.com&sz=32"
                                      alt="Polymarket"
                                      className="w-5 h-5"
                                    />
                                  ) : platform === 'kalshi' ? (
                                    <img
                                      src="https://kalshi.com/logo192.png"
                                      alt="Kalshi"
                                      className="w-5 h-5 rounded-sm"
                                    />
                                  ) : (
                                    <MessageSquare className="h-4 w-4 text-gray-400" />
                                  )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 leading-tight">
                                    {question}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-gray-500">
                                      {session.completed_at ? new Date(session.completed_at).toLocaleDateString(undefined, {
                                        month: 'short',
                                        day: 'numeric',
                                        year: session.completed_at.startsWith(new Date().getFullYear().toString()) ? undefined : 'numeric'
                                      }) : 'In progress'}
                                    </span>
                                    {probability !== undefined && (
                                      <>
                                        <span className="text-gray-300 dark:text-gray-600">·</span>
                                        <span className={`text-xs font-medium ${
                                          probability >= 0.7 ? 'text-green-600 dark:text-green-400' :
                                          probability <= 0.3 ? 'text-red-600 dark:text-red-400' :
                                          'text-yellow-600 dark:text-yellow-400'
                                        }`}>
                                          {(probability * 100).toFixed(0)}%
                                        </span>
                                      </>
                                    )}
                                    <span className="text-xs text-gray-400 capitalize">
                                      {platform !== 'unknown' && platform}
                                    </span>
                                  </div>
                                </div>

                                {/* Delete button */}
                                <div
                                  className="p-1.5 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSession(session.id);
                                  }}
                                  title="Delete analysis"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Menu Actions */}
                  <DropdownMenuItem onClick={() => setShowSettings(true)}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>

                  {/* Valyu Platform link for credit management */}
                  {isValyuUser && (
                    <DropdownMenuItem asChild>
                      <a
                        href="https://platform.valyu.ai"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Manage Valyu Credits
                      </a>
                    </DropdownMenuItem>
                  )}

                  {/* Theme Switcher */}
                  <div className="px-2 py-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Theme</span>
                      </div>
                      <ThemeSwitcher
                        value={currentTheme}
                        onChange={setCurrentTheme}
                        userId={user?.id}
                        sessionId={`session_${Date.now()}`}
                        tier={tier}
                        className="ml-auto"
                      />
                    </div>
                  </div>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={async () => {
                    console.log('[Header] Sign out button clicked')
                    try {
                      const result = await signOut()
                      console.log('[Header] Sign out result:', result)
                      if (result?.error) {
                        console.error('[Header] Sign out error:', result.error)
                      } else {
                        console.log('[Header] Sign out successful')
                      }
                    } catch (error) {
                      console.error('[Header] Sign out exception:', error)
                    }
                  }}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : mounted && !isDevelopment ? (
              <Button
                variant='ghost'
                size='sm'
                className='text-white/90 hover:text-white hover:bg-white/10 drop-shadow-md text-base px-3 py-1.5'
                onClick={() => {
                  setAuthModalOpen(true);
                  // Track signup button click
                  if (typeof window !== 'undefined') {
                    import('@vercel/analytics').then(({ track }) => {
                      track('Sign In Button Clicked', { location: 'header' });
                    });
                  }
                }}
              >
                Sign in
              </Button>
            ) : null}

            {/* Profile Settings Modal */}
            {showSettings && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSettings(false)}>
                <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
                  <h3 className="text-lg font-semibold mb-4">Profile Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <div className="text-sm text-gray-600">{user?.email}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">User ID</label>
                      <div className="text-xs font-mono text-gray-600">{user?.id}</div>
                    </div>
                    {isValyuUser && (
                      <>
                        <div>
                          <label className="text-sm font-medium">Valyu Organization</label>
                          <div className="text-sm text-gray-600">{user?.valyu_organisation_name || 'N/A'}</div>
                        </div>
                        <div className="pt-2">
                          <a
                            href="https://platform.valyu.ai"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-purple-600 hover:text-purple-700 underline"
                          >
                            Manage credits on Valyu Platform
                          </a>
                        </div>
                      </>
                    )}
                  </div>
                  <Button variant="outline" onClick={() => setShowSettings(false)} className="w-full mt-4">Close</Button>
                </div>
              </div>
            )}
          </motion.nav>
        </div>
      </div>

      <TelegramBotModal
        open={telegramModalOpen}
        onOpenChange={setTelegramModalOpen}
      />
      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
      />
    </header>
  );
}
