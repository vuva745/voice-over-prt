"use client";

import Image from "next/image";
import { HERO_PHOTO, MOOD_PHOTOS } from "@/lib/photos";

export function HeroPhotoStage() {
  return (
    <div className="hero-photo-stage" aria-hidden>
      <Image
        src={HERO_PHOTO.src}
        alt=""
        fill
        priority
        sizes="100vw"
        className="hero-photo"
      />
      <div className="hero-photo-tint" />
    </div>
  );
}

export function MoodGallery() {
  return (
    <section className="section mood" id="mood" aria-label="Studio moodboard">
      <div className="section-head">
        <span className="section-index">02</span>
        <div>
          <h2>Color & mood</h2>
          <p>Bright studio energy — photos from Unsplash to set the tone.</p>
        </div>
      </div>

      <div className="mood-track">
        {MOOD_PHOTOS.map((photo) => (
          <figure key={photo.src} className="mood-shot" style={{ ["--shot-accent" as string]: photo.accent }}>
            <div className="mood-shot-frame">
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(max-width: 700px) 70vw, 320px"
                className="mood-shot-img"
              />
              <div className="mood-shot-wash" />
            </div>
            <figcaption>
              <span>{photo.alt}</span>
              <a href={photo.creditUrl} target="_blank" rel="noreferrer">
                {photo.credit} · Unsplash
              </a>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
