import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn, } from 'typeorm';
import { Media } from 'src/media/entities/media.entity';
import { Quest } from './quest.entity';
@Entity('quest_step')
@Unique(['quest', 'taskNumber'])
export class QuestStep {
    @PrimaryGeneratedColumn()
    id: number;
    @Column({ name: 'task_number', type: 'int' })
    taskNumber: number;
    @Column({ type: 'varchar', nullable: true })
    label: string | null;
    @Column({ type: 'varchar', nullable: true })
    color: string | null;
    @Column({ name: 'cy_step', type: 'double precision' })
    cyStep: number;
    @Column({ name: 'cx_step', type: 'double precision' })
    cxStep: number;
    @Column({ name: 'icon_media_id', type: 'uuid', nullable: true })
    iconMediaId: string | null;
    @ManyToOne(() => Media, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'icon_media_id' })
    iconMedia: Media | null;
    @Column({ type: 'varchar' })
    size: string;
    @ManyToOne(() => Quest, (quest) => quest.steps, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'quest_id' })
    quest: Quest;
    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;
    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
}
