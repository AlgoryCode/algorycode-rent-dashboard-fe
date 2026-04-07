"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchCountriesFromRentApi,
  getRentApiErrorMessage,
  type CountryRow,
} from "@/lib/rent-api";

export function useCountries() {
  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchCountriesFromRentApi();
      setCountries(list);
    } catch (e) {
      setError(getRentApiErrorMessage(e));
      setCountries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const countryByCode = useMemo(() => {
    const m = new Map<string, CountryRow>();
    for (const c of countries) {
      m.set(c.code.toUpperCase(), c);
    }
    return m;
  }, [countries]);

  return { countries, countryByCode, loading, error, refetch, setCountries };
}
