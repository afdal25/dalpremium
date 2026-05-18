export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const API_ORIGIN =
  import.meta.env.VITE_API_ORIGIN ||
  API_BASE_URL.replace(/\/api\/?$/, "");

export const assetUrl = (path) => {
  if (!path) {
    return "";
  }

  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:")
  ) {
    return path;
  }

  return `${API_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
};

const isCloudinaryUrl = (url = "") =>
  /^https:\/\/res\.cloudinary\.com\/.+\/upload\//.test(url);

export const optimizedImageUrl = (
  path,
  {
    width,
    height,
    crop = "fill",
    quality = "auto",
    format = "auto",
  } = {}
) => {
  const url = assetUrl(path);

  if (!url || !isCloudinaryUrl(url)) {
    return url;
  }

  const transforms = [
    format ? `f_${format}` : "",
    quality ? `q_${quality}` : "",
    width ? `w_${width}` : "",
    height ? `h_${height}` : "",
    crop && width ? `c_${crop}` : "",
  ].filter(Boolean);

  if (transforms.length === 0 || url.includes("/upload/f_")) {
    return url;
  }

  return url.replace("/upload/", `/upload/${transforms.join(",")}/`);
};

export const imageSrcSet = (path, widths, options = {}) =>
  widths
    .map(
      (width) =>
        `${optimizedImageUrl(path, {
          ...options,
          width,
        })} ${width}w`
    )
    .join(", ");
