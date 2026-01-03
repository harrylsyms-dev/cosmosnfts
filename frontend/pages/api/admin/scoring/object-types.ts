import type { NextApiRequest, NextApiResponse } from 'next';
import { validateAdmin } from '../../../../lib/adminAuth';
import { prisma } from '../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await validateAdmin(req);
  if (!admin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const rules = await prisma.objectTypeScoringRule.findMany({
        orderBy: { objectType: 'asc' },
      });

      res.json({ rules });
    } catch (error) {
      console.error('Failed to fetch object type rules:', error);
      res.status(500).json({ error: 'Failed to fetch object type rules' });
    }
  } else if (req.method === 'POST') {
    try {
      const {
        objectType,
        hasDistance = true,
        hasMass = true,
        hasAge = true,
        hasLuminosity = true,
        hasSize = true,
        hasTemperature = true,
        hasDiscovery = true,
        hasPapers = true,
        distanceLogMin,
        distanceLogMax,
        massLogMin,
        massLogMax,
        ageLogMin,
        ageLogMax,
        sizeLogMin,
        sizeLogMax,
        temperatureLogMin,
        temperatureLogMax,
        defaultMissingScore = 50,
      } = req.body;

      if (!objectType) {
        return res.status(400).json({ error: 'objectType is required' });
      }

      const rule = await prisma.objectTypeScoringRule.create({
        data: {
          objectType,
          hasDistance,
          hasMass,
          hasAge,
          hasLuminosity,
          hasSize,
          hasTemperature,
          hasDiscovery,
          hasPapers,
          distanceLogMin,
          distanceLogMax,
          massLogMin,
          massLogMax,
          ageLogMin,
          ageLogMax,
          sizeLogMin,
          sizeLogMax,
          temperatureLogMin,
          temperatureLogMax,
          defaultMissingScore,
        },
      });

      res.json({ success: true, rule });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        return res.status(400).json({ error: 'Object type rule already exists' });
      }
      console.error('Failed to create object type rule:', error);
      res.status(500).json({ error: 'Failed to create object type rule' });
    }
  } else if (req.method === 'PUT' || req.method === 'PATCH') {
    try {
      const { objectType, ...updates } = req.body;

      if (!objectType) {
        return res.status(400).json({ error: 'objectType is required' });
      }

      const rule = await prisma.objectTypeScoringRule.update({
        where: { objectType },
        data: updates,
      });

      res.json({ success: true, rule });
    } catch (error: any) {
      if (error?.code === 'P2025') {
        return res.status(404).json({ error: 'Object type rule not found' });
      }
      console.error('Failed to update object type rule:', error);
      res.status(500).json({ error: 'Failed to update object type rule' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { objectType } = req.body;

      if (!objectType) {
        return res.status(400).json({ error: 'objectType is required' });
      }

      await prisma.objectTypeScoringRule.delete({
        where: { objectType },
      });

      res.json({ success: true, message: `Deleted rule for ${objectType}` });
    } catch (error: any) {
      if (error?.code === 'P2025') {
        return res.status(404).json({ error: 'Object type rule not found' });
      }
      console.error('Failed to delete object type rule:', error);
      res.status(500).json({ error: 'Failed to delete object type rule' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
