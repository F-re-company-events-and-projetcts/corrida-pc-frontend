"use client";

import { Header } from "@/components/organisms/Header";
import { Hero } from "@/components/organisms/Hero";
import { Countdown } from "@/components/organisms/Countdown";
import { Routes } from "@/components/organisms/Routes";
import { Registration } from "@/components/organisms/Registration";
import { RaceInfo } from "@/components/organisms/RaceInfo";
import { HistoryGallery } from "@/components/organisms/HistoryGallery";
import { Footer } from "@/components/organisms/Footer";

export default function Home() {
  return (
    <div className="font-sans text-gray-900 bg-white overflow-x-hidden">
      <Header />
      <Hero />
      <Countdown />
      <Routes />
      <Registration />
      <RaceInfo />
      <HistoryGallery />
      <Footer />
    </div>
  );
}