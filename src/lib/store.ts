import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface ApplicationState {
  // Store Selection
  selectedStoreId: number | null;
  setSelectedStoreId: (id: number) => void;

  // Section 1: Basic Info
  basicInfo: {
    firstName: string;
    lastName: string;
    idNumber: string;
    dateOfBirth: string;
    gender: string;
  };
  setBasicInfo: (info: Partial<ApplicationState["basicInfo"]>) => void;

  // Section 2: Contact Details
  contactDetails: {
    email: string;
    phoneNumber: string;
    address: string;
    city: string;
    postalCode: string;
  };
  setContactDetails: (details: Partial<ApplicationState["contactDetails"]>) => void;

  // Section 3: Employment Details
  employmentDetails: {
    employerName: string;
    jobTitle: string;
    monthlyIncome: string;
    employmentType: string;
  };
  setEmploymentDetails: (details: Partial<ApplicationState["employmentDetails"]>) => void;

  // Section 4: Next of Kin
  nextOfKin: {
    fullName: string;
    relationship: string;
    phoneNumber: string;
  };
  setNextOfKin: (details: Partial<ApplicationState["nextOfKin"]>) => void;

  // Section 5: Purchase Details
  purchaseDetails: {
    productType: string;
    loanAmount: string;
    repaymentTerm: string;
  };
  setPurchaseDetails: (details: Partial<ApplicationState["purchaseDetails"]>) => void;
  
  // Actions
  resetStore: () => void;
}

const initialState = {
  selectedStoreId: null,
  basicInfo: {
    firstName: "",
    lastName: "",
    idNumber: "",
    dateOfBirth: "",
    gender: "",
  },
  contactDetails: {
    email: "",
    phoneNumber: "",
    address: "",
    city: "",
    postalCode: "",
  },
  employmentDetails: {
    employerName: "",
    jobTitle: "",
    monthlyIncome: "",
    employmentType: "",
  },
  nextOfKin: {
    fullName: "",
    relationship: "",
    phoneNumber: "",
  },
  purchaseDetails: {
    productType: "",
    loanAmount: "",
    repaymentTerm: "",
  },
};

export const useApplicationStore = create<ApplicationState>()(
  persist(
    (set) => ({
      ...initialState,
      setSelectedStoreId: (id) => set({ selectedStoreId: id }),
      setBasicInfo: (info) =>
        set((state) => ({ basicInfo: { ...state.basicInfo, ...info } })),
      setContactDetails: (details) =>
        set((state) => ({ contactDetails: { ...state.contactDetails, ...details } })),
      setEmploymentDetails: (details) =>
        set((state) => ({
          employmentDetails: { ...state.employmentDetails, ...details },
        })),
      setNextOfKin: (details) =>
        set((state) => ({ nextOfKin: { ...state.nextOfKin, ...details } })),
      setPurchaseDetails: (details) =>
        set((state) => ({
          purchaseDetails: { ...state.purchaseDetails, ...details },
        })),
      resetStore: () => set(initialState),
    }),
    {
      name: "htb-application-storage",
      storage: createJSONStorage(() => sessionStorage), // Using sessionStorage so it clears on tab close
    }
  )
);
