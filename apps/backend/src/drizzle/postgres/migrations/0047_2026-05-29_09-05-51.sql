CREATE TABLE IF NOT EXISTS "givens" (
	"given_full_id" varchar(64) PRIMARY KEY NOT NULL,
	"project_id" varchar(32) NOT NULL,
	"given_id" varchar(32) NOT NULL,
	"type" varchar NOT NULL,
	"st" json NOT NULL,
	"lt" json NOT NULL,
	"key_tag" text,
	"server_ts" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roles" (
	"role_full_id" varchar(64) PRIMARY KEY NOT NULL,
	"project_id" varchar(32) NOT NULL,
	"role_id" varchar(32) NOT NULL,
	"st" json NOT NULL,
	"lt" json NOT NULL,
	"key_tag" text,
	"server_ts" bigint NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_givens_server_ts" ON "givens" USING btree ("server_ts");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_givens_project_id" ON "givens" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_givens_given_id" ON "givens" USING btree ("given_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_givens_key_tag" ON "givens" USING btree ("key_tag");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uidx_givens_project_id_given_id" ON "givens" USING btree ("project_id","given_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_roles_server_ts" ON "roles" USING btree ("server_ts");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_roles_project_id" ON "roles" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_roles_role_id" ON "roles" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_roles_key_tag" ON "roles" USING btree ("key_tag");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uidx_roles_project_id_role_id" ON "roles" USING btree ("project_id","role_id");