import { UserRole } from '@prisma/client';

export class UserResponseDto {
  id!: string;
  email!: string;
  name!: string;
  role!: UserRole;
  avatar?: string | null;
  isActive!: boolean;
}

export class TokensDto {
  accessToken!: string;
  refreshToken!: string;
  expiresIn!: number; // seconds
}

export class AuthResponseDto {
  user!: UserResponseDto;
  tokens!: TokensDto;
}

export class ClientAuthResponseDto {
  client!: {
    id: string;
    companyName: string;
    contactName?: string | null;
  };
  tokens!: TokensDto;
}
