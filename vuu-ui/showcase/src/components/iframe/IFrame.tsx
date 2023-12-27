export const IFrame = () => {
  const src = `${location.href}?standalone&theme=vuu`;
  return (
    <div className="ShowCaseIFrame-container">
      <iframe className="ShowCaseIFrame" src={src} title={"inside"}></iframe>
    </div>
  );
};
