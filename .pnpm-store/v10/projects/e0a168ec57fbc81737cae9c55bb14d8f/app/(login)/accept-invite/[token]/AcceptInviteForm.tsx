'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AcceptInviteFormProps {
  token: string;
  email: string;
}

interface FormErrors {
  name?: string[];
  password?: string[];
  confirmPassword?: string[];
  general?: string;
}

export function AcceptInviteForm({ token, email }: AcceptInviteFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const res = await fetch(`/api/staff-invites/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'VALIDATION_ERROR') {
          setErrors(data.details?.fieldErrors ?? {});
        } else if (data.code === 'INVITE_EXPIRED') {
          setErrors({ general: 'This invite link has expired. Please ask your admin to send a new invite.' });
        } else if (data.code === 'INVALID_INVITE') {
          setErrors({ general: 'This invite link is no longer valid.' });
        } else {
          setErrors({ general: data.error ?? 'An error occurred. Please try again.' });
        }
        return;
      }

      router.push('/dashboard');
    } catch {
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.general && (
        <div className="p-3 bg-red-50 text-red-800 rounded-md text-sm">
          {errors.general}
        </div>
      )}

      <div>
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          value={email}
          disabled
          className="bg-gray-50 text-gray-500"
        />
        <p className="mt-1 text-xs text-gray-500">Your invite email — cannot be changed</p>
      </div>

      <div>
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="Jane Smith"
          value={formData.name}
          onChange={handleChange}
          disabled={isLoading}
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name[0]}</p>
        )}
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Create a password"
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
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Re-enter your password"
          value={formData.confirmPassword}
          onChange={handleChange}
          disabled={isLoading}
          className={errors.confirmPassword ? 'border-red-500' : ''}
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">{errors.confirmPassword[0]}</p>
        )}
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Activating account...' : 'Activate account'}
      </Button>
    </form>
  );
}
