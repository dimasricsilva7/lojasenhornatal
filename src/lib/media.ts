/** Decide se um link é vídeo ou imagem pela extensão (GIF conta como imagem). */
export function mediaTypeFromUrl(url: string): "video" | "image" {
  const path = url.split("?")[0].toLowerCase();
  return /\.(mp4|webm|mov|m4v)$/.test(path) ? "video" : "image";
}
