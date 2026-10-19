import type { Meta, StoryObj } from "@storybook/react-vite";
import { MyProfile } from "./MyProfile";
import { SetUpProfile } from "./SetUpProfile";
import { WithBottomNav } from "./AppLayout";
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
        pets={[
          { id: "1", name: "Buddy", kindLabel: "Dog", ageLabel: "9 years old" },
        ]}
        onOpenPet={() => {}}
        onLogOut={() => {}}
        onBack={() => {}}
      />
    </WithBottomNav>
  ),
};

/** Tapping Edit profile: the setup form with a back arrow and a bio field. */
export const EditProfile: StoryObj = {
  name: "Edit profile",
  render: () => (
    <WithBottomNav onTab={() => {}}>
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
    </WithBottomNav>
  ),
};
