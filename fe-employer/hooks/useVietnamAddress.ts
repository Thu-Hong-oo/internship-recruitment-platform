import { useState, useEffect, useCallback } from "react";
import { getCities, getDistricts, getWards } from "@/lib/vietnamAddress";

interface AddressOption {
  value: string;
  label: string;
}

interface UseVietnamAddressReturn {
  cities: AddressOption[];
  districts: AddressOption[];
  wards: AddressOption[];
  loading: boolean;
  error: string | null;
  loadDistricts: (cityKey: string) => Promise<void>;
  loadWards: (districtCode: string) => Promise<void>;
  resetDistricts: () => void;
  resetWards: () => void;
}

export const useVietnamAddress = (): UseVietnamAddressReturn => {
  const [cities, setCities] = useState<AddressOption[]>([]);
  const [districts, setDistricts] = useState<AddressOption[]>([]);
  const [wards, setWards] = useState<AddressOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load cities on mount
  useEffect(() => {
    const loadCities = async () => {
      setLoading(true);
      setError(null);
      try {
        const citiesData = await getCities();
        setCities(citiesData);
      } catch (err) {
        setError("Không thể tải danh sách tỉnh/thành phố");
        console.error("Error loading cities:", err);
      } finally {
        setLoading(false);
      }
    };

    loadCities();
  }, []);

  // Load districts by city
  const loadDistricts = useCallback(async (cityKey: string) => {
    if (!cityKey) return;

    setLoading(true);
    setError(null);
    try {
      const districtsData = await getDistricts(cityKey);
      setDistricts(districtsData);
    } catch (err) {
      setError("Không thể tải danh sách quận/huyện");
      console.error("Error loading districts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load wards by city and district
  const loadWards = useCallback(async (districtCode: string) => {
    if (!districtCode) return;

    setLoading(true);
    setError(null);
    try {
      const wardsData = await getWards(districtCode);
      setWards(wardsData);
    } catch (err) {
      setError("Không thể tải danh sách phường/xã");
      console.error("Error loading wards:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset functions
  const resetDistricts = useCallback(() => {
    setDistricts([]);
    setWards([]);
  }, []);

  const resetWards = useCallback(() => {
    setWards([]);
  }, []);

  return {
    cities,
    districts,
    wards,
    loading,
    error,
    loadDistricts,
    loadWards,
    resetDistricts,
    resetWards,
  };
};
