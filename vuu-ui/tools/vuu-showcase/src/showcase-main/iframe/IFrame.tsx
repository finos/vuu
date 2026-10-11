export interface IFrameProps {
  src: string;
  title: string;
}

/**
 * Examples and documents are rendered by ShowcaseStandalone, in an iframe, so
 * they are fully isolated from the showcase chrome. See standaloneUrl.
 */
export const IFrame = ({ src, title }: IFrameProps) => (
  <iframe className="ShowCaseIFrame" src={src} title={title} />
);
