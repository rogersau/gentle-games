const fs = require('fs');
const path = require('path');
const { GAME_REGISTRY } = require('../src/games/registry');

const projectRoot = path.join(__dirname, '..');
const homepagePath = path.join(projectRoot, 'docs', 'index.html');

const readHomepageGameIds = () => {
  const homepage = fs.readFileSync(homepagePath, 'utf8');
  return [...homepage.matchAll(/data-game-id="([^"]+)"/g)].map((match) => match[1]);
};

describe('project homepage game catalogue', () => {
  it('lists every released game in registry order and excludes unfinished games', () => {
    const releasedGameIds = GAME_REGISTRY.filter((game) => !game.isUnfinished).map(
      (game) => game.id,
    );
    const homepageGameIds = readHomepageGameIds();

    expect(homepageGameIds).toEqual(releasedGameIds);
    expect(new Set(homepageGameIds).size).toBe(homepageGameIds.length);
  });
});
