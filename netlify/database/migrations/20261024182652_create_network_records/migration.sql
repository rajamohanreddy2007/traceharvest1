CREATE TABLE "network_records" (
	"collection" text,
	"id" text,
	"position" text NOT NULL,
	"payload" jsonb NOT NULL,
	CONSTRAINT "network_records_pkey" PRIMARY KEY("collection","id")
);
