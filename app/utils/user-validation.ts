import { z } from 'zod'

export const usernameSchema = z
	.string()
	.min(3, {
        error: 'Username is too short'
    })
	.max(20, {
        error: 'Username is too long'
    })
	.regex(/^[a-zA-Z0-9_]+$/, {
        error: 'Username can only include letters, numbers, and underscores'
    })

export const passwordSchema = z
	.string()
	.min(6, {
        error: 'Password is too short'
    })
	.max(100, {
        error: 'Password is too long'
    })

export const nameSchema = z
	.string()
	.min(3, {
        error: 'Name is too short'
    })
	.max(40, {
        error: 'Name is too long'
    })

export const emailSchema = z.email({
        error: 'Email is invalid'
    })
	.min(3, {
        error: 'Email is too short'
    })
	.max(100, {
        error: 'Email is too long'
    })
