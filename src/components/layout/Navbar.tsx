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

      {/* Mobile Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 w-full z-50 lg:hidden flex justify-around items-center h-16 px-4 bg-surface/90 backdrop-blur-xl border-t border-outline-variant shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <Link href="/" className="flex flex-col items-center gap-1 text-primary">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
          <span className="text-[10px] font-bold uppercase tracking-tighter">Home</span>
        </Link>
        <Link href="/store-selection" className="flex flex-col items-center gap-1 text-on-surface-variant/50">
          <span className="material-symbols-outlined">add_circle</span>
          <span className="text-[10px] font-bold uppercase tracking-tighter">Apply</span>
        </Link>
        {/* <div className="flex flex-col items-center gap-1 text-on-surface-variant/50">
          <span className="material-symbols-outlined">help</span>
          <span className="text-[10px] font-bold uppercase tracking-tighter">Support</span>
        </div> */}
        <div className="flex flex-col items-center gap-1 text-on-surface-variant/50">
          <span className="material-symbols-outlined">account_circle</span>
          <span className="text-[10px] font-bold uppercase tracking-tighter">Account</span>
        </div>
      </nav>
    </>
  );
}
