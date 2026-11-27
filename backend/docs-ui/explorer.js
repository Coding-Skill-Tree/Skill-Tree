const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'];
const METHOD_FILTERS = ['ALL', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const appRoot = document.querySelector('#app');

let openApi;
let operations = [];
let selectedTag = 'Health';
let expandedOperationId = null;
let expandedTags = new Set(['Health']);
let methodFilter = 'ALL';
let searchText = '';
let healthMessage = '檢查服務狀態';
let healthStatus = 'unknown';
let activeResponseTab = 'body';
let requestResult = null;
let runningOperationId = null;
let tryModeOperationId = null;
let operationInputs = new Map();
let searchComposing = false;

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

function resolveRef(value) {
  if (!value?.$ref) return value || {};
  const keys = value.$ref.replace(/^#\//, '').split('/').map((key) => key.replace(/~1/g, '/').replace(/~0/g, '~'));
  return keys.reduce((current, key) => current?.[key], openApi) || {};
}

function dereference(value) {
  let current = value || {};
  let depth = 0;
  while (current?.$ref && depth < 8) {
    current = resolveRef(current);
    depth += 1;
  }
  return current;
}

function schemaType(schema) {
  const resolved = dereference(schema);
  if (resolved.type === 'array') return `${schemaType(resolved.items)}[]`;
  if (resolved.type === 'object' || resolved.properties) return 'object';
  return resolved.type || 'any';
}

function exampleForSchema(schema, depth = 0) {
  if (depth > 4) return null;
  const resolved = dereference(schema);
  if (resolved.example !== undefined) return resolved.example;
  if (resolved.default !== undefined) return resolved.default;
  if (resolved.enum?.length) return resolved.enum[0];
  if (resolved.type === 'array') return [exampleForSchema(resolved.items, depth + 1)].filter((item) => item !== null);
  if (resolved.type === 'object' || resolved.properties) {
    return Object.fromEntries(Object.entries(resolved.properties || {})
      .map(([key, child]) => [key, exampleForSchema(child, depth + 1)])
      .filter(([, value]) => value !== null));
  }
  if (resolved.type === 'integer' || resolved.type === 'number') return 1;
  if (resolved.type === 'boolean') return true;
  if (resolved.format === 'email') return 'member@example.com';
  if (resolved.format === 'date-time') return '2026-01-01T00:00:00.000Z';
  if (resolved.format === 'uuid') return '00000000-0000-4000-8000-000000000000';
  if (resolved.type === 'string') return resolved.minLength ? 'example' : '';
  return null;
}

function jsonMedia(content) {
  return Object.entries(content || {}).find(([type]) => type.includes('json'))?.[1] || Object.values(content || {})[0] || {};
}

function getBodyExample(operation) {
  const requestBody = dereference(operation.requestBody);
  const media = jsonMedia(requestBody.content);
  const examples = media.examples || {};
  const firstNamedExample = Object.values(examples)[0];
  if (media.example !== undefined) return media.example;
  if (firstNamedExample?.value !== undefined) return firstNamedExample.value;
  return exampleForSchema(media.schema) ?? {};
}

function getOperationList() {
  return Object.entries(openApi.paths || {}).flatMap(([path, pathItem]) => HTTP_METHODS.flatMap((method) => {
    const operation = pathItem[method];
    if (!operation) return [];
    const resolvedParameters = [
      ...(pathItem.parameters || []),
      ...(operation.parameters || []),
    ].map((parameter) => dereference(parameter));
    return [{
      id: operation.operationId || `${method}-${path}`,
      method: method.toUpperCase(),
      path,
      operation,
      tags: operation.tags?.length ? operation.tags : ['Other'],
      parameters: resolvedParameters,
    }];
  }));
}

function getAuth(operation) {
  if (!operation.security?.length) return { label: '公開 API', className: 'auth-public' };
  const names = operation.security.flatMap((group) => Object.keys(group));
  return names.some((name) => name.toLowerCase().includes('admin'))
    ? { label: '管理員 Session', className: 'auth-admin' }
    : { label: '會員 Session', className: 'auth-member' };
}

function getTags() {
  const described = new Map((openApi.tags || []).map((tag) => [tag.name, tag.description || '']));
  const names = [...new Set(operations.flatMap((operation) => operation.tags))];
  return names.map((name) => ({
    name,
    description: described.get(name) || '',
    operations: operations.filter((operation) => operation.tags.includes(name)),
  }));
}

function isOperationVisible(item) {
  const search = searchText.trim().toLocaleLowerCase();
  const matchesSearch = !search || [item.path, item.method, item.operation.summary, item.operation.description, item.id, ...item.tags]
    .join(' ').toLocaleLowerCase().includes(search);
  return matchesSearch && (methodFilter === 'ALL' || methodFilter === item.method);
}

function visibleTags() {
  return getTags().map((tag) => ({ ...tag, operations: tag.operations.filter(isOperationVisible) }))
    .filter((tag) => tag.operations.length);
}

function pathParameters(item) {
  const fromSpec = item.parameters.filter((parameter) => parameter.in === 'path');
  const known = new Set(fromSpec.map((parameter) => parameter.name));
  const fromPath = [...item.path.matchAll(/\{([^}]+)\}/g)]
    .map(([, name]) => ({ name, in: 'path', required: true, schema: { type: 'string' } }))
    .filter((parameter) => !known.has(parameter.name));
  return [...fromSpec, ...fromPath];
}

function queryParameters(item) {
  return item.parameters.filter((parameter) => parameter.in === 'query');
}

function headerParameters(item) {
  return item.parameters.filter((parameter) => parameter.in === 'header');
}

function fieldType(parameter) {
  const schema = dereference(parameter.schema);
  if (schema.enum?.length) return 'text';
  if (schema.type === 'integer' || schema.type === 'number') return 'number';
  return 'text';
}

function inputLabel(parameter) {
  const schema = dereference(parameter.schema);
  const details = [schemaType(schema), schema.format].filter(Boolean).join(' · ');
  return `<span><code>${escapeHtml(parameter.name)}</code>${parameter.required ? '<b class="required-mark"> *</b>' : ''}</span><span class="field-hint">${escapeHtml(details)}</span>`;
}

function renderParameterRows(parameters) {
  if (!parameters.length) return '<p class="no-fields">此端點不需要額外參數。</p>';
  return `<table class="field-table"><thead><tr><th>名稱</th><th>位置</th><th>型別</th><th>必填</th></tr></thead><tbody>${parameters.map((parameter) => `
    <tr><td><code>${escapeHtml(parameter.name)}</code>${parameter.description ? `<small class="field-description">${escapeHtml(parameter.description)}</small>` : ''}</td>
      <td>${escapeHtml(parameter.in || 'query')}</td><td>${escapeHtml(schemaType(parameter.schema))}</td><td>${parameter.required ? '<span class="required-mark">是</span>' : '否'}</td></tr>`).join('')}
  </tbody></table>`;
}

function renderSchemaRows(schema, required = [], depth = 0) {
  const resolved = dereference(schema);
  const properties = Object.entries(resolved.properties || {});
  if (!properties.length) return '<p class="no-fields">請依照下方 JSON 範例填入 request body。</p>';
  const ownRequired = new Set([...required, ...(resolved.required || [])]);
  return `<table class="field-table"><thead><tr><th>欄位</th><th>型別</th><th>必填</th><th>說明</th></tr></thead><tbody>${properties.map(([name, property]) => {
    const child = dereference(property);
    return `<tr><td><code>${'　'.repeat(depth)}${escapeHtml(name)}</code></td><td>${escapeHtml(schemaType(child))}</td><td>${ownRequired.has(name) ? '<span class="required-mark">是</span>' : '否'}</td><td>${escapeHtml(child.description || '')}</td></tr>`;
  }).join('')}</tbody></table>`;
}

function renderRequestDocs(item) {
  const pathFields = pathParameters(item);
  const queryFields = queryParameters(item);
  const headerFields = headerParameters(item);
  const body = dereference(item.operation.requestBody);
  const hasBody = Boolean(item.operation.requestBody);
  const media = jsonMedia(body.content);
  const example = hasBody ? getBodyExample(item.operation) : null;
  return `<div class="field-section"><h4 class="field-section-title">路徑參數</h4>${renderParameterRows(pathFields)}</div>
    <div class="field-section"><h4 class="field-section-title">查詢參數</h4>${renderParameterRows(queryFields)}</div>
    ${headerFields.length ? `<div class="field-section"><h4 class="field-section-title">Request headers</h4>${renderParameterRows(headerFields)}</div>` : ''}
    ${hasBody ? `<div class="field-section"><h4 class="field-section-title">Request body <span class="field-hint">${body.required ? '必填' : '選填'} · ${escapeHtml(Object.keys(body.content || {}).join(', ') || 'application/json')}</span></h4>
      ${renderSchemaRows(media.schema)}<details class="example-block"><summary>查看 JSON 範例</summary><pre class="request-example">${escapeHtml(JSON.stringify(example, null, 2))}</pre></details></div>` : ''}`;
}

function requestFieldValue(operationId, name, fallback = '') {
  const values = operationInputs.get(operationId) || {};
  return values[name] ?? fallback;
}

function saveInput(operationId, key, value) {
  const current = operationInputs.get(operationId) || {};
  current[key] = value;
  operationInputs.set(operationId, current);
}

function renderInputField(item, parameter) {
  const key = `${parameter.in}:${parameter.name}`;
  const example = exampleForSchema(parameter.schema);
  const value = requestFieldValue(item.id, key, example === null ? '' : String(example));
  const enumOptions = dereference(parameter.schema).enum;
  if (enumOptions?.length) {
    return `<div class="form-field"><label for="input-${escapeHtml(item.id)}-${escapeHtml(key)}">${inputLabel(parameter)}</label><select class="form-input" id="input-${escapeHtml(item.id)}-${escapeHtml(key)}" data-input-key="${escapeHtml(key)}">${enumOptions.map((option) => `<option value="${escapeHtml(option)}" ${String(value) === String(option) ? 'selected' : ''}>${escapeHtml(option)}</option>`).join('')}</select></div>`;
  }
  return `<div class="form-field"><label for="input-${escapeHtml(item.id)}-${escapeHtml(key)}">${inputLabel(parameter)}</label><input class="form-input" id="input-${escapeHtml(item.id)}-${escapeHtml(key)}" data-input-key="${escapeHtml(key)}" type="${fieldType(parameter)}" value="${escapeHtml(value)}" placeholder="${escapeHtml(parameter.description || '')}" ${parameter.required ? 'required' : ''} /></div>`;
}

function renderExecutionFields(item) {
  const pathFields = pathParameters(item);
  const queryFields = queryParameters(item);
  const headerFields = headerParameters(item);
  const body = dereference(item.operation.requestBody);
  const hasBody = Boolean(item.operation.requestBody);
  const example = hasBody ? JSON.stringify(getBodyExample(item.operation), null, 2) : '';
  const bodyValue = requestFieldValue(item.id, 'body', example);
  return `<div class="panel-content">
    ${pathFields.length ? `<div class="field-section"><h4 class="field-section-title">路徑參數</h4>${pathFields.map((parameter) => renderInputField(item, parameter)).join('')}</div>` : ''}
    ${queryFields.length ? `<div class="field-section"><h4 class="field-section-title">查詢參數</h4>${queryFields.map((parameter) => renderInputField(item, parameter)).join('')}</div>` : ''}
    ${headerFields.length ? `<div class="field-section"><h4 class="field-section-title">Request headers</h4>${headerFields.map((parameter) => renderInputField(item, parameter)).join('')}</div>` : ''}
    ${hasBody ? `<div class="field-section"><h4 class="field-section-title">Request body <span class="field-hint">${body.required ? '必填' : '選填'} · JSON</span></h4>
      <textarea class="json-editor" data-body-input="${escapeHtml(item.id)}" spellcheck="false" aria-label="JSON request body">${escapeHtml(bodyValue)}</textarea></div>` : ''}
    ${!pathFields.length && !queryFields.length && !headerFields.length && !hasBody ? '<p class="no-fields">此端點不需要輸入參數。</p>' : ''}
    <p class="write-warning">僅對本機開發 API 發送。新增、修改、刪除或登入請求會依端點實際寫入資料／建立 Session。</p>
    <div class="execute-row"><button class="execute-button" type="button" data-execute="${escapeHtml(item.id)}" ${runningOperationId === item.id ? 'disabled' : ''}>${runningOperationId === item.id ? '執行中…' : 'Execute'} <span aria-hidden="true">→</span></button><span class="run-state">Cookie 會由同源瀏覽器自動帶入</span></div>
  </div>`;
}

function getResponseExamples(item) {
  return Object.entries(item.operation.responses || {}).map(([status, responseValue]) => {
    const response = dereference(responseValue);
    const media = jsonMedia(response.content);
    let example = media.example;
    if (example === undefined) {
      const named = Object.values(media.examples || {})[0];
      if (named?.value !== undefined) example = named.value;
    }
    if (example === undefined && media.schema) example = exampleForSchema(media.schema);
    return { status, description: response.description || '', example };
  });
}

function renderResponse(item) {
  const expected = getResponseExamples(item);
  const result = requestResult?.operationId === item.id ? requestResult : null;
  const status = result?.status;
  const statusClass = status >= 200 && status < 400 ? 'status-ok' : 'status-error';
  const responseOutput = result
    ? activeResponseTab === 'body' ? result.bodyText : result.headersText
    : '';
  return `<div class="detail-panel response-panel">
    <div class="panel-head"><h3>Response</h3><span>回應內容與預期狀態</span></div>
    ${result ? `<div class="response-meta"><span class="status-chip ${statusClass}">HTTP ${escapeHtml(status)}${result.statusText ? ` ${escapeHtml(result.statusText)}` : ''}</span><span>${escapeHtml(result.url)} · ${escapeHtml(result.duration)} ms</span></div>
      <div class="response-tabs" role="tablist"><button type="button" class="response-tab ${activeResponseTab === 'body' ? 'active' : ''}" data-response-tab="body">Body</button><button type="button" class="response-tab ${activeResponseTab === 'headers' ? 'active' : ''}" data-response-tab="headers">Headers</button></div>
      <pre class="response-output">${escapeHtml(responseOutput || '(empty response)')}</pre>`
      : `<div class="response-empty"><strong>執行後，實際回應會出現在這裡</strong><p>狀態碼、耗時、response body 和 headers 都會保留在此端點下方。</p></div>`}
    <div class="expected-responses"><span>契約狀態</span>${expected.map((response) => `<code>${escapeHtml(response.status)}</code>`).join('')}</div>
    ${expected.filter((response) => response.example !== undefined && response.example !== null).slice(0, 1).map((response) => `<details class="example-block"><summary>查看 HTTP ${escapeHtml(response.status)} 回應範例</summary><pre class="response-example">${escapeHtml(JSON.stringify(response.example, null, 2))}</pre></details>`).join('')}
  </div>`;
}

function renderOperation(item) {
  const expanded = expandedOperationId === item.id;
  const auth = getAuth(item.operation);
  const responseCodes = Object.keys(item.operation.responses || {});
  const tryMode = tryModeOperationId === item.id;
  return `<article class="operation-card ${expanded ? 'is-expanded' : ''}" id="operation-${escapeHtml(item.id)}">
    <button class="operation-summary" type="button" data-operation="${escapeHtml(item.id)}" aria-expanded="${expanded}">
      <span class="method-pill method-${escapeHtml(item.method.toLowerCase())}">${escapeHtml(item.method)}</span>
      <span class="operation-route"><code>${escapeHtml(item.path)}</code><span class="operation-blurb">${escapeHtml(item.operation.summary || '未命名端點')}</span></span>
      <span class="operation-chevron" aria-hidden="true">›</span>
    </button>
    ${expanded ? `<div class="operation-detail">
      ${item.operation.description ? `<p class="operation-description">${escapeHtml(item.operation.description)}</p>` : ''}
      <div class="operation-meta"><span class="meta-pill ${auth.className}">${escapeHtml(auth.label)}</span><span class="meta-pill">${escapeHtml(item.id)}</span><span class="meta-pill">${responseCodes.map((code) => `HTTP ${code}`).join(' · ') || '尚未定義回應'}</span></div>
      <div class="detail-grid">
        <section class="detail-panel"><div class="panel-head"><h3>Request</h3>${tryMode ? `<button type="button" class="stop-edit-button" data-stop-try="${escapeHtml(item.id)}">收起操作</button>` : `<button type="button" class="try-button" data-try="${escapeHtml(item.id)}">Try it out</button>`}</div>
          ${tryMode ? renderExecutionFields(item) : `<div class="panel-content">${renderRequestDocs(item)}</div>`}
        </section>
        ${renderResponse(item)}
      </div>
    </div>` : ''}
  </article>`;
}

function renderTagGroup(tag) {
  const expanded = expandedTags.has(tag.name) || Boolean(searchText.trim());
  return `<section class="tag-group ${expanded ? 'is-open' : ''}" id="tag-${escapeHtml(tag.name)}">
    <button class="tag-group-head" type="button" data-tag-toggle="${escapeHtml(tag.name)}" aria-expanded="${expanded}">
      <span class="tag-group-copy"><span class="tag-group-name">${escapeHtml(tag.name)}</span><span class="tag-group-description">${escapeHtml(tag.description)}</span></span>
      <span class="tag-group-meta"><span>${tag.operations.length} 個端點</span><span class="tag-chevron" aria-hidden="true">›</span></span>
    </button>
    ${expanded ? `<div class="operation-list">${tag.operations.map(renderOperation).join('')}</div>` : ''}
  </section>`;
}

function renderSidebar() {
  const tags = getTags();
  const items = operations.filter(isOperationVisible);
  const activeTag = selectedTag;
  return `<aside class="sidebar">
    <a class="brand-lockup" href="/" aria-label="Skill Tree 首頁"><span class="brand-symbol">ST</span><span class="brand-copy"><strong>SKILL TREE</strong><small>API REFERENCE</small></span></a>
    <label class="search-wrap"><span class="search-glyph" aria-hidden="true">⌕</span><input class="search-input" id="search-input" type="search" placeholder="搜尋端點或描述" value="${escapeHtml(searchText)}" /></label>
    <div class="sidebar-section-head"><span>分類 TAGS</span><span class="count-pill">${tags.length}</span></div>
    <nav class="tag-list" aria-label="API 分類">${tags.map((tag) => `<button class="tag-button ${activeTag === tag.name ? 'active' : ''}" type="button" data-select-tag="${escapeHtml(tag.name)}"><span class="tag-dot"></span><span class="tag-name">${escapeHtml(tag.name)}</span><span class="tag-count">${tag.operations.filter(isOperationVisible).length}</span></button>`).join('')}</nav>
    <div class="sidebar-section-head endpoints-head"><span>端點清單</span><span class="count-caption">${items.length}</span></div>
    <nav class="endpoint-list" aria-label="端點清單">${items.length ? items.map((item) => `<button class="endpoint-button ${expandedOperationId === item.id ? 'active' : ''}" type="button" data-jump-operation="${escapeHtml(item.id)}"><span class="method-pill method-${escapeHtml(item.method.toLowerCase())}">${escapeHtml(item.method)}</span><span class="endpoint-copy"><span class="endpoint-summary">${escapeHtml(item.operation.summary || item.id)}</span><span class="endpoint-path">${escapeHtml(item.path)}</span></span></button>`).join('') : '<p class="empty-list">沒有符合的端點</p>'}</nav>
    <div class="sidebar-footer"><span class="connection-dot ${healthStatus === 'ok' ? 'is-ok' : healthStatus === 'error' ? 'is-error' : ''}"></span><span>${escapeHtml(healthMessage)}</span></div>
  </aside>`;
}

function renderWorkspace() {
  const visible = visibleTags();
  const visibleCount = visible.reduce((count, tag) => count + tag.operations.length, 0);
  const tagCount = getTags().length;
  const version = openApi.info?.version || '未標示';
  return `<main class="workspace">
    <header class="topbar"><div class="breadcrumb"><span>Skill Tree</span><span class="crumb-separator">/</span><strong>API 文件</strong><span class="crumb-separator">/</span><span>${escapeHtml(version)}</span></div>
      <div class="top-actions"><span class="health-state ${healthStatus === 'ok' ? 'health-ok' : healthStatus === 'error' ? 'health-error' : ''}">${escapeHtml(healthMessage)}</span><button class="health-button" id="health-check" type="button">檢查連線</button><a class="spec-link" href="/api/openapi.json" target="_blank" rel="noreferrer">OpenAPI JSON ↗</a></div>
    </header>
    <section class="overview"><div class="overview-copy"><span class="eyebrow">SKILL TREE · SHARED BACKEND</span><h1>${escapeHtml(openApi.info?.title || 'API 文件')}</h1><p class="overview-description">依目前共用後端路由整理。選擇端點即可查看參數、回應格式，或在同源開發環境直接試跑。</p><details class="usage-details"><summary>使用與安全說明</summary><p>${escapeHtml(openApi.info?.description || '請只連線開發環境。')}</p></details><div class="overview-note"><span class="note-icon">i</span><span>點開端點看規格；按 <strong>Try it out</strong> 填入參數後執行。登入 Session 會由同源瀏覽器自動帶入。</span></div></div>
      <div class="overview-stats"><div class="stat-card"><strong>${operations.length}</strong><span>API 端點</span></div><div class="stat-card"><strong>${tagCount}</strong><span>功能分類</span></div></div>
    </section>
    <section class="catalog" aria-label="API 端點"><div class="catalog-toolbar"><div class="catalog-label">端點一覽 <small>顯示 ${visibleCount} / ${operations.length}</small></div><div class="method-filters" role="group" aria-label="依 HTTP 方法篩選">${METHOD_FILTERS.map((method) => `<button type="button" class="filter-button ${methodFilter === method ? 'active' : ''}" data-filter-method="${method}">${method === 'ALL' ? '全部' : method}</button>`).join('')}</div></div>
      ${visible.length ? visible.map(renderTagGroup).join('') : '<div class="empty-results">找不到符合條件的 API 端點，試試其他關鍵字或 HTTP 方法。</div>'}
    </section>
  </main>`;
}

function render() {
  appRoot.className = 'explorer-shell';
  appRoot.innerHTML = `${renderSidebar()}${renderWorkspace()}`;
  bindEvents();
}

function bindEvents() {
  document.querySelector('#search-input')?.addEventListener('input', (event) => {
    searchText = event.currentTarget.value;
    if (event.isComposing || searchComposing) return;
    render();
    const search = document.querySelector('#search-input');
    search?.focus();
    search?.setSelectionRange(search.value.length, search.value.length);
  });
  document.querySelector('#search-input')?.addEventListener('compositionstart', () => { searchComposing = true; });
  document.querySelector('#search-input')?.addEventListener('compositionend', (event) => {
    searchComposing = false;
    searchText = event.currentTarget.value;
    render();
    const search = document.querySelector('#search-input');
    search?.focus();
    search?.setSelectionRange(search.value.length, search.value.length);
  });
  document.querySelector('#health-check')?.addEventListener('click', checkHealth);
  document.querySelectorAll('[data-filter-method]').forEach((button) => button.addEventListener('click', () => {
    methodFilter = button.dataset.filterMethod;
    render();
  }));
  document.querySelectorAll('[data-select-tag]').forEach((button) => button.addEventListener('click', () => {
    selectedTag = button.dataset.selectTag;
    expandedTags.add(selectedTag);
    render();
    document.querySelector(`#tag-${CSS.escape(selectedTag)}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
  document.querySelectorAll('[data-tag-toggle]').forEach((button) => button.addEventListener('click', () => {
    const tag = button.dataset.tagToggle;
    if (expandedTags.has(tag)) expandedTags.delete(tag);
    else expandedTags.add(tag);
    render();
  }));
  document.querySelectorAll('[data-operation]').forEach((button) => button.addEventListener('click', () => {
    const id = button.dataset.operation;
    expandedOperationId = expandedOperationId === id ? null : id;
    tryModeOperationId = expandedOperationId === id ? tryModeOperationId : null;
    activeResponseTab = 'body';
    render();
  }));
  document.querySelectorAll('[data-jump-operation]').forEach((button) => button.addEventListener('click', () => {
    const id = button.dataset.jumpOperation;
    const item = operations.find((entry) => entry.id === id);
    expandedOperationId = id;
    if (item) item.tags.forEach((tag) => expandedTags.add(tag));
    render();
    document.querySelector(`#operation-${CSS.escape(id)}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }));
  document.querySelectorAll('[data-try]').forEach((button) => button.addEventListener('click', () => {
    tryModeOperationId = button.dataset.try;
    render();
  }));
  document.querySelectorAll('[data-stop-try]').forEach((button) => button.addEventListener('click', () => {
    tryModeOperationId = null;
    render();
  }));
  document.querySelectorAll('[data-input-key]').forEach((input) => input.addEventListener('input', (event) => {
    const itemId = expandedOperationId;
    if (itemId) saveInput(itemId, event.currentTarget.dataset.inputKey, event.currentTarget.value);
  }));
  document.querySelectorAll('[data-body-input]').forEach((textarea) => textarea.addEventListener('input', (event) => {
    saveInput(event.currentTarget.dataset.bodyInput, 'body', event.currentTarget.value);
  }));
  document.querySelectorAll('[data-execute]').forEach((button) => button.addEventListener('click', () => executeOperation(button.dataset.execute)));
  document.querySelectorAll('[data-response-tab]').forEach((button) => button.addEventListener('click', () => {
    activeResponseTab = button.dataset.responseTab;
    render();
  }));
}

function buildRequest(item) {
  const values = operationInputs.get(item.id) || {};
  const pathValues = Object.fromEntries(pathParameters(item).map((parameter) => [parameter.name, values[`path:${parameter.name}`] ?? '']));
  const missingPath = pathParameters(item).find((parameter) => parameter.required && !String(pathValues[parameter.name]).trim());
  if (missingPath) throw new Error(`請填寫路徑參數：${missingPath.name}`);
  const path = item.path.replace(/\{([^}]+)\}/g, (_match, name) => encodeURIComponent(pathValues[name] ?? ''));
  const url = new URL(path, window.location.origin);
  if (url.origin !== window.location.origin) throw new Error('API Explorer 僅允許呼叫同源 API。');
  queryParameters(item).forEach((parameter) => {
    const value = values[`query:${parameter.name}`];
    if (value !== undefined && value !== '') url.searchParams.set(parameter.name, value);
    else if (parameter.required) throw new Error(`請填寫查詢參數：${parameter.name}`);
  });
  const options = { method: item.method, credentials: 'include', headers: { Accept: 'application/json' } };
  headerParameters(item).forEach((parameter) => {
    const value = values[`header:${parameter.name}`];
    if (value !== undefined && String(value).trim()) options.headers[parameter.name] = String(value).trim();
    else if (parameter.required) throw new Error(`請填寫 request header：${parameter.name}`);
  });
  if (item.operation.requestBody) {
    const rawBody = values.body ?? JSON.stringify(getBodyExample(item.operation), null, 2);
    if (!rawBody.trim()) {
      if (dereference(item.operation.requestBody).required) throw new Error('請填寫 request body。');
    } else {
      let parsedBody;
      try { parsedBody = JSON.parse(rawBody); } catch { throw new Error('Request body 不是有效的 JSON。'); }
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(parsedBody);
    }
  }
  return { url, options };
}

async function executeOperation(operationId) {
  const item = operations.find((entry) => entry.id === operationId);
  if (!item || runningOperationId) return;
  let request;
  try { request = buildRequest(item); } catch (error) {
    requestResult = { operationId, status: '輸入錯誤', statusText: '', url: item.path, duration: 0, bodyText: error.message, headersText: '' };
    activeResponseTab = 'body';
    render();
    return;
  }
  runningOperationId = operationId;
  requestResult = null;
  render();
  const startedAt = performance.now();
  try {
    const response = await fetch(request.url, request.options);
    const duration = Math.round(performance.now() - startedAt);
    const text = await response.text();
    let bodyText = text;
    try { bodyText = text ? JSON.stringify(JSON.parse(text), null, 2) : '(empty response)'; } catch { bodyText = text || '(empty response)'; }
    const headersText = [...response.headers.entries()].map(([name, value]) => `${name}: ${value}`).join('\n') || '(no readable response headers)';
    requestResult = {
      operationId,
      status: response.status,
      statusText: response.statusText,
      url: `${request.url.pathname}${request.url.search}`,
      duration,
      bodyText,
      headersText,
    };
  } catch (error) {
    requestResult = {
      operationId,
      status: 'NETWORK ERROR',
      statusText: '',
      url: `${request.url.pathname}${request.url.search}`,
      duration: Math.round(performance.now() - startedAt),
      bodyText: error.message || 'Failed to fetch',
      headersText: '',
    };
  } finally {
    runningOperationId = null;
    activeResponseTab = 'body';
    render();
    document.querySelector(`#operation-${CSS.escape(operationId)}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

async function checkHealth() {
  const button = document.querySelector('#health-check');
  if (button) button.disabled = true;
  healthMessage = '檢查連線中…';
  healthStatus = 'unknown';
  render();
  try {
    const response = await fetch('/api/health', { credentials: 'include', headers: { Accept: 'application/json' } });
    const data = await response.json();
    const isOk = response.ok && data?.success && data?.data?.status === 'ok';
    healthStatus = isOk ? 'ok' : 'error';
    healthMessage = isOk ? `API 與資料庫正常 · ${data.data.database}` : `API 狀態異常 · HTTP ${response.status}`;
  } catch {
    healthStatus = 'error';
    healthMessage = '無法連線 API';
  }
  render();
}

async function load() {
  try {
    const response = await fetch('/api/openapi.json', { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`載入 OpenAPI 失敗（HTTP ${response.status}）`);
    openApi = await response.json();
    operations = getOperationList();
    expandedOperationId = operations.find((item) => item.tags.includes('Health'))?.id || operations[0]?.id || null;
    render();
    checkHealth();
  } catch (error) {
    appRoot.className = 'load-error';
    appRoot.innerHTML = `<span class="load-error-mark">!</span><h1>API 文件載入失敗</h1><p>${escapeHtml(error.message)}。請確認 API 服務正在執行，再重新整理頁面。</p>`;
  }
}

load();
