import { Module } from '@nestjs/common';
import { EmailService } from './email.service';

// Standalone module — import it wherever you need to send transactional emails.
// ConfigModule is global so no need to import it here.
@Module({
  providers: [EmailService],
  exports:   [EmailService],
})
export class EmailModule {}
