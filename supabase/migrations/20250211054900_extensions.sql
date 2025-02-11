-- Enable extensions that are not already enabled by default

-- For storing and querying JSON data (useful for prompt and response storage)
CREATE EXTENSION IF NOT EXISTS "pg_jsonschema";

-- For advanced text search capabilities (useful for prompt searching and analytics)
--CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- For efficient storage and indexing of high-dimensional vectors (useful for semantic search)
CREATE EXTENSION IF NOT EXISTS "vector";

-- For advanced statistical analysis (useful for analytics dashboard)
CREATE EXTENSION IF NOT EXISTS "tablefunc";

-- For testing
CREATE EXTENSION IF NOT EXISTS "pgtap";

-- For email checking, etc.
--CREATE EXTENSION IF NOT EXISTS "citext";

-- to send HTTP requests to our edge functions
--create EXTENSION IF NOT EXISTS pg_net;

-- The following extensions are enabled (they should be by default in Supabase)
---- CREATE EXTENSION IF NOT EXISTS "pgcrypto";
---- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
---- CREATE EXTENSION IF NOT EXISTS "pgjwt";
---- CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

COMMENT ON EXTENSION "pg_jsonschema" IS 'Enables JSON Schema validation for prompt and response data';
--COMMENT ON EXTENSION "pg_trgm" IS 'Provides trigram matching for efficient text search in prompts and responses';
COMMENT ON EXTENSION "vector" IS 'Supports vector operations for semantic search and analysis of prompts and responses';
COMMENT ON EXTENSION "tablefunc" IS 'Enables advanced SQL functions for complex analytics queries';
COMMENT ON EXTENSION "pgcrypto" IS 'Provides cryptographic functions for secure data handling';
COMMENT ON EXTENSION "uuid-ossp" IS 'Generates UUIDs for unique identifiers in the data model';
COMMENT ON EXTENSION "pgjwt" IS 'Supports JWT operations for authentication and authorization';
COMMENT ON EXTENSION "pg_stat_statements" IS 'Tracks planning and execution statistics for performance monitoring';
COMMENT ON EXTENSION "pgtap" IS 'Used to test the Database entities';
--COMMENT ON EXTENSION "pg_net" IS 'Used to send HTTP requests to our edge functions';
