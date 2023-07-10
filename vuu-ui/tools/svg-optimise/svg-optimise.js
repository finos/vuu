import { parse } from "svg-parser";
import fs from "fs";

const input = fs.readFileSync("./VuuSiteAnimation.svg");
const json = parse(input.toString());
const outJson = "./out/VuuSiteAnimationSvg.json";
const outCSS = "./out/VuuSiteAnimationStyle.css";

const {
  children: [{ tagName, children: svgChildren }],
} = json;

if (tagName !== "svg") {
  throw Error("not an SVG document");
}

const [style] = svgChildren;

if (style) {
  svgChildren.splice(0, 1);
  const {
    tagName,
    children: [{ value: cssText }],
  } = style;
  if (tagName !== "style") {
    throw Error("no style block");
  }
  fs.writeFile(outCSS, cssText, (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("css file created");
    }
  });
}

fs.writeFile(outJson, JSON.stringify(json, null, 2), (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log("json file created");
  }
});
