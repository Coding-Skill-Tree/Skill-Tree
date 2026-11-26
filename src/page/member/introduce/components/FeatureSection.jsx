import { FEATURES } from "../data/welcomeContent.js";
import IllustrationCard from "./IllustrationCard.jsx";

function FeatureSection() {
  return (
    <section className="welcome-section" aria-labelledby="feature-title">
      <h2 id="feature-title" className="section-title">
        這是什麼網站？
      </h2>
      <ul className="card-grid card-grid-3">
        {FEATURES.map((feature) => (
          <li key={feature.id}>
            <IllustrationCard
              image={feature.image}
              imageAlt={feature.imageAlt}
              title={feature.title}
              description={feature.description}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default FeatureSection;
