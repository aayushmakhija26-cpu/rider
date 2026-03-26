import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as onboardingStepService from './onboardingStep.service';
import { prisma } from '@/src/lib/db';

vi.mock('@/src/lib/db', () => ({
  prisma: {
    onboardingStep: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    dealer: {
      findUnique: vi.fn(),
    },
  },
}));

describe('onboardingStepService', () => {
  const dealerId = 'test-dealer-123';
  const stepName = 'branding';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSteps', () => {
    it('should return all steps for a dealer ordered by createdAt', async () => {
      const mockSteps = [
        {
          id: '1',
          dealerId,
          stepName: 'branding',
          status: 'pending' as const,
          data: null,
          completedAt: null,
          skippedAt: null,
          createdAt: new Date('2026-03-25'),
          updatedAt: new Date('2026-03-25'),
        },
      ];

      vi.mocked(prisma.onboardingStep.findMany).mockResolvedValue(mockSteps);

      const result = await onboardingStepService.getSteps(dealerId);

      expect(result).toEqual(mockSteps);
      expect(prisma.onboardingStep.findMany).toHaveBeenCalledWith({
        where: { dealerId },
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('getStep', () => {
    it('should return a specific step by dealer and step name', async () => {
      const mockStep = {
        id: '1',
        dealerId,
        stepName,
        status: 'pending' as const,
        data: null,
        completedAt: null,
        skippedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.onboardingStep.findUnique).mockResolvedValue(mockStep);

      const result = await onboardingStepService.getStep(dealerId, stepName);

      expect(result).toEqual(mockStep);
      expect(prisma.onboardingStep.findUnique).toHaveBeenCalledWith({
        where: { dealerId_stepName: { dealerId, stepName } },
      });
    });

    it('should return null when step does not exist', async () => {
      vi.mocked(prisma.onboardingStep.findUnique).mockResolvedValue(null);

      const result = await onboardingStepService.getStep(dealerId, stepName);

      expect(result).toBeNull();
    });
  });

  describe('updateStep', () => {
    it('should create a new step with pending status', async () => {
      const mockStep = {
        id: '1',
        dealerId,
        stepName,
        status: 'pending' as const,
        data: null,
        completedAt: null,
        skippedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.dealer.findUnique).mockResolvedValueOnce({ id: dealerId } as never);
      vi.mocked(prisma.onboardingStep.upsert).mockResolvedValue(mockStep);

      const result = await onboardingStepService.updateStep(
        dealerId,
        stepName,
        'pending'
      );

      expect(result).toEqual(mockStep);
      expect(prisma.onboardingStep.upsert).toHaveBeenCalled();
    });

    it('should set completedAt when status is complete', async () => {
      const now = new Date();
      const mockStep = {
        id: '1',
        dealerId,
        stepName,
        status: 'complete' as const,
        data: null,
        completedAt: now,
        skippedAt: null,
        createdAt: new Date(),
        updatedAt: now,
      };

      vi.mocked(prisma.dealer.findUnique).mockResolvedValueOnce({ id: dealerId } as never);
      vi.mocked(prisma.onboardingStep.upsert).mockResolvedValue(mockStep);

      const result = await onboardingStepService.updateStep(
        dealerId,
        stepName,
        'complete'
      );

      expect(result.status).toBe('complete');
      expect(result.completedAt).toBeDefined();
    });

    it('should handle step data with optional data parameter', async () => {
      const stepData = { logoUrl: 'https://example.com/logo.png' };
      const mockStep = {
        id: '1',
        dealerId,
        stepName,
        status: 'pending' as const,
        data: stepData,
        completedAt: null,
        skippedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.dealer.findUnique).mockResolvedValueOnce({ id: dealerId } as never);
      vi.mocked(prisma.onboardingStep.upsert).mockResolvedValue(mockStep);

      const result = await onboardingStepService.updateStep(
        dealerId,
        stepName,
        'pending',
        stepData
      );

      expect(result.data).toEqual(stepData);
    });
  });

  describe('allStepsComplete', () => {
    it('should return true when all required steps are complete', async () => {
      const mockSteps = [
        {
          id: '1',
          dealerId,
          stepName: 'branding',
          status: 'complete' as const,
          data: null,
          completedAt: new Date(),
          skippedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          dealerId,
          stepName: 'dms',
          status: 'complete' as const,
          data: null,
          completedAt: new Date(),
          skippedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '3',
          dealerId,
          stepName: 'staff',
          status: 'complete' as const,
          data: null,
          completedAt: new Date(),
          skippedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '4',
          dealerId,
          stepName: 'billing',
          status: 'complete' as const,
          data: null,
          completedAt: new Date(),
          skippedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.onboardingStep.findMany).mockResolvedValue(mockSteps);

      const result = await onboardingStepService.allStepsComplete(dealerId);

      expect(result).toBe(true);
    });

    it('should return false when not all required steps are complete', async () => {
      const mockSteps = [
        {
          id: '1',
          dealerId,
          stepName: 'branding',
          status: 'pending' as const,
          data: null,
          completedAt: null,
          skippedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.onboardingStep.findMany).mockResolvedValue(mockSteps);

      const result = await onboardingStepService.allStepsComplete(dealerId);

      expect(result).toBe(false);
    });
  });
});
