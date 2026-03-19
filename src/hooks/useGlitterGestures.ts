import { useEffect, useRef, useCallback } from 'react';
import { Accelerometer } from 'expo-sensors';
import { EventSubscription } from 'expo-modules-core';
import { getMotionForce, shouldTriggerShake, MotionReading } from '../utils/glitterMotion';

interface UseGlitterGesturesOptions {
  onShake: () => void;
  onWake: () => void;
  enabled?: boolean;
}

export function useGlitterGestures({
  onShake,
  onWake,
  enabled = true,
}: UseGlitterGesturesOptions) {
  const lastShakeTime = useRef(0);
  const subscriptionRef = useRef<EventSubscription | null>(null);

  const handleShake = useCallback(() => {
    const now = Date.now();
    if (now - lastShakeTime.current > 500) {
      lastShakeTime.current = now;
      onShake();
    }
  }, [onShake]);

  const handleWake = useCallback(() => {
    onWake();
  }, [onWake]);

  useEffect(() => {
    if (!enabled) {
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
      return;
    }

    const subscription = Accelerometer.addListener((reading: MotionReading) => {
      getMotionForce(reading);
      if (shouldTriggerShake(reading, lastShakeTime.current, Date.now())) {
        handleShake();
      }
    });

    subscriptionRef.current = subscription;

    return () => {
      subscription.remove();
      subscriptionRef.current = null;
    };
  }, [enabled, handleShake]);

  return {
    handleShake,
    handleWake,
  };
}
