"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Clock, TrendingUp, Users, Lightbulb, ArrowRight, Instagram } from "lucide-react";
import Image from "next/image";

export default function Home() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-white to-gray-50 overflow-hidden">
      {/* Hero Background Elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[800px] bg-[radial-gradient(60%_60%_at_50%_30%,rgba(46,139,87,0.12)_0%,rgba(255,255,255,0)_100%)]" />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-100 rounded-full opacity-30 blur-3xl" />
        <div className="absolute top-40 -left-20 w-60 h-60 bg-emerald-100 rounded-full opacity-40 blur-3xl" />
        <div className="absolute bottom-40 right-20 w-60 h-60 bg-green-50 rounded-full opacity-30 blur-3xl" />
        <svg 
          className="absolute bottom-0 left-0 right-0 -z-10 w-full opacity-10"
          viewBox="0 0 1440 116" 
          fill="none"
        >
          <path d="M0 51.4091H1440V116H0V51.4091Z" fill="#2e8b57" />
          <path d="M1440 50.0909C1171.5 50.0909 1143 0 720 0C297 0 268.5 50.0909 0 50.0909H1440Z" fill="#2e8b57" />
        </svg>
      </div>

      {/* Hero Section */}
      <div className="relative px-4 sm:px-6 lg:px-8 pt-16 pb-24 md:pt-24 md:pb-32">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="text-center md:text-left space-y-6">
            <div className="inline-block rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700 ring-1 ring-inset ring-green-600/20 mb-2">
              Start your transformation today
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Face Your Fears,{" "}
              <span className="bg-gradient-to-r from-green-700 to-emerald-500 bg-clip-text text-transparent">
                Embrace Rejection
              </span>
            </h1>
            <p className="text-lg md:text-xl leading-relaxed text-gray-600 max-w-2xl">
              Weekly challenges to help you overcome the fear of rejection. Build
              confidence, resilience, and personal growth through structured
              rejection therapy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center md:justify-start pt-4">
              <Button
                size="lg"
                className="text-white shadow-xl shadow-green-200/50 
                transform-gpu transition-all duration-300 ease-out hover:scale-105 active:scale-95
                rounded-xl px-8 h-14 text-lg font-medium flex items-center gap-2"
                onClick={() => router.push("/auth")}
              >
                Get Started <ArrowRight className="ml-1 h-5 w-5" />
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-gray-200 bg-white/80 backdrop-blur-sm text-gray-800 hover:bg-gray-50/80
                transform-gpu transition-all duration-300 ease-out hover:scale-105 active:scale-95
                rounded-xl px-6 h-14 text-lg font-medium flex items-center gap-2"
                onClick={() => window.open("https://www.instagram.com/dailyrejection/", "_blank")}
              >
                <Instagram className="h-5 w-5 text-pink-600" /> Follow Me
              </Button>
            </div>
          </div>
          
          <div className="hidden md:block relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-emerald-500 rounded-2xl blur-sm opacity-30"></div>
            <div className="relative bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl p-8 border border-green-100">
              <div className="aspect-square w-full bg-gray-100 rounded-lg overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-white flex items-center justify-center">
                  <div className="text-center p-6">
                    <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-green-600 to-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg">
                      <ArrowRight className="h-10 w-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Ready To Start?</h3>
                    <p className="text-gray-600">Face rejection, build confidence, transform your life</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex items-center gap-4">
              <div className="flex -space-x-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-10 h-10 rounded-full ring-2 ring-white overflow-hidden">
                    <Image
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.floor(Math.random() * 1000000) + 1}`}
                      alt={`Avatar`}
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
                <div className="text-sm text-gray-600">
                  <p>Join others already participating</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instagram Feed Section */}
      <div className="py-24 sm:py-32 bg-white/70 backdrop-blur-sm relative">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,transparent_0%,rgba(250,250,250,0.8)_100%)]"></div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center mb-16">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="h-8 w-8 bg-pink-500 rounded-full flex items-center justify-center">
                <Instagram className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-base font-semibold text-pink-600">
                Social Media
              </h2>
            </div>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Follow My Journey
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Follow my personal journey and see how I&apos;m embracing
              rejection therapy.
            </p>
          </div>
          <div className="mt-16">
            <div className="aspect-[4/3] w-full max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-xl ring-1 ring-gray-200">
              <iframe
                src="https://www.instagram.com/dailyrejection/embed"
                className="w-full h-full"
                frameBorder="0"
                scrolling="no"
                allow="encrypted-media"
              ></iframe>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div
        id="features"
        className="py-24 sm:py-32 bg-gradient-to-b from-white/70 to-gray-50/70 backdrop-blur-sm relative"
      >
        <div className="absolute inset-0 -z-10 [mask-image:linear-gradient(white,transparent)] bg-white"></div>
        <div className="absolute inset-y-0 right-1/2 -z-10 mr-16 w-[200%] origin-bottom-left skew-x-[-30deg] bg-white shadow-xl shadow-green-600/10 ring-1 ring-green-50"></div>
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center mb-16">
            <span className="inline-flex items-center rounded-full px-4 py-1 text-sm font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
              Start Today
            </span>
            <p className="mt-6 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to overcome rejection
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Our platform provides a structured approach to rejection therapy,
              helping you build resilience and confidence through daily
              challenges.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <div className="grid grid-cols-1 gap-y-10 gap-x-8 lg:grid-cols-4">
              {features.map((feature) => (
                <div key={feature.name} className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
                  <div className="relative">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center text-white shadow-lg mb-5 group-hover:scale-110 transition-all duration-300">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-green-700 transition-colors duration-200">
                      {feature.name}
                    </h3>
                    <p className="text-gray-600 group-hover:text-gray-700">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-gradient-to-r from-green-700 to-emerald-600 py-16 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiB4PSIwIiB5PSIwIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHBhdHRlcm5UcmFuc2Zvcm09InJvdGF0ZSgzMCkiPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIyIiBoZWlnaHQ9IjIiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNwYXR0ZXJuKSIvPjwvc3ZnPg==')] opacity-20"></div>
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to transform your life?
            </h2>
            <p className="mt-6 text-lg leading-8 text-green-50">
              Join our community today and start your journey to overcome rejection.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const features = [
  {
    name: "Weekly Challenges",
    description:
      "Get a new rejection challenge every week, carefully designed to push your comfort zone gradually.",
    icon: Clock,
  },
  {
    name: "Track Progress",
    description:
      "Monitor your growth with detailed statistics and insights about your rejection journey.",
    icon: TrendingUp,
  },
  {
    name: "Community Support",
    description:
      "Connect with others on the same journey, share experiences, and celebrate victories together.",
    icon: Users,
  },
  {
    name: "Guided Reflection",
    description:
      "Learn from each experience with structured reflection prompts and personal insights tracking.",
    icon: Lightbulb,
  },
];
