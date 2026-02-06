import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

export const BASE_URL = 'http://localhost:4200'

afterEach(() => {
	cleanup()
})
