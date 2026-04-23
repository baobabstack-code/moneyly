import Link from "next/link";

export default function StoreSelectionPage() {
  const stores = [
    {
      id: 1,
      name: "TV Sales & Home",
      location: "Sam Levy's Village, Borrowdale\nHarare, Zimbabwe",
      hours: "8:00 AM - 6:00 PM",
      status: "Open Now",
      logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuBuj7691Ri2bQuVhoJGqt6DQ2yQFO5Pa-SziT1TN6DKpS9t_-6GjGmXKZflPL2rlVt3TIev6Y3X4X1P2kypI_JGnraQfqFyaqo8EwLiG4EEo66rM13bZKFQRJY1TXMmASmPULRgI68XgbyFXQrEPD7PxrSFoI3pdFsw3l18NEaubuP61-HCLaXonIlPWT2oplGPgOZkY-TswFqEkC7y3mi8lyRF0Ur6lVPc3M12hDaH_rcFi4WxjLJLUuraA71OXE642lc1HsuSVBI9"
    },
    {
      id: 2,
      name: "Halsted Builders Express",
      location: "71 Plumtree Road, Belmont\nBulawayo, Zimbabwe",
      hours: "9:00 AM - 5:00 PM",
      logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuD_QvEJy5HhE7WTgXqj--ifTjKXtQrhsNcGLVQluqPJ6uAh2mNICtzSnC1Nghw3SqSXV2ug0bMKB3sKBzTyLWs0UkgDS3b3dgl6G4MrCRXtB7xDAMGy62gcAA5o07ycw5_wVAojfgTupuODYWzTG1L16QucwxdwyE6cr7Jc_k4QRRkm9cv7NGK-9mAaTALvApnfhfal9Fy9UklrsCTNSBM6wQ7mHcujdNpA4BIJwkxhcep6WLyDftc4JCrairsp-2GvJq1CmopmVvOk"
    },
    {
      id: 3,
      name: "Electrosales",
      location: "128 Seke Road, Graniteside\nHarare, Zimbabwe",
      hours: "10:00 AM - 9:00 PM",
      logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuCK3Yp9TX7tOnp6meMSwFoEVD8XT77sLqMXrondkhXJFH9eX63V5V9jxlNRx9FSeS-2j2kWMTBYBPRXvbu4CRt4877PwgrDCcd7uCr0CBUSkAP77XM_TTWbMFQmbo8jg2MTBWuUYNwAgaLYtAM_kYabb7i3vHk0jxzaVGvo7EScX9h8UU94Ue4TPRAsUFfzWuu8uUlJwFyGqq69WsZItSiBUmihb1qEI-otCr1YexZjSNU3gAMLJiU2oYLqTJZo7rRE-Ha1EwTa7Nzb"
    }
  ];

  return (
    <div className="w-full">
      {/* Progress Header */}
      <div className="mb-stack-lg px-4 sm:px-0">
        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-secondary font-label-md uppercase tracking-wider block mb-2">Step 1 of 7</span>
            <h1 className="font-h1 text-on-surface">Store Selection</h1>
          </div>
          <div className="hidden md:block text-right">
            <span className="text-on-surface-variant font-body-sm">Completion</span>
            <div className="w-48 h-2 bg-outline-variant rounded-full mt-2 overflow-hidden">
              <div className="bg-secondary h-full w-[14%] transition-all duration-500"></div>
            </div>
          </div>
        </div>
        <p className="text-on-surface-variant font-body-lg max-w-2xl">
          Select your store to continue. This location will be used for final document signing and fund disbursement.
        </p>
      </div>

      {/* Store Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter px-4 sm:px-0">
        {stores.map((store) => (
          <Link 
            key={store.id}
            className="group flex flex-col text-left bg-surface border border-outline-variant p-gutter rounded-xl hover:border-secondary hover:shadow-xl hover:-translate-y-1 transition-all duration-300 shadow-sm"
            href="/apply/purchase-details"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 rounded-xl bg-white overflow-hidden flex items-center justify-center p-2 border border-outline-variant group-hover:border-secondary/50 shadow-inner transition-colors">
                <img alt={store.name} className="w-full h-full object-contain" src={store.logo} />
              </div>
              {store.status && (
                <span className="px-2.5 py-1 bg-secondary/10 text-secondary text-[10px] font-bold rounded-full uppercase tracking-widest border border-secondary/20">{store.status}</span>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-h3 text-h3 text-primary mb-2 group-hover:text-secondary transition-colors">{store.name}</h3>
              <p className="text-on-surface-variant/80 font-body-sm mb-4 whitespace-pre-line leading-relaxed">{store.location}</p>
            </div>
            <div className="flex items-center gap-2 pt-4 border-t border-outline-variant/30 mt-auto">
              <span className="material-symbols-outlined text-sm text-secondary">schedule</span>
              <span className="text-on-surface-variant font-label-sm">{store.hours}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Map Placeholder */}
      {/* <div className="mt-stack-lg rounded-2xl overflow-hidden relative h-[300px] sm:h-[360px] mx-4 sm:mx-0 bg-surface-container border border-outline-variant shadow-lg group">
        <div className="absolute inset-0 bg-cover bg-center grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAfkgtBFlPDZ8zyluq0V9CY5z0Mu3wihzYboBu-5ECuMfuPCHSN20rhypLVuaH8RkyW-qe6DdYnFMfBeGwynC7IIxDl8NEC6Aj8bgTEMkqM0OdIE1bY46Wg6SBobF7UvjtJWPBgDaXrTJCN5hCraaLoDb8PZXdE1g2P8pL1qMplJanTs5BEa5zxWukYaGdOTaFdNk6fwss2rwLOgpIi614__dLByjLEbyohuQ43z4O9MrdtlWHNdSMDgWvTt3mRHrzz9CXyJyXQgdsf')" }}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent"></div>
        <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="bg-surface/80 backdrop-blur-md px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border border-outline-variant/30 shadow-xl flex items-center gap-3">
            <span className="material-symbols-outlined text-secondary text-sm sm:text-base">distance</span>
            <span className="text-on-surface font-bold text-[10px] sm:text-sm uppercase tracking-wide sm:normal-case sm:tracking-normal">Institutional stores near you</span>
          </div>
          <button className="w-full sm:w-auto bg-secondary text-on-secondary font-bold px-8 py-3 rounded-full hover:opacity-90 transition-all shadow-xl active:scale-95 text-xs sm:text-sm uppercase tracking-wider">
            View Full Map
          </button>
        </div>
      </div> */}
    </div>
  );
}
