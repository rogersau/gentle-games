import { useEffect, useRef, useCallback } from 'react';
import { Accelerometer } from 'expo-sensors';
import { EventSubscription } from 'expo-modules-core';
import { shouldTriggerShake, MotionReading } from '../utils/glitterMotion';

interface UseGlitterGesturesOptions {
  onShake: () => void;
  enabled?: boolean;
}

export function useGlitterGestures({ onShake, enabled = true }: UseGlitterGesturesOptions) {
  const lastShakeTime = useRef(0);
  const subscriptionRef = useRef<EventSubscription | null>(null);
  const onShakeRef = useRef(onShake);

  useEffect(() => {
    onShakeRef.current = onShake;
  }, [onShake]);

  const handleShake = useCallback(() => {
    if (!enabled) return;
    const now = Date.now();
    if (now - lastShakeTime.current > 500) {
      lastShakeTime.current = now;
      onShakeRef.current();
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled || subscriptionRef.current) {
      return;
    }

    let cancelled = false;

    const subscribeToAccelerometer = async () => {
      try {
        if (!(await Accelerometer.isAvailableAsync()) || cancelled) {
          return;
        }

        const subscription = Accelerometer.addListener((reading: MotionReading) => {
          if (shouldTriggerShake(reading, lastShakeTime.current, Date.now())) {
            handleShake();
          }
        });

        if (cancelled) {
          subscription.remove();
          return;
        }

        subscriptionRef.current = subscription;
      } catch {
        // Sensors are optional; touch interaction remains available without them.
      }
    };

    void subscribeToAccelerometer();

    return () => {
      cancelled = true;
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };
  }, [enabled, handleShake]);

  return {
    handleShake,
  };
}
