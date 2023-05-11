import "./MovingDots.css";

export const MovingDots = () => {
  return (
    <g>
      <circle r="4" className="moving-circle move-1" />
      <circle r="4" className="moving-circle move-2" />
      <circle r="4" className="moving-circle move-3" />
      <circle r="4" className="moving-circle move-4" />
      <circle r="4" className="moving-circle move-5" />
    </g>
  );
};
