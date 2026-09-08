// =========================================================
//  Public menu API
//
//  GET /api/menu                     all available items
//  GET /api/menu?category=burgers    filter by category
//  GET /api/menu?featured=true       only featured items
//  GET /api/menu/:id                 one item by its public id ("b1")
//
//  Item shape: { id, cat, name, price, tag, desc, img, featured }
//  Errors use the shared shape: { error: { message, code, details? } }
// =========================================================

import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { getPublicMenu, getPublicMenuItem } from '../services/menu.service.js';
import { menuListQuerySchema, menuItemParamsSchema } from '../validators/menu.validators.js';

export const menuRouter = Router();

// The menu changes rarely — let browsers/proxies reuse a response briefly.
const SHORT_CACHE = 'public, max-age=30';

// ---- List (with optional ?category= and ?featured=) ----
menuRouter.get(
  '/',
  validate({ query: menuListQuerySchema }),
  asyncHandler(async (req, res) => {
    const { category, featured } = req.valid.query;
    const items = await getPublicMenu({ category, featured });

    res.set('Cache-Control', SHORT_CACHE);
    res.json({
      items,
      count: items.length,
      filters: {
        category: category ?? null,
        featured: featured ?? null,
      },
    });
  }),
);

// ---- Single item by public id ----
menuRouter.get(
  '/:id',
  validate({ params: menuItemParamsSchema }),
  asyncHandler(async (req, res) => {
    const item = await getPublicMenuItem(req.valid.params.id);

    res.set('Cache-Control', SHORT_CACHE);
    res.json({ item });
  }),
);
