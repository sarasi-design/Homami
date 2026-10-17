import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Header } from './Header'
import { ChoiceCard, ChoiceGroup } from './ChoiceCard'
import petDog from '../../assets/pet-dog.webp'
import petCat from '../../assets/pet-cat.webp'

const meta: Meta = { title: 'Blocks/Header and choice cards', parameters: { options: { showPanel: false } } }
export default meta

/** Figma Header / Minimal: 80px, back button on the left, title on the right. */
export const Headers: StoryObj = {
  render: () => (
    <div className="flex w-[393px] flex-col gap-l bg-surface">
      <Header title="Set up profile" onBack={() => {}} />
      <Header title="Set up profile" />
    </div>
  ),
}

function Choices() {
  const [chosen, setChosen] = useState<string>('dog')
  return (
    <div className="w-[361px]">
      <ChoiceGroup label="What kind of pet?">
        <ChoiceCard label="Dog" image={petDog} selected={chosen === 'dog'} onClick={() => setChosen('dog')} />
        <ChoiceCard label="Cat" image={petCat} selected={chosen === 'cat'} onClick={() => setChosen('cat')} />
      </ChoiceGroup>
    </div>
  )
}

/** Pick one. The chosen card gets a 3px Soft sage border. */
export const ChoiceCards: StoryObj = { name: 'Choice cards', render: () => <Choices /> }
