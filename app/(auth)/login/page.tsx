import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans bg-no-repeat"
      style={{ backgroundImage: "url('/bg1.jpg')", backgroundSize: "100vw 100vh" }}
    >
      <LoginForm />
    </div>
  );
}

