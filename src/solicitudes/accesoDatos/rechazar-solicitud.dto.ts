import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RechazarSolicitudDto {
  @ApiProperty({ description: 'Motivo por el cual se rechaza la solicitud', example: 'Falta adjuntar el acta de posesión.' })
  @IsString()
  @IsNotEmpty()
  motivo: string;
}
