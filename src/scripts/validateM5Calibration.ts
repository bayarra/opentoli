import {
  M5_MANIFEST_PATH,
  loadM5Manifest,
  validateM5Manifest,
} from '../calibration/m5Manifest'

const manifest = await loadM5Manifest()
const validation = validateM5Manifest(manifest)

if (validation.errors.length > 0) {
  console.error(`M5 calibration manifest is invalid: ${M5_MANIFEST_PATH}`)
  for (const error of validation.errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(`M5 calibration manifest is valid: ${M5_MANIFEST_PATH}`)
console.log(`Terms: ${validation.stats.termCount}`)
console.log(`Sources: ${validation.stats.sourceCount}`)
console.log(
  `Difficulty mix: ${Object.entries(validation.stats.difficultyCounts)
    .map(([key, value]) => `${key}=${value}`)
    .join(', ')}`,
)

if (validation.warnings.length > 0) {
  console.warn('Warnings:')
  for (const warning of validation.warnings) console.warn(`- ${warning}`)
}
