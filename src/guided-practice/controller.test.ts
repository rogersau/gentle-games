import { createGuidedRoundController } from './controller';

describe('guided round controller', () => {
  it('progresses from an independent attempt through hinting and modelling', () => {
    const controller = createGuidedRoundController({ hintAfter: 1, modelAfter: 2 });

    expect(controller.getState().phase).toBe('independent');
    expect(controller.attempt(false).phase).toBe('hinted');
    expect(controller.attempt(false).phase).toBe('modelled');
  });

  it('requires the corrected action after modelling before advancing', () => {
    const controller = createGuidedRoundController();
    controller.attempt(false);
    controller.attempt(false);

    expect(controller.startNextExample().exampleNumber).toBe(1);
    expect(controller.attempt(true).phase).toBe('corrected');
    expect(controller.startNextExample()).toMatchObject({
      phase: 'independent',
      exampleNumber: 2,
      incorrectAttempts: 0,
    });
  });

  it('supports instruction replay and an explicit skip', () => {
    const controller = createGuidedRoundController();

    expect(controller.replayInstructions().instructionReplayCount).toBe(1);
    expect(controller.skip().phase).toBe('skipped');
    expect(controller.startNextExample().phase).toBe('independent');
  });

  it('lets the child request a hint without counting an incorrect attempt', () => {
    const controller = createGuidedRoundController();

    expect(controller.showHint()).toMatchObject({ phase: 'hinted', incorrectAttempts: 0 });
    expect(controller.showHint().phase).toBe('hinted');
  });

  it('records support only when local progress recording is enabled', () => {
    const onRecordSupport = jest.fn();
    const privateController = createGuidedRoundController({ onRecordSupport });
    privateController.attempt(true);
    expect(onRecordSupport).not.toHaveBeenCalled();

    const recordingController = createGuidedRoundController({
      recordProgress: true,
      onRecordSupport,
    });
    recordingController.attempt(false);
    recordingController.attempt(true);
    expect(onRecordSupport).toHaveBeenCalledWith('hinted');
  });

  it('cancels registered delayed work on teardown and ignores later actions', () => {
    const cancel = jest.fn();
    const controller = createGuidedRoundController();
    controller.registerCancellation(cancel);
    controller.dispose();

    expect(cancel).toHaveBeenCalledTimes(1);
    expect(controller.attempt(false).phase).toBe('independent');
  });
});
