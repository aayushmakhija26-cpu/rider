import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createDealerWithAdmin,
  findUserByEmail,
  updateBranding,
  getDealerByStripeCustomerId,
  updateDealerStripeSubscription,
} from './dealer.service';
import { prisma } from '@/src/lib/db';

// Mock the prisma client
vi.mock('@/src/lib/db', () => ({
  prisma: {
    $transaction: vi.fn(),
    dealerUser: {
      findFirst: vi.fn(),
    },
    dealer: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('dealer.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createDealerWithAdmin', () => {
    it('creates a Dealer and DEALER_ADMIN DealerUser in a transaction', async () => {
      const mockDealer = {
        id: 'dealer-123',
        name: 'Test Dealership',
        email: 'admin@test.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        logoUrl: null,
        primaryColour: null,
        secondaryColour: null,
        contactPhone: null,
        contactEmail: null,
        websiteUrl: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        stripeProductId: null,
        planName: null,
        subscriptionStatus: null,
        simulationMode: false,
      };

      const mockUser = {
        id: 'user-123',
        dealerId: 'dealer-123',
        email: 'admin@test.com',
        passwordHash: 'hashed_password',
        name: null,
        role: 'DEALER_ADMIN' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.$transaction).mockResolvedValueOnce({
        dealer: mockDealer,
        user: mockUser,
      });

      const result = await createDealerWithAdmin(
        'admin@test.com',
        'Test Dealership',
        'hashed_password'
      );

      expect(result.dealer).toEqual(mockDealer);
      expect(result.user).toEqual(mockUser);
      expect(result.user.role).toBe('DEALER_ADMIN');
      expect(result.user.dealerId).toBe(result.dealer.id);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('returns dealer and user with correct relationship', async () => {
      const mockDealer = {
        id: 'dealer-456',
        name: 'Premium Auto',
        email: 'admin@premium.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        logoUrl: null,
        primaryColour: null,
        secondaryColour: null,
        contactPhone: null,
        contactEmail: null,
        websiteUrl: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        stripeProductId: null,
        planName: null,
        subscriptionStatus: null,
        simulationMode: false,
      };

      const mockUser = {
        id: 'user-456',
        dealerId: 'dealer-456',
        email: 'admin@premium.com',
        passwordHash: 'hashed_pass_456',
        name: null,
        role: 'DEALER_ADMIN' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.$transaction).mockResolvedValueOnce({
        dealer: mockDealer,
        user: mockUser,
      });

      const result = await createDealerWithAdmin(
        'admin@premium.com',
        'Premium Auto',
        'hashed_pass_456'
      );

      expect(result.dealer.id).toBe(mockUser.dealerId);
      expect(result.user.dealerId).toBe(result.dealer.id);
    });
  });

  describe('findUserByEmail', () => {
    it('returns a DealerUser when email exists', async () => {
      const mockUser = {
        id: 'user-existing',
        dealerId: 'dealer-123',
        email: 'existing@test.com',
        passwordHash: 'hash',
        name: 'John Doe',
        role: 'DEALER_ADMIN' as const,
        inviteTokenHash: null,
        inviteExpiresAt: null,
        invitedAt: null,
        acceptedAt: null,
        deactivatedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.dealerUser.findFirst).mockResolvedValueOnce(mockUser);

      const result = await findUserByEmail('existing@test.com');

      expect(result).toEqual(mockUser);
      expect(prisma.dealerUser.findFirst).toHaveBeenCalledWith({
        where: { email: 'existing@test.com' },
      });
    });

    it('returns null when email does not exist', async () => {
      vi.mocked(prisma.dealerUser.findFirst).mockResolvedValueOnce(null);

      const result = await findUserByEmail('nonexistent@test.com');

      expect(result).toBeNull();
      expect(prisma.dealerUser.findFirst).toHaveBeenCalledWith({
        where: { email: 'nonexistent@test.com' },
      });
    });
  });

  describe('updateBranding', () => {
    it('should update dealer branding fields', async () => {
      const mockDealer = {
        id: 'dealer-123',
        name: 'Test Dealership',
        email: 'test@test.com',
        logoUrl: 'https://example.com/logo.png',
        primaryColour: '#0066CC',
        secondaryColour: null,
        contactPhone: '+1 555-1234',
        contactEmail: 'support@test.com',
        websiteUrl: 'https://example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        stripeProductId: null,
        planName: null,
        subscriptionStatus: null,
        simulationMode: false,
      };

      vi.mocked(prisma.dealer.findUnique).mockResolvedValueOnce(mockDealer);
      vi.mocked(prisma.dealer.update).mockResolvedValueOnce(mockDealer);

      const result = await updateBranding(
        'dealer-123',
        'https://example.com/logo.png',
        '#0066CC',
        '+1 555-1234',
        'support@test.com',
        'https://example.com'
      );

      expect(result.logoUrl).toBe('https://example.com/logo.png');
      expect(result.primaryColour).toBe('#0066CC');
      expect(result.contactPhone).toBe('+1 555-1234');
      expect(result.contactEmail).toBe('support@test.com');
      expect(result.websiteUrl).toBe('https://example.com');
      expect(prisma.dealer.update).toHaveBeenCalled();
    });

    it('should handle partial updates (only colour)', async () => {
      const mockDealer = {
        id: 'dealer-456',
        name: 'Another Dealership',
        email: 'another@test.com',
        logoUrl: null,
        primaryColour: '#0066CC',
        secondaryColour: null,
        contactPhone: null,
        contactEmail: null,
        websiteUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        stripeProductId: null,
        planName: null,
        subscriptionStatus: null,
        simulationMode: false,
      };

      vi.mocked(prisma.dealer.findUnique).mockResolvedValueOnce(mockDealer);
      vi.mocked(prisma.dealer.update).mockResolvedValueOnce(mockDealer);

      const result = await updateBranding('dealer-456', undefined, '#0066CC');

      expect(result.primaryColour).toBe('#0066CC');
      expect(result.logoUrl).toBeNull();
      expect(prisma.dealer.update).toHaveBeenCalled();
    });

    it('should handle empty strings as undefined', async () => {
      const mockDealer = {
        id: 'dealer-789',
        name: 'Test',
        email: 'test@test.com',
        logoUrl: null,
        primaryColour: null,
        secondaryColour: null,
        contactPhone: null,
        contactEmail: null,
        websiteUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        stripeProductId: null,
        planName: null,
        subscriptionStatus: null,
        simulationMode: false,
      };

      vi.mocked(prisma.dealer.findUnique).mockResolvedValueOnce(mockDealer);

      const result = await updateBranding('dealer-789', '', '', '', '', '');

      expect(result.logoUrl).toBeNull();
      expect(result.primaryColour).toBeNull();
      expect(prisma.dealer.update).not.toHaveBeenCalled();
    });
  });

  describe('getDealerByStripeCustomerId', () => {
    const mockDealer = {
      id: 'dealer-123',
      name: 'Test Dealership',
      email: 'admin@test.com',
      logoUrl: null,
      primaryColour: null,
      secondaryColour: null,
      contactPhone: null,
      contactEmail: null,
      websiteUrl: null,
      stripeCustomerId: 'cus_test123',
      stripeSubscriptionId: 'sub_test123',
      stripeProductId: 'prod_test123',
      planName: 'Base',
      subscriptionStatus: 'active',
      simulationMode: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('returns the matching Dealer record when found', async () => {
      vi.mocked(prisma.dealer.findUnique).mockResolvedValueOnce(mockDealer);

      const result = await getDealerByStripeCustomerId('cus_test123');

      expect(result).toEqual(mockDealer);
      expect(prisma.dealer.findUnique).toHaveBeenCalledWith({
        where: { stripeCustomerId: 'cus_test123' },
      });
    });

    it('returns null when no dealer matches the customer ID', async () => {
      vi.mocked(prisma.dealer.findUnique).mockResolvedValueOnce(null);

      const result = await getDealerByStripeCustomerId('cus_unknown');

      expect(result).toBeNull();
      expect(prisma.dealer.findUnique).toHaveBeenCalledWith({
        where: { stripeCustomerId: 'cus_unknown' },
      });
    });
  });

  describe('updateDealerStripeSubscription', () => {
    const mockUpdatedDealer = {
      id: 'dealer-123',
      name: 'Test Dealership',
      email: 'admin@test.com',
      logoUrl: null,
      primaryColour: null,
      secondaryColour: null,
      contactPhone: null,
      contactEmail: null,
      websiteUrl: null,
      stripeCustomerId: 'cus_test123',
      stripeSubscriptionId: 'sub_test123',
      stripeProductId: 'prod_test123',
      planName: 'Base',
      subscriptionStatus: 'active',
      simulationMode: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('updates all billing fields and returns the updated Dealer', async () => {
      vi.mocked(prisma.dealer.update).mockResolvedValueOnce(mockUpdatedDealer);

      const result = await updateDealerStripeSubscription('dealer-123', {
        stripeCustomerId: 'cus_test123',
        stripeSubscriptionId: 'sub_test123',
        stripeProductId: 'prod_test123',
        planName: 'Base',
        subscriptionStatus: 'active',
      });

      expect(result).toEqual(mockUpdatedDealer);
      expect(prisma.dealer.update).toHaveBeenCalledWith({
        where: { id: 'dealer-123' },
        data: {
          stripeCustomerId: 'cus_test123',
          stripeSubscriptionId: 'sub_test123',
          stripeProductId: 'prod_test123',
          planName: 'Base',
          subscriptionStatus: 'active',
        },
      });
    });

    it('calling twice with same data produces the same result (idempotency)', async () => {
      vi.mocked(prisma.dealer.update)
        .mockResolvedValueOnce(mockUpdatedDealer)
        .mockResolvedValueOnce(mockUpdatedDealer);

      const data = {
        stripeCustomerId: 'cus_test123',
        stripeSubscriptionId: 'sub_test123',
        subscriptionStatus: 'active',
      };

      const first = await updateDealerStripeSubscription('dealer-123', data);
      const second = await updateDealerStripeSubscription('dealer-123', data);

      expect(first).toEqual(second);
      expect(prisma.dealer.update).toHaveBeenCalledTimes(2);
    });

    it('can null out subscription fields for cancellation', async () => {
      const cancelledDealer = { ...mockUpdatedDealer, stripeSubscriptionId: null, stripeProductId: null, planName: null, subscriptionStatus: 'canceled' };
      vi.mocked(prisma.dealer.update).mockResolvedValueOnce(cancelledDealer);

      const result = await updateDealerStripeSubscription('dealer-123', {
        stripeSubscriptionId: null,
        stripeProductId: null,
        planName: null,
        subscriptionStatus: 'canceled',
      });

      expect(result.stripeSubscriptionId).toBeNull();
      expect(result.subscriptionStatus).toBe('canceled');
    });
  });
});
