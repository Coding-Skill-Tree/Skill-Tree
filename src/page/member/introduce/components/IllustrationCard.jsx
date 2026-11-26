// 共用卡片：上方示意圖（16:9），下方標題、說明，可附一個範例數值。
function IllustrationCard({ image, imageAlt, title, description, sampleValue }) {
  return (
    <article className="illustration-card">
      <img className="illustration-image" src={image} alt={imageAlt} width="320" height="180" loading="lazy" />
      <div className="illustration-body">
        <h3 className="illustration-title">{title}</h3>
        <p className="illustration-description">{description}</p>
        {sampleValue && <p className="illustration-sample">{sampleValue}</p>}
      </div>
    </article>
  );
}

export default IllustrationCard;
