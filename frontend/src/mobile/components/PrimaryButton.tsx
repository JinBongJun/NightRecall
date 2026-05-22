import { ActionButton } from "./ActionButton";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
};

export function PrimaryButton({ label, onPress, disabled, accessibilityLabel }: Props) {
  return (
    <ActionButton
      label={label}
      onPress={onPress}
      disabled={disabled}
      variant="primary"
      accessibilityLabel={accessibilityLabel}
    />
  );
}
