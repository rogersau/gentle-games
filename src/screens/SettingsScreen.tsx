import { CategoryMatchPackPicker } from '../components/CategoryMatchPackPicker';
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import type { StackNavigationProp } from '@react-navigation/stack';
import * as Application from 'expo-application';
import { APP_ROUTES, AppStackParamList, SettingsPage } from '../types/navigation';
import { openExternalUrl } from '../utils/externalLinks';
import { ControlIcon } from '../ui/components/ControlIcon';
import { useSettings } from '../context/SettingsContext';
import {
  CategoryMatchCategoryCount,
  Movement,
  NumberPicnicMode,
  NumberPicnicStage,
} from '../types';
import { GAME_REGISTRY, GameId } from '../games/registry';
import { useSystemReducedMotion, useThemeColors } from '../utils/theme';
import { SUPPORTED_LANGUAGES } from '../types/i18n';
import { useNumberPicnicSpeechAvailable } from '../utils/numberPicnicNarration';
import {
  AppScreen,
  GameArtwork,
  AppModal,
  SettingToggle,
  SegmentedControl,
  VolumeControl,
  AppButton,
} from '../ui/components';
import { ControlIconName } from '../ui/components/ControlIcon';
import { Radius, Shadow, Space, TypeStyle } from '../ui/tokens';
import {
  getGameSettings,
  MemorySnapMismatchDuration,
  MemorySnapPairCount,
  MemorySnapPreviewMode,
  stageToMaxQuantity,
} from '../games/settings';
import {
  GLITTER_PRESETS,
  GlitterColorCount,
  GlitterFallSpeed,
  GlitterParticleDensity,
} from '../games/glitterSettings';

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<AppStackParamList, 'Settings'>>();
  const { settings, updateSettings, persistenceError } = useSettings();
  const { colors } = useThemeColors();
  const systemReduced = useSystemReducedMotion();
  const { t } = useTranslation();
  const [websiteFallback, setWebsiteFallback] = useState(false);
  const page = route.params?.page ?? 'hub';
  const gameId = route.params?.gameId;
  const game = GAME_REGISTRY.find((item) => item.id === gameId);
  const open = (next: SettingsPage, id?: GameId) =>
    navigation.push(APP_ROUTES.Settings, { page: next, gameId: id });
  const done = () => navigation.popToTop();
  const games = GAME_REGISTRY.filter(
    (item) => !item.isUnfinished || settings.enableUnfinishedGames,
  );
  const title =
    page === 'game' && game
      ? t(game.nameKey)
      : t(
          (
            {
              hub: 'settings.title',
              games: 'settings.games.title',
              game: 'settings.games.title',
              break: 'settings.parentTimer.title',
              language: 'settings.language.title',
              privacy: 'settings.privacy.title',
              appearance: 'settings.appearance.title',
            } as const
          )[page],
        );
  const currentAppearance = t(`settings.appearance.${settings.colorMode}`);
  const timerLabel = (count: number) =>
    count ? t('settings.parentTimer.duration', { count }) : t('settings.parentTimer.off');

  return (
    <AppScreen
      scroll
      contentContainerStyle={styles.content}
      testID={`settings-${page}`}
      header={
        <View style={styles.header}>
          {page !== 'hub' && (
            <AppButton
              label={t('common.backPlain')}
              icon='back'
              variant='ghost'
              size='sm'
              onPress={() => navigation.goBack()}
            />
          )}
          <Text
            accessibilityRole='header'
            style={[TypeStyle.title, styles.headerTitle, { color: colors.text }]}
          >
            {title}
          </Text>
          <AppButton label={t('common.done')} size='sm' onPress={done} />
        </View>
      }
    >
      {persistenceError && (
        <Text
          testID='settings-persistence-status'
          accessibilityRole='alert'
          accessibilityLiveRegion='polite'
          style={[
            TypeStyle.body,
            styles.error,
            { color: colors.peachInk, backgroundColor: colors.peach },
          ]}
        >
          {t('settings.persistenceError')}
        </Text>
      )}
      {page === 'hub' && (
        <>
          <Group title={t('settings.comfort')}>
            <View style={styles.groupItem}>
              <SettingToggle
                label={t('settings.sound.label')}
                artwork={<RowIcon icon='sound' fill={colors.sky} ink={colors.skyInk} />}
                value={settings.soundEnabled}
                onValueChange={(soundEnabled) => updateSettings({ soundEnabled })}
              />
              {settings.soundEnabled && (
                <View style={styles.volumeWrap}>
                  <VolumeControl
                    value={settings.soundVolume}
                    onValueChange={(soundVolume) => updateSettings({ soundVolume })}
                  />
                </View>
              )}
            </View>
            <View style={styles.groupSegment}>
              <Text style={[styles.controlLabel, { color: colors.text }]}>
                {t('settings.movement.title')}
              </Text>
              <Text style={[styles.description, { color: colors.textLight }]}>
                {t(systemReduced ? 'settings.movement.device' : 'settings.movement.description')}
              </Text>
              <SegmentedControl<Movement>
                options={(['still', 'gentle', 'lively'] as const).map((value) => ({
                  value,
                  label: t(`settings.movement.${value}`),
                }))}
                value={settings.movement}
                onValueChange={(movement) => updateSettings({ movement })}
              />
            </View>
            <SettingsRow
              label={t('settings.appearance.title')}
              artwork={<RowIcon icon='eye' fill={colors.lavender} ink={colors.lavenderInk} />}
              value={currentAppearance}
              onPress={() => open('appearance')}
            />
            <SettingToggle
              label={t('settings.pressureFreeMode.label')}
              description={t('settings.pressureFreeMode.description')}
              artwork={<RowIcon icon='check' fill={colors.sage} ink={colors.sageInk} />}
              value={settings.pressureFreeMode !== false}
              onValueChange={(pressureFreeMode) => updateSettings({ pressureFreeMode })}
            />
            <SettingToggle
              label={t('settings.showMochiInGames.label')}
              artwork={<RowIcon icon='circle' fill={colors.rose} ink={colors.peachInk} />}
              value={settings.showMochiInGames}
              onValueChange={(showMochiInGames) => updateSettings({ showMochiInGames })}
            />
            <SettingToggle
              label={t('settings.grownUpsHoldGate.label')}
              description={t('settings.grownUpsHoldGate.description')}
              artwork={<RowIcon icon='lock' fill={colors.sky} ink={colors.skyInk} />}
              value={settings.grownUpsHoldGate !== false}
              onValueChange={(grownUpsHoldGate) => updateSettings({ grownUpsHoldGate })}
            />
          </Group>
          <Group title={t('settings.play')}>
            <SettingToggle
              label={t('settings.autoAdvance.label')}
              description={t('settings.autoAdvance.description')}
              artwork={<RowIcon icon='next' fill={colors.sage} ink={colors.sageInk} />}
              value={settings.autoAdvance !== false}
              onValueChange={(autoAdvance) => updateSettings({ autoAdvance })}
            />
            <SettingsRow
              label={t('settings.parentTimer.title')}
              artwork={<RowIcon icon='pause' fill={colors.peach} ink={colors.peachInk} />}
              value={timerLabel(settings.parentTimerMinutes)}
              onPress={() => open('break')}
            />
            <SettingsRow
              label={t('settings.games.title')}
              description={t('settings.games.description')}
              artwork={<RowIcon icon='cards' fill={colors.butter} ink={colors.peachInk} />}
              value={String(games.length)}
              onPress={() => open('games')}
            />
          </Group>
          <Group title={t('settings.app')}>
            <SettingsRow
              label={t('settings.language.title')}
              value={t(`settings.language.${settings.language}`)}
              onPress={() => open('language')}
            />
            <SettingsRow label={t('settings.privacy.title')} onPress={() => open('privacy')} />
          </Group>
        </>
      )}
      {page === 'appearance' && (
        <Group>
          <Text style={[styles.description, { color: colors.textLight }]}>
            {t('settings.appearance.description')}
          </Text>
          <SegmentedControl
            options={(['light', 'dark', 'system'] as const).map((value) => ({
              value,
              label: t(`settings.appearance.${value}`),
            }))}
            value={settings.colorMode}
            onValueChange={(colorMode) => updateSettings({ colorMode })}
            wrap
          />
        </Group>
      )}
      {page === 'break' && (
        <Group>
          <Text style={[styles.description, { color: colors.textLight }]}>
            {t('settings.parentTimer.description')}
          </Text>
          <SegmentedControl
            options={[0, 5, 10, 15, 20, 30].map((value) => ({ value, label: timerLabel(value) }))}
            value={settings.parentTimerMinutes}
            onValueChange={(parentTimerMinutes) => updateSettings({ parentTimerMinutes })}
            wrap
          />
        </Group>
      )}
      {page === 'language' && (
        <Group>
          <Text style={[styles.description, { color: colors.textLight }]}>
            {t('settings.language.description')}
          </Text>
          <SegmentedControl
            options={SUPPORTED_LANGUAGES.map((value) => ({
              value,
              label: t(`settings.language.${value}`),
            }))}
            value={settings.language}
            onValueChange={(language) => updateSettings({ language })}
            wrap
          />
        </Group>
      )}
      {page === 'privacy' && (
        <Group>
          <SettingToggle
            label={t('settings.telemetry.label')}
            description={t('settings.telemetry.description')}
            value={settings.telemetryEnabled}
            onValueChange={(telemetryEnabled) => updateSettings({ telemetryEnabled })}
          />
          <SettingToggle
            label={t('settings.unfinishedGames.label')}
            description={t('settings.unfinishedGames.description')}
            value={settings.enableUnfinishedGames}
            onValueChange={(enableUnfinishedGames) => updateSettings({ enableUnfinishedGames })}
          />
          <SettingsRow
            label={t('settings.privacy.websiteLink')}
            link
            onPress={() =>
              void openExternalUrl('https://gentlegames.org').then((result) => {
                if (result !== 'opened') setWebsiteFallback(true);
              })
            }
          />
          <Text style={[styles.description, { color: colors.textLight }]}>
            {t('settings.privacy.version', {
              version:
                Application.nativeApplicationVersion ?? require('../../package.json').version,
            })}
          </Text>
          <AppModal
            visible={websiteFallback}
            onClose={() => setWebsiteFallback(false)}
            title={t('settings.privacy.websiteFallback.title')}
          >
            <Text style={[styles.description, { color: colors.textLight }]}>
              {t('settings.privacy.websiteFallback.message')}
            </Text>
          </AppModal>
        </Group>
      )}
      {page === 'games' && (
        <Group>
          {games.map((item) => (
            <SettingsRow
              key={item.id}
              label={t(item.nameKey)}
              artwork={<GameArtwork gameId={item.id} size={36} />}
              value={t(
                settings.hiddenGames.includes(item.id)
                  ? 'settings.games.hidden'
                  : 'settings.games.shown',
              )}
              onPress={() => open('game', item.id)}
            />
          ))}
        </Group>
      )}
      {page === 'game' && game && (
        <>
          <View style={styles.hero}>
            <View style={[styles.heroTile, { backgroundColor: colors.sky }]}>
              <GameArtwork gameId={game.id} size={64} />
            </View>
            <View style={styles.heroCopy}>
              <Text style={[TypeStyle.title, { color: colors.text }]}>{t(game.nameKey)}</Text>
              <Text style={[TypeStyle.body, { color: colors.textLight }]}>
                {t(game.descriptionKey)}
              </Text>
            </View>
          </View>
          <Group title={t('settings.games.onHome')}>
            <SettingToggle
              label={t('settings.games.showOnHome')}
              value={!settings.hiddenGames.includes(game.id)}
              onValueChange={(show) =>
                updateSettings({
                  hiddenGames: show
                    ? settings.hiddenGames.filter((id) => id !== game.id)
                    : [...settings.hiddenGames, game.id],
                })
              }
            />
          </Group>
          <GameOptions gameId={game.id} />
        </>
      )}
    </AppScreen>
  );
};

