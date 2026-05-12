import { IsString, Matches, MinLength } from 'class-validator';
import {
  PASSWORD_STRENGTH_PATTERN,
  PASSWORD_STRENGTH_MESSAGE,
} from './register.dto';

export class ResetPasswordDto {
  @IsString()
  token!: string;

  // Mêmes exigences qu'au register — un user qui reset son mot de passe ne peut
  // pas revenir à un mot de passe plus faible que ce que les nouveaux comptes
  // doivent fournir.
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères.' })
  @Matches(PASSWORD_STRENGTH_PATTERN, { message: PASSWORD_STRENGTH_MESSAGE })
  newPassword!: string;
}
