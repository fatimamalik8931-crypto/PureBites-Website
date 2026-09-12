// =========================================================
//  Admin menu management API (Phase 7) — requireAdmin is applied
//  where these routers are mounted, in admin.routes.js.
//
//  GET    /api/admin/menu          every item, hidden ones included
//  POST   /api/admin/menu          create   → 201 { item }
//  PATCH  /api/admin/menu/:code    partial update → { item }
//  DELETE /api/admin/menu/:code    → { ok: true }
//
//  POST   /api/admin/uploads       raw image body (Content-Type image/jpeg|png|webp, ≤ 2 MB)
//                                  → 201 { url: "/uploads/<random>.jpg" }
//
//  The public site picks up changes on its next page load — it
//  already reads the menu from GET /api/menu.
// =========================================================

import express, { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { ApiError } from '../lib/ApiError.js';
import { MENU_CATEGORIES } from '../validators/menu.validators.js';
import {
  menuCodeParamsSchema,
  createMenuItemBodySchema,
  updateMenuItemBodySchema,
} from '../validators/adminDashboard.validators.js';
import * as adminMenu from '../services/adminMenu.service.js';
import { saveImage, MAX_UPLOAD_BYTES, UPLOAD_CONTENT_TYPES } from '../lib/uploads.js';

export const adminMenuRouter = Router();

adminMenuRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const items = await adminMenu.listMenuItems();
    res.json({ items, count: items.length, categories: MENU_CATEGORIES });
  }),
);

adminMenuRouter.post(
  '/',
  validate({ body: createMenuItemBodySchema }),
  asyncHandler(async (req, res) => {
    const item = await adminMenu.createMenuItem(req.valid.body, req.admin);
    res.status(201).json({ item });
  }),
);

adminMenuRouter.patch(
  '/:code',
  validate({ params: menuCodeParamsSchema, body: updateMenuItemBodySchema }),
  asyncHandler(async (req, res) => {
    const item = await adminMenu.updateMenuItem(req.valid.params.code, req.valid.body, req.admin);
    res.json({ item });
  }),
);

adminMenuRouter.delete(
  '/:code',
  validate({ params: menuCodeParamsSchema }),
  asyncHandler(async (req, res) => {
    await adminMenu.deleteMenuItem(req.valid.params.code, req.admin);
    res.json({ ok: true });
  }),
);

export const adminUploadRouter = Router();

const unsupported = () =>
  new ApiError(415, 'Please upload a JPEG, PNG or WebP image.', { code: 'UNSUPPORTED_MEDIA_TYPE' });

adminUploadRouter.post(
  '/',
  express.raw({ type: UPLOAD_CONTENT_TYPES, limit: MAX_UPLOAD_BYTES }),
  asyncHandler(async (req, res) => {
    // express.raw leaves req.body unset when the Content-Type isn't an allowed image.
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) throw unsupported();

    const url = await saveImage(req.body);
    if (!url) throw unsupported(); // bytes aren't really an image of an allowed type

    res.status(201).json({ url });
  }),
);
