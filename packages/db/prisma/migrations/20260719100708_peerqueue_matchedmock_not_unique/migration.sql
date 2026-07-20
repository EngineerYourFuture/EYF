-- A matched peer pair is two queue rows referencing the same mock session,
-- so matchedMockId must not be unique. (IF EXISTS: local dev DBs may have had
-- the index dropped manually before this migration was recorded.)
DROP INDEX IF EXISTS "peer_queue_matchedMockId_key";
