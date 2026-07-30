const fs = require('fs');
const path = require('path');
const { GAME_REGISTRY } = require('../src/games/registry');
const translations = require('../src/i18n/locales/en-AU.json');

const projectRoot = path.join(__dirname, '..');

const translatedGameName = (key) =>
  key.split('.').reduce((value, segment) => value[segment], translations);

describe('public game catalogue', () => {
  const releasedNames = GAME_REGISTRY.filter((game) => !game.isUnfinished).map((game) =>
    translatedGameName(game.nameKey),
  );
  const unfinishedNames = GAME_REGISTRY.filter((game) => game.isUnfinished).map((game) =>
    translatedGameName(game.nameKey),
  );

  it.each(['docs/index.html', 'public/index.html'])(
    'lists every released game and omits unfinished games in %s',
    (relativePath) => {
      const page = fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');

      releasedNames.forEach((name) => expect(page).toContain(name));
      unfinishedNames.forEach((name) => expect(page).not.toContain(name));
    },
  );
});
