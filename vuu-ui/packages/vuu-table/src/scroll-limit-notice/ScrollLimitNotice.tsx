import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { HTMLAttributes } from "react";

import scrollLimitNoticeCss from "./ScrollLimitNotice.css";

const classBase = "vuuScrollLimitNotice";

const numberFormatter = new Intl.NumberFormat();

export interface ScrollLimitNoticeProps
    extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    maxScrollEnd: number;
    rowCount: number;
}

export const ScrollLimitNotice = ({
    className,
    maxScrollEnd,
    rowCount,
    ...htmlAttributes
}: ScrollLimitNoticeProps) => {
    const targetWindow = useWindow();

    useComponentCssInjection({
        testId: "vuu-table",
        css: scrollLimitNoticeCss,
        window: targetWindow,
    });

    const hiddenRowCount = Math.max(0, rowCount - maxScrollEnd);
    const hiddenRowCountLabel = numberFormatter.format(hiddenRowCount);
    const maxScrollEndLabel = numberFormatter.format(maxScrollEnd);

    return (
        <div {...htmlAttributes} className={cx(classBase, className)}>
            {`There are ${hiddenRowCountLabel} more rows, but we only allow scrolling through the first ${maxScrollEndLabel}. Use filters to narrow down the dataset.`}
        </div>
    );
};
