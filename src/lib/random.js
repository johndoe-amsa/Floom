import { VARIATION_COUNT } from '../data'

export function randSeed() { return 1 + Math.floor(Math.random() * 99999) }
export function rand(a, b) { return a + Math.random() * (b - a) }
export function newVariantSeeds() {
  const seeds = []
  for (let i = 0; i < VARIATION_COUNT; i++) seeds.push(randSeed())
  return seeds
}
