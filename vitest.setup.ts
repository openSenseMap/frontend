import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { pg } from '~/db.server'

export const BASE_URL = 'http://localhost:4200'

afterEach(() => {
	cleanup()
})

afterAll(async () => {
	// prevent lingering connections from
	// blocking other test suites
	await pg.end()
})
