"use client";

import { Card, CardContent } from '@/components/ui/card';
import { useState } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';

const productImages = [
  { src: "https://placehold.co/600x400/232f3e/ffffff?text=Product+1", alt: "Product 1" },
  { src: "https://placehold.co/600x400/ffffff/000000?text=Product+2", alt: "Product 2" },
  { src: "https://placehold.co/600x400/00aae4/ffffff?text=Product+3", alt: "Product 3" },
  { src: "https://placehold.co/600x400/d35400/ffffff?text=Product+4", alt: "Product 4" },
  { src: "https://placehold.co/600x400/0a3d62/ffffff?text=Product+5", alt: "Product 5" },
];

export function CarouselDemo() {
  const [mainApi, setMainApi] = useState<CarouselApi | null>(null);

  return (
    <div className="flex justify-start items-start gap-16">
      {/* LEFT VERTICAL THUMBNAIL CAROUSEL */}
      <Carousel
        opts={{
          align: "start",
        }}
        orientation="vertical"
        className="w-full max-w-[100px] border-none shadow-none"
      >
        <CarouselContent className="-mt-1 h-[600px]">
          {productImages.map((image, index) => (
            <CarouselItem key={index} className="pt-1 basis-1/3">
              <div
                className="cursor-pointer rounded-md overflow-hidden"
                onClick={() => mainApi?.scrollTo(index)}
              >
                <Card className="border-0 shadow-none rounded-md overflow-hidden">
                  <CardContent className="p-0 relative w-full h-[120px]">
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-full object-cover block"
                    />
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>

      {/* MAIN LARGE IMAGE CAROUSEL */}
      <Carousel className="w-full" setApi={setMainApi}>
        <CarouselContent>
          {productImages.map((image, index) => (
            <CarouselItem key={index}>
              <Card className="border-0 shadow-none overflow-hidden rounded-lg">
                <CardContent className="relative p-0 h-[600px]">
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-full object-cover block"
                  />
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}
