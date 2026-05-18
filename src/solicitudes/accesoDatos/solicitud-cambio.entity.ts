import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UsuarioEspejo } from './usuario-espejo.entity';

export enum EstadoSolicitud {
  PENDIENTE = 'PENDIENTE',
  APROBADA = 'APROBADA',
  RECHAZADA = 'RECHAZADA',
}

@Entity('solicitud_cambio')
export class SolicitudCambio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: EstadoSolicitud,
    default: EstadoSolicitud.PENDIENTE,
  })
  estado: EstadoSolicitud;

  @Column({ type: 'varchar', length: 100 })
  operadorId: string; // Email/ID de quien hace la solicitud

  @Column({ type: 'varchar', length: 200, nullable: true })
  operadorNombre: string; // Nombre legible extraído del JWT

  @ManyToOne(() => UsuarioEspejo, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'operadorId' })
  usuarioOperador: UsuarioEspejo;

  // Datos para el Maker-Checker
  @Column({ type: 'varchar', length: 100 })
  entidadAfectada: string; // ej: 'JAC'

  @Column({ type: 'varchar', length: 100, nullable: true })
  entidadId: string; // ID de la JAC o NULL si es creación

  @Column({ type: 'varchar', length: 50 })
  tipoAccion: string; // 'CREAR', 'EDITAR', 'ELIMINAR'

  @Column({ type: 'jsonb', nullable: true })
  payloadAnterior: object; // Estado de la JAC antes de edición

  @Column({ type: 'jsonb', nullable: true })
  payloadDeseado: object; // Los datos propuestos a cambiar/insertar

  @Column({ type: 'text', nullable: true })
  motivoRechazo: string; // Se llena si un admin rechaza la solicitud

  @Column({ type: 'varchar', length: 100, nullable: true })
  revisadoPorAdminId: string; // Email/ID del Admin que la aprobó o la rechazó

  @Column({ type: 'varchar', length: 200, nullable: true })
  revisadoPorAdminNombre: string; // Nombre legible del Admin

  @CreateDateColumn()
  fechaCreacion: Date;

  @UpdateDateColumn()
  fechaActualizacion: Date;
}
