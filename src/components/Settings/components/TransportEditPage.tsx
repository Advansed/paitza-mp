import React, { useEffect, useMemo, useState } from 'react';
import { FleetPage } from './FleetPage';
import { VehicleModal } from './VehicleModal';
import { useProfile } from '../useProfile';
import { TransportData } from '../../../Store/transportStore';
import { useTransport } from '../../../Store/useTransport';

export const TransportEditPage: React.FC = () => {
  const { transportData, transportItems, updateTransport, isTransportSaving, user_type } = useProfile();
  const { loadTypes, refresh } = useTransport();
  const [editing, setEditing] = useState<TransportData | null | undefined>(undefined);

  useEffect(() => {
    loadTypes();
  }, [loadTypes]);

  useEffect(() => {
    refresh();
  }, [refresh, user_type]);

  const vehicles = useMemo(() => {
    if (transportItems?.length) return transportItems;
    return transportData ? [transportData] : [];
  }, [transportItems, transportData]);

  const modalOpen = editing !== undefined;

  return (
    <div className="web-vehicles-page">
      <FleetPage
        vehicles={vehicles}
        onAdd={() => setEditing(null)}
        onOpen={(vehicle) => setEditing(vehicle)}
      />
      {modalOpen && (
        <VehicleModal
          vehicle={editing}
          saving={isTransportSaving}
          onClose={() => setEditing(undefined)}
          onSave={async (data) => {
            const ok = await updateTransport({
              guid: editing?.guid,
              ...data,
            });
            if (ok) setEditing(undefined);
          }}
        />
      )}
    </div>
  );
};
