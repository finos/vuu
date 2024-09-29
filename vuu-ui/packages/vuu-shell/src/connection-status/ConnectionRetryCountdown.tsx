import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const classBase = "vuuConnectionRetryCountdown";

export const ConnectionRetryCountdown = ({
  seconds: secondsProp,
}: {
  seconds: number;
}) => {
  const secondsRemainingRef = useRef(secondsProp);
  const [seconds, setSeconds] = useState<number>(secondsRemainingRef.current);

  const countDown = useCallback(() => {
    secondsRemainingRef.current -= 1;
    setSeconds(secondsRemainingRef.current);
    if (secondsRemainingRef.current > 0) {
      setTimeout(countDown, 1000);
    }
  }, []);

  useEffect(() => {
    if (secondsProp !== secondsRemainingRef.current) {
      secondsRemainingRef.current = secondsProp;
      countDown();
    }
  }, [countDown, secondsProp]);

  useMemo(() => {
    setTimeout(countDown, 1000);
  }, [countDown]);

  return seconds === 0 ? (
    <div className={classBase}>
      <span>connecting</span>
    </div>
  ) : (
    <div className={classBase}>
      <span>retry in {seconds} seconds</span>
    </div>
  );
};
