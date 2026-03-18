import { useMochiContext } from '../context/MochiContext';
import { MochiProps } from '../components/Mochi';

export interface UseMochiResult {
  mochiProps: MochiProps & { visible: boolean; phrase: string | null };
  showMochi: (phrase?: string, variant?: MochiProps['variant']) => void;
  hideMochi: () => void;
  celebrate: () => void;
}

export const useMochi = (): UseMochiResult => {
  return useMochiContext();
};
