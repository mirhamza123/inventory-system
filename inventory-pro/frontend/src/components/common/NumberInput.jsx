const stripLeadingZeros = (value) => {
  if (/^0{2,}\./.test(value)) {
    return `0${value.slice(value.indexOf("."))}`;
  }

  return value.replace(/^0+(?=\d)/, "");
};

export default function NumberInput({
  min = 0,
  max,
  step = "any",
  value = "",
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
  onPaste,
  ...props
}) {
  const minimum = Math.max(0, Number(min) || 0);
  const hasMaximum = max !== undefined && max !== null;
  const maximum = hasMaximum ? Number(max) : Infinity;

  const handleChange = (event) => {
    const input = event.currentTarget;
    const rawValue = input.value;
    const numericValue = Number(rawValue);

    if (rawValue !== "" && Number.isFinite(numericValue)) {
      if (numericValue < minimum) {
        input.value = String(minimum);
      } else if (numericValue > maximum) {
        input.value = String(maximum);
      } else {
        input.value = stripLeadingZeros(rawValue);
      }
    }

    onChange?.(event);
  };

  const handleFocus = (event) => {
    const input = event.currentTarget;
    if (input.value === "0") {
      input.value = "";
      onChange?.(event);
    }
    onFocus?.(event);
  };

  const handleBlur = (event) => {
    const input = event.currentTarget;
    if (input.value === "") {
      input.value = String(minimum);
      onChange?.(event);
    }
    onBlur?.(event);
  };

  const handleKeyDown = (event) => {
    if (["-", "e", "E"].includes(event.key)) {
      event.preventDefault();
    }
    onKeyDown?.(event);
  };

  const handlePaste = (event) => {
    const pastedValue = event.clipboardData.getData("text").trim();
    if (pastedValue.startsWith("-") || Number(pastedValue) < minimum) {
      event.preventDefault();
    }
    onPaste?.(event);
  };

  return (
    <input
      {...props}
      type="number"
      min={minimum}
      max={max}
      step={step}
      value={value}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
    />
  );
}
