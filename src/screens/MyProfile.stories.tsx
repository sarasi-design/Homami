import type { Meta, StoryObj } from "@storybook/react-vite";
import { MyProfile } from "./MyProfile";
import { SetUpProfile } from "./SetUpProfile";
import { WithBottomNav } from "./AppLayout";
import { userEvent, within } from "storybook/test";
import { sampleFace } from "../stories-support/sampleFaces";

const meta: Meta = {
  title: "Screens/Your profile",
  parameters: {
    layout: "centered",
    options: { showPanel: false },
    design: {
      type: "figma",
      url: "https://www.figma.com/design/SyIrJ3CngOXOHcBvhMSi8Q/Homami-app-v0?node-id=85-10926",
    },
  },
  decorators: [
    (Story) => (
      <div className="relative h-[852px] w-[393px] overflow-y-auto rounded-[20px] border border-soft-grey bg-surface [transform:translateZ(0)] [&>div>main]:min-h-full [&>main]:min-h-full">
        <Story />
      </div>
    ),
  ],
};
export default meta;

const pets = [
  { id: "1", name: "Berta", kindLabel: "Dog", ageLabel: "4 years old", photoUrl: sampleFace("Berta", 3) },
  { id: "2", name: "Sushy", kindLabel: "Cat", ageLabel: "6 years old" },
];

/** Your photo in the header opens it. The bottom nav stays, so Home and Circle are one tap away. */
export const YourProfile: StoryObj = {
  name: "Your profile",
  render: () => (
    <WithBottomNav onTab={() => {}}>
      <MyProfile
        name="Sara"
        photoUrl={sampleFace("Sara")}
        city="Málaga"
        bio="Two cats, one very opinionated dog. Happy to help neighbours with pet sitting."
        pets={pets}
        onOpenPet={() => {}}
        onAddPet={() => {}}
        onLogOut={() => {}}
        onBack={() => {}}
      />
    </WithBottomNav>
  ),
};

/** Tapping Edit next to Your pets: the full pet cards (tap one to edit it) and + to add another. */
export const EditingPets: StoryObj = {
  ...YourProfile,
  name: "Your profile: editing pets",
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Edit" }));
  },
};

/** Tapping Edit profile: the setup form with a back arrow and a bio field. */
export const EditProfile: StoryObj = {
  name: "Edit profile",
  render: () => (
    <>
      <SetUpProfile
        mode="edit"
        onCancel={() => {}}
        initial={{
          firstName: "Sara",
          city: "Málaga",
          avatarUrl: sampleFace("Sara"),
        }}
        onSubmit={() => new Promise((r) => setTimeout(r, 1000))}
      />
    </>
  ),
};
