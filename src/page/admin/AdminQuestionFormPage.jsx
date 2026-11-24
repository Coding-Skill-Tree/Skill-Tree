import { useEffect, useState } from "react";
import { createAdminQuestion, getAdminQuestion, getAdminQuestionOptions, updateAdminQuestion } from "../../services/adminQuestions";
import AdminIcon from "./AdminIcon";
import AdminLayout from "./AdminLayout";

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 10;
const difficultyLabels = { beginner: "初級", intermediate: "中級", advanced: "進階" };
const emptyOption = () => ({ text: "", explanation: "" });
const defaultValues = {
  skillId: "",
  prompt: "",
  difficulty: "intermediate",
  status: "draft",
  answerMode: "single",
  options: [emptyOption(), emptyOption(), emptyOption()],
  correctOptions: [],
  explanation: "",
};

function optionLetter(index) {
  return String.fromCharCode(65 + index);
}

function validate(values) {
  const errors = {};
  if (!values.prompt.trim()) errors.prompt = "請輸入題目敘述。";
  if (Array.from(values.prompt).length > 500) errors.prompt = "題目敘述最多 500 個字。";
  if (!values.skillId) errors.skillId = "請選擇對應的技能。";
  if (values.options.length < MIN_OPTIONS || values.options.length > MAX_OPTIONS) {
    errors.choices = `選項數量須介於 ${MIN_OPTIONS} 到 ${MAX_OPTIONS} 個。`;
  }
  values.options.forEach((option, index) => {
    if (!option.text.trim()) errors[`option-${index}`] = `請輸入選項 ${optionLetter(index)}。`;
    if (Array.from(option.text).length > 180) errors[`option-${index}`] = "每個選項最多 180 個字。";
    if (!option.explanation.trim()) errors[`optionExplanation-${index}`] = "請補上這個選項的解析。";
    if (Array.from(option.explanation).length > 1200) errors[`optionExplanation-${index}`] = "每個選項解析最多 1200 個字。";
  });
  const correctOptions = values.correctOptions.filter((index) => Number.isInteger(index) && index >= 0 && index < values.options.length);
  if (correctOptions.length !== values.correctOptions.length
      || (values.answerMode === "single" && correctOptions.length !== 1)
      || (values.answerMode === "multiple" && correctOptions.length < 2)) {
    errors.correctChoices = values.answerMode === "multiple" ? "多選題請至少標記兩個正確選項。" : "單選題請標記一個正確選項。";
  }
  if (!values.explanation.trim()) errors.explanation = "請補上整題解析。";
  if (Array.from(values.explanation).length > 1200) errors.explanation = "整題解析最多 1200 個字。";
  return errors;
}

function fieldClass(hasError) {
  return `question-form-control${hasError ? " is-invalid" : ""}`;
}

function QuestionFormLoading({ admin, onLogout }) {
  return <AdminLayout activePage="questions" breadcrumb="題目表單" admin={admin} onLogout={onLogout}><main className="admin-content"><div className="admin-panel question-empty-state" role="status">正在載入題目資料…</div></main></AdminLayout>;
}

