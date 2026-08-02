'use client';
import { useState, useRef } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api';
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 Mo
const ACCEPTED_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];

// Upload direct signé (navigateur -> Cloudinary), le fichier ne transite
// jamais par notre serveur. Pattern distinct de PhotoGridUploader
// (qui passe par POST /api/upload/images).
export default function VideoUploader({ video, onChange, token, language = 'FR' }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const inputRef = useRef(null);
  const isAR = language === 'AR';

  const T = {
    clickToChoose: isAR ? 'اضغط لاختيار فيديو' : 'Cliquez pour choisir une vidéo',
    formats: isAR ? 'MP4، MOV، WEBM — الحد الأقصى 100 ميغابايت' : 'MP4, MOV, WEBM — max 100 Mo',
    uploading: isAR ? 'جارٍ الإرسال...' : 'Envoi en cours...',
    unsupportedFormat: isAR ? 'صيغة غير مدعومة. استخدم MP4 أو MOV أو WEBM.' : 'Format non supporté. Utilisez MP4, MOV ou WEBM.',
    tooLarge: isAR ? 'الفيديو يتجاوز 100 ميغابايت.' : 'La vidéo dépasse 100 Mo.',
    prepFailed: isAR ? 'تعذر تجهيز الإرسال' : "Impossible de préparer l'envoi",
    cloudinaryFailed: isAR ? 'فشل الرفع إلى الخادم' : 'Échec du téléchargement vers Cloudinary',
    networkError: isAR ? 'خطأ في الشبكة أثناء الإرسال' : 'Erreur réseau pendant l\'envoi',
    uploadFailed: isAR ? 'فشل رفع الفيديو.' : "Échec de l'upload vidéo.",
    remove: isAR ? 'حذف' : 'Supprimer',
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError(T.unsupportedFormat);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    if (file.size > MAX_VIDEO_SIZE) {
      setUploadError(T.tooLarge);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // 1. Demander la signature à notre backend (vérifie journalistMiddleware)
      const sigRes = await fetch(`${API_URL}/upload/videos/signature`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sigJson = await sigRes.json();
      if (!sigJson.success) throw new Error(T.prepFailed);
      const { signature, timestamp, folder, apiKey, cloudName } = sigJson;

      // 2. Upload direct vers Cloudinary (XHR pour suivre la progression)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
      formData.append('folder', folder);

      const result = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`);
        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) setProgress(Math.round((evt.loaded / evt.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText));
          else reject(new Error(T.cloudinaryFailed));
        };
        xhr.onerror = () => reject(new Error(T.networkError));
        xhr.send(formData);
      });

      onChange({ url: result.secure_url, publicId: result.public_id });
    } catch (err) {
      setUploadError(err.message || T.uploadFailed);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = () => onChange(null);

  return (
    <div className="flex flex-col gap-3">
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition ${
          uploading ? 'border-[#A7D129] bg-[#E8F5D0]/40 cursor-wait'
          : uploadError ? 'border-red-300 bg-red-50 hover:border-red-400'
          : 'border-gray-200 hover:border-[#2D5016] hover:bg-[#2D5016]/5'
        }`}
      >
        <input ref={inputRef} type="file" accept="video/mp4,video/quicktime,video/webm" className="hidden" onChange={handleFile} />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-5 h-5 border-2 border-[#2D5016] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#2D5016] font-semibold">{T.uploading} {progress}%</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-gray-500">
            <span className="text-2xl">🎬</span>
            <p className="text-sm font-semibold">{T.clickToChoose}</p>
            <p className="text-xs text-gray-400">{T.formats}</p>
          </div>
        )}
      </div>

      {uploadError && <p className="text-xs text-red-500">⚠ {uploadError}</p>}

      {video?.url && (
        <div className="relative group rounded-xl overflow-hidden border-2 border-gray-200">
          <video src={video.url} controls className="w-full max-h-64" />
          <button type="button" onClick={remove}
            className="absolute top-2 right-2 text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold opacity-0 group-hover:opacity-100 transition">
            {T.remove}
          </button>
        </div>
      )}
    </div>
  );
}