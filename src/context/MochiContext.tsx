import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
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
  const autoHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queuedShow = useRef<{ phrase: string | null; variant: MochiProps['variant'] } | null>(null);
  const [isShowing, setIsShowing] = useState(false);

  const hideMochiInternal = useCallback(() => {
    setVisible(false);
    setPhrase(null);
    setIsShowing(false);
    if (autoHideTimer.current) {
      clearTimeout(autoHideTimer.current);
      autoHideTimer.current = null;
    }

    if (queuedShow.current) {
      const next = queuedShow.current;
      queuedShow.current = null;
      setTimeout(() => {
        setPhrase(next.phrase || null);
        setVariant(next.variant || 'idle');
        setVisible(true);
        setIsShowing(true);
        autoHideTimer.current = setTimeout(() => {
          hideMochiInternal();
        }, 3000);
      }, 300);
    }
  }, []);

  const showMochi = useCallback((p?: string, v?: MochiProps['variant']) => {
    const payload = { phrase: p || null, variant: v || 'idle' };

    if (isShowing) {
      if (!queuedShow.current) {
        queuedShow.current = payload;
      }
      return;
    }

    setPhrase(payload.phrase);
    setVariant(payload.variant);
    setVisible(true);
    setIsShowing(true);

    if (autoHideTimer.current) clearTimeout(autoHideTimer.current);
    autoHideTimer.current = setTimeout(() => {
      hideMochiInternal();
    }, 3000);
  }, [isShowing, hideMochiInternal]);

  const hideMochi = useCallback(() => {
    hideMochiInternal();
  }, [hideMochiInternal]);

  const celebrate = useCallback(() => {
    setVariant('happy');
    setVisible(true);
    if (celebrateTimer.current) clearTimeout(celebrateTimer.current);
    celebrateTimer.current = setTimeout(() => {
      setVariant('idle');
      celebrateTimer.current = null;
    }, 1500);
  }, []);

  useEffect(() => {
    return () => {
      if (celebrateTimer.current) clearTimeout(celebrateTimer.current);
      if (autoHideTimer.current) clearTimeout(autoHideTimer.current);
    };
  }, []);

  return (
    <MochiContext.Provider
      value={{ mochiProps: { variant, visible, phrase }, showMochi, hideMochi, celebrate }}
    >
      {children}
    </MochiContext.Provider>
  );
};

export const useMochiContext = (): MochiContextValue => {
  const ctx = useContext(MochiContext);
  if (!ctx) throw new Error('useMochiContext must be used within MochiProvider');
  return ctx;
};
