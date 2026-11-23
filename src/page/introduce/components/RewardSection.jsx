import { REWARDS } from "../data/welcomeContent.js";
import IllustrationCard from "./IllustrationCard.jsx";

function RewardSection() {
  return (
    <section className="welcome-section" aria-labelledby="reward-title">
      <h2 id="reward-title" className="section-title">
        獎勵機制
      </h2>
      <ul className="card-grid card-grid-2">
        {REWARDS.map((reward) => (
          <li key={reward.id}>
            <IllustrationCard
              image={reward.image}
              imageAlt={reward.imageAlt}
              title={reward.name}
              description={reward.description}
              sampleValue={reward.sampleValue}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default RewardSection;
