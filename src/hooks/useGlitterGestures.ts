import { useEffect, useRef, useCallback } from 'react';
import { Accelerometer } from 'expo-sensors';
import { EventSubscription } from 'expo-modules-core';
import { getMotionForce, shouldTriggerShake, MotionReading } from '../utils/glitterMotion';

interface UseGlitterGesturesOptions {
  onShake: () => void;
  onWake: () => void;
  enabled?: boolean;
}

export function useGlitterGestures({ onShake, onWake, enabled = true }: UseGlitterGesturesOptions) {
  const lastShakeTime = useRef(0);
  const subscriptionRef = useRef<EventSubscription | null>(null);
  const onShakeRef = useRef(onShake);
  const onWakeRef = useRef(onWake);

  useEffect(() => {
    onShakeRef.current = onShake;
    onWakeRef.current = onWake;
  }, [onShake, onWake]);

  const handleShake = useCallback(() => {
    const now = Date.now();
    if (now - lastShakeTime.current > 500) {
      lastShakeTime.current = now;
      onShakeRef.current();
    }
  }, []);

  const handleWake = useCallback(() => {
    onWakeRef.current();
  }, []);

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
          getMotionForce(reading);
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
    handleWake,
  };
}
