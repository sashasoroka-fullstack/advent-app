import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1756300000000 implements MigrationInterface {
    name = 'InitSchema1756300000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE media (
                id uuid PRIMARY KEY,
                original_filename varchar(512) NOT NULL,
                mime_type varchar(255) NOT NULL,
                size_bytes integer NOT NULL,
                storage_key varchar(1024) NOT NULL,
                width integer,
                height integer,
                alt_text text,
                created_by varchar(255),
                created_at timestamptz NOT NULL DEFAULT now(),
                updated_at timestamptz NOT NULL DEFAULT now()
            )
        `);
        await queryRunner.query(`
            CREATE TABLE quest (
                id serial PRIMARY KEY,
                name varchar(512) NOT NULL UNIQUE,
                slug varchar(512) NOT NULL UNIQUE,
                background_media_id uuid REFERENCES media (id) ON DELETE SET NULL,
                map_media_id uuid REFERENCES media (id) ON DELETE SET NULL,
                google_sheet_url varchar(2048),
                is_active boolean NOT NULL DEFAULT false,
                created_by varchar(255),
                created_at timestamptz NOT NULL DEFAULT now(),
                updated_at timestamptz NOT NULL DEFAULT now()
            )
        `);
        await queryRunner.query(`
            CREATE TABLE quest_step (
                id serial PRIMARY KEY,
                task_number integer NOT NULL,
                label varchar,
                color varchar,
                cy_step double precision NOT NULL,
                cx_step double precision NOT NULL,
                icon_media_id uuid REFERENCES media (id) ON DELETE SET NULL,
                size varchar NOT NULL,
                quest_id integer NOT NULL REFERENCES quest (id) ON DELETE CASCADE,
                created_at timestamptz NOT NULL DEFAULT now(),
                updated_at timestamptz NOT NULL DEFAULT now(),
                CONSTRAINT uq_quest_step_quest_task UNIQUE (quest_id, task_number)
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE IF EXISTS quest_step');
        await queryRunner.query('DROP TABLE IF EXISTS quest');
        await queryRunner.query('DROP TABLE IF EXISTS media');
    }
}
