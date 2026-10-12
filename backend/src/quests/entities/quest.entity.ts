import { Media } from 'src/media/entities/media.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn, } from 'typeorm';
import { QuestStep } from './quest-step.entity';
@Entity()
export class Quest {
    @PrimaryGeneratedColumn()
    id: number;
    @Column({ type: 'varchar', length: 512, unique: true })
    name: string;
    @Column({ type: 'varchar', length: 512, unique: true })
    slug: string;
    @Column({ name: 'background_media_id', type: 'uuid', nullable: true })
    backgroundMediaId: string | null;
    @ManyToOne(() => Media, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'background_media_id' })
    backgroundMedia: Media | null;
    @Column({ name: 'map_media_id', type: 'uuid', nullable: true })
    mapMediaId: string | null;
    @ManyToOne(() => Media, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'map_media_id' })
    mapMedia: Media | null;
    @Column({ name: 'google_sheet_url', type: 'varchar', length: 2048, nullable: true })
    googleSheetUrl: string | null;
    @Column({ name: 'is_active', type: 'boolean', default: false })
    isActive: boolean;

    @Column({ name: 'created_by', type: 'varchar', length: 255, nullable: true })
    createdBy: string | null;
    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;
    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
    @OneToMany(() => QuestStep, (step) => step.quest)
    steps: QuestStep[];
}
