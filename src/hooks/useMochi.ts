import { useState, useCallback, useRef, useEffect } from 'react';
import { MochiProps } from '../components/Mochi';

export interface UseMochiResult {
  mochiProps: MochiProps & { visible: boolean; phrase: string | null };
  showMochi: (phrase?: string, variant?: MochiProps['variant']) => void;
  hideMochi: () => void;
  celebrate: () => void;
}

export const useMochi = (): UseMochiResult => {
  const [visible, setVisible] = useState(false);
  const [phrase, setPhrase] = useState<string | null>(null);
  const [variant, setVariant] = useState<MochiProps['variant']>('idle');
  const celebrateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (celebrateTimer.current) {
        clearTimeout(celebrateTimer.current);
      }
    };
  }, []);

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

  return {
    mochiProps: { variant, visible, phrase },
    showMochi,
    hideMochi,
    celebrate,
  };
};