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
    // balanceAmount is computed: retailPrice - depositAmount
  };
  setPurchaseDetails: (details: Partial<ApplicationState["purchaseDetails"]>) => void;

  // Actions
  resetStore: () => void;
}

const initialState = {
  notifications: [],
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
      resetStore: () => set(initialState),
    }),
    {
      name: "htb-application-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
