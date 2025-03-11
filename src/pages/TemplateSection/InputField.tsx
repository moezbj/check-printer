import React from "react";

interface InputFieldProps {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  x: number;
  y: number;
  onXChange: (value: number) => void;
  onYChange: (value: number) => void;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  id,
  value,
  onChange,
  x,
  y,
  onXChange,
  onYChange,
}) => {
  return (
    <div className="form-group">
      <label htmlFor={id} data-i18n={`tableFile.${id}`}>
        {label}
      </label>
      <input
        type="text"
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <label htmlFor={`${id}X`}>X</label>
      <input
        type="number"
        id={`${id}X`}
        value={x}
        onChange={(e) => onXChange(Number(e.target.value))}
      />
      <label htmlFor={`${id}Y`}>Y</label>
      <input
        type="number"
        id={`${id}Y`}
        value={y}
        onChange={(e) => onYChange(Number(e.target.value))}
      />
    </div>
  );
};

export default InputField;
