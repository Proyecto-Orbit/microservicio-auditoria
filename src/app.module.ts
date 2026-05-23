import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { SolicitudesModule } from './solicitudes/solicitudes.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'root',
        database: process.env.DB_NAME || 'DBAuditoria',
        autoLoadEntities: true,
        synchronize: true, // ¡Sólo en desarrollo!
      }),
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'super_secret_jwt_key_123',
    }),
    AuthModule,
    SolicitudesModule,
  ],
})
export class AppModule {}
