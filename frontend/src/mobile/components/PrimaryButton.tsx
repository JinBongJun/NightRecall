import { ActionButton } from "./ActionButton";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

export function PrimaryButton({ label, onPress, disabled }: Props) {
  return <ActionButton label={label} onPress={onPress} disabled={disabled} variant="primary" />;
}
