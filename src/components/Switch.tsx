export function Switch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-8 w-[3.5rem] items-center rounded-full transition ${
        checked ? "bg-red-600" : "bg-neutral-700"
      }`}
    >
      <span
        className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
          checked ? "translate-x-6" : "translate-x-2"
        }`}
      />
    </button>
  );
}