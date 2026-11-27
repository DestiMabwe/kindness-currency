import { z } from 'zod'

export const DISPLAY_NAME_MAX_LENGTH = 60

export const DisplayNameSchema = z
  .string()
  .trim()
  .min(1, 'Enter your name ♥')
  .max(DISPLAY_NAME_MAX_LENGTH, `Names can be up to ${DISPLAY_NAME_MAX_LENGTH} characters.`)
