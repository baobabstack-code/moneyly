export default function Footer() {
  return (
    <footer className="w-full border-t border-outline-variant bg-surface-container font-manrope text-sm mt-auto">
      <div className="flex flex-col md:flex-row justify-between items-center py-12 px-6 sm:px-8 max-w-container-max mx-auto w-full gap-8">
        <div className="flex flex-col items-center md:items-start gap-3">
          <span className="font-h3 text-primary tracking-tight">Moneyly</span>
          <p className="text-on-surface-variant text-center md:text-left leading-relaxed max-w-xs">
            © 2026 Vertex Software Labs trading as Baobab Stack. Moneyly is a personal money manager for budgets, bills, goals, and cash-flow.
          </p>
        </div>
        {/* <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
          <Link className="text-on-surface-variant hover:text-primary transition-colors" href="#">Privacy</Link>
          <Link className="text-on-surface-variant hover:text-primary transition-colors" href="#">Terms</Link>
          <Link className="text-on-surface-variant hover:text-primary transition-colors" href="#">Security</Link>
        {/* </div> */} 
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-surface border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-secondary hover:border-secondary cursor-pointer transition-all shadow-sm">
            <span className="material-symbols-outlined text-lg">public</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-surface border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-secondary hover:border-secondary cursor-pointer transition-all shadow-sm">
            <span className="material-symbols-outlined text-lg">share</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
