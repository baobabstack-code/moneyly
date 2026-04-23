"use client";

import { useApplicationStore } from "@/lib/store";
import { useRouter } from "next/navigation";

export default function StoreSelectionPage() {
  const router = useRouter();
  const { setSelectedStore } = useApplicationStore();

  const stores = [
    {
      id: 1,
      name: "TV Sales & Home",
      code: "TVS-001",
      location: "Sam Levy's Village, Borrowdale\nHarare, Zimbabwe",
      hours: "8:00 AM - 6:00 PM",
      status: "Open Now",
      logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuBuj7691Ri2bQuVhoJGqt6DQ2yQFO5Pa-SziT1TN6DKpS9t_-6GjGmXKZflPL2rlVt3TIev6Y3X4X1P2kypI_JGnraQfqFyaqo8EwLiG4EEo66rM13bZKFQRJY1TXMmASmPULRgI68XgbyFXQrEPD7PxrSFoI3pdFsw3l18NEaubuP61-HCLaXonIlPWT2oplGPgOZkY-TswFqEkC7y3mi8lyRF0Ur6lVPc3M12hDaH_rcFi4WxjLJLUuraA71OXE642lc1HsuSVBI9"
    },
    {
      id: 2,
      name: "Halsted Builders Express",
      code: "HBE-002",
      location: "71 Plumtree Road, Belmont\nBulawayo, Zimbabwe",
      hours: "9:00 AM - 5:00 PM",
      status: null,
      logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuD_QvEJy5HhE7WTgXqj--ifTjKXtQrhsNcGLVQluqPJ6uAh2mNICtzSnC1Nghw3SqSXV2ug0bMKB3sKBzTyLWs0UkgDS3b3dgl6G4MrCRXtB7xDAMGy62gcAA5o07ycw5_wVAojfgTupuODYWzTG1L16QucwxdwyE6cr7Jc_k4QRRkm9cv7NGK-9mAaTALvApnfhfal9Fy9UklrsCTNSBM6wQ7mHcujdNpA4BIJwkxhcep6WLyDftc4JCrairsp-2GvJq1CmopmVvOk"
    },
    {
      id: 3,
      name: "Electrosales",
      code: "ELS-003",
      location: "128 Seke Road, Graniteside\nHarare, Zimbabwe",
      hours: "10:00 AM - 9:00 PM",
      status: null,
      logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuCK3Yp9TX7tOnp6meMSwFoEVD8XT77sLqMXrondkhXJFH9eX63V5V9jxlNRx9FSeS-2j2kWMTBYBPRXvbu4CRt4877PwgrDCcd7uCr0CBUSkAP77XM_TTWbMFQmbo8jg2MTBWuUYNwAgaLYtAM_kYabb7i3vHk0jxzaVGvo7EScX9h8UU94Ue4TPRAsUFfzWuu8uUlJwFyGqq69WsZItSiBUmihb1qEI-otCr1YexZjSNU3gAMLJiU2oYLqTJZo7rRE-Ha1EwTa7Nzb"
    }
  ];

  const handleSelectStore = (id: number, name: string) => {
    setSelectedStore(id, name);
    router.push("/apply/lookup");
  };

  return (
    <div className="w-full">
      {/* Progress Header */}
      <div className="mb-stack-lg px-4 sm:px-0">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-secondary font-label-md uppercase tracking-wider block">Step 1 of 8</span>
              <div className="group relative">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant/40 cursor-help">help</span>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-primary text-on-primary text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100] shadow-xl text-center">
                  Select the branch or digital storefront where you intend to use this facility.
                </div>
              </div>
            </div>
            <h1 className="font-h1 text-on-surface">Select a Store</h1>
          </div>
          <div className="hidden md:block text-right">
            <span className="text-on-surface-variant font-body-sm">Completion</span>
            <div className="w-48 h-2 bg-outline-variant rounded-full mt-2 overflow-hidden">
              <div className="bg-secondary h-full w-[8%] transition-all duration-500"></div>
            </div>
          </div>
        </div>
        <p className="text-on-surface-variant font-body-lg max-w-2xl">
          Choose the store where you are making your purchase. This will be recorded with your application.
        </p>
      </div>

      {/* Store Selection Grid — Big Tiles as per brief */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter px-4 sm:px-0">
        {stores.map((store) => (
          <button
            key={store.id}
            onClick={() => handleSelectStore(store.id, store.name)}
            className="group flex flex-col text-left bg-surface border-2 border-outline-variant p-gutter rounded-2xl hover:border-secondary hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 shadow-sm active:scale-[0.98] cursor-pointer"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="w-16 h-16 rounded-xl bg-white overflow-hidden flex items-center justify-center p-2 border border-outline-variant group-hover:border-secondary/50 shadow-inner transition-colors">
                <img alt={store.name} className="w-full h-full object-contain" src={store.logo} />
              </div>
              <div className="flex flex-col items-end gap-2">
                {store.status && (
                  <span className="px-2.5 py-1 bg-secondary/10 text-secondary text-[10px] font-bold rounded-full uppercase tracking-widest border border-secondary/20">{store.status}</span>
                )}
                <span className="text-[10px] text-on-surface-variant/50 font-mono uppercase">{store.code}</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-h3 text-h3 text-primary mb-2 group-hover:text-secondary transition-colors">{store.name}</h3>
              <p className="text-on-surface-variant/80 font-body-sm mb-4 whitespace-pre-line leading-relaxed">{store.location}</p>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-outline-variant/30 mt-auto">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-secondary">schedule</span>
                <span className="text-on-surface-variant font-label-sm">{store.hours}</span>
              </div>
              <span className="material-symbols-outlined text-secondary group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
