import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, } from 'typeorm';
@Entity('media')
export class Media {
    @PrimaryGeneratedColumn('uuid')
    id: string;
    @Column({ name: 'original_filename', type: 'varchar', length: 512 })
    originalFilename: string;
    @Column({ name: 'mime_type', type: 'varchar', length: 255 })
    mimeType: string;
    @Column({ name: 'size_bytes', type: 'int' })
    sizeBytes: number;
    @Column({ name: 'storage_key', type: 'varchar', length: 1024 })
    storageKey: string;
    @Column({ type: 'int', nullable: true })
    width: number | null;
    @Column({ type: 'int', nullable: true })
    height: number | null;
    @Column({ name: 'alt_text', type: 'text', nullable: true })
    altText: string | null;
    @Column({ name: 'created_by', type: 'varchar', length: 255, nullable: true })
    createdBy: string | null;
    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;
    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
}
