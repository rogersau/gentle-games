import { Linking } from 'react-native';

export type ExternalUrlOpenResult = 'opened' | 'unsupported' | 'failed';

export const openExternalUrl = async (url: string): Promise<ExternalUrlOpenResult> => {
  try {
    const supported = await Linking.canOpenURL(url);

    if (!supported) {
      return 'unsupported';
    }

    await Linking.openURL(url);
    return 'opened';
  } catch {
    return 'failed';
  }
};
