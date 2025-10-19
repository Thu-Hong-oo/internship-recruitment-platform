"use client";

import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { getCities, getDistricts, getWards } from "@/lib/vietnamAddress";
import { AddressData, validateAddress } from "@/lib/addressUtils";

interface AddressSelectorProps {
  value: AddressData;
  onChange: (address: AddressData) => void;
  showValidation?: boolean;
  className?: string;
}

export default function AddressSelector({
  value,
  onChange,
  showValidation = false,
  className = "",
}: AddressSelectorProps) {
  const [cities, setCities] = useState<{ value: string; label: string }[]>([]);
  const [districts, setDistricts] = useState<
    { value: string; label: string }[]
  >([]);
  const [wards, setWards] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState({
    cities: false,
    districts: false,
    wards: false,
  });

  // Load cities on mount
  useEffect(() => {
    const loadCities = async () => {
      setLoading((prev) => ({ ...prev, cities: true }));
      try {
        const citiesData = await getCities();
        setCities(citiesData);
      } catch (error) {
        console.error("Failed to load cities:", error);
      } finally {
        setLoading((prev) => ({ ...prev, cities: false }));
      }
    };

    loadCities();
  }, []);

  // Load districts when city changes
  useEffect(() => {
    if (!value.city) {
      setDistricts([]);
      setWards([]);
      return;
    }

    const loadDistricts = async () => {
      setLoading((prev) => ({ ...prev, districts: true }));
      try {
        const districtsData = await getDistricts(value.city);
        setDistricts(districtsData);
        setWards([]); // Reset wards when city changes
        onChange({ ...value, district: "", ward: "" });
      } catch (error) {
        console.error("Failed to load districts:", error);
      } finally {
        setLoading((prev) => ({ ...prev, districts: false }));
      }
    };

    loadDistricts();
  }, [value.city]);

  // Load wards when district changes
  useEffect(() => {
    if (!value.district) {
      setWards([]);
      return;
    }

    const loadWards = async () => {
      setLoading((prev) => ({ ...prev, wards: true }));
      try {
        const wardsData = await getWards(value.district);
        setWards(wardsData);
        onChange({ ...value, ward: "" });
      } catch (error) {
        console.error("Failed to load wards:", error);
      } finally {
        setLoading((prev) => ({ ...prev, wards: false }));
      }
    };

    loadWards();
  }, [value.district]);

  const handleCityChange = (cityCode: string) => {
    const cityName = cities.find((c) => c.value === cityCode)?.label || "";
    onChange({
      ...value,
      city: cityCode,
      cityName,
      district: "",
      ward: "",
    });
  };

  const handleDistrictChange = (districtCode: string) => {
    const districtName =
      districts.find((d) => d.value === districtCode)?.label || "";
    onChange({
      ...value,
      district: districtCode,
      districtName,
      ward: "",
    });
  };

  const handleWardChange = (wardCode: string) => {
    const wardName = wards.find((w) => w.value === wardCode)?.label || "";
    onChange({
      ...value,
      ward: wardCode,
      wardName,
    });
  };

  const handleStreetChange = (street: string) => {
    onChange({
      ...value,
      street,
    });
  };

  const validation = validateAddress(value);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <Label htmlFor="street">Số nhà, tên đường</Label>
        <Input
          id="street"
          type="text"
          placeholder="Nhập số nhà, tên đường"
          value={value.street || ""}
          onChange={(e) => handleStreetChange(e.target.value)}
          className="h-12 border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">Tỉnh/Thành phố</Label>
          <Select
            value={value.city || ""}
            onValueChange={handleCityChange}
            disabled={loading.cities}
          >
            <SelectTrigger className="h-12 border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary">
              <SelectValue
                placeholder={
                  loading.cities
                    ? "Đang tải..."
                    : "Chọn tỉnh/thành phố (tùy chọn)"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {cities.map((city) => (
                <SelectItem key={city.value} value={city.value}>
                  {city.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="district">Quận/Huyện</Label>
          <Select
            value={value.district || ""}
            onValueChange={handleDistrictChange}
            disabled={!value.city || loading.districts}
          >
            <SelectTrigger className="h-12 border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary">
              <SelectValue
                placeholder={
                  !value.city
                    ? "Chọn tỉnh/thành phố trước"
                    : loading.districts
                    ? "Đang tải..."
                    : "Chọn quận/huyện (tùy chọn)"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {districts.map((district) => (
                <SelectItem key={district.value} value={district.value}>
                  {district.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ward">Phường/Xã</Label>
          <Select
            value={value.ward || ""}
            onValueChange={handleWardChange}
            disabled={!value.district || loading.wards}
          >
            <SelectTrigger className="h-12 border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary">
              <SelectValue
                placeholder={
                  !value.district
                    ? "Chọn quận/huyện trước"
                    : loading.wards
                    ? "Đang tải..."
                    : "Chọn phường/xã (tùy chọn)"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {wards.map((ward) => (
                <SelectItem key={ward.value} value={ward.value}>
                  {ward.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {showValidation && !validation.isValid && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            <ul className="list-disc list-inside space-y-1">
              {validation.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// Re-export AddressData from addressUtils for backward compatibility
export type { AddressData } from "@/lib/addressUtils";
