// ─── FRENCH TRANSLATIONS ──────────────────────────────────────────────────────
// Every text string displayed in the app is defined here in French.
// Never write text directly in components — always use the translation hook.

const frenchTranslations = {
  common: {
    loading:       'Chargement...',
    error:         'Une erreur est survenue',
    retry:         'Réessayer',
    cancel:        'Annuler',
    confirm:       'Confirmer',
    save:          'Enregistrer',
    delete:        'Supprimer',
    back:          'Retour',
    next:          'Suivant',
    done:          'Terminé',
    close:         'Fermer',
    yes:           'Oui',
    no:            'Non',
    optional:      '(Optionnel)',
    required:      'Obligatoire',
    noResults:     'Aucun résultat',
    seeAll:        'Voir tout',
  },

  auth: {
    welcomeTitle:       'Bienvenue sur SLForce',
    welcomeSubtitle:    'La plateforme qui connecte coachs et athlètes',
    loginTitle:         'Connexion',
    loginSubtitle:      'Contente de te revoir !',
    emailPlaceholder:   'Adresse e-mail',
    passwordPlaceholder:'Mot de passe',
    loginButton:        'Se connecter',
    noAccount:          "Pas encore de compte ?",
    createAccount:      "S'inscrire",
    forgotPassword:     'Mot de passe oublié ?',

    roleSelectionTitle:    'Tu es...',
    roleSelectionSubtitle: 'Choisis ton rôle pour personnaliser ton expérience',
    roleCoach:             'Coach',
    roleCoachDesc:         'Je coache des athlètes et gère des programmes',
    roleAthlete:           'Athlète',
    roleAthleteDesc:       'Je cherche un coach pour progresser',

    registerTitle:         "Créer un compte",
    firstNamePlaceholder:  'Prénom',
    lastNamePlaceholder:   'Nom',
    confirmPasswordPlaceholder: 'Confirmer le mot de passe',
    registerButton:        "S'inscrire",
    alreadyHaveAccount:    'Déjà un compte ?',
    login:                 'Se connecter',

    forgotPasswordTitle:   'Mot de passe oublié',
    forgotPasswordDesc:    'Saisis ton e-mail et nous t\'enverrons un lien de réinitialisation.',
    sendResetLink:         'Envoyer le lien',
    backToLogin:           'Retour à la connexion',

    resetPasswordTitle:    'Nouveau mot de passe',
    newPasswordPlaceholder:'Nouveau mot de passe',
    resetPasswordButton:   'Réinitialiser',

    passwordRulesTitle:    'Le mot de passe doit contenir :',
    passwordRule8chars:    'Au moins 8 caractères',
    passwordRuleUppercase: 'Une lettre majuscule',
    passwordRuleNumber:    'Un chiffre',

    errors: {
      invalidEmail:       'Adresse e-mail invalide',
      passwordTooShort:   'Le mot de passe doit faire au moins 8 caractères',
      passwordsDoNotMatch:'Les mots de passe ne correspondent pas',
      fieldRequired:      'Ce champ est obligatoire',
    },
  },

  chat: {
    title:                 'Messages',
    searchPlaceholder:     'Rechercher une conversation...',
    noConversations:       'Aucune conversation pour le moment',
    noConversationsDesc:   'Trouve un coach ou un athlète et commence à échanger !',
    messagePlaceholder:    'Écris un message...',
    today:                 "Aujourd'hui",
    yesterday:             'Hier',
    sending:               'Envoi...',
    sent:                  'Envoyé',
    failed:                'Échec',
    retry:                 'Réessayer',
    attachPhoto:           'Photo',
    attachVideo:           'Vidéo',
    attachDocument:        'Document',
    sendPaymentRequest:    'Demander un paiement',
    paymentRequestTitle:   'Demande de paiement',
    paymentRequestAmount:  'Montant (€)',
    paymentRequestDesc:    'Description (optionnel)',
    send:                  'Envoyer',
    blockUser:             'Bloquer cet utilisateur',
    deleteConversation:    'Supprimer la conversation',
  },

  payments: {
    title:                 'Paiements',
    coachDashboardTitle:   'Mes revenus',
    athleteHistoryTitle:   'Mes dépenses',
    totalReceived:         'Total reçu',
    totalSpent:            'Total dépensé',
    thisMonth:             'Ce mois',
    allTime:               'Total',
    noPayments:            'Aucun paiement pour le moment',
    paymentSuccess:        'Paiement réussi !',
    paymentFailed:         'Paiement échoué',
    paymentPending:        'En attente',
    amount:                'Montant',
    date:                  'Date',
    status:                'Statut',
    from:                  'De',
    to:                    'À',
    payNow:                'Payer maintenant',
    monthlyRevenue:        'Revenus mensuels',
  },

  search: {
    title:                 'Rechercher',
    searchCoachesPlaceholder: 'Rechercher un coach...',
    searchAthletesPlaceholder:'Rechercher un athlète...',
    filters:               'Filtres',
    specialty:             'Spécialité',
    location:              'Localisation',
    priceRange:            'Fourchette de prix',
    rating:                'Note minimale',
    applyFilters:          'Appliquer',
    resetFilters:          'Réinitialiser',
    noCoachesFound:        'Aucun coach trouvé',
    noAthletesFound:       'Aucun athlète trouvé',
    sendMessage:           'Envoyer un message',
    viewProfile:           'Voir le profil',
  },

  profile: {
    title:                 'Profil',
    editProfile:           'Modifier le profil',
    coachProfileTitle:     'Mon profil coach',
    athleteProfileTitle:   'Mon profil athlète',
    bio:                   'Biographie',
    specialty:             'Spécialité',
    experience:            "Années d'expérience",
    hourlyRate:            'Tarif horaire',
    sport:                 'Sport',
    level:                 'Niveau',
    weight:                'Poids (kg)',
    height:                'Taille (cm)',
    goals:                 'Objectifs',
    save:                  'Enregistrer',
  },

  settings: {
    title:                 'Paramètres',
    account:               'Compte',
    profileSettings:       'Modifier le profil',
    privacySettings:       'Confidentialité',
    bankAccount:           'Compte bancaire',
    paymentChart:          'Mes revenus',
    paymentHistory:        'Historique des paiements',
    notifications:         'Notifications',
    language:              'Langue',
    darkMode:              'Mode sombre',
    support:               'Aide & Support',
    deleteAccount:         'Supprimer mon compte',
    logout:                'Se déconnecter',
    logoutConfirmTitle:    'Se déconnecter',
    logoutConfirmMessage:  'Es-tu sûr(e) de vouloir te déconnecter ?',
  },

  navigation: {
    dashboard:  'Accueil',
    chat:       'Messages',
    search:     'Rechercher',
    payments:   'Paiements',
    earnings:   'Revenus',
    profile:    'Profil',
    settings:   'Paramètres',
  },

  registerCoach: {
    stepProgress: '{{current}} / {{total}}',
    back:         'Retour',
    next:         'Suivant',
    finish:       'Terminer',
    loading:      'Création...',
    month:        '/mois',

    step1Title:    'Ton nom de coach',
    step1Subtitle: 'Comment veux-tu être affiché sur la plateforme ?',
    step1Placeholder: 'Ex: Coach Alex',
    step1Checking: 'Vérification...',
    step1Available: 'Ce nom est disponible ✓',

    step2Title:    'Ta spécialité',
    step2Subtitle: 'Dans quel domaine es-tu expert ?',
    step2Placeholder: 'Sélectionne ta spécialité',

    step3Title:    'Ta ville',
    step3Subtitle: 'Où exerces-tu ton activité ?',
    step3Placeholder: 'Ex: Paris',

    step4Title:    'Ton tarif',
    step4Subtitle: 'Combien factures-tu par mois ?',
    step4Placeholder: '0',

    step5Title:    'Ton expérience',
    step5Subtitle: "Depuis combien d'années coaches-tu ?",
    step5Placeholder: '0',

    step6Title:    'Ta présentation',
    step6Subtitle: 'Décris-toi en quelques mots pour tes futurs athlètes',
    step6Placeholder: 'Ex: Coach spécialisé en Street Lifting depuis 5 ans...',

    step7Title:    'Tes disciplines',
    step7Subtitle: "Sélectionne jusqu'à 2 disciplines que tu enseignes",
    selectedCount: '{{count}} discipline(s) sélectionnée(s)',

    errors: {
      nameEmpty:         'Le nom ne peut pas être vide',
      nameTaken:         'Ce nom est déjà utilisé',
      nameCheckFailed:   'Impossible de vérifier la disponibilité',
      missingAccountInfo:'Informations de compte manquantes',
      registrationFailed:'Échec de la création du compte. Réessaie.',
    },
  },

  registerAthlete: {
    stepProgress: '{{current}} / {{total}}',
    back:         'Retour',
    next:         'Suivant',
    finish:       'Terminer',
    loading:      'Création...',

    step1Title:    'Ton pseudo',
    step1Subtitle: 'Comment veux-tu être affiché sur la plateforme ?',
    step1Placeholder: 'Ex: AthleteMax',
    step1Checking: 'Vérification...',
    step1Available: 'Ce pseudo est disponible ✓',

    step2Title:    'Ton genre',
    step2Subtitle: 'Nécessaire pour les catégories de compétition',
    man:           '👨 Homme',
    woman:         '👩 Femme',

    step3Title:    'Ta catégorie',
    step3Subtitle: 'Ta catégorie de poids en Street Lifting',

    step4Title:    'Ton poids',
    step4Subtitle: 'Ton poids actuel',

    step5Title:    'Ta taille',
    step5Subtitle: 'Ta taille en centimètres',

    step6Title:    'Muscle Up',
    step6Subtitle: 'Ton meilleur record en Muscle Up lestage (kg)',

    step7Title:    'Tractions',
    step7Subtitle: 'Ton meilleur record en Tractions lestage (kg)',

    step8Title:    'Dips',
    step8Subtitle: 'Ton meilleur record en Dips lestage (kg)',

    step9Title:    'Squat',
    step9Subtitle: 'Ton meilleur record en Squat (kg)',

    errors: {
      nameEmpty:         'Le pseudo ne peut pas être vide',
      nameTaken:         'Ce pseudo est déjà utilisé',
      nameCheckFailed:   'Impossible de vérifier la disponibilité',
      missingAccountInfo:'Informations de compte manquantes',
      registrationFailed:'Échec de la création du compte. Réessaie.',
    },
  },
} as const;

export type TranslationKeys = typeof frenchTranslations;
export default frenchTranslations;
