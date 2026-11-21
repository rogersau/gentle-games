import React, { useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import type { ThemeColors } from '../types';
import { useSettings } from '../context/SettingsContext';
import { getNumberPicnicPoolSize, useNumberPicnicGame } from '../utils/numberPicnicLogic';
import { useThemeColors } from '../utils/theme';
import { AppScreen, GameHeader, AppCard, AppButton } from '../ui/components';
import { Space, TypeStyle } from '../ui/tokens';
import {
  NumberPicnicChoice,
  NumberPicnicRepresentation,
  PicnicBasket,
  PicnicBlanket,
} from '../components/numberpicnic';
import { getGameSettings, maxQuantityToStage } from '../games/settings';
import type { TranslationKey } from '../i18n/types';

export const NumberPicnicScreen: React.FC = () => {
  const navigation = useNavigation();
  const { settings } = useSettings();
  const { colors } = useThemeColors();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const basketRef = useRef<View>(null);
  const picnicSettings = getGameSettings(settings, 'number-picnic');

  const {
    prompt,
    basketCount,
    isDragging,
    isOverBasket,
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
    startNewRound,
  } = useNumberPicnicGame(picnicSettings.stage ?? maxQuantityToStage(picnicSettings.maxQuantity), {
    mode: picnicSettings.mode,
    settings,
    spokenCounting: picnicSettings.spokenCounting,
  });

  const { mode, targetCount, representation, comparison } = prompt;
  const getItemName = (count: number) =>
    t(
      `games.numberPicnic.${count === 1 ? 'itemsSingular' : 'items'}.${prompt.itemName}` as TranslationKey,
    );
  const getItemCountWord = (count: number) =>
    t(`games.numberPicnic.itemCount.${count === 1 ? 'one' : 'other'}`);
  const targetItemName = getItemName(targetCount);
  const singleItemName = getItemName(1);
  const isPlacementMode = mode === 'make-amount' || mode === 'add-one-more';
  const initialCount = mode === 'add-one-more' ? targetCount - 1 : 0;
  const comparisonWord = comparison ? t(`games.numberPicnic.comparison.${comparison}`) : '';
  const instruction = (() => {
    switch (mode) {
      case 'find-amount':
        return t('games.numberPicnic.modes.findAmount.instruction', {
          count: targetCount,
          item: targetItemName,
        });
      case 'match-numeral':
        return t('games.numberPicnic.modes.matchNumeral.instruction');
      case 'more-fewer':
        return t('games.numberPicnic.modes.moreFewer.instruction', { comparison: comparisonWord });
      case 'add-one-more':
        return t('games.numberPicnic.modes.addOneMore.instruction', {
          count: initialCount,
          target: targetCount,
          item: getItemName(initialCount),
        });
      default:
        return t('games.numberPicnic.modes.makeAmount.instruction', {
          count: targetCount,
          item: targetItemName,
        });
    }
  })();

  const targetLabel = t(
    mode === 'match-numeral'
      ? 'games.numberPicnic.representation.quantityAccessibilityLabel'
      : 'games.numberPicnic.representation.accessibilityLabel',
    { count: targetCount, itemWord: getItemCountWord(targetCount) },
  );
  const { phase, incorrectAttempts } = guidedRound;
  const choices = mode === 'more-fewer' ? prompt.groups : prompt.choices;
  const modelGroup =
    phase === 'modelled' && mode === 'more-fewer'
      ? prompt.groups.reduce((best, group) =>
          (comparison === 'more' ? group.quantity > best.quantity : group.quantity < best.quantity)
            ? group
            : best,
        )
      : undefined;
  const groupTitle = (id: string) =>
    t(id === 'left' ? 'games.numberPicnic.groups.left' : 'games.numberPicnic.groups.right');
  const groupLabel = (group: { id: string; quantity: number }) =>
    t('games.numberPicnic.groupAccessibilityLabel', {
      group: groupTitle(group.id),
      count: group.quantity,
      itemWord: getItemCountWord(group.quantity),
    });

  const choiceFeedback = (() => {
    if (isComplete) return t('games.numberPicnic.feedback.complete');
    if (incorrectAttempts === 0) return null;
    if (mode === 'more-fewer') {
      return t('games.numberPicnic.guidance.comparisonNeutral', { comparison: comparisonWord });
    }
    if (mode === 'match-numeral') return t('games.numberPicnic.guidance.matchNumeralNeutral');
    return t('games.numberPicnic.guidance.neutral', { target: targetCount, item: targetItemName });
  })();
  const hint = (() => {
    if (phase !== 'hinted') return null;
    if (mode === 'more-fewer') {
      return t('games.numberPicnic.guidance.comparisonHint', { comparison: comparisonWord });
    }
    if (mode === 'match-numeral') return t('games.numberPicnic.guidance.matchNumeralHint');
    return t('games.numberPicnic.guidance.findAmountHint', { target: targetCount });
  })();

  return (
    <AppScreen
      header={
        <GameHeader title={t('games.numberPicnic.title')} onBack={() => navigation.goBack()} />
      }
    >
      <ScrollView
        testID='number-picnic-scroll'
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={!isDragging}
      >
        <AppCard variant='elevated' style={styles.promptCard}>
          <Text style={styles.promptText}>{instruction}</Text>
          {(isPlacementMode || mode === 'match-numeral') && (
            <NumberPicnicRepresentation
              representation={representation}
              accessibilityLabel={targetLabel}
              showNumeral={isPlacementMode}
              testID={
                isPlacementMode
                  ? 'number-picnic-target-representation'
                  : 'number-picnic-match-quantity'
              }
            />
          )}
        </AppCard>

        {isPlacementMode ? (
          <>
            <PicnicBasket
              items={basketItems}
              itemIds={basketItemIds}
              itemName={singleItemName}
              removableItemIds={basketItemIds.slice(initialCount)}
              dropZoneRef={basketRef}
              targetCount={targetCount}
              onItemPress={handleBasketItemPress}
              isDragging={isDragging}
              isDropTarget={isOverBasket}
              isSuccess={isComplete}
              style={styles.basket}
              accessibilityLabel={t('games.numberPicnic.basketAccessibilityLabel', {
                count: basketCount,
                target: targetCount,
                item: getItemName(basketCount),
              })}
              testID='picnic-basket'
            />
            <Text
              style={styles.feedback}
              accessibilityLiveRegion={hasCompletionAnnouncement ? 'polite' : 'none'}
              testID={
                hasCompletionAnnouncement ? 'number-picnic-completion-announcement' : undefined
              }
            >
              {t(
                isComplete
                  ? 'games.numberPicnic.feedback.complete'
                  : 'games.numberPicnic.instruction',
              )}
            </Text>
            <PicnicBlanket
              key={`${prompt.stage}-${mode}`}
              itemEmoji={prompt.itemEmoji}
              itemName={singleItemName}
              itemIds={blanketItemIds}
              firstItemId={initialCount}
              poolSize={getNumberPicnicPoolSize(targetCount)}
              onItemDrop={handleItemDrop}
              onDropStart={handleDropStart}
              onDragOverBasket={handleDragOverBasket}
              onDropEnd={handleDropEnd}
              basketRef={basketRef}
              isComplete={isComplete}
              style={styles.blanket}
              testID='picnic-blanket'
            />
            <View style={styles.controls}>
              <AppButton
                label={t('games.numberPicnic.undo')}
                onPress={handleUndo}
                variant='ghost'
                disabled={isDragging || basketCount === initialCount}
                accessibilityHint={t('games.numberPicnic.undoHint')}
                testID='number-picnic-undo'
              />
              <AppButton
                label={t('games.numberPicnic.reset')}
                onPress={handleReset}
                variant='ghost'
                disabled={isDragging || basketCount === initialCount}
                accessibilityHint={t('games.numberPicnic.resetHint')}
                testID='number-picnic-reset'
              />
              <AppButton
                label={t('games.numberPicnic.nextPicnic')}
                onPress={startNewRound}
                disabled={isDragging}
                variant={isComplete ? 'primary' : 'ghost'}
                accessibilityHint={t('games.numberPicnic.nextPicnicHint')}
                testID='number-picnic-next'
              />
            </View>
          </>
        ) : (
          <>
            <View style={styles.choices} testID='number-picnic-choices'>
              {choices.map((choice) => (
                <NumberPicnicChoice
                  key={choice.id}
                  representation={choice.representation}
                  display={mode === 'match-numeral' ? 'numeral' : 'quantity'}
                  title={mode === 'more-fewer' ? groupTitle(choice.id) : undefined}
                  label={
                    mode === 'more-fewer'
                      ? groupLabel(choice)
                      : mode === 'match-numeral'
                        ? t('games.numberPicnic.numeralChoiceAccessibilityLabel', {
                            numeral: choice.quantity,
                          })
                        : t('games.numberPicnic.choiceAccessibilityLabel', {
                            count: choice.quantity,
                            itemWord: getItemCountWord(choice.quantity),
                          })
                  }
                  accessibilityHint={t(
                    mode === 'match-numeral'
                      ? 'games.numberPicnic.numeralChoiceHint'
                      : 'games.numberPicnic.choiceHint',
                  )}
                  onPress={() => handleChoice(choice.id)}
                  disabled={isComplete}
                  testID={`number-picnic-choice-${choice.id}`}
                />
              ))}
            </View>
            {choiceFeedback && (
              <Text style={styles.feedback} accessibilityLiveRegion='polite'>
                {choiceFeedback}
              </Text>
            )}
            {hint && (
              <Text style={styles.feedback} accessibilityLiveRegion='polite'>
                {hint}
              </Text>
            )}
            {phase === 'modelled' && (
              <View style={styles.model}>
                {modelGroup && <Text style={styles.promptText}>{groupTitle(modelGroup.id)}</Text>}
                <NumberPicnicRepresentation
                  representation={modelGroup?.representation ?? representation}
                  accessibilityLabel={
                    modelGroup
                      ? groupLabel(modelGroup)
                      : t('games.numberPicnic.representation.accessibilityLabel', {
                          count: targetCount,
                          itemWord: getItemCountWord(targetCount),
                        })
                  }
                  showNumeral={!modelGroup}
                  testID='number-picnic-model'
                />
              </View>
            )}
            <View style={styles.controls}>
              <AppButton
                label={t('games.numberPicnic.guidance.hintButton')}
                onPress={showHint}
                variant='ghost'
                disabled={phase !== 'independent'}
                testID='number-picnic-hint'
              />
              <AppButton
                label={t('games.numberPicnic.transfer')}
                onPress={startNewRound}
                variant={isComplete ? 'primary' : 'ghost'}
                accessibilityHint={t('games.numberPicnic.transferHint')}
                testID='number-picnic-transfer'
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
    scrollContent: {
      alignItems: 'center',
      paddingHorizontal: Space.md,
      paddingTop: Space.base,
      paddingBottom: Space.xl,
    },
    promptCard: {
      width: '100%',
      maxWidth: 432,
      alignItems: 'center',
      marginBottom: Space.md,
      gap: Space.xs,
    },
    promptText: { ...TypeStyle.body, color: colors.text, textAlign: 'center' },
    basket: { marginBottom: Space.lg, zIndex: 1 },
    blanket: { marginBottom: Space.md },
    feedback: {
      ...TypeStyle.bodySm,
      color: colors.text,
      textAlign: 'center',
      marginBottom: Space.sm,
    },
    controls: {
      width: '100%',
      maxWidth: 432,
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: Space.sm,
    },
    choices: {
      width: '100%',
      maxWidth: 568,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Space.sm,
      justifyContent: 'center',
      marginBottom: Space.md,
    },
    model: { alignItems: 'center', marginBottom: Space.sm },
  });
