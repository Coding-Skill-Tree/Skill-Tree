import { BANNER, ROUTES } from "../data/welcomeContent.js";
import { MountainFlag } from "./Decorations.jsx";
import SkillCards from "./SkillCards.jsx";

function HeroBanner() {
  return (
    <section className="hero-banner" aria-labelledby="hero-title">
      <MountainFlag className="hero-decoration" />
      <div className="hero-content">
        <p className="hero-eyebrow">{BANNER.eyebrow}</p>
        <h1 id="hero-title" className="hero-title">
          {BANNER.title}
        </h1>
        <p className="hero-description">{BANNER.description}</p>
        <a className="btn btn-primary btn-large" href={ROUTES.register}>
          {BANNER.ctaLabel}
        </a>
      </div>
      <SkillCards />
    </section>
  );
}

export default HeroBanner;
