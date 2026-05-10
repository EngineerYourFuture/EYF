interface StitchScreenProps {
  screenFolder: string;
  title: string;
}

export const StitchScreen = ({ screenFolder, title }: StitchScreenProps) => {
  return (
    <iframe
      title={title}
      src={`/stitch/${screenFolder}/code.html`}
      className="w-full min-h-screen border-0 bg-black"
    />
  );
};
