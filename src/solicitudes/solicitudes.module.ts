import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SolicitudCambio } from './accesoDatos/solicitud-cambio.entity';
import { UsuarioEspejo } from './accesoDatos/usuario-espejo.entity';
import { SolicitudesController } from './capaControladores/solicitudes.controller';
import { SolicitudesService } from './fachadaService/solicitudes.service';
import { ProductorEventosService } from './colaDeMensajes/productor-eventos.service';
import { ConsumidorUsuariosController } from './colaDeMensajes/consumidor-usuarios.controller';
import { SolicitudRepository } from './accesoDatos/repositories/solicitud.repository';
import { UsuarioEspejoRepository } from './accesoDatos/repositories/usuario-espejo.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([SolicitudCambio, UsuarioEspejo]),
    ClientsModule.register([
      {
        name: 'RABBITMQ_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: 'colaAprobacionesAsocomunal',
          queueOptions: {
            durable: false,
          },
        },
      },
      {
        name: 'RABBITMQ_JAC_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: 'colaAprobacionesJAC',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [SolicitudesController, ConsumidorUsuariosController],
  providers: [
    SolicitudesService,
    ProductorEventosService,
    SolicitudRepository,
    UsuarioEspejoRepository
  ],
})
export class SolicitudesModule { }
