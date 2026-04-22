import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { SELECTED_TRYON_PRODUCTS_STORAGE_KEY } from "@/constants/flow";

export type SelectedProduct = {
  id: string;
  title: string;
  imageUrl: string;
  source?: string | null;
  price?: string | null;
  selectedAt: string;
};

type SelectedProductsState = {
  selectedProducts: SelectedProduct[];
  isSelected: (productId: string) => boolean;
  selectProduct: (product: Omit<SelectedProduct, "selectedAt">) => void;
  unselectProduct: (productId: string) => void;
  toggleProduct: (product: Omit<SelectedProduct, "selectedAt">) => void;
  clearSelectedProducts: () => void;
};

const MAX_SELECTED_PRODUCTS = 20;

export const useSelectedProductsStore = create<SelectedProductsState>()(
  persist(
    (set, get) => ({
      selectedProducts: [],

      isSelected: (productId) => {
        return get().selectedProducts.some((item) => item.id === productId);
      },

      selectProduct: (product) => {
        set((state) => {
          const exists = state.selectedProducts.some((item) => item.id === product.id);
          if (exists) {
            return state;
          }

          const nextItem: SelectedProduct = {
            ...product,
            selectedAt: new Date().toISOString(),
          };

          return {
            selectedProducts: [nextItem, ...state.selectedProducts].slice(0, MAX_SELECTED_PRODUCTS),
          };
        });
      },

      unselectProduct: (productId) => {
        set((state) => ({
          selectedProducts: state.selectedProducts.filter((item) => item.id !== productId),
        }));
      },

      toggleProduct: (product) => {
        const exists = get().selectedProducts.some((item) => item.id === product.id);
        if (exists) {
          get().unselectProduct(product.id);
          return;
        }

        get().selectProduct(product);
      },

      clearSelectedProducts: () => {
        set({ selectedProducts: [] });
      },
    }),
    {
      name: SELECTED_TRYON_PRODUCTS_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ selectedProducts: state.selectedProducts }),
    },
  ),
); // Zustand store for managing selected products in the try-on flow, with persistence in localStorage
