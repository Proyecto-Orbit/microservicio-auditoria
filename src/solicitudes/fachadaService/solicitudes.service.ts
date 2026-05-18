import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EstadoSolicitud, SolicitudCambio } from '../accesoDatos/solicitud-cambio.entity';
import { CrearSolicitudDto } from '../accesoDatos/crear-solicitud.dto';
import { ProductorEventosService } from '../colaDeMensajes/productor-eventos.service';
import { SolicitudRepository } from '../accesoDatos/repositories/solicitud.repository';

@Injectable()
export class SolicitudesService {
  constructor(
    private readonly solicitudRepository: SolicitudRepository,
    private readonly productorEventos: ProductorEventosService,
  ) {}

  async listarTodas(estado?: EstadoSolicitud) {
    return this.solicitudRepository.buscarTodas(estado);
  }

  async listarPorOperador(operadorId: string) {
    return this.solicitudRepository.buscarPorOperador(operadorId);
  }

  async crearSolicitud(
    crearSolicitudDto: CrearSolicitudDto,
    operadorId: string,
    operadorNombre?: string,
  ) {
    return this.solicitudRepository.crearNueva(crearSolicitudDto, operadorId, operadorNombre);
  }

  async aprobarSolicitud(id: string, adminId: string, adminNombre?: string) {
    const solicitud = await this.solicitudRepository.buscarGarantizadaPorId(id);
    if (!solicitud) {
      throw new NotFoundException('Solicitud no encontrada');
    }
    if (solicitud.estado !== EstadoSolicitud.PENDIENTE) {
      throw new ForbiddenException('La solicitud ya no está pendiente');
    }

    solicitud.estado = EstadoSolicitud.APROBADA;
    solicitud.revisadoPorAdminId = adminId;
    solicitud.revisadoPorAdminNombre = adminNombre ?? adminId;
    await this.solicitudRepository.guardar(solicitud);

    // HU-6.2: Publicar registro aprobado hacia el microservicio correspondiente (RabbitMQ)
    const { id: _, ...datosLimpios } = (solicitud.payloadDeseado || {}) as any;
    this.productorEventos.emitirAprobacionAplicar(solicitud.entidadAfectada, {
      tipoAccion: solicitud.tipoAccion,
      entidadId: solicitud.entidadId,
      datos: datosLimpios,
    });

    return solicitud;
  }

  async rechazarSolicitud(id: string, motivo: string, adminId: string, adminNombre?: string) {
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
    solicitud.revisadoPorAdminNombre = adminNombre ?? adminId;

    return this.solicitudRepository.guardar(solicitud);
  }

  /**
   * Registra una acción directa del admin como log de auditoría.
   * La solicitud se crea directamente con estado APROBADA (sin revisión).
   * NO emite evento RabbitMQ porque el cambio ya fue aplicado en MS Asocomunales.
   *
   * @param dto         Datos del cambio (entidad, tipo acción, payloads)
   * @param adminId     Email/ID del admin que realizó la acción
   * @param adminNombre Nombre legible del admin extraído del JWT
   */
  async registrarAccionAdmin(
    dto: CrearSolicitudDto,
    adminId: string,
    adminNombre?: string,
  ): Promise<SolicitudCambio> {
    // El admin es a la vez quien propone y quien aprueba
    const nuevaSolicitud = await this.solicitudRepository.crearNueva(dto, adminId, adminNombre);

    nuevaSolicitud.estado = EstadoSolicitud.APROBADA;
    nuevaSolicitud.revisadoPorAdminId = adminId;
    nuevaSolicitud.revisadoPorAdminNombre = adminNombre ?? adminId;

    return this.solicitudRepository.guardar(nuevaSolicitud);
  }
}

