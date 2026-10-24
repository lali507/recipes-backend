// =====================================================================
// Controllers – מקבלים את הבקשה, מפעילים את ה-Service ומחזירים תשובה
// =====================================================================
import type { Request, Response } from 'express';
import { parseOrThrow } from '../../lib/validation';
import { currentUser } from '../../middleware/authorize';
import { loginSchema, registerSchema } from './auth.schemas';
import * as authService from './auth.service';

export async function register(req: Request, res: Response): Promise<void> {
  const input = parseOrThrow(registerSchema, req.body);
  const result = await authService.register(input);
  res.status(201).json(result);
}

export async function login(req: Request, res: Response): Promise<void> {
  const input = parseOrThrow(loginSchema, req.body);
  const result = await authService.login(input);
  res.status(200).json(result);
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await authService.getMe(currentUser(req).id);
  res.status(200).json({ user });
}