const RowIcon: React.FC<{ icon: ControlIconName; fill: string; ink: string }> = ({
  icon,
  fill,
  ink,
}) => (
  <View
    style={[styles.rowIcon, { backgroundColor: fill }]}
    accessibilityElementsHidden
    importantForAccessibility='no-hide-descendants'
    aria-hidden
  >
    <ControlIcon name={icon} size={17} color={ink} />
  </View>
);

const Group: React.FC<{ title?: string; children: React.ReactNode }> = ({ title, children }) => {
  const { colors } = useThemeColors();
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={styles.group}>
      {title && (
        <Text accessibilityRole='header' style={[styles.groupTitle, { color: colors.textLight }]}>
          {title}
        </Text>
      )}
      <View
        style={[
          styles.groupBody,
          Shadow.sm,
          { backgroundColor: colors.surface, borderColor: colors.line },
        ]}
      >
        {items.map((child, index) => (
          <View
            key={index}
            style={index > 0 ? [styles.divider, { borderTopColor: colors.line }] : undefined}
          >
            {child}
          </View>
        ))}
      </View>
    </View>
  );
};

const SettingsRow: React.FC<{
  label: string;
  description?: string;
  value?: string;
  artwork?: React.ReactNode;
  link?: boolean;
  onPress: () => void;
}> = ({ label, description, value, artwork, link, onPress }) => {
  const { colors } = useThemeColors();
  return (
    <Pressable
      accessibilityRole={link ? 'link' : 'button'}
      accessibilityLabel={label}
      accessibilityHint={description ?? value}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? colors.sunken : 'transparent' },
      ]}
    >
      {artwork}
      <View style={styles.rowCopy}>
        <Text style={[TypeStyle.label, { color: colors.text }]}>{label}</Text>
        {description && (
          <Text style={[TypeStyle.helper, { color: colors.textLight }]}>{description}</Text>
        )}
      </View>
      {value && <Text style={[styles.rowValue, { color: colors.textLight }]}>{value}</Text>}
      <View style={!link && styles.chevron}>
        <ControlIcon name={link ? 'next' : 'back'} size={16} color={colors.textLight} />
      </View>
    </Pressable>
  );
};

