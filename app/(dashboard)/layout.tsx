import NextAuthSessionProvider from "@/components/providers/SessionProvider";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import NotificationBell from "@/components/NotificationBell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const isOwner = session.user.role === "owner";

  return (
    <NextAuthSessionProvider>
      <div className="min-h-screen bg-gray-100 flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md flex-shrink-0 hidden md:flex flex-col">
          <div className="h-20 flex flex-col justify-center px-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-800 leading-tight">Shree Krishna Computer</h1>
            <p className="text-xs text-gray-500 font-semibold mt-0.5">Owner: Lalit Menariya</p>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2">
            <Link
              href="/dashboard"
              className="block px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-medium"
            >
              Dashboard
            </Link>
            <Link
              href="/billing"
              className="block px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-medium"
            >
              Billing
            </Link>
            <Link
              href="/billing/history"
              className="block px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-medium"
            >
              Billing History
            </Link>
            <Link
              href="/due-payments"
              className="block px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-medium"
            >
              Due Payments
            </Link>
            <Link
              href="/finance"
              className="block px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-medium"
            >
              Finance
            </Link>
            <Link
              href="/inventory"
              className="block px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-medium"
            >
              Inventory
            </Link>
            {isOwner && (
              <>
                <Link
                  href="/analytics"
                  className="block px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-medium"
                >
                  Analytics
                </Link>
                <Link
                  href="/staff-management"
                  className="block px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-medium"
                >
                  Staff Management
                </Link>
              </>
            )}
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6">
            <div className="md:hidden text-lg font-bold">Shree Krishna Computer</div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 font-medium">
                {session.user.role === "owner" ? "Welcome Lalit Menariya" : `Welcome ${session.user.name}`}
              </span>
              <NotificationBell />
              <Link
                href="/api/auth/signout"
                className="text-sm font-medium text-red-600 hover:text-red-800"
              >
                Logout
              </Link>
            </div>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </NextAuthSessionProvider>
  );
}
