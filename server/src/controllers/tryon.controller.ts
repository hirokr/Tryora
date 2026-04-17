import { getTryon } from '#src/services/tryon.service.ts';
import { AuthRequest, Response } from '#src/types/authRequest.js';

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
    return res.status(500).json({
      message: 'failed to fetch tryons ',
    });
  }
}