export default function AdminQuestionFormPage({ admin, onLogout }) {
  const path = window.location.pathname;
  const editId = path.match(/^\/admin\/questions\/([^/]+)\/edit$/)?.[1];
  const isEdit = Boolean(editId);
  const [values, setValues] = useState(defaultValues);
  const [categories, setCategories] = useState([]);
  const [skills, setSkills] = useState([]);
  const [existingQuestion, setExistingQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [loadNotFound, setLoadNotFound] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [saveMessage, setSaveMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const options = await getAdminQuestionOptions();
        if (!active) return;
        setCategories(options.categories);
        setSkills(options.skills);
        if (isEdit) {
          const question = await getAdminQuestion(decodeURIComponent(editId));
          if (!active) return;
          setExistingQuestion(question);
          setValues({
            ...defaultValues,
            skillId: question.skillId,
            prompt: question.prompt,
            difficulty: question.difficulty,
            status: question.status,
            answerMode: question.answerMode || (question.correctChoices?.length > 1 ? "multiple" : "single"),
            options: question.choices.map((text, index) => ({
              text,
              explanation: question.choiceExplanations?.[index] || "",
            })),
            correctOptions: question.correctChoices || (Number.isInteger(question.correctChoice) ? [question.correctChoice] : []),
            explanation: question.explanation,
          });
        }
      } catch (requestError) {
        if (!active) return;
        setLoadNotFound(requestError.status === 404);
        setLoadError(requestError.message || "載入題目資料失敗。");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [editId, isEdit]);

  const errors = { ...(submitted ? validate(values) : {}), ...serverErrors };
  const selectedSkill = skills.find((skill) => (skill.skillId || skill.id) === values.skillId);

  function clearServerErrors(...keys) {
    setServerErrors((current) => {
      const next = { ...current };
      keys.forEach((key) => { delete next[key]; });
      return next;
    });
    setSaveMessage("");
  }

  function update(key, value) {
    setValues((current) => ({ ...current, [key]: value }));
    clearServerErrors(key);
  }

  function updateAnswerMode(answerMode) {
    setValues((current) => ({
      ...current,
      answerMode,
      correctOptions: answerMode === "single" ? current.correctOptions.slice(0, 1) : current.correctOptions,
    }));
    clearServerErrors("answerMode", "correctChoices");
  }

  function updateOption(index, key, value) {
    setValues((current) => {
      const options = current.options.map((option, optionIndex) => optionIndex === index ? { ...option, [key]: value } : option);
      return { ...current, options };
    });
    clearServerErrors("choices", "choiceExplanations", `option-${index}`, `optionExplanation-${index}`);
  }

  function toggleCorrectOption(index) {
    setValues((current) => {
      if (current.answerMode === "single") return { ...current, correctOptions: [index] };
      const selected = current.correctOptions.includes(index);
      return { ...current, correctOptions: selected
        ? current.correctOptions.filter((optionIndex) => optionIndex !== index)
        : [...current.correctOptions, index] };
    });
    clearServerErrors("correctChoices", "correctChoice");
  }

  function addOption() {
    if (values.options.length >= MAX_OPTIONS) return;
    setValues((current) => ({ ...current, options: [...current.options, emptyOption()] }));
    clearServerErrors("choices", "choiceExplanations");
  }

  function removeOption(index) {
    if (values.options.length <= MIN_OPTIONS) return;
    setValues((current) => ({
      ...current,
      options: current.options.filter((_option, optionIndex) => optionIndex !== index),
      correctOptions: current.correctOptions
        .filter((optionIndex) => optionIndex !== index)
        .map((optionIndex) => optionIndex > index ? optionIndex - 1 : optionIndex),
    }));
    clearServerErrors("choices", "choiceExplanations", "correctChoices", "correctChoice");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
    setSaveMessage("");
    const validationErrors = validate(values);
    if (Object.keys(validationErrors).length) return;

    setSaving(true);
    setServerErrors({});
    const payload = {
      skillId: values.skillId,
      prompt: values.prompt.trim(),
      answerMode: values.answerMode,
      choices: values.options.map((option) => option.text.trim()),
      choiceExplanations: values.options.map((option) => option.explanation.trim()),
      correctChoices: values.correctOptions,
      correctChoice: values.answerMode === "single" ? values.correctOptions[0] : null,
      explanation: values.explanation.trim(),
      difficulty: values.difficulty,
      status: values.status,
    };
    try {
      const savedQuestion = isEdit
        ? await updateAdminQuestion(decodeURIComponent(editId), payload)
        : await createAdminQuestion(payload);
      window.location.assign(`/admin/questions/${encodeURIComponent(savedQuestion.id)}`);
    } catch (requestError) {
      const fieldErrors = requestError.details?.fields || requestError.details?.details?.fields;
      if (fieldErrors) {
        setServerErrors({
          ...(fieldErrors.skillId ? { skillId: fieldErrors.skillId } : {}),
          ...(fieldErrors.prompt ? { prompt: fieldErrors.prompt } : {}),
          ...(fieldErrors.choices ? { choices: fieldErrors.choices } : {}),
          ...(fieldErrors.choiceExplanations ? { choiceExplanations: fieldErrors.choiceExplanations } : {}),
          ...(fieldErrors.answerMode ? { answerMode: fieldErrors.answerMode } : {}),
          ...(fieldErrors.correctChoices ? { correctChoices: fieldErrors.correctChoices } : {}),
          ...(fieldErrors.correctChoice ? { correctChoices: fieldErrors.correctChoice } : {}),
          ...(fieldErrors.explanation ? { explanation: fieldErrors.explanation } : {}),
          ...(fieldErrors.difficulty ? { difficulty: fieldErrors.difficulty } : {}),
          ...(fieldErrors.status ? { status: fieldErrors.status } : {}),
        });
      } else {
        setSaveMessage(requestError.message || "儲存失敗，請稍後再試。");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <QuestionFormLoading admin={admin} onLogout={onLogout}/>;
  if (loadError) {
    return <AdminLayout activePage="questions" breadcrumb={isEdit ? "編輯題目" : "新增題目"} admin={admin} onLogout={onLogout}><main className="admin-content"><section className="admin-panel question-form-not-found"><span className="page-eyebrow">QUESTION EDITOR <i>/</i> E-03</span><h1>{loadNotFound ? "找不到這道題目" : "無法載入題目資料"}</h1><p>{loadError}</p><a className="admin-primary-button" href="/admin/questions">返回題庫列表</a></section></main></AdminLayout>;
  }

  return (
    <AdminLayout activePage="questions" breadcrumb={isEdit ? "編輯題目" : "新增題目"} admin={admin} onLogout={onLogout}>
      <main className="admin-content question-editor-content">
        <div className="question-editor-back-row">
          <a className="question-editor-back" href="/admin/questions"><AdminIcon name="chevron-left" size={16}/>返回題庫列表</a>
          <span className="question-editor-mode">{isEdit ? "編輯模式" : "新增模式"}{existingQuestion && <span className="question-id">#{existingQuestion.id}</span>}</span>
        </div>

        <section className="admin-page-heading question-editor-heading">
          <div><span className="page-eyebrow">QUESTION EDITOR <i>/</i> E-03</span><h1>{isEdit ? "編輯題目" : "新增題目"}</h1><p>設定題目內容、技能分類與作答資訊。</p></div>
        </section>

        <div className="question-editor-notice" role="note"><span className="question-editor-notice-icon">i</span><p><strong>正式題庫</strong> 儲存後會寫入資料庫，並記錄管理員操作。</p></div>

        <form className="question-editor-form" noValidate onSubmit={handleSubmit}>
          <div className="question-editor-main">
            <section className="admin-panel question-form-card" aria-labelledby="question-content-heading">
              <div className="question-form-card-heading"><span className="question-form-step">01</span><div><h2 id="question-content-heading">題目內容</h2><p>清楚描述要測驗的知識或操作。</p></div><span className="question-required-note">* 必填</span></div>
              <label className="question-form-field" htmlFor="question-prompt">
                <span className="question-form-label">題目敘述 <b>*</b></span>
                <textarea id="question-prompt" className={fieldClass(Boolean(errors.prompt))} rows={5} maxLength={500} placeholder="輸入題目內容，最多 500 個字。" value={values.prompt} onChange={(event) => update("prompt", event.target.value)} aria-invalid={Boolean(errors.prompt)} aria-describedby={errors.prompt ? "question-prompt-error" : "question-prompt-hint"}/>
                <span className="question-field-meta">{errors.prompt ? <span className="question-field-error" id="question-prompt-error" role="alert">{errors.prompt}</span> : <span id="question-prompt-hint">請使用簡潔、明確的文字。</span>}<span>{values.prompt.length}/500</span></span>
              </label>
            </section>

            <section className="admin-panel question-form-card" aria-labelledby="question-options-heading">
              <div className="question-form-card-heading"><span className="question-form-step">02</span><div><h2 id="question-options-heading">選項、解析與正確答案</h2><p>可建立 2 到 10 個選項，並為每個選項補充解析。</p></div><span className="question-required-note">* 必填</span></div>

              <fieldset className="question-answer-mode">
                <legend>作答方式</legend>
                <label className={values.answerMode === "single" ? "is-selected" : ""}><input type="radio" name="answerMode" value="single" checked={values.answerMode === "single"} onChange={() => updateAnswerMode("single")}/><span>單選</span></label>
                <label className={values.answerMode === "multiple" ? "is-selected" : ""}><input type="radio" name="answerMode" value="multiple" checked={values.answerMode === "multiple"} onChange={() => updateAnswerMode("multiple")}/><span>多選</span></label>
              </fieldset>

              <div className="question-options-list" role="group" aria-labelledby="question-options-heading" aria-describedby={errors.correctChoices || errors.choices || errors.choiceExplanations ? "question-correct-error" : undefined}>
                {values.options.map((option, index) => {
                  const letter = optionLetter(index);
                  const selected = values.correctOptions.includes(index);
                  const optionError = errors[`option-${index}`];
                  const optionExplanationError = errors[`optionExplanation-${index}`];
                  return (
                    <div className={`question-option-row${selected ? " is-correct" : ""}${optionError || optionExplanationError ? " has-error" : ""}`} key={`option-${index}`}>
                      <div className="question-option-heading">
                        <label className="question-correct-choice">
                          <input type={values.answerMode === "multiple" ? "checkbox" : "radio"} name="correctOption" checked={selected} onChange={() => toggleCorrectOption(index)} aria-label={`將選項 ${letter} 設為正確答案`}/>
                          <span className="question-option-letter">{letter}</span>
                          <span className="question-correct-caption">{selected ? "正確答案" : "設為正解"}</span>
                        </label>
                        <button className="question-option-remove" type="button" onClick={() => removeOption(index)} disabled={values.options.length <= MIN_OPTIONS} aria-label={`移除選項 ${letter}`}>移除</button>
                      </div>
                      <label className="question-option-input-wrap" htmlFor={`question-option-${index}`}>
                        <span className="sr-only">選項 {letter} 內容</span>
                        <input id={`question-option-${index}`} className={fieldClass(Boolean(optionError))} type="text" maxLength={180} placeholder={`輸入選項 ${letter} 的內容`} value={option.text} onChange={(event) => updateOption(index, "text", event.target.value)} aria-invalid={Boolean(optionError)} aria-describedby={optionError ? `option-error-${index}` : undefined}/>
                        {optionError && <span className="question-field-error" id={`option-error-${index}`} role="alert">{optionError}</span>}
                      </label>
                      <label className="question-option-explanation" htmlFor={`question-option-explanation-${index}`}>
                        <span>選項 {letter} 解析 <b>*</b></span>
                        <textarea id={`question-option-explanation-${index}`} className={fieldClass(Boolean(optionExplanationError))} rows={2} maxLength={1200} placeholder={`說明選項 ${letter} 為什麼正確或錯誤。`} value={option.explanation} onChange={(event) => updateOption(index, "explanation", event.target.value)} aria-invalid={Boolean(optionExplanationError)} aria-describedby={optionExplanationError ? `option-explanation-error-${index}` : undefined}/>
                        <span className="question-field-meta">{optionExplanationError && <span className="question-field-error" id={`option-explanation-error-${index}`} role="alert">{optionExplanationError}</span>}<span>{option.explanation.length}/1200</span></span>
                      </label>
                    </div>
                  );
                })}
              </div>
              {(errors.choices || errors.choiceExplanations || errors.correctChoices) && <p className="question-field-error question-options-error" id="question-correct-error" role="alert">{errors.choices || errors.choiceExplanations || errors.correctChoices}</p>}
              <div className="question-options-footer">
                <button className="admin-secondary-button question-add-option" type="button" onClick={addOption} disabled={values.options.length >= MAX_OPTIONS}>＋ 新增選項 <span>{values.options.length}/{MAX_OPTIONS}</span></button>
                <span className="question-options-hint">{values.answerMode === "multiple" ? "多選題至少標記兩個正確答案。" : "單選題請標記一個正確答案。"}</span>
              </div>
            </section>

            <section className="admin-panel question-form-card" aria-labelledby="question-explanation-heading">
              <div className="question-form-card-heading"><span className="question-form-step">03</span><div><h2 id="question-explanation-heading">整題解析</h2><p>補充整體概念或解題步驟，與各選項解析互補。</p></div><span className="question-required-note">* 必填</span></div>
              <label className="question-form-field" htmlFor="question-explanation"><span className="question-form-label">解析內容 <b>*</b></span><textarea id="question-explanation" className={fieldClass(Boolean(errors.explanation))} rows={4} maxLength={1200} placeholder="說明整題的核心觀念或解題步驟。" value={values.explanation} onChange={(event) => update("explanation", event.target.value)} aria-invalid={Boolean(errors.explanation)} aria-describedby={errors.explanation ? "question-explanation-error" : "question-explanation-hint"}/><span className="question-field-meta">{errors.explanation ? <span className="question-field-error" id="question-explanation-error" role="alert">{errors.explanation}</span> : <span id="question-explanation-hint">儲存時需填寫整題解析。</span>}<span>{values.explanation.length}/1200</span></span></label>
            </section>

            <div className="question-form-actions"><a className="admin-secondary-button question-cancel-button" href="/admin/questions">取消</a><button className="admin-primary-button" type="submit" disabled={saving}><AdminIcon name="check" size={17}/>{saving ? "儲存中…" : "儲存題目"}</button></div>
            {saveMessage && <p className="question-save-message" role="alert">{saveMessage}</p>}
          </div>

          <aside className="question-editor-side">
            <section className="admin-panel question-form-card question-settings-card" aria-labelledby="question-settings-heading">
              <div className="question-form-card-heading"><span className="question-form-step">設定</span><div><h2 id="question-settings-heading">題目分類</h2><p>選擇題目對應的技能。</p></div></div>
              <label className="question-form-field" htmlFor="question-skill"><span className="question-form-label">技能節點 <b>*</b></span><select id="question-skill" className={fieldClass(Boolean(errors.skillId))} value={values.skillId} onChange={(event) => update("skillId", event.target.value)} aria-invalid={Boolean(errors.skillId)} aria-describedby={errors.skillId ? "question-skill-error" : undefined}><option value="">選擇技能節點</option>{categories.map((category) => <optgroup label={category.name} key={category.id}>{skills.filter((skill) => skill.categoryId === category.id).map((skill) => { const skillId = skill.skillId || skill.id; return <option value={skillId} key={skillId}>{skill.title}</option>; })}</optgroup>)}</select>{errors.skillId && <span className="question-field-error" id="question-skill-error" role="alert">{errors.skillId}</span>}</label>
              <label className="question-form-field" htmlFor="question-difficulty"><span className="question-form-label">題目難度 <span className="question-optional-label">選填</span></span><select id="question-difficulty" className="question-form-control" value={values.difficulty} onChange={(event) => update("difficulty", event.target.value)}><option value="beginner">初級</option><option value="intermediate">中級</option><option value="advanced">進階</option></select></label>
              <label className="question-form-field" htmlFor="question-status"><span className="question-form-label">題目狀態</span><select id="question-status" className="question-form-control" value={values.status} onChange={(event) => update("status", event.target.value)}><option value="draft">草稿</option><option value="published">已發布</option></select>{errors.status && <span className="question-field-error" role="alert">{errors.status}</span>}</label>
              <div className="question-settings-summary"><span>目前設定</span><strong>{selectedSkill?.title || "尚未選擇技能"}</strong><small>{selectedSkill?.category || "—"} · {difficultyLabels[values.difficulty]} · {values.answerMode === "multiple" ? "多選" : "單選"} · {values.options.length} 個選項</small></div>
            </section>
            <section className="admin-panel question-form-guide"><span className="question-guide-icon"><AdminIcon name="check" size={17}/></span><h3>完成前確認</h3><ul><li>題目敘述清楚完整</li><li>每個選項都填有解析</li><li>正確答案數量符合單選或多選</li><li>已提供整題解析</li></ul></section>
          </aside>
        </form>
      </main>
    </AdminLayout>
  );
}
