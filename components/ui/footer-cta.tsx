export function FooterCTA() {
  return (
    <>
      {/* Developer Credit */}
      <div className="bg-gradient-to-r from-green-700 to-emerald-600 py-10 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center space-y-2">
            <p className="text-sm text-white/90">
              Developed with{" "}
              <span className="inline-block animate-bounce">❤️</span> by{" "}
              <a
                href="https://github.com/rsoaresdev"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-white hover:text-white/80 transition-colors relative group"
              >
                Rafael Soares
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white/70 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
