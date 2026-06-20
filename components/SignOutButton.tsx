import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui";

/**
 * Sign-out control. Renders a form that posts to the signOut Server Action,
 * so it works without client JS.
 */
export function SignOutButton({
  variant = "ghost",
  className,
}: {
  variant?: "ghost" | "glass";
  className?: string;
}) {
  return (
    <form action={signOut} className={className}>
      <Button type="submit" variant={variant} size="sm">
        Sign out
      </Button>
    </form>
  );
}
