import "./Spinner.css";

export default function Spinner({ size = "md" }) {
  return (
    <div className={`spinner spinner--${size}`} />
  );
}