const GameOptions: React.FC<{ gameId: GameId }> = ({ gameId }) => {
  const { t } = useTranslation();
  const { colors } = useThemeColors();
  const { settings, updateGameSettings } = useSettings();
  const glitterSettings = getGameSettings(settings, 'glitter-fall');
  const memorySettings = getGameSettings(settings, 'memory-snap');
  const categorySettings = getGameSettings(settings, 'category-match');
  const numberPicnicSettings = getGameSettings(settings, 'number-picnic');
  const picnicSpeechAvailable = useNumberPicnicSpeechAvailable(
    settings.language,
    gameId === 'number-picnic',
  );

  const memoryPairOptions: { value: MemorySnapPairCount; label: string }[] = [
    { value: 2, label: t('settings.memorySnap.pairs.two') },
    { value: 3, label: t('settings.memorySnap.pairs.three') },
    { value: 4, label: t('settings.memorySnap.pairs.four') },
    { value: 6, label: t('settings.memorySnap.pairs.six') },
    { value: 10, label: t('settings.memorySnap.pairs.ten') },
    { value: 15, label: t('settings.memorySnap.pairs.fifteen') },
  ];
  const memoryPreviewOptions: { value: MemorySnapPreviewMode; label: string }[] = [
    { value: 'none', label: t('settings.memorySnap.preview.none') },
    { value: 'until-ready', label: t('settings.memorySnap.preview.untilReady') },
    { value: '4-seconds', label: t('settings.memorySnap.preview.fourSeconds') },
    { value: '8-seconds', label: t('settings.memorySnap.preview.eightSeconds') },
  ];
  const memoryMismatchOptions: { value: MemorySnapMismatchDuration; label: string }[] = [
    { value: 1000, label: t('settings.memorySnap.mismatch.oneSecond') },
    { value: 2000, label: t('settings.memorySnap.mismatch.twoSeconds') },
    { value: 3000, label: t('settings.memorySnap.mismatch.threeSeconds') },
  ];
  const categoryCountOptions: { value: CategoryMatchCategoryCount; label: string }[] = [
    { value: 2, label: t('settings.categoryMatch.categories.two') },
    { value: 3, label: t('settings.categoryMatch.categories.three') },
  ];
  const numberPicnicStageOptions: { value: NumberPicnicStage; label: string }[] = [
    { value: '1-3', label: t('settings.numberPicnic.stage.oneToThree') },
    { value: '1-5', label: t('settings.numberPicnic.stage.oneToFive') },
    { value: '6-10', label: t('settings.numberPicnic.stage.sixToTen') },
  ];
  const numberPicnicModeOptions: { value: NumberPicnicMode; label: string }[] = [
    { value: 'make-amount', label: t('settings.numberPicnic.modes.makeAmount') },
    { value: 'find-amount', label: t('settings.numberPicnic.modes.findAmount') },
    { value: 'match-numeral', label: t('settings.numberPicnic.modes.matchNumeral') },
    { value: 'more-fewer', label: t('settings.numberPicnic.modes.moreFewer') },
    { value: 'add-one-more', label: t('settings.numberPicnic.modes.addOneMore') },
  ];

  const glitterDensityOptions: { value: GlitterParticleDensity; label: string }[] = [
    { value: 'very-sparse', label: t('settings.glitterFall.density.verySparse') },
    { value: 'sparse', label: t('settings.glitterFall.density.sparse') },
    { value: 'medium', label: t('settings.glitterFall.density.medium') },
    { value: 'dense', label: t('settings.glitterFall.density.dense') },
  ];
  const glitterSpeedOptions: { value: GlitterFallSpeed; label: string }[] = [
    { value: 'very-slow', label: t('settings.glitterFall.speed.verySlow') },
    { value: 'slow', label: t('settings.glitterFall.speed.slow') },
    { value: 'normal', label: t('settings.glitterFall.speed.normal') },
  ];
  const glitterColorOptions: { value: GlitterColorCount; label: string }[] = [
    { value: 1, label: t('settings.glitterFall.colors.one') },
    { value: 3, label: t('settings.glitterFall.colors.three') },
    { value: 6, label: t('settings.glitterFall.colors.six') },
  ];

  return (
    <>
      {gameId === 'memory-snap' && (
        <>
          <Group title={t('settings.challenge')}>
            <Text style={[styles.controlLabel, { color: colors.text }]}>
              {t('settings.memorySnap.pairs.title')}
            </Text>
            <SegmentedControl
              options={memoryPairOptions}
              value={memorySettings.pairCount}
              onValueChange={(pairCount) => updateGameSettings('memory-snap', { pairCount })}
              wrap
            />
            <Text style={[styles.description, { color: colors.textLight }]}>
              {t('settings.memorySnap.pairs.description')}
            </Text>
            <Text style={[styles.controlLabel, { color: colors.text }]}>
              {t('settings.memorySnap.preview.title')}
            </Text>
            <SegmentedControl
              options={memoryPreviewOptions}
              value={memorySettings.previewMode}
              onValueChange={(previewMode) => updateGameSettings('memory-snap', { previewMode })}
              wrap
            />
            <Text style={[styles.description, { color: colors.textLight }]}>
              {t('settings.memorySnap.preview.description')}
            </Text>
            <Text style={[styles.controlLabel, { color: colors.text }]}>
              {t('settings.memorySnap.mismatch.title')}
            </Text>
            <SegmentedControl
              options={memoryMismatchOptions}
              value={memorySettings.mismatchDuration}
              onValueChange={(mismatchDuration) =>
                updateGameSettings('memory-snap', { mismatchDuration })
              }
            />
            <Text style={[styles.description, { color: colors.textLight }]}>
              {t('settings.memorySnap.mismatch.description')}
            </Text>
          </Group>
          <Group title={t('settings.help')}>
            <SettingToggle
              label={t('settings.memorySnap.hint.label')}
              description={t('settings.memorySnap.hint.description')}
              value={memorySettings.hintEnabled}
              onValueChange={(hintEnabled) => updateGameSettings('memory-snap', { hintEnabled })}
            />
          </Group>
        </>
      )}
      {gameId === 'category-match' && (
        <Group title={t('settings.challenge')}>
          <Text style={[styles.controlLabel, { color: colors.text }]}>
            {t('settings.categoryMatch.pack.title')}
          </Text>
          <CategoryMatchPackPicker />
          <Text style={[styles.controlLabel, { color: colors.text }]}>
            {t('settings.categoryMatch.categories.title')}
          </Text>
          <SegmentedControl
            options={categoryCountOptions}
            value={categorySettings.categoryCount}
            onValueChange={(categoryCount) =>
              updateGameSettings('category-match', { categoryCount })
            }
          />
          <Text style={[styles.description, { color: colors.textLight }]}>
            {t('settings.categoryMatch.categories.description')}
          </Text>
          <SettingToggle
            label={t('settings.categoryMatch.showPreview')}
            value={categorySettings.showPreview}
            onValueChange={(showPreview) => updateGameSettings('category-match', { showPreview })}
          />
        </Group>
      )}
      {gameId === 'number-picnic' && (
        <Group title={t('settings.challenge')}>
          <Text style={[styles.controlLabel, { color: colors.text }]}>
            {t('settings.numberPicnic.stage.title')}
          </Text>
          <SegmentedControl
            options={numberPicnicStageOptions}
            value={numberPicnicSettings.stage}
            onValueChange={(stage) =>
              updateGameSettings('number-picnic', {
                stage,
                maxQuantity: stageToMaxQuantity(stage),
                mode:
                  stage === '6-10'
                    ? numberPicnicSettings.mode
                    : numberPicnicSettings.mode === 'add-one-more'
                      ? 'make-amount'
                      : numberPicnicSettings.mode,
              })
            }
            wrap
          />
          <Text style={[styles.description, { color: colors.textLight }]}>
            {t('settings.numberPicnic.stage.description')}
          </Text>
          <Text style={[styles.controlLabel, { color: colors.text }]}>
            {t('settings.numberPicnic.mode.title')}
          </Text>
          <SegmentedControl
            options={numberPicnicModeOptions.filter(
              (option) => option.value !== 'add-one-more' || numberPicnicSettings.stage === '6-10',
            )}
            value={numberPicnicSettings.mode}
            onValueChange={(mode) => updateGameSettings('number-picnic', { mode })}
            wrap
          />
          <Text style={[styles.description, { color: colors.textLight }]}>
            {t('settings.numberPicnic.mode.description')}
          </Text>
          <SettingToggle
            label={t('settings.numberPicnic.spokenCounting.label')}
            description={t(
              picnicSpeechAvailable
                ? 'settings.numberPicnic.spokenCounting.description'
                : 'settings.numberPicnic.spokenCounting.unavailable',
            )}
            value={numberPicnicSettings.spokenCounting}
            onValueChange={(spokenCounting) =>
              updateGameSettings('number-picnic', { spokenCounting })
            }
          />
        </Group>
      )}
      {gameId === 'keepy-uppy' && (
        <Group title={t('settings.challenge')}>
          <SettingToggle
            label={t('settings.keepyUppyEasyMode.label')}
            description={t('settings.keepyUppyEasyMode.description')}
            value={getGameSettings(settings, 'keepy-uppy').liftMode === 'gentle'}
            onValueChange={(value) =>
              updateGameSettings('keepy-uppy', { liftMode: value ? 'gentle' : 'precise' })
            }
          />
        </Group>
      )}
      {gameId === 'bubble-pop' && (
        <Group title={t('settings.challenge')}>
          <SettingToggle
            label={t('settings.bubblePop.moving.label')}
            description={t('settings.bubblePop.moving.description')}
            value={getGameSettings(settings, 'bubble-pop').motion === 'moving'}
            onValueChange={(value) =>
              updateGameSettings('bubble-pop', { motion: value ? 'moving' : 'still' })
            }
          />
          <SettingToggle
            label={t('settings.bubblePop.fullField.label')}
            description={t('settings.bubblePop.fullField.description')}
            value={getGameSettings(settings, 'bubble-pop').density === 'full'}
            onValueChange={(value) =>
              updateGameSettings('bubble-pop', { density: value ? 'full' : 'sparse' })
            }
          />
        </Group>
      )}
      {gameId === 'glitter-fall' && (
        <Group title={t('settings.challenge')}>
          <Text style={[styles.controlLabel, { color: colors.text }]}>
            {t('settings.glitterFall.density.title')}
          </Text>
          <SegmentedControl
            options={glitterDensityOptions}
            value={glitterSettings.particleDensity}
            onValueChange={(particleDensity) =>
              updateGameSettings('glitter-fall', { particleDensity })
            }
            wrap
          />
          <Text style={[styles.controlLabel, { color: colors.text }]}>
            {t('settings.glitterFall.speed.title')}
          </Text>
          <SegmentedControl
            options={glitterSpeedOptions}
            value={glitterSettings.fallSpeed}
            onValueChange={(fallSpeed) => updateGameSettings('glitter-fall', { fallSpeed })}
          />
          <Text style={[styles.controlLabel, { color: colors.text }]}>
            {t('settings.glitterFall.colors.title')}
          </Text>
          <SegmentedControl
            options={glitterColorOptions}
            value={glitterSettings.colorCount}
            onValueChange={(colorCount) => updateGameSettings('glitter-fall', { colorCount })}
          />
          <SettingToggle
            label={t('settings.glitterFall.ripples')}
            value={glitterSettings.ripples}
            onValueChange={(ripples) => updateGameSettings('glitter-fall', { ripples })}
          />
          <SettingToggle
            label={t('settings.glitterFall.shakeResponse')}
            value={glitterSettings.shakeResponse}
            onValueChange={(shakeResponse) => updateGameSettings('glitter-fall', { shakeResponse })}
          />
          <SettingToggle
            label={t('settings.glitterFall.backgroundMotion')}
            value={glitterSettings.backgroundMotion}
            onValueChange={(backgroundMotion) =>
              updateGameSettings('glitter-fall', { backgroundMotion })
            }
          />
          <SettingToggle
            label={t('settings.glitterFall.sound')}
            description={t('settings.glitterFall.soundDescription')}
            value={glitterSettings.sound}
            onValueChange={(sound) => updateGameSettings('glitter-fall', { sound })}
          />
          <AppButton
            label={t('settings.glitterFall.resetPreset')}
            variant='ghost'
            size='sm'
            onPress={() =>
              updateGameSettings('glitter-fall', GLITTER_PRESETS[glitterSettings.preset])
            }
          />
        </Group>
      )}
      {gameId === 'pattern-train' && (
        <Group title={t('settings.challenge')}>
          <Text style={[styles.controlLabel, { color: colors.text }]}>
            {t('games.patternTrain.chooseDifficulty')}
          </Text>
          <SegmentedControl
            options={(['starter', 'growing', 'challenge'] as const).map((value) => ({
              value,
              label: t(
                (
                  {
                    starter: 'games.patternTrain.difficulty.easy.label',
                    growing: 'games.patternTrain.difficulty.medium.label',
                    challenge: 'games.patternTrain.difficulty.hard.label',
                  } as const
                )[value],
              ),
            }))}
            value={getGameSettings(settings, gameId).level}
            onValueChange={(level) => updateGameSettings(gameId, { level })}
            wrap
          />
        </Group>
      )}
      {gameId === 'breathing-garden' && (
        <Group title={t('settings.help')}>
          <Text style={[styles.controlLabel, { color: colors.text }]}>
            {t('games.breathingGarden.session.title')}
          </Text>
          <SegmentedControl
            options={([3, 5, 10, 'open-ended'] as const).map((value) => ({
              value,
              label:
                value === 'open-ended'
                  ? t('games.breathingGarden.session.openEnded')
                  : t('games.breathingGarden.session.breaths', { count: value }),
            }))}
            value={getGameSettings(settings, gameId).sessionLength}
            onValueChange={(sessionLength) => updateGameSettings(gameId, { sessionLength })}
            wrap
          />
          <SettingToggle
            label={t('games.breathingGarden.visualLabel')}
            value={getGameSettings(settings, gameId).visualCue}
            onValueChange={(visualCue) => updateGameSettings(gameId, { visualCue })}
          />
        </Group>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
    paddingHorizontal: Space.base,
    paddingVertical: Space.sm,
  },
  headerTitle: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    paddingHorizontal: Space.base,
    paddingTop: Space.xs,
    paddingBottom: Space.xl,
    gap: Space.base,
  },
  group: { gap: Space.xs + 2 },
  groupTitle: {
    ...TypeStyle.helper,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginLeft: Space.xs,
  },
  groupBody: {
    borderWidth: 1.5,
    borderRadius: Radius.xl,
    paddingHorizontal: Space.md,
    overflow: 'hidden',
  },
  divider: { borderTopWidth: 1 },
  groupItem: { paddingBottom: Space.xs },
  volumeWrap: { paddingBottom: Space.sm },
  groupSegment: { paddingVertical: Space.md, gap: Space.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    minHeight: 54,
    paddingVertical: Space.sm,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowCopy: { flex: 1, gap: 2 },
  rowValue: { ...TypeStyle.helper, fontSize: 14, fontWeight: '700' },
  chevron: { transform: [{ rotate: '180deg' }] },
  hero: { flexDirection: 'row', alignItems: 'center', gap: Space.md, paddingHorizontal: Space.xs },
  heroTile: {
    width: 76,
    height: 76,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: { flex: 1, gap: 2 },
  controlLabel: { ...TypeStyle.label },
  description: { ...TypeStyle.helper, marginBottom: Space.xs },
  error: { borderRadius: Radius.md, padding: Space.md },
});
