import { useState } from 'react';
import {
  BrandCrest,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  PlayIcon,
  UserIcon,
} from './Icons';
import { authApi } from '../utils/api';
import { setAuthToken } from '../utils/storage';
import { soundEngine } from '../utils/sound';

export default function Login({ onLoginSuccess, onSwitchToRegister }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleaned = identifier.trim();
    if (!cleaned || !password) return;

    setError('');
    setSubmitting(true);
    try {
      soundEngine.playClick();
      const data = await authApi.login({ identifier: cleaned, password });
      setAuthToken(data.token);
      onLoginSuccess(data.state);
    } catch (err) {
      setError(err.message || 'Sign in failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[460px] mx-auto px-4 animate-modal-enter">
      <div className="glass-panel rounded-[28px] p-7 sm:p-9 flex flex-col items-center relative overflow-hidden">
        <div className="absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />

        <div className="flex items-center gap-3 mb-2">
          <BrandCrest className="w-12 h-12 drop-shadow-[0_0_16px_rgba(34,211,238,0.45)]" />
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
              Deep Sea Arcade
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Fish Catcher
            </h1>
          </div>
        </div>

        <p className="text-sm text-slate-300/85 mb-6 text-center">
          Sign in with your registered hunter account to play.
        </p>

        {error && (
          <div className="w-full mb-4 px-3.5 py-2.5 rounded-xl bg-rose-500/15 border border-rose-400/35 text-xs text-rose-200 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="login-identifier"
              className="text-xs font-semibold uppercase tracking-wider text-cyan-200/85 pl-1"
            >
              Username or Email
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-cyan-300/65 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="login-identifier"
                type="text"
                placeholder="Enter username or email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                disabled={submitting}
                className="glass-input w-full h-11 pl-10 pr-4 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="login-password"
              className="text-xs font-semibold uppercase tracking-wider text-cyan-200/85 pl-1"
            >
              Password
            </label>
            <div className="relative">
              <LockIcon className="w-4 h-4 text-cyan-300/65 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={submitting}
                className="glass-input w-full h-11 pl-10 pr-11 rounded-xl text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer p-1"
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-ocean-primary w-full h-12 rounded-xl mt-2 flex items-center justify-center gap-2 text-sm tracking-wide cursor-pointer disabled:opacity-60"
          >
            <PlayIcon className="w-4 h-4" />
            <span>{submitting ? 'Signing In...' : 'Dive In'}</span>
          </button>
        </form>

        <p className="mt-6 text-xs text-slate-300/80">
          New to the fleet?{' '}
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onSwitchToRegister();
            }}
            className="text-cyan-300 font-semibold hover:text-cyan-200 underline underline-offset-4 cursor-pointer transition-colors"
          >
            Create Hunter Profile
          </button>
        </p>
      </div>
    </div>
  );
}
