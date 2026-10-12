import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { Media } from '../media/entities/media.entity';
import { Quest } from '../quests/entities/quest.entity';
import { QuestStep } from '../quests/entities/quest-step.entity';

loadEnv();

export default new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [Media, Quest, QuestStep],
    migrations: ['src/database/migrations/*.ts'],
    synchronize: false,
});
