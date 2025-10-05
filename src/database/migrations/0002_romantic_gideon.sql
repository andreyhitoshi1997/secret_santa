ALTER TABLE "sessions" ALTER COLUMN "secret_token" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "secret_token" SET DEFAULT gen_random_uuid();