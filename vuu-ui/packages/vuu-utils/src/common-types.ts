export type orientationType = "horizontal" | "vertical";

type measureProp = keyof DOMRect;
type measureType = Record<string, measureProp>;
type measuresType = Record<orientationType, measureType>;

export const MEASURES: measuresType = {
  horizontal: {
    positionProp: "left",
    sizeProp: "width",
  },
  vertical: {
    positionProp: "top",
    sizeProp: "height",
  },
};
