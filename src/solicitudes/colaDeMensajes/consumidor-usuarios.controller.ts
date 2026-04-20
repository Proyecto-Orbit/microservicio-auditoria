import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { UsuarioEspejoRepository } from '../accesoDatos/repositories/usuario-espejo.repository';

@Controller()
export class ConsumidorUsuariosController {
  constructor(
    private readonly usuarioRepository: UsuarioEspejoRepository,
  ) {}

  /**
   * Escucha la cola de RabbitMQ cuando se crea/edita un usuario en el MS Auth.
   * Este payload asume que envías: { id, correo, nombre, rol }
   */
  @EventPattern('usuario.creado_o_actualizado')
  async handleUsuarioCreado(@Payload() data: any) {
    if (!data || !data.id || !data.correo) return;

    const usuario = await this.usuarioRepository.guardarYActualizar(
      data.id,
      data.correo,
      data.nombre,
      data.rol
    );
    
    console.log(`Usuario espejo actualizado: ${usuario.email}`);
  }
}
