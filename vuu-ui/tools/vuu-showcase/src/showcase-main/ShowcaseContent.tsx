import { useLocation } from "react-router-dom";
import { ThemeBrowser } from "../theme-browser";
import { ContentToolbar } from "./ContentToolbar";
import { IFrame } from "./iframe";
import { THEME_PATH } from "./tree-nav/nav-tree";

/**
 * Content area of the showcase shell. Examples and docs render in an iframe,
 * below the toolbar that controls theme, density etc. The Theme Browser is
 * built into the shell and renders directly, it does not use the toolbar.
 */
export const ShowcaseContent = () => {
  const { pathname } = useLocation();
  const isThemeRoute = pathname.replace(/\/$/, "") === THEME_PATH;
  return (
    <div className="ShowcaseContent">
      {isThemeRoute ? (
        <ThemeBrowser />
      ) : (
        <>
          <ContentToolbar />
          <div className="ShowcaseContent-main">
            <IFrame />
          </div>
        </>
      )}
    </div>
  );
};
