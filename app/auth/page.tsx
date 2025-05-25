import { AuthForm } from "@/components/auth/auth-form";

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 overflow-hidden relative bg-gradient-to-tr from-green-50 via-emerald-50 to-teal-50">
      {/* Background decorations */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-white [background:radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]" />
      
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-100 rounded-full opacity-30 blur-3xl" />
      <div className="absolute top-60 -left-20 w-60 h-60 bg-emerald-100 rounded-full opacity-40 blur-3xl" />
      <div className="absolute bottom-20 right-20 w-60 h-60 bg-teal-50 rounded-full opacity-30 blur-3xl" />
      
      {/* Brand elements */}
      <div className="absolute top-8 left-8 flex items-center gap-2">
        <div className="h-10 w-10 bg-gradient-to-br from-green-600 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-lg">DR</span>
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-green-700 to-emerald-500 bg-clip-text text-transparent">DailyRejection</span>
      </div>
      
      {/* Authentication form */}
      <div className="w-full max-w-md relative z-10">
        <AuthForm />
      </div>
      
      {/* Bottom decorative shapes */}
      <svg 
        className="absolute bottom-0 left-0 right-0 -z-10 w-full opacity-10"
        viewBox="0 0 1440 116" 
        fill="none"
      >
        <path d="M0 51.4091H1440V116H0V51.4091Z" fill="#2e8b57" />
        <path d="M1440 50.0909C1171.5 50.0909 1143 0 720 0C297 0 268.5 50.0909 0 50.0909H1440Z" fill="#2e8b57" />
      </svg>
    </div>
  );
}
