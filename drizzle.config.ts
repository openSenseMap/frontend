import * as dotenv from 'dotenv'
import { type Config } from 'drizzle-kit'
dotenv.config()

export default {
	schema: './app/db/schema/**/*.ts',
	out: './app/db/drizzle',
	dialect: 'postgresql',
	dbCredentials: {
		url: process.env.DATABASE_URL!,
	},
} satisfies Config
