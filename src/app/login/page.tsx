import { redirect } from "next/navigation";

// The portal sign-in lives at /sign-in (Auth.js). Keep /login working for any
// old links by redirecting.
export default function LoginRedirect() {
  redirect("/sign-in");
}
