import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
  Tree,
  TreeParent,
  TreeChildren,
} from 'typeorm';
import {
  parseOpenTimeToSchedule,
  type OpenSchedule,
} from '../../common/helpers/open-time.helper';
import { Department } from '../../departments/entities/department.entity';

export enum LocationType {
  BUILDING = 'building',
  FLOOR = 'floor',
  ROOM = 'room',
}

@Entity('locations')
@Tree('materialized-path')
export class Location {
  @PrimaryGeneratedColumn('uuid')
  id: string;



  @TreeParent()
  @JoinColumn({ name: 'parent_id' })
  parent: Location | null;

  @TreeChildren()
  children: Location[];

  @Column({ type: 'varchar' })
  name: string;

  @Column({ name: 'location_number', type: 'varchar', unique: true })
  locationNumber: string;

  @Column({ type: 'varchar' })
  building: string;

  @Column({ name: 'department_id', type: 'uuid', nullable: true })
  departmentId: string | null;

  @ManyToOne(() => Department, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'department_id' })
  department: Department | null;

  @Column({ type: 'int', nullable: true })
  capacity: number | null;

  @Column({ name: 'open_time', type: 'varchar', nullable: true })
  openTime: string | null;

  @Column({ name: 'open_schedule', type: 'jsonb', nullable: true })
  openSchedule: OpenSchedule | null;

  @Column({
    type: 'enum',
    enum: LocationType,
  })
  type: LocationType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  updateOpenSchedule() {
    if (this.openTime) {
      try {
        this.openSchedule = parseOpenTimeToSchedule(this.openTime);
      } catch {
        this.openSchedule = null;
      }
    } else {
      this.openSchedule = null;
    }
  }
}
