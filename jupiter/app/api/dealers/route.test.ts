import { describe, it, expect } from 'vitest';
import { dealerRegistrationSchema } from '../../../src/schemas/registration';

describe('Zod Registration Schema', () => {
  it('accepts valid registration data', () => {
    const validData = {
      email: 'admin@dealership.com',
      password: 'SecurePass123!',
      passwordConfirm: 'SecurePass123!',
      dealershipName: 'Grand Auto Group',
    };

    const result = dealerRegistrationSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('admin@dealership.com');
      expect(result.data.dealershipName).toBe('Grand Auto Group');
    }
  });

  it('rejects invalid email', () => {
    const invalidData = {
      email: 'invalid-email',
      password: 'SecurePass123!',
      passwordConfirm: 'SecurePass123!',
      dealershipName: 'Test Dealership',
    };

    const result = dealerRegistrationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('rejects password shorter than 8 characters', () => {
    const invalidData = {
      email: 'admin@test.com',
      password: 'short',
      passwordConfirm: 'short',
      dealershipName: 'Test Dealership',
    };

    const result = dealerRegistrationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('rejects empty dealership name', () => {
    const invalidData = {
      email: 'admin@test.com',
      password: 'SecurePass123!',
      passwordConfirm: 'SecurePass123!',
      dealershipName: '',
    };

    const result = dealerRegistrationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('rejects dealership name longer than 255 characters', () => {
    const invalidData = {
      email: 'admin@test.com',
      password: 'SecurePass123!',
      passwordConfirm: 'SecurePass123!',
      dealershipName: 'A'.repeat(256),
    };

    const result = dealerRegistrationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
