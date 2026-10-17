import type { Preview } from '@storybook/react-vite'
import '../src/styles/tokens.css'

const preview: Preview = {
  parameters: {
    layout: 'padded',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: {
        order: ['Foundations', 'Basics', 'Blocks', 'Cards', 'Sections', 'Screens'],
      },
    },
    a11y: {
      test: 'todo',
    },
  },
}

export default preview
