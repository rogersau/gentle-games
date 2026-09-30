import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { initializeSounds, playFlipSound, unloadSounds } from './sounds';
import { Settings } from '../types';

jest.unmock('./sounds');

const settings = { soundEnabled: true, soundVolume: 0.7 } as Settings;

describe('real sound effect lifecycle', () => {
  beforeEach(async () => {
    await unloadSounds();
    jest.clearAllMocks();
  });
  afterEach(() => unloadSounds());

  it('respects the device silent switch and does not recreate loaded players', async () => {
    await initializeSounds();
    await initializeSounds();
    expect(setAudioModeAsync).toHaveBeenCalledWith({
      playsInSilentMode: false,
      shouldPlayInBackground: false,
    });
    expect(createAudioPlayer).toHaveBeenCalledTimes(4);
  });

  it('does not play muted effects and caps playback volume', async () => {
    await initializeSounds();
    const player = jest.mocked(createAudioPlayer).mock.results[0].value;
    await playFlipSound({ ...settings, soundEnabled: false });
    expect(player.play).not.toHaveBeenCalled();
    await playFlipSound(settings);
    expect(player.volume).toBeCloseTo(0.7 * 0.5 * 0.6);
    expect(player.seekTo).toHaveBeenCalledWith(0);
    expect(player.play).toHaveBeenCalledTimes(1);
  });

  it('cancels player creation if sounds are disabled while audio mode setup is pending', async () => {
    let finishSetup!: () => void;
    jest.mocked(setAudioModeAsync).mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishSetup = resolve;
        }),
    );
    const initialize = initializeSounds();
    await unloadSounds();
    finishSetup();
    await initialize;
    expect(createAudioPlayer).not.toHaveBeenCalled();
  });

  it('removes loaded players and stops future playback on unload', async () => {
    await initializeSounds();
    const players = jest.mocked(createAudioPlayer).mock.results.map(({ value }) => value);
    await unloadSounds();
    for (const player of players) expect(player.remove).toHaveBeenCalledTimes(1);
    await playFlipSound(settings);
    for (const player of players) expect(player.play).not.toHaveBeenCalled();
  });
});
