import { Button, ButtonVariant } from '../ui/button';

interface IJourneyItemActionsProps {
  name: string;
  onEdit: () => void;
  onDelete: () => void;
}
export const JourneyItemActions = ({ name, onEdit, onDelete }: IJourneyItemActionsProps) => (
  <>
    <Button
      variant={ButtonVariant.Quiet}
      icon
      aria-label={`Edit details for ${name}`}
      title="Edit details"
      onClick={onEdit}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="m16 3 5 5-12 12-6 1 1-6L16 3Zm-2 2 5 5" />
      </svg>
    </Button>
    <Button
      variant={ButtonVariant.Quiet}
      icon
      aria-label={`Delete ${name}`}
      title="Delete block"
      onClick={onDelete}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" />
      </svg>
    </Button>
  </>
);
