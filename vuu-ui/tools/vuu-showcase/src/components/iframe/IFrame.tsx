export interface IFrameProps {
  theme?: string;
}

export const IFrame = ({ theme = "vuu" }: IFrameProps) => {
  const src = `${location.href}?standalone&theme=${theme}`;
  return (
    <div className="ShowCaseIFrame-container">
      <iframe className="ShowCaseIFrame" src={src} title={"inside"}></iframe>
    </div>
  );
};
