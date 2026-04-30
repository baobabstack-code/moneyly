import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * HTB Global - Central Application Store
 * 
 * This store is the "Source of Truth" for the entire multi-step loan application.
 * All user inputs are collected here and persisted in sessionStorage.
 * 
 * GOAL: Once the user reaches the 'Summary' step, the data in this store 
 * is retrieved and passed to the backend API for processing and storage.
 */
export interface ApplicationState {
  /** System notifications for user feedback (success messages, errors, etc.) */
  notifications: Array<{ id: string; message: string; type: 'success' | 'info' | 'error'; timestamp: number }>;
  addNotification: (message: string, type?: 'success' | 'info' | 'error') => void;
  clearNotifications: () => void;

  /** Last submitted application reference number */
  lastReference: string;
  setLastReference: (ref: string) => void;
  
  /** 
   * Store Selection 
   * Used in the first step to identify which branch the user is applying through.
   */
  selectedStoreId: number | null;
  selectedStoreName: string;
  setSelectedStore: (id: number, name: string) => void;

  /** 
   * National ID Lookup 
   * Initial identity check using the user's National ID number.
   */
  lookup: {
    nationalId: string;
    customerFound: boolean;
  };
  setLookup: (data: Partial<ApplicationState["lookup"]>) => void;

  /** 
   * Section 1: Personal Info (Basic Info) 
   * Core identity details including a selfie for verification.
   */
  basicInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string; // "Male" | "Female"
    photoUrl: string; // selfie data URL (Base64)
  };
  setBasicInfo: (info: Partial<ApplicationState["basicInfo"]>) => void;

  // Section 2: Contact Details
  contactDetails: {
    physicalAddress: string;
    mobileNumber: string;
    emailAddress: string;
  };
  setContactDetails: (details: Partial<ApplicationState["contactDetails"]>) => void;

  /** 
   * Section 3: Employment Details 
   * Income source verification. Civil servants have additional fields.
   */
  employmentDetails: {
    employerName: string;
    isCivilServant: boolean | null; // null = not answered yet
    employerNo: string;    // EC Number (conditional: only if isCivilServant = true)
    ministry: string;      // Ministry name (conditional: only if isCivilServant = true)
    phoneNumber: string;
  };
  setEmploymentDetails: (details: Partial<ApplicationState["employmentDetails"]>) => void;

  // Section 4: Next of Kin
  nextOfKin: {
    fullName: string;
    address: string;
    mobileNumber: string;
    relationship: string;
  };
  setNextOfKin: (details: Partial<ApplicationState["nextOfKin"]>) => void;

  // Section 5: Purchase Details
  purchaseDetails: {
    productName: string;
    retailPrice: string;
    depositAmount: string;
    tenureMonths: string;
    // balanceAmount is computed: retailPrice - depositAmount
  };
  setPurchaseDetails: (details: Partial<ApplicationState["purchaseDetails"]>) => void;

  /** 
   * Section 6: Document Uploads 
   * Scanned proof of identity and income.
   */
  documentUploads: {
    idCopyUrl: string;
    payslipUrl: string;
  };
  setDocumentUploads: (docs: Partial<ApplicationState["documentUploads"]>) => void;

  // Actions
  resetStore: () => void;
}

const initialState = {
  notifications: [],
  lastReference: '',
  selectedStoreId: null,
  selectedStoreName: "",
  lookup: {
    nationalId: "",
    customerFound: false,
  },
  basicInfo: {
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    photoUrl: "",
  },
  contactDetails: {
    physicalAddress: "",
    mobileNumber: "",
    emailAddress: "",
  },
  employmentDetails: {
    employerName: "",
    isCivilServant: null,
    employerNo: "",
    ministry: "",
    phoneNumber: "",
  },
  nextOfKin: {
    fullName: "",
    address: "",
    mobileNumber: "",
    relationship: "",
  },
  purchaseDetails: {
    productName: "",
    retailPrice: "",
    depositAmount: "",
    tenureMonths: "",
  },
  documentUploads: {
    idCopyUrl: "",
    payslipUrl: "",
  },
};

export const useApplicationStore = create<ApplicationState>()(
  persist(
    (set) => ({
      ...initialState,
      addNotification: (message, type = 'info') =>
        set((state) => ({
          notifications: [
            ...state.notifications,
            { id: Math.random().toString(36).substring(7), message, type, timestamp: Date.now() }
          ]
        })),
      clearNotifications: () => set({ notifications: [] }),
      setLastReference: (ref) => set({ lastReference: ref }),
      setSelectedStore: (id, name) =>
        set({ selectedStoreId: id, selectedStoreName: name }),
      setLookup: (data) =>
        set((state) => ({ lookup: { ...state.lookup, ...data } })),
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
      setDocumentUploads: (docs) =>
        set((state) => ({
          documentUploads: { ...state.documentUploads, ...docs },
        })),
      resetStore: () => set(initialState),
    }),
    {
      name: "htb-application-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
