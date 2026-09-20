"use client";

import { useState } from "react";
import Eye from "lucide-react/dist/esm/icons/eye";
import EyeOff from "lucide-react/dist/esm/icons/eye-off";

export default function PasswordInput({
  value,
  onChange,
  placeholder = "••••••••",
  autoComplete = "current-password",
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        className="input-green w-full pr-11"
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        tabIndex={-1}
        aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}