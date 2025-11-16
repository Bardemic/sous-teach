import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('newsletter_subscribers')
export class NewsletterSubscriber {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  @Index({ unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  zipCode?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state?: string;

  @Column({ type: 'boolean', default: false })
  confirmed!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  confirmationToken?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  confirmedAt?: Date;
}

