export const tutorials = [
  {
    skillId: "html-basics",
    category: "HTML",
    nodeCode: "H01",
    title: "認識網頁與 HTML",
    description:
      "認識 HTML 、 CSS 、 JavaScript 的用途，以及瀏覽器如何呈現網頁。",

    lesson: [
      "HTML 是用來建立網頁結構的標記語言，負責定義標題、段落、圖片等內容。",
      "CSS 負責網頁的外觀與排版，而 JavaScript 則負責互動功能。",
    ],

    learningPoints: [
      "認識 HTML、CSS、JavaScript 的差異",
      "了解瀏覽器的基本用途",
      "理解 HTML 在網頁中的角色",
    ],

    codeExample: `<h1>Hello HTML</h1>
<p>這是我的第一個網頁。</p>`,

    status: "draft",
  },
];

export function getTutorial(skillId) {
  return tutorials.find((tutorial) => tutorial.skillId === skillId);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}
function isNonEmptyStringArray(value) {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => isNonEmptyString(item))
  );
}

export function isTutorialReady(skillId) {
  const tutorial = getTutorial(skillId);

  if (!tutorial) {
    return false;
  }

  if (tutorial.status !== "published") {
    return false;
  }
  return (
    isNonEmptyString(tutorial.category) &&
    isNonEmptyString(tutorial.nodeCode) &&
    isNonEmptyString(tutorial.title) &&
    isNonEmptyString(tutorial.description) &&
    isNonEmptyStringArray(tutorial.lesson) &&
    isNonEmptyStringArray(tutorial.learningPoints) &&
    isNonEmptyString(tutorial.codeExample)
  );
}
