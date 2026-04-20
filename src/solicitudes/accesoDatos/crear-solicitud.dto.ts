import { IsObject, IsOptional, IsString, IsNotEmpty, IsEnum } from 'class-validator';

export class CrearSolicitudDto {
  @IsString()
  @IsNotEmpty()
  entidadAfectada: string; // ej: 'JAC'

  @IsString()
  @IsOptional()
  entidadId?: string; 

  @IsString()
  @IsNotEmpty()
  tipoAccion: string; // 'CREAR', 'EDITAR', 'ELIMINAR'

  @IsObject()
  @IsOptional()
  payloadAnterior?: Record<string, any>;

  @IsObject()
  @IsOptional()
  payloadDeseado?: Record<string, any>;
}
