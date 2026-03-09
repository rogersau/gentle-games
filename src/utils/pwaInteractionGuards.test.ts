import { installPwaInteractionGuards, type BrowserLike } from './pwaInteractionGuards';

type MockDocument = BrowserLike['document'] & {
  addEventListener: jest.Mock;
  removeEventListener: jest.Mock;
};

const createMockBrowser = (): { browser: BrowserLike; document: MockDocument } => {
  const document: MockDocument = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };

  return {
    browser: { document },
    document,
  };
};

const getListener = (document: MockDocument, eventName: string) =>
  document.addEventListener.mock.calls.find(([type]) => type === eventName)?.[1] as
    | ((event: { preventDefault: () => void; target?: EventTarget | null; touches?: ArrayLike<unknown>; ctrlKey?: boolean }) => void)
    | undefined;

describe('pwaInteractionGuards', () => {
  it('returns a no-op cleanup outside web', () => {
    const { browser, document } = createMockBrowser();
    const cleanup = installPwaInteractionGuards('ios', browser);

    expect(document.addEventListener).not.toHaveBeenCalled();
    expect(() => cleanup()).not.toThrow();
  });

  it('returns a no-op cleanup when browser is unavailable', () => {
    const cleanup = installPwaInteractionGuards('web', undefined);
    expect(() => cleanup()).not.toThrow();
  });

  it('installs and removes the expected document listeners on web', () => {
    const { browser, document } = createMockBrowser();
    const cleanup = installPwaInteractionGuards('web', browser);

    expect(document.addEventListener).toHaveBeenCalledWith(
      'touchmove',
      expect.any(Function),
      { passive: false },
    );
    expect(document.addEventListener).toHaveBeenCalledWith(
      'wheel',
      expect.any(Function),
      { passive: false },
    );

    cleanup();

    expect(document.removeEventListener).toHaveBeenCalledTimes(document.addEventListener.mock.calls.length);
  });

  it('prevents selection-style browser UI on non-editable targets', () => {
    const { browser, document } = createMockBrowser();
    installPwaInteractionGuards('web', browser);
    const preventDefault = jest.fn();
    const target = { closest: jest.fn().mockReturnValue(null) } as unknown as EventTarget;

    getListener(document, 'selectstart')?.({ preventDefault, target });
    getListener(document, 'contextmenu')?.({ preventDefault, target });
    getListener(document, 'dragstart')?.({ preventDefault, target });

    expect(preventDefault).toHaveBeenCalledTimes(3);
  });

  it('allows editable controls to keep native selection behavior', () => {
    const { browser, document } = createMockBrowser();
    installPwaInteractionGuards('web', browser);
    const preventDefault = jest.fn();
    const target = { closest: jest.fn().mockReturnValue({}) } as unknown as EventTarget;

    getListener(document, 'selectstart')?.({ preventDefault, target });
    getListener(document, 'contextmenu')?.({ preventDefault, target });

    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('blocks multi-touch zoom gestures and ctrl-wheel zoom', () => {
    const { browser, document } = createMockBrowser();
    installPwaInteractionGuards('web', browser);
    const preventDefault = jest.fn();

    getListener(document, 'touchstart')?.({ preventDefault, touches: [{}, {}] });
    getListener(document, 'touchmove')?.({ preventDefault, touches: [{}, {}] });
    getListener(document, 'gesturestart')?.({ preventDefault, target: null });
    getListener(document, 'wheel')?.({ preventDefault, ctrlKey: true });

    expect(preventDefault).toHaveBeenCalledTimes(4);
  });

  it('ignores single-touch movement and ordinary wheel scrolling', () => {
    const { browser, document } = createMockBrowser();
    installPwaInteractionGuards('web', browser);
    const preventDefault = jest.fn();

    getListener(document, 'touchmove')?.({ preventDefault, touches: [{}] });
    getListener(document, 'wheel')?.({ preventDefault, ctrlKey: false });

    expect(preventDefault).not.toHaveBeenCalled();
  });
});
