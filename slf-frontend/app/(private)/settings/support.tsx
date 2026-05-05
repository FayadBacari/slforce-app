import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import { useTheme } from '@shared/theme/theme-provider';
import { AppScreenWrapper } from '@shared/components/app-screen-wrapper/app-screen-wrapper';
import { buildSupportStyles } from '@screen-styles/settings/support.styles';

// A single FAQ item that expands/collapses on press
interface FaqItemProps {
  question:   string;
  answer:     string;
  isExpanded: boolean;
  onPress:    () => void;
  styles:     ReturnType<typeof buildSupportStyles>;
}

const FAQ_ITEMS = [
  {
    question: 'Comment envoyer un paiement à mon coach ?',
    answer:   "Ouvre la conversation avec ton coach, appuie sur le menu ⋮ en haut à droite, puis sélectionne « Effectuer un paiement ». Choisis un montant prédéfini ou saisis le tien, ajoute une note si besoin, puis appuie sur « Payer ». Le paiement est traité de façon sécurisée via Stripe (carte bancaire, Apple Pay ou Google Pay).",
  },
  {
    question: 'Comment modifier mon profil ?',
    answer:   'Va dans Paramètres → Mon profil. Tu peux y modifier ton prénom, nom, e-mail et photo de profil.',
  },
  {
    question: "Comment changer la langue de l'application ?",
    answer:   'Va dans Paramètres → Langue et sélectionne ta langue préférée.',
  },
  {
    question: 'Comment activer le mode sombre ?',
    answer:   'Va dans Paramètres et appuie sur "Mode sombre" pour l\'activer ou le désactiver.',
  },
  {
    question: 'Comment supprimer mon compte ?',
    answer:   'Va dans Paramètres → Supprimer mon compte. Cette action est irréversible. Toutes tes données seront définitivement supprimées.',
  },
];

export default function SupportPage() {
  const { theme } = useTheme();
  const styles = buildSupportStyles(theme);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);

  function toggleFaqItem(index: number) {
    setExpandedFaqIndex((previous) => (previous === index ? null : index));
  }

  async function openEmailSupport() {
    const url = 'mailto:slforce.app@gmail.com?subject=Aide%20SLForce';
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert(
        'Aucune application mail',
        'Aucune application e-mail n\'est configurée sur cet appareil.\n\nContacte-nous directement à :\nslforce.app@gmail.com',
        [{ text: 'OK' }],
      );
    }
  }

  return (
    <AppScreenWrapper>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* FAQ Section */}
        <Text style={styles.sectionTitle}>Questions fréquentes</Text>

        <View style={styles.faqList}>
          {FAQ_ITEMS.map((item, index) => (
            <FaqItem
              key={index}
              question={item.question}
              answer={item.answer}
              isExpanded={expandedFaqIndex === index}
              onPress={() => toggleFaqItem(index)}
              styles={styles}
            />
          ))}
        </View>

        {/* Contact section */}
        <Text style={styles.sectionTitle}>Contacter le support</Text>

        <TouchableOpacity style={styles.contactCard} onPress={openEmailSupport}>
          <Text style={styles.contactIcon}>✉️</Text>
          <View style={styles.contactTextSection}>
            <Text style={styles.contactLabel}>Envoyer un e-mail</Text>
            <Text style={styles.contactSubLabel}>slforce.app@gmail.com</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

      </ScrollView>
    </AppScreenWrapper>
  );
}

function FaqItem({ question, answer, isExpanded, onPress, styles }: FaqItemProps) {
  return (
    <View style={styles.faqItem}>
      <TouchableOpacity style={styles.faqQuestion} onPress={onPress} activeOpacity={0.7}>
        <Text style={styles.faqQuestionText}>{question}</Text>
        <Text style={[styles.faqChevron, isExpanded && styles.faqChevronExpanded]}>›</Text>
      </TouchableOpacity>
      {isExpanded && (
        <Text style={styles.faqAnswer}>{answer}</Text>
      )}
    </View>
  );
}
