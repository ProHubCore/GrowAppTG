import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    'dist',
    'node_modules',
    'functions/node_modules',
    'functions/src',
    '_growapp_backup_bucket_fix_v2',
    'src/components',
    'src/data',
    'src/game',
    'src/hooks',
    'src/legacy',
    'src/src',
    'src/utils',
  ]),
  {
    files: ['src/**/*.{js,jsx,ts,tsx}', 'scripts/**/*.mjs', '*.config.{js,ts}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
])
