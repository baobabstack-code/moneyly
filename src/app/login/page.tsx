'use client'

import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      console.error('Error logging in:', error.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-container-low flex items-center justify-center p-6 font-manrope">
      <div className="max-w-md w-full bg-surface rounded-[2rem] border border-outline-variant shadow-2xl overflow-hidden transition-all duration-500 hover:shadow-primary/5">
        <div className="p-8 md:p-12">
          {/* Logo Section */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-primary text-on-primary rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl shadow-primary/20 mb-6 transform transition-transform hover:scale-110 duration-300">
              H
            </div>
            <h1 className="text-3xl font-black text-primary tracking-tighter mb-2">HTB GLOBAL</h1>
            <p className="text-on-surface-variant font-medium text-center">Institutional Lending Platform</p>
          </div>

          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-xl font-bold text-on-surface mb-2">Welcome Back</h2>
              <p className="text-sm text-on-surface-variant/70 leading-relaxed">
                Sign in to manage your loan applications and access your account.
              </p>
            </div>

            {/* Google Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-4 bg-surface border-2 border-outline-variant hover:border-primary hover:bg-primary/5 text-on-surface font-bold py-4 px-6 rounded-2xl transition-all duration-300 group relative overflow-hidden shadow-sm active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <svg className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="text-lg">Continue with Google</span>
                </>
              )}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant/50"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
                <span className="bg-surface px-4 text-on-surface-variant/40">Secure Access</span>
              </div>
            </div>

            <p className="text-[10px] text-center text-on-surface-variant/50 leading-relaxed uppercase tracking-widest font-bold">
              By continuing, you agree to our <br />
              <a href="#" className="text-primary hover:underline underline-offset-4">Terms of Service</a> & <a href="#" className="text-primary hover:underline underline-offset-4">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
