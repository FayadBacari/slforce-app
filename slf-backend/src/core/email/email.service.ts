import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { readFileSync } from 'fs';
import { join } from 'path';

// ─── EmailService ──────────────────────────────────────────────────────────────
//
// Wrapper fin autour du SDK Resend.
// Garde tous les envois transactionnels au même endroit — facile à étendre,
// facile à mocker. Les templates HTML sont externalisés dans `templates/` et
// chargés une seule fois au boot pour éviter les lectures disque répétées.
//
// Architecture des templates :
//   • Fichiers HTML dans `core/email/templates/*.html` avec placeholders {{var}}
//   • Copiés vers `dist/` par nest-cli.json (assets config)
//   • Cachés en mémoire au démarrage du service (rapide + atomique)

interface PasswordResetTemplateVariables {
  firstName:   string;
  resetUrl:    string;
  currentYear: string;
}

@Injectable()
export class EmailService {
  private readonly resend:   Resend;
  private readonly mailFrom: string;
  private readonly isDev:    boolean;
  private readonly logger = new Logger(EmailService.name);

  // Templates chargés une seule fois au boot — lecture disque coûteuse en hot path.
  private readonly passwordResetTemplate: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey  = this.configService.getOrThrow<string>('email.resendApiKey');
    this.mailFrom = this.configService.getOrThrow<string>('email.mailFrom');
    this.resend   = new Resend(apiKey);
    this.isDev    = this.configService.get<string>('NODE_ENV') !== 'production';

    this.passwordResetTemplate = this.loadTemplateFromDisk('reset-password.html');
  }

  // ─── sendPasswordResetEmail ──────────────────────────────────────────────────
  //
  // En dev, si Resend rejette l'envoi (onboarding@resend.dev ne peut envoyer
  // qu'à l'email du compte Resend), l'URL de reset est imprimée dans le terminal
  // pour pouvoir tester le flow complet sans serveur mail fonctionnel.
  async sendPasswordResetEmail(params: {
    to:        string;
    firstName: string;
    resetUrl:  string;
  }): Promise<void> {
    const { to, firstName, resetUrl } = params;

    const html = this.renderPasswordResetTemplate({
      firstName,
      resetUrl,
      currentYear: String(new Date().getFullYear()),
    });

    const { error } = await this.resend.emails.send({
      from:    this.mailFrom,
      to,
      subject: 'Réinitialise ton mot de passe SLForce',
      html,
    });

    if (error) {
      this.logger.error(
        `Resend delivery failed → ${error.name}: ${error.message}`,
      );

      // ── DEV FALLBACK ───────────────────────────────────────────────────────
      // En dev on imprime l'URL pour pouvoir continuer à tester.
      if (this.isDev) {
        this.logger.warn(
          `[DEV] Impossible d'envoyer l'email à ${to}. ` +
          `Utilise ce lien directement pour tester :\n\n  ${resetUrl}\n`,
        );
        return; // ne throw pas — traité comme succès en dev
      }

      throw new Error(`Email delivery failed: ${error.message}`);
    }

    this.logger.log(`Password reset email sent to ${to}`);
  }

  // ─── Template helpers ────────────────────────────────────────────────────────

  // Charge un fichier template depuis le dossier `templates/`.
  // Fonctionne aussi bien en dev (ts-node, lit depuis src/) qu'en prod
  // (lit depuis dist/) grâce à `__dirname` qui suit la position du fichier compilé.
  private loadTemplateFromDisk(templateFileName: string): string {
    const templatePath = join(__dirname, 'templates', templateFileName);
    try {
      return readFileSync(templatePath, 'utf-8');
    } catch (loadError) {
      // Si le template manque, c'est une erreur de configuration grave.
      // On throw au boot pour échouer vite plutôt que silencieusement à l'envoi.
      this.logger.error(`Template introuvable : ${templatePath}`, loadError);
      throw new Error(`Email template "${templateFileName}" not found at ${templatePath}`);
    }
  }

  // Substitue les placeholders {{variable}} par les valeurs fournies.
  // Volontairement simple — tant qu'on a un seul template on évite la dépendance
  // à Handlebars / Mustache. Si on en ajoute 3 ou plus, basculer vers Handlebars.
  private renderPasswordResetTemplate(variables: PasswordResetTemplateVariables): string {
    return this.passwordResetTemplate
      .replace(/\{\{firstName\}\}/g,   this.escapeHtml(variables.firstName))
      .replace(/\{\{resetUrl\}\}/g,    variables.resetUrl)            // URL — déjà sûre, pas d'échappement HTML
      .replace(/\{\{currentYear\}\}/g, variables.currentYear);
  }

  // Échappement HTML basique pour les valeurs user-controlled (firstName).
  // Empêche un prénom contenant `<script>` de casser la mise en page de l'email.
  private escapeHtml(rawValue: string): string {
    return rawValue
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;')
      .replace(/'/g,  '&#39;');
  }
}
