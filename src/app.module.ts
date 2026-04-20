import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { SolicitudesModule } from './solicitudes/solicitudes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '1234',
      database: process.env.DB_NAME || 'auditoria_db',
      autoLoadEntities: true,
      synchronize: true, // ¡Sólo en desarrollo!
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'super_secreto',
    }),
    SolicitudesModule,
  ],
})
export class AppModule {}
