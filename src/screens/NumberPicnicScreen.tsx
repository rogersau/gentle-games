import React, { useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { NumberPicnicGroup, NumberPicnicMode, ThemeColors } from '../types';
import { useSettings } from '../context/SettingsContext';
import { useNumberPicnicGame } from '../utils/numberPicnicLogic';
import { useThemeColors } from '../utils/theme';
import { AppScreen, AppHeader, AppCard, AppButton, GuidedPracticePrompt } from '../ui/components';
import { Space, TypeStyle } from '../ui/tokens';
import {
  NumberPicnicChoice,
  NumberPicnicRepresentation,
  PicnicBasket,
  PicnicBlanket,
} from '../components/numberpicnic';
import type { TranslationKey } from '../i18n/types';
import { getGameSettings, maxQuantityToStage } from '../games/settings';

interface WindowRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const translate = (t: TFunction, key: string, options?: Record<string, unknown>) =>
  t(key as TranslationKey, options);

export const NumberPicnicScreen: React.FC = () => {
  const navigation = useNavigation();
  const { settings } = useSettings();
  const { colors } = useThemeColors();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const scrollViewRef = useRef<ScrollView>(null);
  const [basketLayout, setBasketLayout] = useState<WindowRect | null>(null);
  const [basketMeasureRequest, setBasketMeasureRequest] = useState(0);
  const picnicSettings = getGameSettings(settings, 'number-picnic');
  const stage = picnicSettings.stage ?? maxQuantityToStage(picnicSettings.maxQuantity);
  const mode: NumberPicnicMode = picnicSettings.mode ?? 'make-amount';

  const {
    prompt,
    basketCount,
    isProcessing,
    isDragging,
    isOverBasket,
    isSuccess,
    blanketItemCount,
    blanketItemIds,
    basketItems,
    basketItemIds,
    isComplete,
    hasCompletionAnnouncement,
    guidedRound,
    handleDropStart,
    handleItemDrop,
    handleBasketItemPress,
    handleUndo,
    handleReset,
    handleDropEnd,
    handleDragOverBasket,
    handleChoice,
    showHint,
    skipRound,
    replayInstructions,
    startNewRound,
  } = useNumberPicnicGame(stage, {
    mode,
    settings,
    spokenCounting: picnicSettings.spokenCounting,
  });

  const getItemName = (count: number) =>
    translate(
      t,
      `games.numberPicnic.${count === 1 ? 'itemsSingular' : 'items'}.${prompt.itemName}`,
    );
  const getItemCountWord = (count: number) =>
    t(`games.numberPicnic.itemCount.${count === 1 ? 'one' : 'other'}`);
  const targetItemName = getItemName(prompt.targetCount);
  const isPlacementMode = mode === 'make-amount' || mode === 'add-one-more';
  const isChoiceMode = !isPlacementMode;
  const beginDrag = () => {
    setBasketMeasureRequest((request) => request + 1);
    handleDropStart();
  };

  const instruction = (() => {
    switch (mode) {
      case 'find-amount':
        return translate(t, 'games.numberPicnic.modes.findAmount.instruction', {
          count: prompt.targetCount,
          item: targetItemName,
        });
      case 'match-numeral':
        return translate(t, 'games.numberPicnic.modes.matchNumeral.instruction', {
          count: prompt.targetCount,
          item: targetItemName,
        });
      case 'more-fewer':
        return translate(t, 'games.numberPicnic.modes.moreFewer.instruction', {
          comparison: translate(t, `games.numberPicnic.comparison.${prompt.comparison}`),
        });
      case 'add-one-more':
        return translate(t, 'games.numberPicnic.modes.addOneMore.instruction', {
          count: prompt.targetCount - 1,
          target: prompt.targetCount,
          item: getItemName(prompt.targetCount - 1),
        });
      default:
        return translate(t, 'games.numberPicnic.modes.makeAmount.instruction', {
          count: prompt.targetCount,
          item: targetItemName,
        });
    }
  })();

  const neutralFeedback =
    mode === 'more-fewer'
      ? translate(t, 'games.numberPicnic.guidance.comparisonNeutral', {
          comparison: translate(t, `games.numberPicnic.comparison.${prompt.comparison}`),
        })
      : translate(t, 'games.numberPicnic.guidance.neutral', {
          target: prompt.targetCount,
          item: targetItemName,
        });
  const hint =
    mode === 'more-fewer'
      ? translate(t, 'games.numberPicnic.guidance.comparisonHint', {
          comparison: translate(t, `games.numberPicnic.comparison.${prompt.comparison ?? 'more'}`),
        })
      : mode === 'match-numeral'
        ? t('games.numberPicnic.guidance.matchNumeralHint')
        : translate(t, 'games.numberPicnic.guidance.findAmountHint', {
            target: prompt.targetCount,
          });
  const modelGroup =
    mode === 'more-fewer'
      ? prompt.groups.find((group) =>
          prompt.comparison === 'more'
            ? group.quantity === Math.max(...prompt.groups.map((item) => item.quantity))
            : group.quantity === Math.min(...prompt.groups.map((item) => item.quantity)),
        )
      : undefined;
  const model = modelGroup ? (
    <View>
      <Text style={[styles.modelLabel, { color: colors.text }]}>
        {translate(t, `games.numberPicnic.groups.${modelGroup.id}`)}
      </Text>
      <NumberPicnicRepresentation
        representation={modelGroup.representation}
        accessibilityLabel={translate(t, 'games.numberPicnic.groupAccessibilityLabel', {
          group: translate(t, `games.numberPicnic.groups.${modelGroup.id}`),
          count: modelGroup.quantity,
          itemWord: getItemCountWord(modelGroup.quantity),
        })}
        testID='number-picnic-model'
      />
    </View>
  ) : (
    <NumberPicnicRepresentation
      representation={prompt.representation}
      accessibilityLabel={translate(t, 'games.numberPicnic.representation.accessibilityLabel', {
        count: prompt.targetCount,
        itemWord: getItemCountWord(prompt.targetCount),
      })}
      testID='number-picnic-model'
    />
  );

  const renderGroup = (group: NumberPicnicGroup) => (
    <View key={group.id} style={[styles.group, { borderColor: colors.border }]}>
      <Text style={[styles.groupLabel, { color: colors.text }]}>
        {translate(t, `games.numberPicnic.groups.${group.id}`)}
      </Text>
      <NumberPicnicRepresentation
        representation={group.representation}
        showNumeral={false}
        accessibilityLabel={translate(t, 'games.numberPicnic.groupAccessibilityLabel', {
          group: translate(t, `games.numberPicnic.groups.${group.id}`),
          count: group.quantity,
          itemWord: getItemCountWord(group.quantity),
        })}
        testID={`number-picnic-group-${group.id}`}
      />
    </View>
  );

  return (
    <AppScreen>
      <AppHeader title={t('games.numberPicnic.title')} onBack={() => navigation.goBack()} />
      <ScrollView
        ref={scrollViewRef}
        testID='number-picnic-scroll'
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isDragging}
      >
        <Text style={styles.subtitle}>{t('games.numberPicnic.subtitle')}</Text>

        <AppCard variant='elevated' style={styles.promptCard}>
          {isChoiceMode ? (
            <>
              <GuidedPracticePrompt
                state={guidedRound}
                instruction={instruction}
                neutralFeedback={neutralFeedback}
                hint={hint}
                model={model}
                hintLabel={t('games.numberPicnic.guidance.hintButton')}
                replayLabel={t('games.numberPicnic.guidance.replay')}
                skipLabel={t('games.numberPicnic.guidance.skip')}
                onReplay={replayInstructions}
                onHint={showHint}
                onSkip={skipRound}
              />
              {mode === 'match-numeral' && (
                <NumberPicnicRepresentation
                  representation={prompt.representation}
                  accessibilityLabel={translate(
                    t,
                    'games.numberPicnic.representation.quantityAccessibilityLabel',
                    {
                      count: prompt.targetCount,
                      itemWord: getItemCountWord(prompt.targetCount),
                    },
                  )}
                  showNumeral={false}
                  testID='number-picnic-match-quantity'
                />
              )}
            </>
          ) : (
            <>
              <Text style={styles.promptText}>{instruction}</Text>
              <NumberPicnicRepresentation
                representation={prompt.representation}
                accessibilityLabel={translate(
                  t,
                  'games.numberPicnic.representation.accessibilityLabel',
                  {
                    count: prompt.targetCount,
                    itemWord: getItemCountWord(prompt.targetCount),
                  },
                )}
                testID='number-picnic-target-representation'
              />
            </>
          )}
        </AppCard>

        {isChoiceMode ? (
          <>
            {mode === 'more-fewer' ? (
              <View style={styles.groups} testID='number-picnic-groups'>
                {prompt.groups.map(renderGroup)}
              </View>
            ) : (
              <View style={styles.choices} testID='number-picnic-choices'>
                {prompt.choices.map((choice) => (
                  <NumberPicnicChoice
                    key={choice.id}
                    choice={choice}
                    display={mode === 'match-numeral' ? 'numeral' : 'quantity'}
                    label={
                      mode === 'match-numeral'
                        ? translate(t, 'games.numberPicnic.numeralChoiceAccessibilityLabel', {
                            numeral: choice.numeral,
                          })
                        : translate(t, 'games.numberPicnic.choiceAccessibilityLabel', {
                            count: choice.quantity,
                            itemWord: getItemCountWord(choice.quantity),
                          })
                    }
                    accessibilityHint={t('games.numberPicnic.choiceHint')}
                    onPress={() => handleChoice(choice.id)}
                    disabled={guidedRound.phase === 'corrected' || guidedRound.phase === 'skipped'}
                    testID={`number-picnic-choice-${choice.id}`}
                  />
                ))}
              </View>
            )}
            <View style={styles.choiceActions}>
              {mode === 'more-fewer'
                ? prompt.groups.map((group) => (
                    <AppButton
                      key={group.id}
                      label={translate(t, `games.numberPicnic.groups.${group.id}`)}
                      onPress={() => handleChoice(group.id)}
                      disabled={
                        guidedRound.phase === 'corrected' || guidedRound.phase === 'skipped'
                      }
                      testID={`number-picnic-choice-${group.id}`}
                    />
                  ))
                : null}
              {(guidedRound.phase === 'corrected' || guidedRound.phase === 'skipped') && (
                <AppButton
                  label={t('games.numberPicnic.transfer')}
                  onPress={startNewRound}
                  accessibilityHint={t('games.numberPicnic.transferHint')}
                  testID='number-picnic-transfer'
                />
              )}
            </View>
          </>
        ) : (
          <>
            <View style={styles.basketContainer}>
              <PicnicBasket
                items={basketItems}
                itemIds={basketItemIds}
                removableItemIds={
                  mode === 'add-one-more'
                    ? basketItemIds.slice(prompt.targetCount - 1)
                    : basketItemIds
                }
                measureRequest={basketMeasureRequest}
                targetCount={prompt.targetCount}
                onPress={() => {}}
                onItemPress={handleBasketItemPress}
                onDropZoneLayout={setBasketLayout}
                isDropTarget={isOverBasket}
                isSuccess={isSuccess}
                style={styles.basket}
                accessibilityLabel={t('games.numberPicnic.basketAccessibilityLabel', {
                  count: basketCount,
                  item: getItemName(basketCount),
                })}
                accessibilityHint={t('games.numberPicnic.basketAccessibilityHint')}
                testID='picnic-basket'
              />
            </View>
            <Text
              style={[styles.feedback, isComplete && styles.feedbackComplete]}
              accessibilityLiveRegion={hasCompletionAnnouncement ? 'polite' : 'none'}
              testID={
                hasCompletionAnnouncement ? 'number-picnic-completion-announcement' : undefined
              }
            >
              {isComplete
                ? t('games.numberPicnic.feedback.complete')
                : t('games.numberPicnic.feedback.incomplete')}
            </Text>
            <PicnicBlanket
              itemEmoji={prompt.itemEmoji}
              itemCount={blanketItemCount}
              itemIds={blanketItemIds}
              targetCount={prompt.targetCount}
              onItemDrop={handleItemDrop}
              onDropStart={beginDrag}
              onDragOverBasket={handleDragOverBasket}
              dropZoneLayout={basketLayout}
              onDropEnd={handleDropEnd}
              isProcessing={isProcessing}
              style={styles.blanket}
              testID='picnic-blanket'
            />
            <View style={styles.controls}>
              <AppButton
                label={t('games.numberPicnic.undo')}
                onPress={handleUndo}
                variant='ghost'
                disabled={
                  basketCount === 0 ||
                  (mode === 'add-one-more' && basketCount === prompt.targetCount - 1)
                }
                accessibilityHint={t('games.numberPicnic.undoHint')}
                testID='number-picnic-undo'
              />
              <AppButton
                label={t('games.numberPicnic.reset')}
                onPress={handleReset}
                variant='ghost'
                accessibilityHint={t('games.numberPicnic.resetHint')}
                testID='number-picnic-reset'
              />
              <AppButton
                label={t('games.numberPicnic.nextPicnic')}
                onPress={startNewRound}
                disabled={!isComplete}
                accessibilityHint={t('games.numberPicnic.nextPicnicHint')}
                testID='number-picnic-next'
              />
            </View>
          </>
        )}
      </ScrollView>
    </AppScreen>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    scrollView: { flex: 1 },
    scrollContent: {
      alignItems: 'center',
      paddingHorizontal: Space.md,
      paddingTop: Space.base,
      paddingBottom: Space.xl,
    },
    subtitle: {
      ...TypeStyle.bodySm,
      color: colors.textLight,
      textAlign: 'center',
      marginBottom: Space.sm,
    },
    promptCard: { width: '100%', alignItems: 'center', marginBottom: Space.md, gap: Space.sm },
    promptText: { ...TypeStyle.body, color: colors.text, textAlign: 'center' },
    basketContainer: { width: '100%', alignItems: 'center', marginBottom: Space.md, zIndex: 1 },
    basket: {},
    blanket: { marginBottom: Space.md },
    feedback: {
      ...TypeStyle.body,
      color: colors.textLight,
      textAlign: 'center',
      marginBottom: Space.sm,
      minHeight: 24,
    },
    feedbackComplete: { color: colors.success, fontWeight: 'bold' },
    controls: { width: '100%', gap: Space.sm, marginBottom: Space.sm },
    choices: {
      width: '100%',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Space.sm,
      justifyContent: 'center',
    },
    groups: { width: '100%', flexDirection: 'row', gap: Space.sm, justifyContent: 'center' },
    group: {
      flex: 1,
      minWidth: 130,
      borderWidth: 2,
      borderRadius: 16,
      padding: Space.sm,
      alignItems: 'center',
    },
    groupLabel: { ...TypeStyle.label, marginBottom: Space.xs },
    choiceActions: { width: '100%', gap: Space.sm, marginTop: Space.md },
    modelLabel: { ...TypeStyle.label, textAlign: 'center', marginBottom: Space.xs },
  });
