import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { MochiProps } from '../components/Mochi';

interface MochiContextValue {
  mochiProps: MochiProps & { visible: boolean; phrase: string | null };
  showMochi: (phrase?: string, variant?: MochiProps['variant']) => void;
  hideMochi: () => void;
  celebrate: () => void;
}

const MochiContext = createContext<MochiContextValue | null>(null);

export const MochiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [phrase, setPhrase] = useState<string | null>(null);
  const [variant, setVariant] = useState<MochiProps['variant']>('idle');
  const celebrateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showMochi = useCallback((p?: string, v?: MochiProps['variant']) => {
    setPhrase(p || null);
    setVariant(v || 'idle');
    setVisible(true);
  }, []);

  const hideMochi = useCallback(() => {
    setVisible(false);
    setPhrase(null);
    if (celebrateTimer.current) {
      clearTimeout(celebrateTimer.current);
      celebrateTimer.current = null;
    }
  }, []);

  const celebrate = useCallback(() => {
    setVariant('happy');
    setVisible(true);
    if (celebrateTimer.current) clearTimeout(celebrateTimer.current);
    celebrateTimer.current = setTimeout(() => {
      setVariant('idle');
      celebrateTimer.current = null;
    }, 1500);
  }, []);

  React.useEffect(() => {
    return () => {
      if (celebrateTimer.current) clearTimeout(celebrateTimer.current);
    };
  }, []);

  return (
    <MochiContext.Provider value={{ mochiProps: { variant, visible, phrase }, showMochi, hideMochi, celebrate }}>
      {children}
    </MochiContext.Provider>
  );
};

export const useMochiContext = (): MochiContextValue => {
  const ctx = useContext(MochiContext);
  if (!ctx) throw new Error('useMochiContext must be used within MochiProvider');
  return ctx;
};
