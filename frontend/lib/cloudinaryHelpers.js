// Helpers Cloudinary côté frontend — aucune requête serveur, juste de la
// réécriture d'URL (Cloudinary supporte ces transformations à la volée).

// Génère l'URL d'une vignette JPG statique à partir de l'URL d'une vidéo déjà
// hébergée sur Cloudinary. Évite de streamer/décoder la vidéo entière juste
// pour afficher un aperçu dans une grille de cartes (PressCard/LeadStory).
//
// Principe : Cloudinary génère une frame fixe si on demande l'extension .jpg
// sur un asset vidéo. "so_0" (start offset) fixe l'instant de la capture à 0s.
export function videoThumbnailUrl(videoUrl) {
  if (!videoUrl) return null;
  try {
    const withTransform = videoUrl.includes('/upload/so_')
      ? videoUrl
      : videoUrl.replace('/upload/', '/upload/so_0/');
    return withTransform.replace(/\.\w+($|\?.*$)/, '.jpg$1');
  } catch {
    return null;
  }
}