'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import TelegramBotModal from '@/components/telegram-bot-modal';
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
import { ResearchHistoryList } from '@/components/research/research-history';
import {
  User,
  History,
  ExternalLink,
  Monitor,
  LogOut
} from 'lucide-react';

export default function Header() {
  const [telegramModalOpen, setTelegramModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'system'>('light');

  const pathname = usePathname();
  const isAnalysisPage = pathname.startsWith('/research/') || pathname === '/history';
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);

  // User is a Valyu user if they have valyu_sub
  const isValyuUser = !!user?.valyu_sub;
  const isSelfHosted = process.env.NEXT_PUBLIC_APP_MODE !== 'valyu';

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
                  className={`h-24 w-auto drop-shadow-md ${isAnalysisPage ? 'brightness-0 invert' : 'dark:brightness-0 dark:invert'}`}
                  priority
                />
              </Link>
            </motion.div>

            {/* Valyu sign-in banner - only for non-authenticated users */}
            {mounted && !user && !isSelfHosted && (
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
                {pathname === '/history' ? 'Research History' : 'Deep Research'}
              </h1>
            </motion.div>
          )}

          <motion.nav
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
            className='flex items-center gap-0.5 md:gap-1'
          >

            {mounted && (user || isSelfHosted) && (
              <Link
                href="/history"
                className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 mr-1 rounded-md text-sm text-white/90 hover:text-white hover:bg-white/10 drop-shadow-md transition-colors"
              >
                <History className="h-4 w-4" />
                History
              </Link>
            )}

            {mounted && user ? (
              <DropdownMenu>
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

                  {/* Research History Section */}
                  <div className="border-b">
                    <DropdownMenuLabel className="flex items-center justify-between gap-2 px-3 py-2">
                      <span className="flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Recent research
                      </span>
                      <Link href="/history" className="text-xs font-normal text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
                        View all
                      </Link>
                    </DropdownMenuLabel>
                    <div className="max-h-[280px] overflow-y-auto p-2">
                      <ResearchHistoryList limit={6} compact appearance="plain" />
                    </div>
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
            ) : mounted && !isSelfHosted ? (
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
