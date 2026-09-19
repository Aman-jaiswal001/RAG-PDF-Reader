import Login from "../components/Login";
import Register from "../components/Register";
const AuthPage = ({ showRegister, setShowRegister }) => {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-950 text-white">
      
      <div className="grid min-h-screen min-w-0 lg:grid-cols-2">
        
        {/* ================= LEFT DASHBOARD ================= */}
        <div className="relative hidden min-w-0 overflow-hidden lg:flex">
          
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-slate-950 to-slate-950" />
          {/* Glow */}
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl" />
          <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-14">
            
            {/* Logo */}
            <div className="flex items-center gap-3">
              
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30">
                
                🧠
              </div>
              <div>
                
                <h1 className="text-lg font-bold"> RAG Assistant </h1>
                <p className="text-xs text-slate-500">
                  
                  AI Knowledge Workspace
                </p>
              </div>
            </div>
            {/* Main Content */}
            <div className="max-w-xl">
              
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
                
                <span className="h-2 w-2 rounded-full bg-green-400" />
                AI-powered knowledge assistant
              </div>
              <h2 className="text-4xl font-bold leading-tight xl:text-5xl">
                
                Your documents.
                <span className="block text-blue-500">
                  
                  Your knowledge.
                </span>
                Powered by AI.
              </h2>
              <p className="mt-6 max-w-lg text-base leading-7 text-slate-400">
                
                Upload your documents, ask questions, and get intelligent
                answers using Retrieval-Augmented Generation.
              </p>
              {/* Features */}
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                
                {/* Feature 1 */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
                  
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-lg">
                    
                    📄
                  </div>
                  <h3 className="text-sm font-semibold">
                    
                    Smart Documents
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    
                    Upload and organize your PDF knowledge base.
                  </p>
                </div>
                {/* Feature 2 */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
                  
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-lg">
                    
                    🧠
                  </div>
                  <h3 className="text-sm font-semibold"> AI Answers </h3>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    
                    Ask questions and retrieve relevant information.
                  </p>
                </div>
                {/* Feature 3 */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
                  
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 text-lg">
                    
                    🔒
                  </div>
                  <h3 className="text-sm font-semibold"> Secure </h3>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    
                    Your documents and conversations stay protected.
                  </p>
                </div>
              </div>
            </div>
            {/* Footer */}
            <p className="text-xs text-slate-600">
              
              © {new Date().getFullYear()} RAG Assistant
            </p>
          </div>
        </div>
        {/* ================= RIGHT AUTH PANEL ================= */}
        <div className="flex min-w-0 items-center justify-center px-5 py-10 sm:px-8">
          
          <div className="w-full min-w-0 max-w-md">
            
            {/* Mobile Logo */}
            <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
              
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600">
                
                🧠
              </div>
              <div>
                
                <h1 className="font-bold"> RAG Assistant </h1>
                <p className="text-xs text-slate-500">
                  
                  AI Knowledge Workspace
                </p>
              </div>
            </div>
            {/* Auth Card */}
            <div className="w-full min-w-0 rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-9">
              
              {/* Toggle */}
              <div className="mb-8 flex rounded-xl bg-slate-800/70 p-1">
                
                <button
                  type="button"
                  onClick={() => setShowRegister(false)}
                  className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition ${!showRegister ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"}`}
                >
                  
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setShowRegister(true)}
                  className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition ${showRegister ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"}`}
                >
                  
                  Register
                </button>
              </div>
              {/* Form */}
              {showRegister ? (
                <Register onLogin={() => setShowRegister(false)} />
              ) : (
                <Login onRegister={() => setShowRegister(true)} />
              )}
            </div>
            {/* Security */}
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-600">
              
              🔒 Secure authentication
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default AuthPage;