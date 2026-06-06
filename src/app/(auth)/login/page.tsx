'use client';

import { useState, type FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password. Please try again.');
      } else {
        router.push('/chat');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      {/* Header */}
      <div className="auth-header">
        <img
          src="/images/logo.png"
          alt="Yantrixa AI"
          width={56}
          height={56}
          style={{
            margin: '0 auto 16px',
            borderRadius: 'var(--radius-md)',
          }}
        />
        <h1 className="auth-logo">
          <span className="text-gradient">Yantrixa AI</span>
        </h1>
        <p className="auth-description">Welcome back. Sign in to continue.</p>
      </div>

      {/* Error */}
      {error && (
        <div className="auth-error">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Form */}
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="input-field"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            autoFocus
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <div className="password-wrapper">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className="input-field"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={{ paddingRight: 44 }}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className={`btn-primary auth-submit ${loading ? 'btn-loading' : ''}`}
          disabled={loading}
        >
          <span>Sign In</span>
        </button>
      </form>

      {/* Footer */}
      <p className="auth-footer">
        Don&apos;t have an account?{' '}
        <Link href="/register">Create one</Link>
      </p>
    </div>
  );
}
