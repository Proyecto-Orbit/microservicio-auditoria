import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class ProductorEventosService {
  constructor(
    @Inject('RABBITMQ_SERVICE') private readonly client: ClientProxy,
  ) {}

  /**
   * Emite un evento a RabbitMQ para que Asocomunales lo aplique
   * @param entidad 'JAC', 'ASOCOMUNAL', etc.
   * @param payload Datos de la entidad.
   */
  emitirAprobacionAplicar(entidad: string, payload: any) {
    const patron = `solicitud.aprobada.${entidad.toLowerCase()}`;
    console.log(`[RabbitMQ] Emitiendo evento ${patron}...`);
    return this.client.emit(patron, payload).subscribe({
      next: () => console.log(`[RabbitMQ] Evento ${patron} emitido con éxito`),
      error: (err) => console.error(`[RabbitMQ] Error emitiendo ${patron}:`, err)
    });
  }
}
