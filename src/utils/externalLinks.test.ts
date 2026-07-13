import { Linking } from 'react-native';
import { openExternalUrl } from './externalLinks';

const mockedLinking = Linking as jest.Mocked<typeof Linking>;

describe('openExternalUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns opened when the url can be opened and launch succeeds', async () => {
    mockedLinking.canOpenURL.mockResolvedValue(true);
    mockedLinking.openURL.mockResolvedValue(undefined);

    await expect(openExternalUrl('https://gentlegames.org')).resolves.toBe('opened');

    expect(mockedLinking.canOpenURL).toHaveBeenCalledWith('https://gentlegames.org');
    expect(mockedLinking.openURL).toHaveBeenCalledWith('https://gentlegames.org');
  });

  it('returns unsupported without opening when the url cannot be opened', async () => {
    mockedLinking.canOpenURL.mockResolvedValue(false);

    await expect(openExternalUrl('https://gentlegames.org')).resolves.toBe('unsupported');

    expect(mockedLinking.canOpenURL).toHaveBeenCalledWith('https://gentlegames.org');
    expect(mockedLinking.openURL).not.toHaveBeenCalled();
  });

  it('returns failed when canOpenURL rejects and does not throw', async () => {
    mockedLinking.canOpenURL.mockRejectedValue(new Error('capability check exploded'));

    await expect(openExternalUrl('https://gentlegames.org')).resolves.toBe('failed');

    expect(mockedLinking.openURL).not.toHaveBeenCalled();
  });

  it('returns failed when openURL rejects and does not throw', async () => {
    mockedLinking.canOpenURL.mockResolvedValue(true);
    mockedLinking.openURL.mockRejectedValue(new Error('native open exploded'));

    await expect(openExternalUrl('https://gentlegames.org')).resolves.toBe('failed');

    expect(mockedLinking.canOpenURL).toHaveBeenCalledWith('https://gentlegames.org');
    expect(mockedLinking.openURL).toHaveBeenCalledWith('https://gentlegames.org');
  });
});
