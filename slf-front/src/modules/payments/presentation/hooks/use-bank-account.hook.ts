import { useState, useEffect, useCallback } from 'react';
import { Linking, Alert, AppState, type AppStateStatus } from 'react-native';
import { paymentsRepository } from '../../data/repositories/payments.repository';
import type { BankAccountStatus } from '../../domain/entities/bank-account.entity';

// ─── useBankAccount ────────────────────────────────────────────────────────────
// Drives the entire BankAccountPage:
//   - loads the Stripe Connect status on mount
//   - opens the Stripe onboarding URL in the system browser
//   - reloads the status when the user returns to the app (AppState change)
//   - handles dashboard link + disconnect

export function useBankAccount() {
  const [status,       setStatus]       = useState<BankAccountStatus | null>(null);
  const [isLoading,    setIsLoading]    = useState(true);
  const [isActing,     setIsActing]     = useState(false);   // button spinner
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // When the user goes to the Stripe browser and comes back, we need to reload.
  // This flag prevents redundant reloads (only reload once per return trip).
  const [waitingForReturn, setWaitingForReturn] = useState(false);

  // ─── Load account status ─────────────────────────────────────────────────
  const loadStatus = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await paymentsRepository.getBankAccountStatus();
      setStatus(data);
    } catch {
      setErrorMessage('Impossible de charger les informations du compte.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  // ─── Reload when app comes back to foreground ─────────────────────────────
  // After the coach completes Stripe onboarding in the browser, they return to
  // the app via the deep link slforce://stripe-connect-return. We detect this
  // by watching AppState changes and reload the status once.
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (nextState === 'active' && waitingForReturn) {
          setWaitingForReturn(false);
          void loadStatus();
        }
      },
    );
    return () => subscription.remove();
  }, [waitingForReturn, loadStatus]);

  // ─── Start / resume onboarding ───────────────────────────────────────────
  // Creates (or resumes) the Stripe Express onboarding and opens the URL.
  const handleConnectAccount = useCallback(async () => {
    setIsActing(true);
    try {
      const onboardingUrl = await paymentsRepository.startBankAccountOnboarding();
      setWaitingForReturn(true);
      await Linking.openURL(onboardingUrl);
    } catch {
      Alert.alert(
        'Erreur',
        "Impossible d'ouvrir l'inscription Stripe. Vérifie ta connexion internet.",
      );
    } finally {
      setIsActing(false);
    }
  }, []);

  // ─── Open Stripe Express dashboard ───────────────────────────────────────
  const handleOpenDashboard = useCallback(async () => {
    setIsActing(true);
    try {
      const dashboardUrl = await paymentsRepository.getBankAccountDashboardUrl();
      await Linking.openURL(dashboardUrl);
    } catch {
      Alert.alert('Erreur', 'Impossible d\'ouvrir le tableau de bord Stripe.');
    } finally {
      setIsActing(false);
    }
  }, []);

  // ─── Disconnect account ───────────────────────────────────────────────────
  const handleDisconnect = useCallback(() => {
    Alert.alert(
      'Déconnecter le compte',
      'Cette action supprime définitivement ton compte Stripe et tu ne pourras plus recevoir de paiements. Es-tu sûr(e) ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text:    'Déconnecter',
          style:   'destructive',
          onPress: async () => {
            setIsActing(true);
            try {
              await paymentsRepository.disconnectBankAccount();
              setStatus({ isConnected: false });
            } catch {
              Alert.alert('Erreur', 'Impossible de déconnecter le compte.');
            } finally {
              setIsActing(false);
            }
          },
        },
      ],
    );
  }, []);

  return {
    status,
    isLoading,
    isActing,
    errorMessage,
    reload:               loadStatus,
    handleConnectAccount,
    handleOpenDashboard,
    handleDisconnect,
  };
}
