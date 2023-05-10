import "./AnimationPath.css";
export const AnimationPath = () => {
  return (
    <g>
      <path className="animation-path" d="M50,500v500" />
      <path className="animation-path" d="M50,1000l200,200v500l-200,200" />
      <path className="animation-path" d="M50,1000l-200,200v500l200,200" />
      <path className="animation-path" d="M50,1900v500" />
    </g>
  );
};
