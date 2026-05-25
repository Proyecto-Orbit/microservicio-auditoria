import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { SolicitudesService } from '../fachadaService/solicitudes.service';
import { CrearSolicitudDto } from '../accesoDatos/crear-solicitud.dto';
import { EstadoSolicitud } from '../accesoDatos/solicitud-cambio.entity';
import { JwtCookieGuard } from '../../auth/guards/jwt-cookie.guard';
import type { UserPayload } from '../../auth/guards/jwt-cookie.guard';
import { UsuarioActivo } from '../../auth/decorators/usuario-activo.decorator';
import { RechazarSolicitudDto } from '../accesoDatos/rechazar-solicitud.dto';
import { AllowRoles } from '../../auth/decorators/allow-roles.decorator';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';

@ApiTags('solicitudes')
@Controller('solicitudes')
@UseGuards(JwtCookieGuard)
export class SolicitudesController {
  constructor(private readonly solicitudesService: SolicitudesService) {}

  @ApiOperation({ summary: 'Registrar una nueva propuesta de cambio (Operador)' })
  @ApiResponse({ status: 201, description: 'Solicitud creada exitosamente.' })
  @AllowRoles('operador', 'superadmin')
  @Post()
  crearSolicitud(
    @Body() crearDto: CrearSolicitudDto,
    @UsuarioActivo() usuario: UserPayload,
  ) {
    return this.solicitudesService.crearSolicitud(crearDto, usuario.email, usuario.nombre);
  }

  @ApiOperation({ summary: 'Consultar solicitudes propias (Operador)' })
  @AllowRoles('operador', 'superadmin')
  @Get('mias')
  listarMias(@UsuarioActivo() usuario: UserPayload) {
    return this.solicitudesService.listarPorOperador(usuario.email);
  }

  @ApiOperation({ summary: 'Listar todas las solicitudes con filtro opcional (Admin)' })
  @ApiQuery({ name: 'estado', enum: EstadoSolicitud, required: false })
  @AllowRoles('admin', 'superadmin')
  @Get()
  listarTodas(
    @Query('estado') estado: EstadoSolicitud,
  ) {
    return this.solicitudesService.listarTodas(estado);
  }

  @ApiOperation({ summary: 'Aprobar una solicitud de cambio (Admin)' })
  @ApiResponse({ status: 200, description: 'Cambio aprobado y evento emitido a RabbitMQ.' })
  @AllowRoles('admin', 'superadmin')
  @Patch(':id/aprobar')
  aprobarSolicitud(
    @Param('id') id: string,
    @UsuarioActivo() usuario: UserPayload,
  ) {
    return this.solicitudesService.aprobarSolicitud(id, usuario.email, usuario.nombre);
  }

  @ApiOperation({ summary: 'Rechazar una solicitud de cambio (Admin)' })
  @AllowRoles('admin', 'superadmin')
  @Patch(':id/rechazar')
  rechazarSolicitud(
    @Param('id') id: string,
    @Body() rechazoDto: RechazarSolicitudDto,
    @UsuarioActivo() usuario: UserPayload,
  ) {
    return this.solicitudesService.rechazarSolicitud(id, rechazoDto.motivo, usuario.email, usuario.nombre);
  }

  @ApiOperation({ summary: 'Registrar una acción directa como log de auditoría (Admin)' })
  @ApiResponse({ status: 201, description: 'Log de acción directa registrado como APROBADO.' })
  @AllowRoles('admin', 'superadmin')
  @Post('accion-directa')
  registrarAccionAdmin(
    @Body() crearDto: CrearSolicitudDto,
    @UsuarioActivo() usuario: UserPayload,
  ) {
    return this.solicitudesService.registrarAccionAdmin(crearDto, usuario.email, usuario.nombre);
  }
}
