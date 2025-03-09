'use client';

import { useEffect, useState } from 'react';
import { signUpAction } from '@/app/actions';
import { FormMessage, Message } from '@/components/form-message';
import { SubmitButton } from '@/components/submit-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { SmtpMessage } from '../smtp-message';

export default function Signup(props: { searchParams: Promise<Message> }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);
  const [searchParams, setSearchParams] = useState<Message | null>(null);
  const minLength = Number(process.env.NEXT_PUBLIC_MIN_PASSWORD_LENGTH) || 12; // fallback to 12 if env var is missing

  // Resolve the Promise<Message> and store it in state
  useEffect(() => {
    props.searchParams.then((resolvedMessage) => setSearchParams(resolvedMessage));
  }, [props.searchParams]);

  // Email validation function
  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Standard email regex
    if (!emailRegex.test(value)) {
      setEmailError('Please enter a valid email address.');
    } else {
      setEmailError('');
    }
  };

  // Password validation function
  const validatePassword = (value: string) => {
    const hasUppercase = /[A-Z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    if (value.length < minLength-1) {
      setPasswordError(`Password must be at least ${minLength} characters long.`);
    } else if (!hasUppercase) {
      setPasswordError('Password must include at least one uppercase letter.');
    } else if (!hasNumber) {
      setPasswordError('Password must include at least one number.');
    } else if (!hasSpecialChar) {
      setPasswordError('Password must include at least one special character.');
    } else {
      setPasswordError('');
    }
  };

  // Form validation handler
  const handleValidation = () => {
    validateEmail(email);
    validatePassword(password);

    // Check if all fields are valid
    if (!emailError && !passwordError && email && password) {
      setIsFormValid(true);
    } else {
      setIsFormValid(false);
    }
  };

  // Handlers for input changes
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    validateEmail(value);
    handleValidation();
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    validatePassword(value);
    handleValidation();
  };

  // If searchParams is still loading, show a loading state
  if (!searchParams) {
    return (
      <div className="flex h-screen w-full flex-1 items-center justify-center gap-2 p-4 sm:max-w-md">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <form className="mx-auto flex min-w-64 max-w-64 flex-col">
        <h1 className="text-2xl font-medium">Sign up</h1>
        <p className="text text-sm text-foreground">
          Already have an account?{' '}
          <Link className="font-medium text-primary underline" href="/sign-in">
            Sign in
          </Link>
        </p>
        <div className="mt-8 flex flex-col gap-2 [&>input]:mb-3">
          {/* Email Input */}
          <Label htmlFor="email">Email</Label>
          <Input
            name="email"
            placeholder="you@example.com"
            value={email}
            onChange={handleEmailChange}
            required
          />
          {emailError && <p className="text-sm text-red-500">{emailError}</p>}

          {/* Password Input */}
          <Label htmlFor="password">Password</Label>
          <Input
            type="password"
            name="password"
            placeholder="Your password"
            value={password}
            onChange={handlePasswordChange}
            minLength={ minLength }
            required
          />
          {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}

          {/* Submit Button */}
          <SubmitButton
            formAction={signUpAction}
            pendingText="Signing up..."
            disabled={!isFormValid} // Disable button if form is invalid
          >
            Sign up
          </SubmitButton>

          {/* Feedback Message */}
          {searchParams && <FormMessage message={searchParams} />}
        </div>
      </form>
      <SmtpMessage />
    </>
  );
}
