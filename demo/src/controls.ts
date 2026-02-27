/**
 * UI control components for tessellation demos.
 * @license Apache-2.0 OR MIT
 * @copyright 2025
 */

export interface SliderOptions {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
}

export function createSlider(options: SliderOptions): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "control-group";
  const label = document.createElement("label");
  label.textContent = `${options.label}: `;
  const input = document.createElement("input");
  input.type = "range";
  input.min = String(options.min);
  input.max = String(options.max);
  input.step = String(options.step ?? (options.max - options.min) / 100);
  input.value = String(options.value);
  const valueSpan = document.createElement("span");
  valueSpan.className = "control-value";
  valueSpan.textContent = String(options.value);

  input.addEventListener("input", () => {
    const val = Number(input.value);
    valueSpan.textContent = String(val);
    options.onChange(val);
  });

  wrapper.append(label, input, valueSpan);
  return wrapper;
}

export interface SelectOptions {
  label: string;
  options: { value: string; text: string }[];
  value: string;
  onChange: (value: string) => void;
}

export function createSelect(options: SelectOptions): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "control-group";
  const label = document.createElement("label");
  label.textContent = `${options.label}: `;
  const select = document.createElement("select");
  for (const opt of options.options) {
    const option = document.createElement("option");
    option.value = opt.value;
    option.textContent = opt.text;
    if (opt.value === options.value) option.selected = true;
    select.appendChild(option);
  }
  select.addEventListener("change", () => options.onChange(select.value));
  wrapper.append(label, select);
  return wrapper;
}

export interface ToggleOptions {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function createToggle(options: ToggleOptions): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "control-group";
  const label = document.createElement("label");
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = options.checked;
  input.addEventListener("change", () => options.onChange(input.checked));
  label.append(input, " ", options.label);
  wrapper.appendChild(label);
  return wrapper;
}

export interface StatsDisplay {
  element: HTMLElement;
  update(vertCount: number, faceCount: number, elapsedMs: number): void;
}

export function createStats(): StatsDisplay {
  const wrapper = document.createElement("div");
  wrapper.className = "stats";
  const vertEl = document.createElement("div");
  const faceEl = document.createElement("div");
  const timeEl = document.createElement("div");
  vertEl.textContent = "Vertices: —";
  faceEl.textContent = "Faces: —";
  timeEl.textContent = "Time: — ms";
  wrapper.append(vertEl, faceEl, timeEl);

  return {
    element: wrapper,
    update(vertCount: number, faceCount: number, elapsedMs: number) {
      vertEl.textContent = `Vertices: ${vertCount.toLocaleString()}`;
      faceEl.textContent = `Faces: ${faceCount.toLocaleString()}`;
      timeEl.textContent = `Time: ${elapsedMs.toFixed(1)} ms`;
    },
  };
}

export interface CodePanel {
  element: HTMLElement;
  setCode(code: string): void;
}

export function createCodePanel(initialCode: string = ""): CodePanel {
  const wrapper = document.createElement("div");
  wrapper.className = "code-panel";
  const pre = document.createElement("pre");
  const code = document.createElement("code");
  code.textContent = initialCode;
  pre.appendChild(code);
  wrapper.appendChild(pre);

  return {
    element: wrapper,
    setCode(text: string) {
      code.textContent = text;
    },
  };
}
