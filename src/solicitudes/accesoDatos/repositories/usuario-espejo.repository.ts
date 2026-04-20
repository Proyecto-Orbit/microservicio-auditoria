import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsuarioEspejo } from '../usuario-espejo.entity';

@Injectable()
export class UsuarioEspejoRepository {
  constructor(
    @InjectRepository(UsuarioEspejo)
    private readonly repo: Repository<UsuarioEspejo>,
  ) {}

  async buscarPorId(id: string): Promise<UsuarioEspejo | null> {
    return this.repo.findOne({ where: { id } });
  }

  async guardarYActualizar(
    id: string,
    email: string,
    nombre: string,
    rol: string,
  ): Promise<UsuarioEspejo> {
    let usuario = await this.buscarPorId(id);
    if (!usuario) {
      usuario = new UsuarioEspejo();
      usuario.id = id;
    }
    usuario.email = email;
    usuario.nombre = nombre;
    usuario.rol = rol;

    return this.repo.save(usuario);
  }
}
