import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SolicitudCambio, EstadoSolicitud } from '../solicitud-cambio.entity';
import { CrearSolicitudDto } from '../crear-solicitud.dto';

@Injectable()
export class SolicitudRepository {
  constructor(
    @InjectRepository(SolicitudCambio)
    private readonly repo: Repository<SolicitudCambio>,
  ) {}

  async buscarTodas(estado?: EstadoSolicitud): Promise<SolicitudCambio[]> {
    const whereCondition = estado ? { estado } : {};
    return this.repo.find({
      where: whereCondition,
      order: { fechaCreacion: 'DESC' },
      relations: ['usuarioOperador'],
    });
  }

  async buscarPorOperador(operadorId: string): Promise<SolicitudCambio[]> {
    return this.repo.find({
      where: { operadorId },
      order: { fechaCreacion: 'DESC' },
    });
  }

  async buscarGarantizadaPorId(id: string): Promise<SolicitudCambio | null> {
    return this.repo.findOne({ where: { id } });
  }

  async guardar(solicitud: SolicitudCambio): Promise<SolicitudCambio> {
    return this.repo.save(solicitud);
  }

  async crearNueva(
    crearSolicitudDto: CrearSolicitudDto,
    operadorId: string,
  ): Promise<SolicitudCambio> {
    const nueva = this.repo.create({
      ...crearSolicitudDto,
      operadorId,
      estado: EstadoSolicitud.PENDIENTE,
    });
    return this.guardar(nueva);
  }
}
