'use client';

import { useState, useMemo, type FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  if (password.length === 0) return 'weak';

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return 'weak';
  if (score <= 4) return 'medium';
  return 'strong';
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  function validate(): string | null {
    if (name.trim().length < 2) return 'Name must be at least 2 characters.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return 'Please enter a valid email address.';
    if (password.length < 8)
      return 'Password must be at least 8 characters.';
    if (password !== confirmPassword) return 'Passwords do not match.';
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed. Please try again.');
        return;
      }

      // Auto sign-in after successful registration
      const signInResult = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        // Registration worked but auto-login failed → redirect to login
        router.push('/login');
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
        <p className="auth-description">Create your account to get started.</p>
      </div>

      {/* Error */}
      {error && (
        <div className="auth-error" style={{ marginBottom: 16 }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Form */}
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Full Name</label>
          <input
            id="name"
            type="text"
            className="input-field"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            autoFocus
          />
        </div>

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
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <div className="password-wrapper">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className="input-field"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
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

          {/* Strength indicator */}
          {password.length > 0 && (
            <div className="password-strength">
              <div className="strength-bar">
                <div className={`strength-fill ${strength}`} />
              </div>
              <span className={`strength-text ${strength}`}>
                {strength === 'weak'
                  ? 'Weak password'
                  : strength === 'medium'
                  ? 'Medium strength'
                  : 'Strong password'}
              </span>
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="confirm-password">Confirm Password</label>
          <div className="password-wrapper">
            <input
              id="confirm-password"
              type={showConfirm ? 'text' : 'password'}
              className="input-field"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              style={{ paddingRight: 44 }}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirm(!showConfirm)}
              aria-label={
                showConfirm ? 'Hide password' : 'Show password'
              }
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {confirmPassword.length > 0 && password !== confirmPassword && (
            <span
              style={{
                fontSize: '0.75rem',
                color: '#ef4444',
                marginTop: 4,
              }}
            >
              Passwords do not match
            </span>
          )}
        </div>

        <button
          type="submit"
          className={`btn-primary auth-submit ${loading ? 'btn-loading' : ''}`}
          disabled={loading}
        >
          <span>Create Account</span>
        </button>
      </form>

      {/* Footer */}
      <p className="auth-footer">
        Already have an account? <Link href="/login">Sign In</Link>
      </p>
    </div>
  );
}
