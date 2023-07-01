export function getTwitterLink(
  message: string,
  url: string,
  hashtags: string[]
) {
  const baseUrl = "https://twitter.com/intent/tweet";
  return `${baseUrl}?text=${encode(message)}&url=${encode(
    url
  )}&hashtags=${hashtags.join(",")}`;
}

export function getLinkedInLink(url: string) {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encode(url)}`;
}

export function getFacebookLink(message: string, url: string) {
  const baseUrl = "https://web.facebook.com/sharer/sharer.php";
  return `${baseUrl}?display=popup&u=${encode(url)}&quote=${encode(message)}`;
}

export function getWhatsAppLink(text: string, url: string) {
  return `https://api.whatsapp.com/send?text=${encode(text)}%20${encode(url)}`;
}

export function getInstagramLink(caption: string, url: string) {
  return `https://www.instagram.com/share?url=${encode(url)}&caption=${encode(
    caption
  )}`;
}

export function getTelegramLink(text: string, url: string) {
  return `https://t.me/share/url?text=${encode(text)}&url=${encode(url)}`;
}

const encode = (value: string) => encodeURIComponent(value);
