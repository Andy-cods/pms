import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface ClientJwtPayload {
  sub: string; // clientId
  role: string;
  companyName: string;
}

export interface ClientUser {
  clientId: string;
  companyName: string;
  role: 'CLIENT';
}

@Injectable()
export class ClientAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);

    try {
      const payload = await this.jwtService.verifyAsync<ClientJwtPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      if (payload.role !== 'CLIENT') {
        throw new UnauthorizedException('Invalid role for client access');
      }

      // Attach client info to request
      request.clientUser = {
        clientId: payload.sub,
        companyName: payload.companyName,
        role: 'CLIENT',
      } as ClientUser;

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
