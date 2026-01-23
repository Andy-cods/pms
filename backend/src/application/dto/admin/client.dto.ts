import { IsString, IsOptional, IsBoolean, IsEmail } from 'class-validator';

export class CreateClientDto {
  @IsString()
  companyName!: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;
}

export class UpdateClientDto {
  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ClientResponseDto {
  id!: string;
  companyName!: string;
  contactName!: string | null;
  contactEmail!: string | null;
  contactPhone!: string | null;
  accessCode!: string;
  isActive!: boolean;
  projectCount!: number;
  createdAt!: string;
  updatedAt!: string;
}

export class ClientListResponseDto {
  clients!: ClientResponseDto[];
  total!: number;
}
