import type { Feature } from "~/lib/directus";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../ui/carousel";
import { Card, CardContent } from "../ui/card";

type FeaturesProps = {
  data: Feature[];
};

export default function Features({ data }: FeaturesProps) {
  return (
    <div
      id="features"
      className="flex h-full items-center justify-center w-full"
    >
      <div className="w-full">
        <div className="flex items-center justify-center pb-10">
          <p className="dark:text-green-200 font-serif text-6xl font-black text-green-100 subpixel-antialiased">
            Features
          </p>
        </div>
        <div className="flex">
          <Carousel
            className="w-full"
            opts={{
              // align: "start",
              loop: true,
            }}
            plugins={[
              Autoplay({
                delay: 2000,
              }),
            ]}
          >
            <CarouselContent className="-ml-8">
              {Array.from({ length: 5 }).map((_, index) => (
                <CarouselItem
                  key={index}
                  className="pl-8 md:basis-1/2 lg:basis-1/3"
                >
                  <div className="p-1">
                    <Card>
                      <CardContent className="flex aspect-square items-center justify-center p-6">
                        <span className="text-2xl font-semibold">
                          {index + 1}
                        </span>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </div>
    </div>
  );
}
