import { useEffect, useMemo } from "react";

export const ExperimentB = () => {
  const bc = useMemo(() => {
    const bc = new BroadcastChannel("example");
    bc.onmessage = ({ data }: MessageEvent) => {
      console.log(data);
    };
    return bc;
  }, []);

  useEffect(() => {
    bc.postMessage({ Message: "listening for messages", sender: "B" });
  }, [bc]);

  return <div>Hello</div>;
};
