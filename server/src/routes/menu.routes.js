// =========================================================
//  GET /api/menu
//  Returns the public menu for the frontend to render.
//  Response: { items: [ { id, cat, name, price, tag, desc, img } ], count }
// =========================================================

import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { getPublicMenu } from '../services/menu.service.js';

export const menuRouter = Router();

menuRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const items = await getPublicMenu();

    // Small cache: the menu changes rarely. Browsers/proxies may reuse
    // the response for 30s, which softens traffic spikes.
    res.set('Cache-Control', 'public, max-age=30');
    res.json({ items, count: items.length });
  }),
);
