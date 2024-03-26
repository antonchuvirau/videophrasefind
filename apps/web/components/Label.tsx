import _ from "lodash";

const Label = ({
  label,
  name,
  required = false,
}: {
  label: string;
  name: string;
  required?: boolean;
}) => {
  return (
    <label className="text-secondary" htmlFor={name}>
      <span>{label + (required ? "*" : "")}</span>
    </label>
  );
};

export default Label;
