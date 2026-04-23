import Link from "next/link";
import { ThemeToggle } from "../theme-toggle";

export default function Navbar() {
  return (
    <>
      <nav className="sticky top-0 w-full border-b bg-surface/80 backdrop-blur-md border-outline-variant z-50 font-manrope">
        <div className="flex justify-between items-center h-16 px-4 sm:px-8 max-w-container-max mx-auto w-full">
          <div className="flex items-center gap-4 sm:gap-8">
            <Link href="/" className="text-xl font-black tracking-tighter text-primary">
              HTB GLOBAL
            </Link>
            {/* <div className="hidden md:flex gap-6">
              <Link className="text-on-surface border-b-2 border-primary pb-1 font-semibold text-sm tracking-tight" href="/">Loans</Link>
              <Link className="text-on-surface-variant font-medium hover:text-on-surface transition-colors duration-200 text-sm tracking-tight" href="#">Support</Link>
            </div> */}
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <button className="hidden sm:block text-on-surface-variant font-medium hover:text-on-surface transition-all active:opacity-80 text-sm">
              Login
            </button>
            <Link href="/store-selection" className="bg-secondary text-on-secondary px-6 py-2 rounded-xl font-bold shadow-lg shadow-secondary/20 hover:opacity-90 active:scale-95 transition-all text-sm">
              Apply Now
            </Link>
          </div>
        </div>
      </nav>

    </>
  );
}
