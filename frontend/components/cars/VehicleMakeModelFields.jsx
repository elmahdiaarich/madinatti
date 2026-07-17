"use client";

import { useEffect, useMemo, useState } from "react";
import { carsService } from "@/services/carsService";

const OTHER = "__other__";

function sameText(a, b) {
  return String(a || "").toLowerCase() === String(b || "").toLowerCase();
}

function findMake(catalog, make) {
  return catalog.find((item) => sameText(item.make, make));
}

const inputClass = (error) =>
  `w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition ${
    error
      ? "border-red-300 focus:ring-red-200 bg-red-50"
      : "border-gray-200 focus:ring-[#2D5016] focus:border-transparent"
  }`;

function ErrorText({ children }) {
  if (!children) return null;
  return (
    <p className="text-xs text-red-500 flex items-center gap-1">
      <span>!</span>
      {children}
    </p>
  );
}

export default function VehicleMakeModelFields({
  make,
  model,
  onMakeChange,
  onModelChange,
  errors = {},
}) {
  const [catalog, setCatalog] = useState([]);
  const [customMake, setCustomMake] = useState(false);
  const [customModel, setCustomModel] = useState(false);

  useEffect(() => {
    let alive = true;
    carsService
      .getCatalog()
      .then((res) => {
        if (!alive) return;
        const data = res.data || [];
        setCatalog(data);
      })
      .catch(() => setCatalog([]));
    return () => { alive = false; };
  }, []);

  const selectedMake = useMemo(() => findMake(catalog, make), [catalog, make]);
  const customMakeActive = customMake || Boolean(make && catalog.length && !selectedMake);
  const modelOptions = selectedMake?.models || [];
  const selectedModelKnown = modelOptions.some((item) => sameText(item, model));
  const customModelActive = customModel || Boolean(model && modelOptions.length && !selectedModelKnown);

  const handleMakeSelect = (value) => {
    if (value === OTHER) {
      setCustomMake(true);
      setCustomModel(true);
      onMakeChange("");
      onModelChange("");
      return;
    }
    setCustomMake(false);
    setCustomModel(false);
    onMakeChange(value);
    onModelChange("");
  };

  const handleModelSelect = (value) => {
    if (value === OTHER) {
      setCustomModel(true);
      onModelChange("");
      return;
    }
    setCustomModel(false);
    onModelChange(value);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-gray-700">Marque *</label>
        <select
          value={customMakeActive ? OTHER : selectedMake?.make || ""}
          onChange={(e) => handleMakeSelect(e.target.value)}
          className={inputClass(errors.make)}
        >
          <option value="">Sélectionner une marque</option>
          {catalog.map((item) => (
            <option key={item.make} value={item.make}>{item.make}</option>
          ))}
          <option value={OTHER}>Autre marque</option>
        </select>
        {customMakeActive && (
          <input
            value={make}
            onChange={(e) => onMakeChange(e.target.value)}
            placeholder="Saisir la marque"
            className={inputClass(errors.make)}
          />
        )}
        <ErrorText>{errors.make}</ErrorText>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-gray-700">Modèle *</label>
        {customMakeActive || !selectedMake ? (
          <input
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
            placeholder="Saisir le modèle"
            className={inputClass(errors.model)}
          />
        ) : (
          <>
            <select
              value={customModelActive ? OTHER : selectedModelKnown ? model : ""}
              onChange={(e) => handleModelSelect(e.target.value)}
              className={inputClass(errors.model)}
            >
              <option value="">Sélectionner un modèle</option>
              {modelOptions.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
              <option value={OTHER}>Autre modèle</option>
            </select>
            {customModelActive && (
              <input
                value={model}
                onChange={(e) => onModelChange(e.target.value)}
                placeholder="Saisir le modèle"
                className={inputClass(errors.model)}
              />
            )}
          </>
        )}
        <ErrorText>{errors.model}</ErrorText>
      </div>
    </div>
  );
}
