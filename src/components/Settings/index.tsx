import React, { useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { SettingsPage } from './components/SettingsPage';
import { useProfile } from './useProfile';

/**
 * Настройки: режим, уведомления, согласия, безопасность.
 * Профиль и организация — /profile.
 * Транспорт — /vehicles.
 * Кошелёк — /finance.
 */

export const Settings: React.FC = () => {
  const { user_type, setUser } = useProfile();
  const history = useHistory();
  const params = useParams<{ name?: string }>();
  const routeName = params.name;

  useEffect(() => {
    // Старый путь `/…/account` → отдельный раздел финансов
    if (routeName === 'account') {
      history.replace('/finance');
    }
  }, [routeName, history]);

  const handleRoleChange = (nextType: number) => {
    if (nextType !== user_type) setUser({ user_type: nextType });
  };

  return (
    <SettingsPage onRoleChange={handleRoleChange} onBack={undefined} />
  );
};

export { SettingsPage } from './components/SettingsPage';
