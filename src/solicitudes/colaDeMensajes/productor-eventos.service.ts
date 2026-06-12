import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class ProductorEventosService {
  constructor(
    @Inject('RABBITMQ_SERVICE') private readonly clientAsocomunal: ClientProxy,
    @Inject('RABBITMQ_JAC_SERVICE') private readonly clientJac: ClientProxy,
  ) {}

  /**
   * Emite un evento a RabbitMQ para que el microservicio correspondiente lo aplique.
   * Enruta automáticamente al cliente correcto según la entidad:
   * - 'JAC' y 'AFILIADO' → cola colaAprobacionesJAC (jac-backend, que también gestiona afiliados)
   * - Otras             → cola colaAprobacionesAsocomunal (MS Asocomunales)
   *
   * @param entidad 'JAC', 'AFILIADO', 'ASOCOMUNAL', etc.
   * @param payload Datos de la entidad.
   */
  emitirAprobacionAplicar(entidad: string, payload: any) {
    const patron = `solicitud.aprobada.${entidad.toLowerCase()}`;
    // jac-backend es responsable tanto de las JAC como de los afiliados (personas).
    const entidadUpper = entidad.toUpperCase();
    const loAplicaJacBackend = entidadUpper === 'JAC' || entidadUpper === 'AFILIADO';
    const client = loAplicaJacBackend ? this.clientJac : this.clientAsocomunal;

    console.log(`[RabbitMQ] Emitiendo evento ${patron}...`);
    return client.emit(patron, payload).subscribe({
      next: () => console.log(`[RabbitMQ] Evento ${patron} emitido con éxito`),
      error: (err) => console.error(`[RabbitMQ] Error emitiendo ${patron}:`, err)
    });
  }
}

