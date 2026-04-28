import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { SolicitudesService } from '../fachadaService/solicitudes.service';
import { CrearSolicitudDto } from '../accesoDatos/crear-solicitud.dto';
import { EstadoSolicitud } from '../accesoDatos/solicitud-cambio.entity';
import { JwtCookieGuard } from '../../auth/guards/jwt-cookie.guard';
import type { JwtPayload } from '../../auth/guards/jwt-cookie.guard';
import { UsuarioActivo } from '../../auth/decorators/usuario-activo.decorator';
import { RechazarSolicitudDto } from '../accesoDatos/rechazar-solicitud.dto';
import { AllowRoles } from '../../auth/decorators/allow-roles.decorator';

@Controller('solicitudes')
@UseGuards(JwtCookieGuard)
export class SolicitudesController {
  constructor(private readonly solicitudesService: SolicitudesService) {}

  // HU-6.5: Registrar una solicitud de cambio (Operador)
  @AllowRoles('operador')
  @Post()
  crearSolicitud(
    @Body() crearDto: CrearSolicitudDto,
    @UsuarioActivo() usuario: JwtPayload,
  ) {
    return this.solicitudesService.crearSolicitud(crearDto, usuario.email);
  }

  // HU-6.6: Consultar mis solicitudes (Operador)
  @AllowRoles('operador')
  @Get('mias')
  listarMias(@UsuarioActivo() usuario: JwtPayload) {
    return this.solicitudesService.listarPorOperador(usuario.email);
  }

  // HU-6.1 y HU-6.4: Listar todas las solicitudes (Admin)
  @AllowRoles('admin')
  @Get()
  listarTodas(
    @Query('estado') estado: EstadoSolicitud,
  ) {
    return this.solicitudesService.listarTodas(estado);
  }

  // HU-6.2: Aprobar un cambio (Admin)
  @AllowRoles('admin')
  @Patch(':id/aprobar')
  aprobarSolicitud(
    @Param('id') id: string,
    @UsuarioActivo() usuario: JwtPayload,
  ) {
    return this.solicitudesService.aprobarSolicitud(id, usuario.email);
  }

  // HU-6.3: Rechazar un cambio (Admin)
  @AllowRoles('admin')
  @Patch(':id/rechazar')
  rechazarSolicitud(
    @Param('id') id: string,
    @Body() rechazoDto: RechazarSolicitudDto,
    @UsuarioActivo() usuario: JwtPayload,
  ) {
    return this.solicitudesService.rechazarSolicitud(id, rechazoDto.motivo, usuario.email);
  }

  // Auditoría: Registrar acción directa del Admin como log (estado = APROBADA automáticamente)
  @AllowRoles('admin')
  @Post('accion-directa')
  registrarAccionAdmin(
    @Body() crearDto: CrearSolicitudDto,
    @UsuarioActivo() usuario: JwtPayload,
  ) {
    return this.solicitudesService.registrarAccionAdmin(crearDto, usuario.email);
  }
}
