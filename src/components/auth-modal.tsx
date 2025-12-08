'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useAuthStore } from '@/lib/stores/use-auth-store'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTab?: 'signin' | 'signup'
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { signInWithValyu } = useAuthStore()

  // Hide auth modal in development mode (default to development)
  const isDevelopment = process.env.NEXT_PUBLIC_APP_MODE !== 'production'
  if (isDevelopment) {
    return null
  }

  const handleValyuSignIn = async () => {
    setError(null)
    setIsLoading(true)

    try {
      const result = await signInWithValyu()

      if (result.error) {
        setError(result.error.message)
        setIsLoading(false)
      }
      // If successful, the user will be redirected to Valyu OAuth
      // No need to close modal as page will redirect
    } catch (err) {
      setError('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Sign in with Valyu</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <p className="text-center text-sm text-muted-foreground leading-relaxed">
            Valyu is the information backbone of Polyseer, giving our AI engine access to real-time data across web, academic, and proprietary sources.
          </p>

          {/* Free Credits Badge */}
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-xl">🎁</span>
              <span className="text-green-600 dark:text-green-400 font-bold">$10 Free Credits</span>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              New accounts get $10 in free search credits
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleValyuSignIn}
            disabled={isLoading}
            className="w-full h-12 bg-black hover:bg-gray-800 text-white font-medium"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Connecting...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-3">
                <span>Sign in with</span>
                <Image
                  src="/valyu.svg"
                  alt="Valyu"
                  width={60}
                  height={20}
                  className="h-5 w-auto invert"
                />
              </span>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Don&apos;t have an account? You can create one during sign-in.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
