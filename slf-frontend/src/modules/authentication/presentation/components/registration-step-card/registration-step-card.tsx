import React from 'react';
import { Animated, Text, View } from 'react-native';
import type { buildOnboardingScreenStyles } from '../../styles/register-onboarding-screen.styles';

type RegistrationStepCardProps = {
  styles:   ReturnType<typeof buildOnboardingScreenStyles>;
  fadeAnim: Animated.Value;
  icon:     string;
  title:    string;
  subtitle: string;
  children: React.ReactNode;
};

export function RegistrationStepCard({
  styles,
  fadeAnim,
  icon,
  title,
  subtitle,
  children,
}: RegistrationStepCardProps) {
  return (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
      <View style={styles.iconWrapper}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepSubtitle}>{subtitle}</Text>
      {children}
    </Animated.View>
  );
}
