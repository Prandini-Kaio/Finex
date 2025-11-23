import React from 'react';
import { SettingsProvider, CreditCardList, CategoryManager, SystemStats } from '../contexts/settings';
import { PageHeader } from '../components/ui';

export const SettingsView: React.FC = () => {
  return (
    <SettingsProvider>
      <div className="space-y-6">
        <PageHeader title="Configurações" />

        <SettingsContent />
      </div>
    </SettingsProvider>
  );
};

const SettingsContent: React.FC = () => {
  const [showCreditCardModal, setShowCreditCardModal] = React.useState(false);

  return (
    <div className="space-y-6">
      <CreditCardList onAddCard={() => setShowCreditCardModal(true)} />
      <CategoryManager />
      <SystemStats />
    </div>
  );
};

