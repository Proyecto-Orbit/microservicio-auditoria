import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EstadoSolicitud } from '../accesoDatos/solicitud-cambio.entity';
import { CrearSolicitudDto } from '../accesoDatos/crear-solicitud.dto';
import { ProductorEventosService } from '../colaDeMensajes/productor-eventos.service';
import { SolicitudRepository } from '../accesoDatos/repositories/solicitud.repository';

@Injectable()
export class SolicitudesService {
  constructor(
    private readonly solicitudRepository: SolicitudRepository,
    private readonly productorEventos: ProductorEventosService,
  ) { }

  async listarTodas(estado?: EstadoSolicitud) {
    return this.solicitudRepository.buscarTodas(estado);
  }

  async listarPorOperador(operadorId: string) {
    return this.solicitudRepository.buscarPorOperador(operadorId);
  }

  async crearSolicitud(crearSolicitudDto: CrearSolicitudDto, operadorId: string) {
    return this.solicitudRepository.crearNueva(crearSolicitudDto, operadorId);
  }

  async aprobarSolicitud(id: string, adminId: string) {
    const solicitud = await this.solicitudRepository.buscarGarantizadaPorId(id);
    if (!solicitud) {
      throw new NotFoundException('Solicitud no encontrada');
    }
    if (solicitud.estado !== EstadoSolicitud.PENDIENTE) {
      throw new ForbiddenException('La solicitud ya no está pendiente');
    }

    // Cambiar estado
    solicitud.estado = EstadoSolicitud.APROBADA;
    solicitud.revisadoPorAdminId = adminId;
    await this.solicitudRepository.guardar(solicitud);

    // HU-6.2: Publicar registro aprobado hacia el microservicio correspondiente (RabbitMQ)
    // Limpiar el payload para no enviar IDs internos que confundan a los MS destino
    const { id: _, ...datosLimpios } = (solicitud.payloadDeseado || {}) as any;
    this.productorEventos.emitirAprobacionAplicar(
      solicitud.entidadAfectada,
      {
        tipoAccion: solicitud.tipoAccion,
        entidadId: solicitud.entidadId,
        datos: datosLimpios,
      }
    );

    return solicitud;
  }

  async rechazarSolicitud(id: string, motivo: string, adminId: string) {
    const solicitud = await this.solicitudRepository.buscarGarantizadaPorId(id);
    if (!solicitud) {
      throw new NotFoundException('Solicitud no encontrada');
    }
    if (solicitud.estado !== EstadoSolicitud.PENDIENTE) {
      throw new ForbiddenException('La solicitud ya no está pendiente');
    }

    solicitud.estado = EstadoSolicitud.RECHAZADA;
    solicitud.motivoRechazo = motivo;
    solicitud.revisadoPorAdminId = adminId;

    return this.solicitudRepository.guardar(solicitud);
  }
}
