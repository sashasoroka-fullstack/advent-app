-- Local-dev helper: drop quest tables so TypeORM synchronize can recreate them.
-- Does not touch media. Same effect as `npm run db:reset-quests`.

DROP TABLE IF EXISTS quest_step CASCADE;
DROP TABLE IF EXISTS quest CASCADE;
