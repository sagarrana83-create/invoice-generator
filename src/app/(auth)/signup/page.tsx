import { AuthForm } from "@/components/auth/auth-form";
import { signupAction } from "../actions";

export default function SignupPage() {
  return (
    <AuthForm
      title="Create your account"
      description="Set up your secure workspace to start managing your business."
      submitLabel="Sign up"
      footerText="Already have an account?"
      footerLinkLabel="Log in"
      footerLinkHref="/login"
      action={signupAction}
    />
  );
}
