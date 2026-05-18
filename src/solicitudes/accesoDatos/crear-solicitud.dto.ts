import { IsObject, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CrearSolicitudDto {
  @ApiProperty({ description: 'Entidad a la que pertenece el cambio (JAC o ASOCOMUNAL)', example: 'ASOCOMUNAL' })
  @IsString()
  @IsNotEmpty()
  entidadAfectada: string;

  @ApiProperty({ description: 'ID de la entidad si es edición o eliminación. Null si es creación.', example: '1', required: false })
  @IsString()
  @IsOptional()
  entidadId?: string; 

  @ApiProperty({ description: 'Tipo de cambio propuesto', example: 'EDITAR', enum: ['CREAR', 'EDITAR', 'ELIMINAR', 'ACTIVAR', 'DESACTIVAR'] })
  @IsString()
  @IsNotEmpty()
  tipoAccion: string;

  @ApiProperty({ description: 'Estado actual de la entidad antes del cambio', required: false })
  @IsObject()
  @IsOptional()
  payloadAnterior?: Record<string, any>;

  @ApiProperty({ description: 'Estado propuesto para la entidad' })
  @IsObject()
  @IsOptional()
  payloadDeseado?: Record<string, any>;
}
