import type { NextApiRequest, NextApiResponse } from 'next';
import { validateAdmin } from '../../../../lib/adminAuth';
import { prisma } from '../../../../lib/prisma';

// Default scoring config values
const DEFAULT_CONFIG = {
  id: 'main',
  activeSystem: 'EQUAL',
  basePricePerPoint: 0.10,
  distanceWeight: 62.5,
  massWeight: 62.5,
  ageWeight: 62.5,
  luminosityWeight: 62.5,
  sizeWeight: 62.5,
  temperatureWeight: 62.5,
  discoveryWeight: 62.5,
  papersWeight: 62.5,
  primaryMetrics: '["distance","mass","age","luminosity","size"]',
  distanceLogMin: 1,
  distanceLogMax: 13000000000,
  massLogMin: 0.00000001,
  massLogMax: 100000000000,
  ageLogMin: 1,
  ageLogMax: 14000000000,
  sizeLogMin: 1,
  sizeLogMax: 100000000000000,
  temperatureLogMin: 3,
  temperatureLogMax: 1000000000,
  papersLogMin: 1,
  papersLogMax: 100000,
  discoveryYearMin: 1600,
  discoveryYearMax: 2025,
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await validateAdmin(req);
  if (!admin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      let config = await prisma.scoringConfig.findUnique({
        where: { id: 'main' },
      });

      if (!config) {
        // Create default config
        config = await prisma.scoringConfig.create({
          data: DEFAULT_CONFIG,
        });
      }

      res.json({ config });
    } catch (error) {
      console.error('Failed to fetch scoring config:', error);
      res.status(500).json({ error: 'Failed to fetch scoring config' });
    }
  } else if (req.method === 'PUT' || req.method === 'PATCH') {
    try {
      const updates = req.body;

      // Validate activeSystem if provided
      if (updates.activeSystem && !['EQUAL', 'PRIMARY_FIVE', 'WEIGHTED'].includes(updates.activeSystem)) {
        return res.status(400).json({ error: 'Invalid activeSystem. Must be EQUAL, PRIMARY_FIVE, or WEIGHTED' });
      }

      // Validate basePricePerPoint if provided
      if (updates.basePricePerPoint !== undefined) {
        const price = parseFloat(updates.basePricePerPoint);
        if (isNaN(price) || price < 0) {
          return res.status(400).json({ error: 'basePricePerPoint must be a non-negative number' });
        }
        updates.basePricePerPoint = price;
      }

      // Validate primaryMetrics if provided (should be JSON array of strings)
      if (updates.primaryMetrics !== undefined) {
        try {
          const metrics = JSON.parse(updates.primaryMetrics);
          if (!Array.isArray(metrics) || metrics.length !== 5) {
            return res.status(400).json({ error: 'primaryMetrics must be a JSON array of exactly 5 metric names' });
          }
          const validMetrics = ['distance', 'mass', 'age', 'luminosity', 'size', 'temperature', 'discovery', 'papers'];
          for (const m of metrics) {
            if (!validMetrics.includes(m)) {
              return res.status(400).json({ error: `Invalid metric: ${m}. Valid metrics: ${validMetrics.join(', ')}` });
            }
          }
        } catch {
          return res.status(400).json({ error: 'primaryMetrics must be valid JSON' });
        }
      }

      // Validate weights if WEIGHTED system is being used
      if (updates.activeSystem === 'WEIGHTED') {
        const weightFields = ['distanceWeight', 'massWeight', 'ageWeight', 'luminosityWeight', 'sizeWeight', 'temperatureWeight', 'discoveryWeight', 'papersWeight'];
        let totalWeight = 0;

        // Get existing config to calculate total
        const existing = await prisma.scoringConfig.findUnique({ where: { id: 'main' } });

        for (const field of weightFields) {
          const value = updates[field] !== undefined ? updates[field] : (existing as any)?.[field] ?? DEFAULT_CONFIG[field as keyof typeof DEFAULT_CONFIG];
          totalWeight += parseFloat(value) || 0;
        }

        // Allow some tolerance for floating point
        if (Math.abs(totalWeight - 500) > 0.1) {
          return res.status(400).json({
            error: `Weights must sum to 500 for WEIGHTED system. Current sum: ${totalWeight.toFixed(2)}`
          });
        }
      }

      const config = await prisma.scoringConfig.upsert({
        where: { id: 'main' },
        update: updates,
        create: {
          ...DEFAULT_CONFIG,
          ...updates,
        },
      });

      res.json({ success: true, config });
    } catch (error) {
      console.error('Failed to update scoring config:', error);
      res.status(500).json({ error: 'Failed to update scoring config' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
