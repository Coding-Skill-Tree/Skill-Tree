import { ROUTES, SITE_NAME } from "../../data/characterOptions.js";
import "./SiteHeader.css";

function SiteHeader() {
  return (
    <header className="onboarding-header">
      <a className="onboarding-brand" href={ROUTES.home}>
        {SITE_NAME}
      </a>
    </header>
  );
}

export default SiteHeader;
