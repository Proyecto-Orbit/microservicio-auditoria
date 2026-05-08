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
   * - 'JAC' → cola colaAsocomunales (backend de JACs)
   * - Otras  → cola colaAprobacionesAsocomunal (MS Asocomunales)
   *
   * @param entidad 'JAC', 'ASOCOMUNAL', etc.
   * @param payload Datos de la entidad.
   */
  emitirAprobacionAplicar(entidad: string, payload: any) {
    const patron = `solicitud.aprobada.${entidad.toLowerCase()}`;
    const client = entidad.toUpperCase() === 'JAC' ? this.clientJac : this.clientAsocomunal;

    console.log(`[RabbitMQ] Emitiendo evento ${patron}...`);
    return client.emit(patron, payload).subscribe({
      next: () => console.log(`[RabbitMQ] Evento ${patron} emitido con éxito`),
      error: (err) => console.error(`[RabbitMQ] Error emitiendo ${patron}:`, err)
    });
  }
}

