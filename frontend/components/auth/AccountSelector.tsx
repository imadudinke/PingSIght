"use client";

interface Account {
  email: string;
  name?: string;
  picture?: string;
}

interface AccountSelectorProps {
  accounts: Account[];
  onSelectAccount: (account: Account) => void;
  onUseAnother: () => void;
  appName?: string;
}

export default function AccountSelector({ 
  accounts, 
  onSelectAccount, 
  onUseAnother,
  appName = "pingSight"
}: AccountSelectorProps) {
  return (
    <div className="w-full max-w-md mx-auto bg-[#1a1a1a] border border-[#2a2a2a] p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-xl font-mono tracking-widest text-[#a5b9ff] mb-2">
          CHOOSE_ACCOUNT
        </h2>
        <p className="text-xs font-mono text-[#888] tracking-wider">
          to continue to {appName}
        </p>
      </div>

      {/* Account List */}
      <div className="space-y-2 mb-6">
        {accounts.map((account, index) => (
          <button
            key={index}
            onClick={() => onSelectAccount(account)}
            className="w-full flex items-center gap-4 p-4 bg-[#0a0a0a] border border-[#2a2a2a] hover:border-[#a5b9ff] hover:bg-[#1a1a1a] transition-all duration-200 group"
          >
            {/* Avatar */}
            <div className="flex-shrink-0">
              {account.picture ? (
                <img 
                  src={account.picture} 
                  alt={account.name || account.email}
                  className="w-10 h-10 rounded-full border border-[#2a2a2a] group-hover:border-[#a5b9ff] transition-colors"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#2a2a2a] border border-[#2a2a2a] group-hover:border-[#a5b9ff] flex items-center justify-center transition-colors">
                  <span className="text-[#a5b9ff] font-mono text-sm">
                    {account.email.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Account Info */}
            <div className="flex-1 text-left">
              {account.name && (
                <div className="font-mono text-sm text-white tracking-wide mb-1">
                  {account.name}
                </div>
              )}
              <div className="font-mono text-xs text-[#888] tracking-wider">
                {account.email}
              </div>
            </div>

            {/* Arrow Indicator */}
            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg 
                className="w-5 h-5 text-[#a5b9ff]" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 5l7 7-7 7" 
                />
              </svg>
            </div>
          </button>
        ))}
      </div>

      {/* Use Another Account */}
      <button
        onClick={onUseAnother}
        className="w-full flex items-center justify-center gap-2 p-4 bg-[#0a0a0a] border border-[#2a2a2a] hover:border-[#a5b9ff] hover:bg-[#1a1a1a] transition-all duration-200 group"
      >
        <svg 
          className="w-5 h-5 text-[#888] group-hover:text-[#a5b9ff] transition-colors" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" 
          />
        </svg>
        <span className="font-mono text-xs tracking-widest text-[#888] group-hover:text-[#a5b9ff] transition-colors">
          USE_ANOTHER_ACCOUNT
        </span>
      </button>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-[#2a2a2a]">
        <p className="text-[10px] text-[#555] font-mono tracking-wider text-center leading-relaxed">
          To continue, Google will share your name, email address, and profile picture with {appName}.
        </p>
      </div>
    </div>
  );
}
