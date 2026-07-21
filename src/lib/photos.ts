export type MoodPhoto = {
  src: string;
  alt: string;
  credit: string;
  creditUrl: string;
  accent: string;
};

/** Free-to-use Unsplash photos (Pinterest images aren't free to reuse). */
export const HERO_PHOTO: MoodPhoto = {
  src: "https://images.unsplash.com/photo-1598653222000-6b7b7a552625?auto=format&fit=crop&w=2400&q=80",
  alt: "Studio microphone in warm colorful light",
  credit: "Unsplash",
  creditUrl: "https://unsplash.com/photos/1598653222000-6b7b7a552625",
  accent: "#ff6b9d",
};

export const MOOD_PHOTOS: MoodPhoto[] = [
  {
    src: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80",
    alt: "DJ booth under electric blue light",
    credit: "Marcela Laskoski",
    creditUrl: "https://unsplash.com/photos/dba8ba36b745",
    accent: "#67e8f9",
  },
  {
    src: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=80",
    alt: "Neon silhouette in magenta haze",
    credit: "Lucas Benjamin",
    creditUrl: "https://unsplash.com/photos/45ecd05ae2ad",
    accent: "#ff6ad5",
  },
  {
    src: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=1200&q=80",
    alt: "Crowd under rainbow stage lights",
    credit: "Anthony DELANOIX",
    creditUrl: "https://unsplash.com/photos/bb934ecdc4ec",
    accent: "#fde047",
  },
  {
    src: "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?auto=format&fit=crop&w=1200&q=80",
    alt: "Vinyl collection in warm tones",
    credit: "Adrian Korte",
    creditUrl: "https://unsplash.com/photos/1015ddeb83d1",
    accent: "#ff8a65",
  },
  {
    src: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80",
    alt: "Colorful music studio equipment",
    credit: "Austin Neill",
    creditUrl: "https://unsplash.com/photos/c1f69419868d",
    accent: "#5efce0",
  },
  {
    src: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80",
    alt: "Concert energy in vivid color",
    credit: "Michael Baccin",
    creditUrl: "https://unsplash.com/photos/7a46d19cd819",
    accent: "#c084fc",
  },
  {
    src: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=1200&q=80",
    alt: "Close-up condenser microphone",
    credit: "Jonathan Velasquez",
    creditUrl: "https://unsplash.com/photos/c1ZN57GfDB0",
    accent: "#a78bfa",
  },
  {
    src: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80",
    alt: "Recording studio with ambient color",
    credit: "Antonio Janeski",
    creditUrl: "https://unsplash.com/photos/bdbb2231ce04",
    accent: "#34d399",
  },
  {
    src: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80",
    alt: "Performer under neon magenta light",
    credit: "Gabriel Gurrola",
    creditUrl: "https://unsplash.com/photos/a3eb161ffa5f",
    accent: "#f472b6",
  },
  {
    src: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=1200&q=80",
    alt: "Abstract neon light trails",
    credit: "Unsplash",
    creditUrl: "https://unsplash.com/photos/eb5fbd3d2c17",
    accent: "#22d3ee",
  },
];
