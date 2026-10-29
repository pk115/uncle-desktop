'use strict';

const CHARACTERS = require('../../assets/characters/catalog.json');
const DEFAULT_CHARACTER = 'angry-boy';

function characterFor(id) {
  return CHARACTERS.find((character) => character.id === id) || CHARACTERS[0];
}

module.exports = { CHARACTERS, DEFAULT_CHARACTER, characterFor };
