import { Platform } from 'react-native';

type GuardEventName =
  | 'contextmenu'
  | 'dragstart'
  | 'gesturechange'
  | 'gestureend'
  | 'gesturestart'
  | 'selectstart'
  | 'touchmove'
  | 'touchstart'
  | 'wheel';

type GuardEvent = {
  ctrlKey?: boolean;
  preventDefault: () => void;
  target?: EventTarget | null;
  touches?: ArrayLike<unknown>;
};

type EventTargetLike = {
  addEventListener: (
    type: GuardEventName,
    listener: (event: GuardEvent) => void,
    options?: boolean | AddEventListenerOptions,
  ) => void;
  removeEventListener: (
    type: GuardEventName,
    listener: (event: GuardEvent) => void,
    options?: boolean | EventListenerOptions,
  ) => void;
};

export type BrowserLike = {
  document: EventTargetLike;
};

type ClosestCapableTarget = EventTarget & {
  closest: (selector: string) => Element | null;
};

const NON_PASSIVE_LISTENER: AddEventListenerOptions = { passive: false };
const EDITABLE_SELECTOR = 'input, textarea, select, [contenteditable="true"]';

const hasClosest = (target?: EventTarget | null): target is ClosestCapableTarget =>
  typeof (target as ClosestCapableTarget | null)?.closest === 'function';

const isEditableTarget = (target?: EventTarget | null) => {
  if (!hasClosest(target)) {
    return false;
  }

  return Boolean(target.closest(EDITABLE_SELECTOR));
};

const shouldBlockDefault = (event: GuardEvent) => !isEditableTarget(event.target);

export const installPwaInteractionGuards = (
  platformOS: string = Platform.OS,
  browser?: BrowserLike,
) => {
  if (platformOS !== 'web') {
    return () => {};
  }

  const activeBrowser =
    browser ?? (typeof window !== 'undefined' ? (window as unknown as BrowserLike) : undefined);
  const activeDocument = activeBrowser?.document;

  if (!activeDocument) {
    return () => {};
  }

  const cleanups: Array<() => void> = [];

  const addListener = (
    eventName: GuardEventName,
    listener: (event: GuardEvent) => void,
    options?: boolean | AddEventListenerOptions,
  ) => {
    activeDocument.addEventListener(eventName, listener, options);
    cleanups.push(() => {
      activeDocument.removeEventListener(eventName, listener, options);
    });
  };

  const preventBrowserUi = (event: GuardEvent) => {
    if (!shouldBlockDefault(event)) {
      return;
    }

    event.preventDefault();
  };

  const preventMultiTouchZoom = (event: GuardEvent) => {
    if ((event.touches?.length ?? 0) < 2) {
      return;
    }

    event.preventDefault();
  };

  const preventTrackpadZoom = (event: GuardEvent) => {
    if (!event.ctrlKey) {
      return;
    }

    event.preventDefault();
  };

  addListener('contextmenu', preventBrowserUi);
  addListener('dragstart', preventBrowserUi);
  addListener('selectstart', preventBrowserUi);
  addListener('gesturestart', preventBrowserUi, NON_PASSIVE_LISTENER);
  addListener('gesturechange', preventBrowserUi, NON_PASSIVE_LISTENER);
  addListener('gestureend', preventBrowserUi, NON_PASSIVE_LISTENER);
  addListener('touchstart', preventMultiTouchZoom, NON_PASSIVE_LISTENER);
  addListener('touchmove', preventMultiTouchZoom, NON_PASSIVE_LISTENER);
  addListener('wheel', preventTrackpadZoom, NON_PASSIVE_LISTENER);

  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
};
