import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { CaregiverGate } from '../components/CaregiverGate';
import { usePracticeHistory } from '../context/PracticeHistoryContext';
import type { TranslationKey } from '../i18n/types';
import type { PracticeResponse } from '../utils/practiceHistory';
import { useThemeColors } from '../utils/theme';
import {
  AppButton,
  AppCard,
  AppHeader,
  AppModal,
  AppScreen,
  SegmentedControl,
  SettingToggle,
} from '../ui/components';
import { Space, TypeStyle } from '../ui/tokens';

const RESPONSES: PracticeResponse[] = [
  'independent',
  'after-visual-hint',
  'after-model',
  'corrected',
  'skipped',
];

const configurationTranslationKey = (configuration: string): TranslationKey | null => {
  switch (configuration) {
    case 'pattern-train:easy':
      return 'practiceHistory.configurations.patternTrain.easy';
    case 'pattern-train:medium':
      return 'practiceHistory.configurations.patternTrain.medium';
    case 'pattern-train:hard':
      return 'practiceHistory.configurations.patternTrain.hard';
    case 'category-match:2-groups':
      return 'practiceHistory.configurations.categoryMatch.twoGroups';
    case 'category-match:3-groups':
      return 'practiceHistory.configurations.categoryMatch.threeGroups';
    default:
      return null;
  }
};

export const PracticeHistoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { colors } = useThemeColors();
  const {
    records,
    settings,
    updateSettings,
    deleteAllRecords,
    isLoading,
    isSaving,
    persistenceError,
  } = usePracticeHistory();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const responseCounts = useMemo(
    () =>
      Object.fromEntries(
        RESPONSES.map((response) => [
          response,
          records.filter((record) => record.response === response).length,
        ]),
      ) as Record<PracticeResponse, number>,
    [records],
  );

  return (
    <AppScreen scroll testID='practice-history-screen'>
      <AppHeader title={t('practiceHistory.title')} onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <CaregiverGate>
          <Text style={[styles.description, { color: colors.textLight }]}>
            {t('practiceHistory.description')}
          </Text>
          <SettingToggle
            label={t('practiceHistory.enable.label')}
            description={t('practiceHistory.enable.description')}
            value={settings.enabled}
            onValueChange={(enabled) => void updateSettings({ enabled })}
          />
          <Text style={[styles.label, { color: colors.text }]}>
            {t('practiceHistory.retention.title')}
          </Text>
          <SegmentedControl
            options={([7, 30, 90] as const).map((value) => ({
              value,
              label: t('practiceHistory.retention.days', { count: value }),
            }))}
            value={settings.retentionDays}
            onValueChange={(retentionDays) => void updateSettings({ retentionDays })}
          />
          <Text
            style={[styles.status, { color: persistenceError ? colors.danger : colors.textLight }]}
          >
            {persistenceError
              ? t('practiceHistory.persistenceError')
              : isLoading
                ? t('common.loading')
                : isSaving
                  ? t('settings.saving')
                  : t('settings.saved')}
          </Text>

          <Text accessibilityRole='header' style={[styles.heading, { color: colors.text }]}>
            {t('practiceHistory.summary.title')}
          </Text>
          <View style={styles.summaryGrid}>
            {RESPONSES.map((response) => (
              <AppCard
                key={response}
                variant='outlined'
                style={styles.summaryCard}
                testID={`practice-summary-${response}`}
              >
                <Text style={[styles.count, { color: colors.text }]}>
                  {responseCounts[response]}
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.textLight }]}>
                  {t(`practiceHistory.responses.${response}`)}
                </Text>
              </AppCard>
            ))}
          </View>

          <Text accessibilityRole='header' style={[styles.heading, { color: colors.text }]}>
            {t('practiceHistory.recent.title')}
          </Text>
          {records.length === 0 ? (
            <Text style={[styles.empty, { color: colors.textLight }]}>
              {t('practiceHistory.recent.empty')}
            </Text>
          ) : (
            records.map((record, index) => {
              const configurationKey = record.selectedConfiguration
                ? configurationTranslationKey(record.selectedConfiguration)
                : null;
              const levelConfiguration = `${record.game}:${record.level}`;
              const levelKey = configurationTranslationKey(levelConfiguration);
              return (
                <AppCard
                  key={`${record.occurredAt}-${record.game}-${record.targetSkill}-${index}`}
                  variant='outlined'
                  style={styles.recordCard}
                >
                  <Text style={[styles.recordTitle, { color: colors.text }]}>
                    {t(`practiceHistory.games.${record.game}`)}
                  </Text>
                  <Text style={[styles.recordText, { color: colors.textLight }]}>
                    {record.targetSkill === 'continue-repeating-pattern'
                      ? t('practiceHistory.skills.continue-repeating-pattern')
                      : record.targetSkill === 'sort-by-stated-category'
                        ? t('practiceHistory.skills.sort-by-stated-category')
                        : record.targetSkill}
                  </Text>
                  <Text
                    testID='practice-record-details'
                    style={[styles.recordText, { color: colors.textLight }]}
                  >
                    {t(`practiceHistory.responses.${record.response}`)} ·{' '}
                    {levelKey ? t(levelKey) : record.level} ·{' '}
                    {t('practiceHistory.attempts', { count: record.attempts })}
                  </Text>
                  {record.selectedConfiguration &&
                  record.selectedConfiguration !== levelConfiguration ? (
                    <Text style={[styles.recordText, { color: colors.textLight }]}>
                      {configurationKey ? t(configurationKey) : record.selectedConfiguration}
                    </Text>
                  ) : null}
                </AppCard>
              );
            })
          )}
          <AppButton
            label={t('practiceHistory.deleteAll')}
            variant='danger'
            disabled={records.length === 0}
            onPress={() => setShowDeleteConfirm(true)}
            testID='delete-practice-history'
          />
        </CaregiverGate>
      </View>

      <AppModal
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title={t('practiceHistory.deleteConfirm.title')}
      >
        <Text style={[styles.description, { color: colors.text }]}>
          {t('practiceHistory.deleteConfirm.description')}
        </Text>
        <View style={styles.modalActions}>
          <AppButton
            label={t('common.cancel')}
            variant='ghost'
            onPress={() => setShowDeleteConfirm(false)}
          />
          <AppButton
            label={t('practiceHistory.deleteConfirm.action')}
            variant='danger'
            onPress={() => {
              void deleteAllRecords();
              setShowDeleteConfirm(false);
            }}
            testID='confirm-delete-practice-history'
          />
        </View>
      </AppModal>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  content: { padding: Space.xl, width: '100%', maxWidth: 720, alignSelf: 'center', gap: Space.md },
  description: { ...TypeStyle.bodySm, textAlign: 'center', marginBottom: Space.md },
  label: { ...TypeStyle.label, marginTop: Space.md, marginBottom: Space.xs },
  status: { ...TypeStyle.bodySm, marginTop: Space.sm },
  heading: { ...TypeStyle.h3, marginTop: Space.lg, marginBottom: Space.sm },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  summaryCard: { width: '47%', flexGrow: 1, alignItems: 'center' },
  count: { ...TypeStyle.h2 },
  summaryLabel: { ...TypeStyle.bodySm, textAlign: 'center' },
  empty: { ...TypeStyle.body, marginBottom: Space.md },
  recordCard: { marginBottom: Space.sm },
  recordTitle: { ...TypeStyle.bodyMedium },
  recordText: { ...TypeStyle.bodySm, marginTop: Space.xs },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Space.sm,
    marginTop: Space.md,
  },
});
