'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FormErrors {
  email?: string[];
  password?: string[];
  passwordConfirm?: string[];
  dealershipName?: string[];
  general?: string;
}

export function RegistrationForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    dealershipName: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const res = await fetch('/api/dealers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'VALIDATION_ERROR') {
          setErrors(data.details?.fieldErrors || {});
        } else if (data.code === 'CONFLICT') {
          setErrors({ email: [data.error] });
        } else {
          setErrors({ general: data.error || 'An error occurred' });
        }
        return;
      }

      // Registration successful - redirect to onboarding
      router.push('/dealer/onboarding');
    } catch (err) {
      console.error('Registration error:', err);
      setErrors({ general: 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
      {errors.general && (
        <div className="p-3 bg-red-50 text-red-800 rounded-md text-sm">
          {errors.general}
        </div>
      )}

      <div>
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="admin@dealership.com"
          value={formData.email}
          onChange={handleChange}
          disabled={isLoading}
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email[0]}</p>
        )}
      </div>

      <div>
        <Label htmlFor="dealershipName">Dealership Name</Label>
        <Input
          id="dealershipName"
          name="dealershipName"
          type="text"
          placeholder="Grand Auto Group"
          value={formData.dealershipName}
          onChange={handleChange}
          disabled={isLoading}
          className={errors.dealershipName ? 'border-red-500' : ''}
        />
        {errors.dealershipName && (
          <p className="mt-1 text-sm text-red-600">{errors.dealershipName[0]}</p>
        )}
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleChange}
          disabled={isLoading}
          className={errors.password ? 'border-red-500' : ''}
        />
        <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password[0]}</p>
        )}
      </div>

      <div>
        <Label htmlFor="passwordConfirm">Confirm Password</Label>
        <Input
          id="passwordConfirm"
          name="passwordConfirm"
          type="password"
          placeholder="Re-enter your password"
          value={formData.passwordConfirm}
          onChange={handleChange}
          disabled={isLoading}
          className={errors.passwordConfirm ? 'border-red-500' : ''}
        />
        {errors.passwordConfirm && (
          <p className="mt-1 text-sm text-red-600">{errors.passwordConfirm[0]}</p>
        )}
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Registering...' : 'Register'}
      </Button>
    </form>
  );
}