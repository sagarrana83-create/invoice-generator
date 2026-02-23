import { AuthForm } from "@/components/auth/auth-form";
import { loginAction } from "../actions";

export default function LoginPage() {
  return (
    <AuthForm
      title="Welcome back"
      description="Sign in to access your Invoice SaaS dashboard."
      submitLabel="Log in"
      footerText="New here?"
      footerLinkLabel="Create an account"
      footerLinkHref="/signup"
      action={loginAction}
    />
  );
}
