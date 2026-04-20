import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * Reflejo local de la tabla de usuarios del MS de Autenticación.
 * Se llena consumiendo los eventos de RabbitMQ (colaUsuariosSistema).
 */
@Entity('usuario_espejo')
export class UsuarioEspejo {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  id: string; // Corresponde al ID/sub en el Auth MS

  @Column({ type: 'varchar', length: 150 })
  email: string;

  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  @Column({ type: 'varchar', length: 50 })
  rol: string;
}
