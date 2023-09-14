export const IFrame = () => {
  const src = `${location.href}?standalone&theme=vuu`;
  return (
    <div className="ShowCaseIFrame-container">
      <iframe
        className="ShowCaseIFrame"
        src={src}
        // ref={iframeRef}
        title={"inside"}
      ></iframe>
    </div>
  );
};
