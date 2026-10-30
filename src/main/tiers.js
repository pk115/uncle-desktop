'use strict';

// Her three brain tiers (NORMAL, HIGHER, MAX), out of the models the provider has: ranked by
// size in the name (7b, 70b), else by what the name says (mini/flash small, pro/opus big).
// ponytail: a name heuristic, not benchmarks; a model the user picks in the menu always wins.
const TIERS = ['normal', 'higher', 'max'];

function weight(name) {
  const n = String(name).toLowerCase().replace(/[:_/-]/g, ' '); // in words: "gemini" isn't "mini"
  const size = /\b(\d+(?:\.\d+)?)b\b/.exec(n);
  if (size) return Number(size[1]);
  if (/\b(nano|tiny|lite|mini|small|haiku)\b/.test(n)) return 4;
  if (/\b(flash|turbo|sonnet|medium)\b/.test(n)) return 20;
  if (/\b(pro|opus|large|max|plus|ultra|reasoner|o\d)\b/.test(n)) return 200;
  return 30;
}

// The model for that tier: the smallest, the middle one, the biggest (cloud models included).
function tierModel(models, tier) {
  if (!models?.length || !TIERS.includes(tier)) return null;
  const ranked = [...models].sort((a, b) => weight(a) - weight(b));
  return ranked[tier === 'normal' ? 0 : tier === 'max' ? ranked.length - 1 : Math.floor((ranked.length - 1) / 2)];
}

module.exports = { TIERS, tierModel, weight };
