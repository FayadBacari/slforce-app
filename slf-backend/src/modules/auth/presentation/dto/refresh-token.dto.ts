import { IsNotEmpty, IsString } from 'class-validator';

// Body schema for POST /api/v1/auth/refresh AND /api/v1/auth/logout
export class RefreshTokenRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'Le refresh token est requis.' })
  refreshToken!: string;
}
