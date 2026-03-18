import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ViewStyle,
  Animated,
  Easing,
  Dimensions,
  Platform,
  LayoutChangeEvent,
} from 'react-native';
import { useThemeColors } from '../../utils/theme';
import { Space, TypeStyle, Radius } from '../../ui/tokens';
import { ThemeColors } from '../../types';
import { useSettings } from '../../context/SettingsContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Animation timing constants (in milliseconds)
const BASKET_ANIMATION = {
  ENTRY_DURATION: 1500,
  EXIT_DURATION: 1500,
  SUCCESS_DELAY: 800,
};

interface PicnicBasketProps {
  items: string[];
  targetCount: number;
  onPress: () => void;
  onDropZoneLayout?: (layout: { x: number; y: number; width: number; height: number }) => void;
  isDropTarget?: boolean;
  isSuccess?: boolean;
  onAnimationComplete?: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

export const PicnicBasket: React.FC<PicnicBasketProps> = ({
  items,
  targetCount,
  onDropZoneLayout,
  isDropTarget = false,
  isSuccess = false,
  onAnimationComplete,
  style,
  testID,
}) => {
  const { colors } = useThemeColors();
  const { settings } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const basketRef = useRef<View>(null);
  
  // Animation state
  const [basketPhase, setBasketPhase] = useState<'entering' | 'waiting' | 'exiting' | 'offscreen'>('entering');
  const basketPosition = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const basketOpacity = useRef(new Animated.Value(0)).current;
  const dropHighlight = useRef(new Animated.Value(0)).current;
  
  // Track previous item count for animation
  const prevCountRef = useRef(items.length);
  const itemAnimationsRef = useRef<Map<number, Animated.Value>>(new Map());

  const isFull = items.length >= targetCount;
  const isCorrect = items.length === targetCount;
  
  // Show up to 12 items inside the basket
  const displayItems = items.slice(0, 12);
  const remainingCount = Math.max(0, items.length - 12);

  const measureDropZone = React.useCallback(() => {
    if (!basketRef.current || !onDropZoneLayout) {
      return;
    }

    basketRef.current.measureInWindow?.((x, y, width, height) => {
      onDropZoneLayout({ x, y, width, height });
    });
  }, [onDropZoneLayout]);

  const handleDropZoneLayout = (_event: LayoutChangeEvent) => {
    if (basketRef.current?.measureInWindow) {
      measureDropZone();
      return;
    }

    const { layout } = _event.nativeEvent;
    onDropZoneLayout?.({
      x: layout.x,
      y: layout.y,
      width: layout.width,
      height: layout.height,
    });
  };

  // Measure drop zone layout
  useEffect(() => {
    if (basketPhase === 'waiting') {
      measureDropZone();
    }
  }, [basketPhase, measureDropZone]);

  // Start basket entry animation
  const startBasketEntry = () => {
    setBasketPhase('entering');
    basketPosition.setValue(SCREEN_WIDTH);
    basketOpacity.setValue(0);

    if (settings.animationsEnabled && !settings.reducedMotionEnabled) {
      Animated.parallel([
        Animated.timing(basketPosition, {
          toValue: 0,
          duration: BASKET_ANIMATION.ENTRY_DURATION,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(basketOpacity, {
          toValue: 1,
          duration: BASKET_ANIMATION.ENTRY_DURATION * 0.5,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start(() => {
        setBasketPhase('waiting');
      });
    } else {
      basketPosition.setValue(0);
      basketOpacity.setValue(1);
      setBasketPhase('waiting');
    }
  };

  // Start basket exit animation
  const startBasketExit = () => {
    setBasketPhase('exiting');

    if (settings.animationsEnabled && !settings.reducedMotionEnabled) {
      Animated.parallel([
        Animated.timing(basketPosition, {
          toValue: -SCREEN_WIDTH,
          duration: BASKET_ANIMATION.EXIT_DURATION,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(basketOpacity, {
          toValue: 0,
          duration: BASKET_ANIMATION.EXIT_DURATION,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start(() => {
        setBasketPhase('offscreen');
        onAnimationComplete?.();
      });
    } else {
      basketPosition.setValue(-SCREEN_WIDTH);
      basketOpacity.setValue(0);
      setBasketPhase('offscreen');
      onAnimationComplete?.();
    }
  };

  // Trigger exit animation on success
  useEffect(() => {
    if (isSuccess && basketPhase === 'waiting') {
      const timeoutId = setTimeout(() => {
        startBasketExit();
      }, BASKET_ANIMATION.SUCCESS_DELAY);
      return () => clearTimeout(timeoutId);
    }
  }, [isSuccess, basketPhase]);

  // Animate drop highlight
  useEffect(() => {
    if (isDropTarget && basketPhase === 'waiting') {
      Animated.timing(dropHighlight, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(dropHighlight, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [isDropTarget, basketPhase]);

  // Start entry on mount
  useEffect(() => {
    startBasketEntry();
  }, []);

  // Animate new items
  useEffect(() => {
    const currentCount = items.length;
    const prevCount = prevCountRef.current;
    
    if (currentCount > prevCount) {
      const newItemIndices = [];
      for (let i = prevCount; i < currentCount; i++) {
        newItemIndices.push(i);
        if (!itemAnimationsRef.current.has(i)) {
          itemAnimationsRef.current.set(i, new Animated.Value(0));
        }
      }
      
      const duration = settings.animationsEnabled && !settings.reducedMotionEnabled
        ? 400
        : 50;
        
      newItemIndices.forEach((index) => {
        const animValue = itemAnimationsRef.current.get(index);
        if (animValue) {
          animValue.setValue(0);
          Animated.timing(animValue, {
            toValue: 1,
            duration,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: Platform.OS !== 'web',
          }).start();
        }
      });
    }
    
    prevCountRef.current = currentCount;
  }, [items.length, settings.animationsEnabled, settings.reducedMotionEnabled]);

  const getItemAnimatedStyle = (index: number) => {
    const animValue = itemAnimationsRef.current.get(index);
    if (!animValue) {
      return {
        transform: [{ scale: 1 }],
        opacity: 1,
      };
    }
    
    return {
      transform: [
        {
          scale: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          }),
        },
      ],
      opacity: animValue,
    };
  };

  const animatedBasketStyle = {
    transform: [{ translateX: basketPosition }],
    opacity: basketOpacity,
  };

  const highlightStyle = {
    borderColor: dropHighlight.interpolate({
      inputRange: [0, 1],
      outputRange: [colors.border, colors.success],
    }),
    borderWidth: dropHighlight.interpolate({
      inputRange: [0, 1],
      outputRange: [4, 6],
    }),
  };

  return (
    <Animated.View style={[styles.container, animatedBasketStyle, style]}>
      <View style={styles.basketContainer}>
        {/* Basket Handle */}
        <View style={styles.handle} />
        
        {/* Basket Body */}
        <Animated.View 
          ref={basketRef}
          onLayout={handleDropZoneLayout}
          testID={testID ? `${testID}-drop-zone` : undefined}
          style={[
            styles.basket,
            isCorrect && styles.basketCorrect,
            isFull && !isCorrect && styles.basketFull,
            highlightStyle,
          ]}
        >
          {/* Basket Top Rim */}
          <View style={styles.rim} />
          
          {/* Items Preview */}
          <View style={styles.itemsArea}>
            {displayItems.length > 0 ? (
              <>
                <View style={styles.itemsGrid}>
                  {displayItems.map((emoji, index) => (
                    <Animated.View 
                      key={`${emoji}-${index}`}
                      style={getItemAnimatedStyle(index)}
                    >
                      <Text style={styles.itemEmoji} selectable={false}>
                        {emoji}
                      </Text>
                    </Animated.View>
                  ))}
                </View>
                {remainingCount > 0 && (
                  <Text style={styles.moreIndicator}>
                    +{remainingCount} more
                  </Text>
                )}
              </>
            ) : (
              <Text style={styles.emptyText}>
                Drag items here!
              </Text>
            )}
          </View>
          
          {/* Count Badge */}
          <View style={[
            styles.countBadge,
            isCorrect && styles.countBadgeCorrect,
            isFull && !isCorrect && styles.countBadgeFull,
          ]}>
            <Text style={styles.countText}>
              {items.length}/{targetCount}
            </Text>
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingHorizontal: Space.md,
    },
    basketContainer: {
      height: 220,
      alignItems: 'center',
      position: 'relative',
    },
    handle: {
      width: 100,
      height: 40,
      borderWidth: 4,
      borderColor: colors.border,
      borderBottomWidth: 0,
      borderRadius: 50,
      marginBottom: -15,
      zIndex: 1,
      backgroundColor: 'transparent',
    },
    basket: {
      width: 280,
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 4,
      borderColor: colors.border,
      height: 180,
      paddingHorizontal: Space.md,
      paddingTop: Space.lg,
      paddingBottom: Space.md,
      position: 'relative',
    },
    basketCorrect: {
      borderColor: colors.success,
      backgroundColor: `${colors.success}20`,
    },
    basketFull: {
      borderColor: colors.danger,
      backgroundColor: `${colors.danger}15`,
    },
    rim: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 8,
      backgroundColor: colors.border,
      borderTopLeftRadius: Radius.lg - 4,
      borderTopRightRadius: Radius.lg - 4,
    },
    itemsArea: {
      height: 100,
      justifyContent: 'center',
      alignItems: 'center',
    },
    itemsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
      gap: Space.xs,
      maxWidth: 240,
    },
    itemEmoji: {
      fontSize: 24,
      textAlign: 'center',
    },
    moreIndicator: {
      ...TypeStyle.bodySm,
      color: colors.textLight,
      marginTop: Space.xs,
    },
    emptyText: {
      ...TypeStyle.body,
      color: colors.textLight,
      textAlign: 'center',
      fontStyle: 'italic',
    },
    countBadge: {
      position: 'absolute',
      bottom: -12,
      alignSelf: 'center',
      backgroundColor: colors.primary,
      paddingHorizontal: Space.md,
      paddingVertical: Space.xs,
      borderRadius: 20,
      borderWidth: 3,
      borderColor: colors.surface,
    },
    countBadgeCorrect: {
      backgroundColor: colors.success,
    },
    countBadgeFull: {
      backgroundColor: colors.danger,
    },
    countText: {
      ...TypeStyle.label,
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
  });
