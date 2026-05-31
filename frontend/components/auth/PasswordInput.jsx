"use client";

import { useState } from "react";
import Eye from "lucide-react/dist/esm/icons/eye";
import EyeOff from "lucide-react/dist/esm/icons/eye-off";

export default function PasswordInput({ value, onChange }) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        className="input-green p-3 border rounded-lg w-full pr-10"
        placeholder="Mot de passe"
        required
      />

      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-3"
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}