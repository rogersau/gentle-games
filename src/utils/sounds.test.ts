import { Settings } from '../types';

// Mock the sounds module
jest.mock('./sounds', () => ({
  initializeSounds: jest.fn(() => Promise.resolve()),
  playFlipSound: jest.fn(() => Promise.resolve()),
  playMatchSound: jest.fn(() => Promise.resolve()),
  playCompleteSound: jest.fn(() => Promise.resolve()),
  playBubblePopSound: jest.fn(() => Promise.resolve()),
  unloadSounds: jest.fn(() => Promise.resolve()),
}));

// Import the mocked module
import {
  initializeSounds,
  playFlipSound,
  playMatchSound,
  playCompleteSound,
  playBubblePopSound,
  unloadSounds,
} from './sounds';

describe('sounds (mocked)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initializeSounds', () => {
    it('can be called without errors', async () => {
      await initializeSounds();
      expect(initializeSounds).toHaveBeenCalled();
    });
  });

  describe('playFlipSound', () => {
    it('can be called with settings', async () => {
      const settings: Settings = {
        difficulty: 'medium',
        theme: 'animals',
        soundEnabled: true,
        soundVolume: 0.7,
        animationsEnabled: true,
        colorMode: 'light',
        showCardPreview: false,
        keepyUppyEasyMode: true,
        hiddenGames: [],
        parentTimerMinutes: 0,
        language: 'en-AU',
        enableUnfinishedGames: false,
        reducedMotionEnabled: false,
        telemetryEnabled: false,
        showMochiInGames: true,
      };

      await playFlipSound(settings);
      expect(playFlipSound).toHaveBeenCalledWith(settings);
    });
  });

  describe('playMatchSound', () => {
    it('can be called with settings', async () => {
      const settings: Settings = {
        difficulty: 'medium',
        theme: 'animals',
        soundEnabled: true,
        soundVolume: 0.7,
        animationsEnabled: true,
        colorMode: 'light',
        showCardPreview: false,
        keepyUppyEasyMode: true,
        hiddenGames: [],
        parentTimerMinutes: 0,
        language: 'en-AU',
        enableUnfinishedGames: false,
        reducedMotionEnabled: false,
        telemetryEnabled: false,
        showMochiInGames: true,
      };

      await playMatchSound(settings);
      expect(playMatchSound).toHaveBeenCalledWith(settings);
    });
  });

  describe('playCompleteSound', () => {
    it('can be called with settings', async () => {
      const settings: Settings = {
        difficulty: 'medium',
        theme: 'animals',
        soundEnabled: true,
        soundVolume: 0.7,
        animationsEnabled: true,
        colorMode: 'light',
        showCardPreview: false,
        keepyUppyEasyMode: true,
        hiddenGames: [],
        parentTimerMinutes: 0,
        language: 'en-AU',
        enableUnfinishedGames: false,
        reducedMotionEnabled: false,
        telemetryEnabled: false,
        showMochiInGames: true,
      };

      await playCompleteSound(settings);
      expect(playCompleteSound).toHaveBeenCalledWith(settings);
    });
  });

  describe('playBubblePopSound', () => {
    it('can be called with settings', async () => {
      const settings: Settings = {
        difficulty: 'medium',
        theme: 'animals',
        soundEnabled: true,
        soundVolume: 0.7,
        animationsEnabled: true,
        colorMode: 'light',
        showCardPreview: false,
        keepyUppyEasyMode: true,
        hiddenGames: [],
        parentTimerMinutes: 0,
        language: 'en-AU',
        enableUnfinishedGames: false,
        reducedMotionEnabled: false,
        telemetryEnabled: false,
        showMochiInGames: true,
      };

      await playBubblePopSound(settings);
      expect(playBubblePopSound).toHaveBeenCalledWith(settings);
    });
  });

  describe('unloadSounds', () => {
    it('can be called without errors', async () => {
      await unloadSounds();
      expect(unloadSounds).toHaveBeenCalled();
    });
  });
});
