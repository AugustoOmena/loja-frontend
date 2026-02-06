import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import type { ShippingAddress } from "../types";

const STORAGE_KEY = "@loja-omena:address";

const DEFAULT_ADDRESS: ShippingAddress = {
  cep: "",
  street: "",
  number: "",
  neighborhood: "",
  city: "",
  state: "SP",
  complement: "",
};

interface AddressContextType {
  address: ShippingAddress;
  setAddress: (
    addr: ShippingAddress | ((prev: ShippingAddress) => ShippingAddress)
  ) => void;
  updateField: <K extends keyof ShippingAddress>(
    field: K,
    value: ShippingAddress[K]
  ) => void;
}

const AddressContext = createContext<AddressContextType>(
  {} as AddressContextType
);

export const AddressProvider = ({ children }: { children: ReactNode }) => {
  const [address, setAddressState] = useState<ShippingAddress>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<ShippingAddress>;
        return { ...DEFAULT_ADDRESS, ...parsed };
      }
    } catch {
      // ignore
    }
    return { ...DEFAULT_ADDRESS };
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(address));
    } catch {
      // ignore
    }
  }, [address]);

  const setAddress = useCallback(
    (
      updater: ShippingAddress | ((prev: ShippingAddress) => ShippingAddress)
    ) => {
      setAddressState((prev) =>
        typeof updater === "function" ? updater(prev) : updater
      );
    },
    []
  );

  const updateField = useCallback(
    <K extends keyof ShippingAddress>(field: K, value: ShippingAddress[K]) => {
      setAddressState((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  return (
    <AddressContext.Provider value={{ address, setAddress, updateField }}>
      {children}
    </AddressContext.Provider>
  );
};

export const useAddress = () => useContext(AddressContext);
