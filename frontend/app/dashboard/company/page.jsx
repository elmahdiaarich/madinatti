"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { Upload, Building, MapPin, Phone, Globe, CheckCircle2 } from "lucide-react";

export default function CompanyProfilePage() {
  const { user, token } = useAuth();
  
  const [formData, setFormData] = useState({
    companyName: "",
    companyWebsite: "",
    phone: "",
    city: "",
  });
  
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setFormData({
        companyName: user.companyName || "",
        companyWebsite: user.companyWebsite || "",
        phone: user.phone || "",
        city: user.city || "",
      });
      if (user.companyLogo) {
        setLogoPreview(user.companyLogo);
      }
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;
    
    setLoading(true);
    setSuccess(false);

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key]) data.append(key, formData[key]);
      });
      if (logoFile) {
        data.append("companyLogo", logoFile);
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: data,
      });

      if (res.ok) {
        setSuccess(true);
        // Ideally we would update the user in AuthContext here too
        setTimeout(() => setSuccess(false), 3000);
      } else {
        console.error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profil Entreprise</h1>
        <p className="text-gray-500 mt-1">Mettez à jour les informations publiques de votre entreprise.</p>
      </div>

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700">
          <CheckCircle2 size={20} />
          <p className="font-medium">Profil mis à jour avec succès !</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-8 space-y-8">
          
          {/* Logo Upload Section */}
          <div className="flex flex-col md:flex-row items-center gap-8 pb-8 border-b border-gray-100">
            <div 
              className="relative w-32 h-32 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Building className="text-gray-300" size={40} />
              )}
              
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload className="text-white mb-1" size={24} />
                <span className="text-white text-xs font-medium">Modifier</span>
              </div>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-lg font-bold text-gray-900">Logo de l'entreprise</h3>
              <p className="text-sm text-gray-500 mt-1 mb-4">Ce logo sera affiché sur vos annonces pour renforcer votre image de marque. Format recommandé : JPG, PNG (Max 2MB).</p>
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 border-2 border-[#2D5016] text-[#2D5016] rounded-xl text-sm font-bold hover:bg-[#E8F5D0] transition-colors"
              >
                Choisir une image
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleLogoChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Building size={16} className="text-gray-400" /> Nom de l'entreprise
              </label>
              <input 
                type="text" 
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2D5016] focus:ring-0 outline-none transition-colors"
                placeholder="Ex: Agence ImmoPlus"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Globe size={16} className="text-gray-400" /> Site Web
              </label>
              <input 
                type="url" 
                name="companyWebsite"
                value={formData.companyWebsite}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2D5016] focus:ring-0 outline-none transition-colors"
                placeholder="https://www.exemple.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Phone size={16} className="text-gray-400" /> Téléphone de contact
              </label>
              <input 
                type="tel" 
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2D5016] focus:ring-0 outline-none transition-colors"
                placeholder="06 00 00 00 00"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <MapPin size={16} className="text-gray-400" /> Ville
              </label>
              <input 
                type="text" 
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#2D5016] focus:ring-0 outline-none transition-colors"
                placeholder="Ex: Casablanca"
              />
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button 
            type="submit" 
            disabled={loading}
            className="px-8 py-3 bg-[#2D5016] text-white rounded-xl font-bold hover:bg-[#3a6b1e] transition-colors shadow-md shadow-[#2D5016]/20 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </div>
      </form>
    </div>
  );
}
