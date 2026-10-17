import { addons } from 'storybook/manager-api'
import { create } from 'storybook/theming'

addons.setConfig({
  theme: create({
    base: 'light',
    brandTitle: 'Homami components',
    colorPrimary: '#49653a',
    colorSecondary: '#49653a',
    fontBase: '"Work Sans", system-ui, sans-serif',
    appBg: '#f2f1ee',
    appContentBg: '#ffffff',
    textColor: '#262625',
  }),
})
