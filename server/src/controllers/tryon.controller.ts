import { deleteTryOn, getTryOnById, getTryon, getTryOnsByUserId } from '#src/services/tryon.service.ts';
import { AuthRequest, Response } from '#src/types/authRequest.js';

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] || '';
  }

  return typeof value === 'string' ? value : '';
}

export async function discoverTryOns(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { limit = 20, skip = 0 } = req.query;

    const tryons = await getTryon(Number(limit), Number(skip));

    res.status(200).json({
      status: 'success',
      results: tryons.length,
      data: tryons,
    });
  } catch (error) {
    console.log(error);
    
    return res.status(500).json({
      message: 'failed to fetch tryons ',
    });
  }
}

export async function getTryOnsByUserIdController(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = firstParam(req.params.userId);

    if (!userId || userId !== req.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const tryons = await getTryOnsByUserId(userId);

    return res.status(200).json({
      status: 'success',
      results: tryons.length,
      data: tryons,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'failed to fetch user tryons',
    });
  }
}

export async function getTryOnByIdController(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const tryonId = firstParam(req.params.tryonId);

    if (!tryonId) {
      return res.status(400).json({ message: 'Invalid tryonId' });
    }

    const tryon = await getTryOnById(tryonId);

    if (!tryon) {
      return res.status(404).json({ message: 'Try-on not found' });
    }

    if (tryon.userId !== req.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    return res.status(200).json({
      status: 'success',
      data: tryon,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'failed to fetch try-on',
    });
  }
}

export async function getPublicTryOnByIdController(req: AuthRequest, res: Response) {
  try {
    const tryonId = firstParam(req.params.tryonId);

    if (!tryonId) {
      return res.status(400).json({ message: 'Invalid tryonId' });
    }

    const tryon = await getTryOnById(tryonId);

    if (!tryon) {
      return res.status(404).json({ message: 'Try-on not found' });
    }

    return res.status(200).json({
      status: 'success',
      data: tryon,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'failed to fetch public try-on',
    });
  }
}

export async function deleteTryOnByIdController(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const tryonId = firstParam(req.params.tryonId);

    if (!tryonId) {
      return res.status(400).json({ message: 'Invalid tryonId' });
    }

    const tryon = await getTryOnById(tryonId);

    if (!tryon) {
      return res.status(404).json({ message: 'Try-on not found' });
    }

    if (tryon.userId !== req.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await deleteTryOn(tryonId);

    return res.status(200).json({
      status: 'success',
      message: 'Try-on deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'failed to delete try-on',
    });
  }
}
