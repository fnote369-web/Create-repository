"use client";

export default function ConfirmSubmitButton({
  formAction,
  confirmText,
  className,
  children,
}: {
  formAction: (formData: FormData) => void;
  confirmText: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      formAction={formAction}
      className={className}
      onClick={(e) => {
        if (!window.confirm(confirmText)) {
          e.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}
