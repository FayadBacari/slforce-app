import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

// Wraps bcrypt so the rest of the codebase never touches it directly.
// Salt rounds come from config (default 12) — higher = slower but more secure.
@Injectable()
export class PasswordHashService {
  private readonly saltRounds: number;

  constructor(private readonly configService: ConfigService) {
    this.saltRounds = this.configService.getOrThrow<number>('security.bcryptSaltRounds');
  }

  // Hashes a plaintext password. Use this when creating a user or changing password.
  async hashPlaintextPassword(plaintextPassword: string): Promise<string> {
    return bcrypt.hash(plaintextPassword, this.saltRounds);
  }

  // Compares a plaintext attempt to a stored hash. Returns true if they match.
  async doesPlaintextMatchHash(plaintextPassword: string, storedHash: string): Promise<boolean> {
    return bcrypt.compare(plaintextPassword, storedHash);
  }
}
