/**
 * Reusable UI control builders — matching clipper2-rust styling.
 * @license Apache-2.0 OR MIT
 * @copyright 2025
 */

export function createSlider(
  label: string,
  min: number,
  max: number,
  value: number,
  step: number,
  onChange: (val: number) => void
): HTMLElement {
  const group = document.createElement("div");
  group.className = "control-group";
  const lbl = document.createElement("label");
  const labelText = document.createTextNode(label);
  const valSpan = document.createElement("span");
  valSpan.className = "slider-value";
  valSpan.textContent = String(value);
  lbl.appendChild(labelText);
  lbl.appendChild(valSpan);

  const input = document.createElement("input");
  input.type = "range";
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(value);
  input.addEventListener("input", () => {
    const v = parseFloat(input.value);
    valSpan.textContent = String(v);
    onChange(v);
  });

  group.appendChild(lbl);
  group.appendChild(input);
  return group;
}

export function createDropdown(
  label: string,
  options: { value: string; text: string }[],
  selectedValue: string,
  onChange: (val: string) => void
): HTMLElement {
  const group = document.createElement("div");
  group.className = "control-group";
  const lbl = document.createElement("label");
  lbl.textContent = label;

  const select = document.createElement("select");
  for (const opt of options) {
    const o = document.createElement("option");
    o.value = opt.value;
    o.textContent = opt.text;
    select.appendChild(o);
  }
  select.value = selectedValue;
  select.addEventListener("change", () => onChange(select.value));

  group.appendChild(lbl);
  group.appendChild(select);
  return group;
}

export function createCheckbox(
  label: string,
  checked: boolean,
  onChange: (val: boolean) => void
): HTMLElement {
  const wrapper = document.createElement("label");
  wrapper.className = "control-checkbox";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = checked;
  input.addEventListener("change", () => onChange(input.checked));
  const span = document.createElement("span");
  span.textContent = label;
  wrapper.appendChild(input);
  wrapper.appendChild(span);
  return wrapper;
}

export function createSeparator(): HTMLElement {
  const sep = document.createElement("div");
  sep.className = "control-separator";
  return sep;
}

export function createReadout(): HTMLElement {
  const box = document.createElement("div");
  box.className = "info-readout";
  return box;
}

export function updateReadout(
  el: HTMLElement,
  entries: { label: string; value: string }[]
) {
  el.innerHTML = entries
    .map(
      (e) =>
        `<span class="label">${e.label}:</span> <span class="value">${e.value}</span>`
    )
    .join("<br>");
}

export function createInfoBox(html: string): HTMLElement {
  const box = document.createElement("div");
  box.className = "info-box";
  box.innerHTML = html;
  return box;
}

export interface CodePanel {
  element: HTMLElement;
  setCode(code: string): void;
}

export function createCodePanel(initialCode: string = ""): CodePanel {
  const wrapper = document.createElement("div");
  wrapper.className = "code-panel";

  const header = document.createElement("div");
  header.className = "code-panel-header";
  header.textContent = "▸ View Source Code";

  const body = document.createElement("div");
  body.className = "code-panel-body";

  const pre = document.createElement("pre");
  const code = document.createElement("code");
  code.textContent = initialCode;
  pre.appendChild(code);
  body.appendChild(pre);

  header.addEventListener("click", () => {
    const isOpen = body.classList.toggle("open");
    header.textContent = isOpen ? "▾ Source Code" : "▸ View Source Code";
  });

  wrapper.appendChild(header);
  wrapper.appendChild(body);

  return {
    element: wrapper,
    setCode(text: string) {
      code.textContent = text;
    },
  };
}
